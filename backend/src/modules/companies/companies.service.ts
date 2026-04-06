import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const existing = createCompanyDto.cnpj
      ? await this.companyRepo.findOne({ where: { cnpj: createCompanyDto.cnpj } })
      : null;

    if (existing) {
      throw new ConflictException('Company with this CNPJ already exists');
    }

    const company = this.companyRepo.create(createCompanyDto);
    return this.companyRepo.save(company);
  }

  async findAll(active?: boolean): Promise<Company[]> {
    const where = active !== undefined ? { active } : {};
    return this.companyRepo.find({ where });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);

    if (updateCompanyDto.cnpj && updateCompanyDto.cnpj !== company.cnpj) {
      const existing = await this.companyRepo.findOne({
        where: { cnpj: updateCompanyDto.cnpj },
      });
      if (existing) {
        throw new ConflictException('Company with this CNPJ already exists');
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companyRepo.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    company.active = false;
    await this.companyRepo.save(company);
  }
}
