/**
 * SectorsService — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SectorsService } from './sectors.service';
import { Sector } from './entities/sector.entity';

const mockDate = new Date('2026-01-01T00:00:00.000Z');

const mockSector = (): Sector => ({
  id: 'sector-uuid-1',
  name: 'TI',
  companyId: 'comp-uuid-1',
  helpdeskId: null,
  active: true,
  createdAt: mockDate,
  updatedAt: mockDate,
  company: null,
});

describe('SectorsService', () => {
  let service: SectorsService;
  let repo: Partial<Repository<Sector>>;

  const findOne = jest.fn();
  const find = jest.fn();
  const create = jest.fn();
  const save = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    repo = {
      findOne,
      find,
      create,
      save,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectorsService,
        { provide: getRepositoryToken(Sector), useValue: repo },
      ],
    }).compile();

    service = module.get<SectorsService>(SectorsService);
  });

  describe('create', () => {
    it('should create a sector when name does not exist in company', async () => {
      findOne.mockResolvedValue(null);
      create.mockReturnValue({ name: 'TI', companyId: 'comp-uuid-1', active: true });
      save.mockResolvedValue(mockSector());

      const result = await service.create('comp-uuid-1', { name: 'TI' });

      expect(findOne).toHaveBeenCalledWith({
        where: { name: 'TI', companyId: 'comp-uuid-1' },
      });
      expect(create).toHaveBeenCalledWith({
        name: 'TI',
        companyId: 'comp-uuid-1',
      });
      expect(save).toHaveBeenCalled();
      expect(result).toMatchObject(mockSector());
    });

    it('should throw ConflictException when sector name exists in company', async () => {
      findOne.mockResolvedValue(mockSector());

      await expect(service.create('comp-uuid-1', { name: 'TI' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all sectors for a company', async () => {
      const sectors = [mockSector()];
      find.mockResolvedValue(sectors);

      const result = await service.findAll('comp-uuid-1');

      expect(find).toHaveBeenCalledWith({ where: { companyId: 'comp-uuid-1' } });
      expect(result).toEqual(sectors);
    });

    it('should filter by active=true', async () => {
      find.mockResolvedValue([mockSector()]);

      await service.findAll('comp-uuid-1', true);

      expect(find).toHaveBeenCalledWith({
        where: { companyId: 'comp-uuid-1', active: true },
      });
    });

    it('should filter by active=false', async () => {
      find.mockResolvedValue([]);

      await service.findAll('comp-uuid-1', false);

      expect(find).toHaveBeenCalledWith({
        where: { companyId: 'comp-uuid-1', active: false },
      });
    });
  });

  describe('findOne', () => {
    it('should return sector when found in company', async () => {
      findOne.mockResolvedValue(mockSector());

      const result = await service.findOne('sector-uuid-1', 'comp-uuid-1');

      expect(findOne).toHaveBeenCalledWith({
        where: { id: 'sector-uuid-1', companyId: 'comp-uuid-1' },
        relations: ['company'],
      });
      expect(result).toEqual(mockSector());
    });

    it('should throw NotFoundException when sector not found', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'comp-uuid-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update sector name', async () => {
      const existing = mockSector();
      const updated = { ...existing, name: 'Information Technology' };
      findOne.mockResolvedValue(existing);
      save.mockResolvedValue(updated);

      const result = await service.update('sector-uuid-1', 'comp-uuid-1', { name: 'Information Technology' });

      expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Information Technology' }));
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException for non-existent sector', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', 'comp-uuid-1', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should deactivate sector', async () => {
      const existing = mockSector();
      findOne.mockResolvedValue(existing);
      save.mockResolvedValue({ ...existing, active: false });

      await service.remove('sector-uuid-1', 'comp-uuid-1');

      expect(save).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });

    it('should throw NotFoundException for non-existent sector', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'comp-uuid-1')).rejects.toThrow(NotFoundException);
    });
  });
});
