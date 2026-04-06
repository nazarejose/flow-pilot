/**
 * CompaniesService — TDD Unit Tests
 *
 * TDD order: write test → run → see fail → implement → see pass.
 *
 * These tests mock the TypeORM Repository so they run without DB.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';

const mockDate = new Date('2026-01-01T00:00:00.000Z');

const mockCompany = (): Company => ({
  id: 'test-uuid-1',
  name: 'Test Corp',
  cnpj: '12345678000100',
  active: true,
  createdAt: mockDate,
  updatedAt: mockDate,
});

describe('CompaniesService', () => {
  let service: CompaniesService;
  let repo: Repository<Company>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    repo = module.get<Repository<Company>>(getRepositoryToken(Company));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCompanyDto = {
      name: 'Test Corp',
      cnpj: '12345678000100',
    };

    it('should create a company when CNPJ does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...createDto, active: true });
      mockRepository.save.mockResolvedValue(mockCompany());

      const result = await service.create(createDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { cnpj: createDto.cnpj },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject(mockCompany());
    });

    it('should throw ConflictException when CNPJ already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockCompany());

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should create a company without CNPJ (field is optional)', async () => {
      const dtoWithoutCnpj = { name: 'Test Corp' };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...dtoWithoutCnpj, active: true });
      mockRepository.save.mockResolvedValue({
        ...mockCompany(),
        cnpj: null,
      });

      const result = await service.create(dtoWithoutCnpj as CreateCompanyDto);

      expect(result.name).toBe('Test Corp');
    });
  });

  describe('findAll', () => {
    it('should return all companies when no filter is provided', async () => {
      const companies = [mockCompany()];
      mockRepository.find.mockResolvedValue(companies);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual(companies);
    });

    it('should filter by active=true', async () => {
      const companies = [mockCompany()];
      mockRepository.find.mockResolvedValue(companies);

      await service.findAll(true);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { active: true },
      });
    });

    it('should filter by active=false', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll(false);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { active: false },
      });
    });
  });

  describe('findOne', () => {
    it('should return a company when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockCompany());

      const result = await service.findOne('test-uuid-1');

      expect(result).toMatchObject(mockCompany());
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Corp' };

    it('should update an existing company', async () => {
      const existing = mockCompany();
      const updated = { ...existing, name: 'Updated Corp' };
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('test-uuid-1', updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Corp' }),
      );
      expect(result).toMatchObject(updated);
    });

    it('should throw NotFoundException for non-existent company', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should deactivate a company (soft delete via active flag)', async () => {
      const existing = mockCompany();
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue({ ...existing, active: false });

      await service.remove('test-uuid-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });

    it('should throw NotFoundException for non-existent company', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
