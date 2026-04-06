import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './entities/ticket-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { validateFieldValues, FieldSchema } from './validators/ticket-field-values.validator';
import { Helpdesk } from '../helpdesks/entities/helpdesk.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Helpdesk)
    private readonly helpdeskRepo: Repository<Helpdesk>,
  ) {}

  private isSuperAdmin(companyId: string, role?: string): boolean {
    return role === 'admin' && companyId === '1';
  }

  async create(companyId: string, requesterId: string, dto: CreateTicketDto): Promise<Ticket> {
    const helpdesk = await this.helpdeskRepo.findOne({
      where: { id: dto.helpdeskId, companyId, active: true, published: true },
    });

    if (!helpdesk || !helpdesk.published) {
      throw new NotFoundException('Published helpdesk not found');
    }

    const schema = (helpdesk.schema as FieldSchema[]).map((f) => ({
      name: f.name,
      required: f.required,
    }));

    const cleanedFieldValues = validateFieldValues(dto.fieldValues, schema);

    const ticket = this.ticketRepo.create({
      helpdeskId: dto.helpdeskId,
      companyId,
      requesterId,
      status: TicketStatus.OPEN,
      fieldValues: cleanedFieldValues,
    });

    return this.ticketRepo.save(ticket);
  }

  async findAll(
    companyId: string,
    user: { id: string; role: string; sectorId?: string },
    filters?: { status?: TicketStatus; dateFrom?: Date; dateTo?: Date },
  ): Promise<Ticket[]> {
    const where: any = {};

    if (!this.isSuperAdmin(companyId, user.role)) {
      if (user.role === 'admin') {
        where.companyId = companyId;
      } else if (user.role === 'attendant') {
        where.companyId = companyId;
        where.helpdesk = { sectorId: user.sectorId };
      } else {
        return this.findByRequester(user.id, filters);
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt = { ...where.createdAt, ...MoreThanOrEqual(filters.dateFrom) };
      }
      if (filters.dateTo) {
        where.createdAt = { ...where.createdAt, ...LessThanOrEqual(filters.dateTo) };
      }
    }

    return this.ticketRepo.find({
      where,
      relations: ['helpdesk'],
      order: { createdAt: 'DESC' },
    });
  }

  private async findByRequester(
    requesterId: string,
    filters?: { status?: TicketStatus; dateFrom?: Date; dateTo?: Date },
  ): Promise<Ticket[]> {
    const where: any = { requesterId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt = { ...where.createdAt, ...MoreThanOrEqual(filters.dateFrom) };
      }
      if (filters.dateTo) {
        where.createdAt = { ...where.createdAt, ...LessThanOrEqual(filters.dateTo) };
      }
    }

    return this.ticketRepo.find({
      where,
      relations: ['helpdesk'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    companyId: string,
    user: { id: string; role: string; sectorId?: string },
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['helpdesk'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!this.isSuperAdmin(companyId, user.role)) {
      if (user.role === 'admin' && ticket.companyId !== companyId) {
        throw new ForbiddenException('You can only access tickets from your own company');
      }

      if (user.role === 'attendant') {
        if (ticket.companyId !== companyId) {
          throw new ForbiddenException('You can only access tickets from your own company');
        }
        if (ticket.helpdesk.sectorId !== user.sectorId) {
          throw new ForbiddenException('You can only access tickets from your sector');
        }
      }

      if (user.role === 'requester' && ticket.requesterId !== user.id) {
        throw new ForbiddenException('You can only access your own tickets');
      }
    }

    return ticket;
  }

  private async findById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['helpdesk'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async updateStatus(
    id: string,
    companyId: string,
    user: { id: string; role: string },
    dto: UpdateTicketStatusDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id, companyId, user);

    if (user.role === 'requester') {
      if (ticket.requesterId !== user.id) {
        throw new ForbiddenException('You can only close your own tickets');
      }
      if (dto.status !== TicketStatus.CLOSED) {
        throw new ForbiddenException('Requesters can only close tickets');
      }
    }

    ticket.status = dto.status;

    if (dto.status === TicketStatus.CLOSED || dto.status === TicketStatus.RESOLVED) {
      ticket.closedAt = new Date();
    } else {
      ticket.closedAt = null;
    }

    return this.ticketRepo.save(ticket);
  }

  async claim(
    id: string,
    companyId: string,
    attendantId: string,
    attendantSectorId: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['helpdesk'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.companyId !== companyId) {
      throw new ForbiddenException('You can only claim tickets from your company');
    }

    if (ticket.helpdesk.sectorId !== attendantSectorId) {
      throw new ForbiddenException('You can only claim tickets from your sector');
    }

    ticket.assignedToId = attendantId;

    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    return this.ticketRepo.save(ticket);
  }

  async cancel(id: string, companyId: string, requesterId: string): Promise<Ticket> {
    const ticket = await this.findOne(id, companyId, { id: requesterId, role: 'requester' });

    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();

    return this.ticketRepo.save(ticket);
  }
}
