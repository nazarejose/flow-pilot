import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './entities/sector.entity';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepo: Repository<Sector>,
  ) {}

  async create(companyId: string, createSectorDto: CreateSectorDto): Promise<Sector> {
    const existing = await this.sectorRepo.findOne({
      where: { name: createSectorDto.name, companyId },
    });

    if (existing) {
      throw new ConflictException('Sector with this name already exists in this company');
    }

    const sector = this.sectorRepo.create({
      ...createSectorDto,
      companyId,
    });
    return this.sectorRepo.save(sector);
  }

  async findAll(companyId: string, active?: boolean): Promise<Sector[]> {
    const where: any = { companyId };
    if (active !== undefined) {
      where.active = active;
    }
    return this.sectorRepo.find({ where });
  }

  async findOne(id: string, companyId: string): Promise<Sector> {
    const sector = await this.sectorRepo.findOne({
      where: { id, companyId },
      relations: ['company'],
    });
    if (!sector) {
      throw new NotFoundException('Sector not found');
    }
    return sector;
  }

  async update(id: string, companyId: string, updateSectorDto: UpdateSectorDto): Promise<Sector> {
    const sector = await this.findOne(id, companyId);
    Object.assign(sector, updateSectorDto);
    return this.sectorRepo.save(sector);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const sector = await this.findOne(id, companyId);
    sector.active = false;
    await this.sectorRepo.save(sector);
  }
}
