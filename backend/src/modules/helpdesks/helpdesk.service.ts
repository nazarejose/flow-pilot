import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Helpdesk } from './entities/helpdesk.entity';
import { HelpdeskCompany } from './entities/helpdesk-company.entity';
import { CreateHelpdeskDto } from './dto/create-helpdesk.dto';
import { UpdateHelpdeskDto } from './dto/update-helpdesk.dto';
import { validateHelpdeskSchema } from './validators/helpdesk-schema.validator';

@Injectable()
export class HelpdeskService {
  constructor(
    @InjectRepository(Helpdesk)
    private readonly helpdeskRepo: Repository<Helpdesk>,
    @InjectRepository(HelpdeskCompany)
    private readonly hcRepo: Repository<{ helpdeskId: string; companyId: string } & { id: string }>,
  ) {}

  async create(companyId: string, dto: CreateHelpdeskDto): Promise<Helpdesk> {
    validateHelpdeskSchema(dto.schema);

    const existing = await this.helpdeskRepo.findOne({
      where: { sectorId: dto.sectorId, companyId, active: true },
    });
    if (existing) {
      throw new ConflictException('Sector already has a helpdesk');
    }

    const helpdesk = this.helpdeskRepo.create({
      ...dto,
      companyId,
      schema: dto.schema as any,
    });
    return this.helpdeskRepo.save(helpdesk);
  }

  /**
   * Check if user is Super Admin (FlowPilot HQ)
   * Super Admin = role === 'admin' AND companyId === '1'
   */
  private isSuperAdmin(companyId: string, role?: string): boolean {
    return role === 'admin' && companyId === '1';
  }

  async findAll(companyId: string, user?: { role?: string }): Promise<Helpdesk[]> {
    const where: any = { active: true };

    // Super Admin bypasses company filter
    if (!this.isSuperAdmin(companyId, user?.role)) {
      where.companyId = companyId;
    }

    return this.helpdeskRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, companyId: string, user?: { role?: string }): Promise<Helpdesk> {
    const helpdesk = await this.helpdeskRepo.findOne({
      where: { id, active: true },
      relations: ['permissions'],
    });

    if (!helpdesk) {
      throw new NotFoundException('Helpdesk not found');
    }

    // Regular admins can only access helpdesks from their own company
    if (!this.isSuperAdmin(companyId, user?.role) && helpdesk.companyId !== companyId) {
      throw new ForbiddenException('You can only access helpdesks from your own company');
    }

    return helpdesk;
  }

  async findByCompany(companyId: string): Promise<Helpdesk[]> {
    const permissions = await this.hcRepo.findBy({ companyId });
    const helpdeskIds = permissions.map((p) => p.helpdeskId);

    if (helpdeskIds.length === 0) {
      return [];
    }

    return this.helpdeskRepo.find({
      where: { id: In(helpdeskIds), active: true, published: true },
      relations: ['permissions'],
    });
  }

  async update(id: string, companyId: string, dto: UpdateHelpdeskDto): Promise<Helpdesk> {
    const helpdesk = await this.findOne(id, companyId);

    if (helpdesk.published && dto.schema) {
      throw new BadRequestException('Cannot change schema of a published helpdesk');
    }

    if (dto.schema) {
      validateHelpdeskSchema(dto.schema);
    }

    Object.assign(helpdesk, dto);
    return this.helpdeskRepo.save(helpdesk);
  }

  async publish(id: string, companyId: string): Promise<Helpdesk> {
    const helpdesk = await this.findOne(id, companyId);

    if (
      Array.isArray(helpdesk.schema) &&
      (helpdesk.schema as any[]).length === 0
    ) {
      throw new BadRequestException('Helpdesk must have at least one field to publish');
    }

    helpdesk.published = true;
    return this.helpdeskRepo.save(helpdesk);
  }

  async unpublish(id: string, companyId: string): Promise<Helpdesk> {
    const helpdesk = await this.findOne(id, companyId);

    helpdesk.published = false;
    return this.helpdeskRepo.save(helpdesk);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const helpdesk = await this.findOne(id, companyId);

    helpdesk.active = false;
    await this.helpdeskRepo.save(helpdesk);
  }

  // ---- Permissions (junction table) ----

  async addCompanyPermission(helpdeskId: string, companyId: string): Promise<void> {
    const helpdesk = await this.helpdeskRepo.findOne({ where: { id: helpdeskId, companyId, active: true } });
    if (!helpdesk) {
      throw new NotFoundException('Helpdesk not found');
    }

    const existing = await this.hcRepo.findOne({
      where: { helpdeskId, companyId } as any,
    });
    if (existing) {
      throw new ConflictException('Company already has access to this helpdesk');
    }

    const permission = this.hcRepo.create({ helpdeskId, companyId });
    await this.hcRepo.save(permission as any);
  }

  async listCompanyPermissions(helpdeskId: string, companyId: string): Promise<string[]> {
    await this.findOne(helpdeskId, companyId);

    const permissions = await this.hcRepo.findBy({ helpdeskId } as any);
    return permissions.map((p) => p.companyId);
  }

  async removeCompanyPermission(helpdeskId: string, companyId: string): Promise<void> {
    const permission = await this.hcRepo.findOne({
      where: { helpdeskId, companyId } as any,
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.hcRepo.remove(permission as any);
  }
}