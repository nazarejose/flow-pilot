import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Ticket } from '../tickets/entities/ticket.entity';
import { extractMentions } from './validators/mention-validator';

interface UserInfo {
  id: string;
  role: string;
  sectorId?: string;
  companyId: string;
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  private async getTicketWithAccess(ticketId: string, companyId: string, user: UserInfo) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['helpdesk'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isSuperAdmin = user.role === 'admin' && companyId === '1';
    if (isSuperAdmin) return ticket;

    if (user.role === 'admin' && ticket.companyId === companyId) {
      return ticket;
    }

    if (user.role === 'attendant') {
      if (ticket.companyId !== companyId) {
        throw new ForbiddenException('Cannot access tickets from another company');
      }
      if (ticket.helpdesk?.sectorId !== user.sectorId) {
        throw new ForbiddenException('Cannot access tickets from other sectors');
      }
      return ticket;
    }

    if (user.role === 'requester' && ticket.requesterId === user.id) {
      return ticket;
    }

    throw new ForbiddenException('You do not have access to this ticket');
  }

  async create(
    ticketId: string,
    companyId: string,
    user: UserInfo,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const ticket = await this.getTicketWithAccess(ticketId, companyId, user);

    const comment = this.commentRepo.create({
      ticket,
      ticketId: ticket.id,
      authorId: user.id,
      content: dto.content,
    });

    const saved = await this.commentRepo.save(comment);

    const mentions = extractMentions(dto.content);
    for (const mention of mentions) {
      this.logger.log(`Notification: User @${mention} was mentioned in ticket #${ticketId}`);
    }

    return saved;
  }

  async findAllByTicket(
    ticketId: string,
    companyId: string,
    user: UserInfo,
  ): Promise<Comment[]> {
    await this.getTicketWithAccess(ticketId, companyId, user);

    return this.commentRepo.find({
      where: { ticketId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(
    commentId: string,
    ticketId: string,
    companyId: string,
    user: UserInfo,
  ): Promise<Comment> {
    await this.getTicketWithAccess(ticketId, companyId, user);

    const comment = await this.commentRepo.findOne({
      where: { id: commentId, ticketId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
