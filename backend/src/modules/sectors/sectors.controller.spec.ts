/**
 * SectorsController — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockSector = {
  id: 'sector-uuid-1',
  name: 'TI',
  companyId: 'comp-uuid-1',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SectorsController', () => {
  let controller: SectorsController;
  let service: SectorsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectorsController],
      providers: [
        { provide: SectorsService, useValue: mockService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SectorsController>(SectorsController);
    service = module.get<SectorsService>(SectorsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /companies/:companyId/sectors', () => {
    it('should create a sector', async () => {
      mockService.create.mockResolvedValue(mockSector);

      const result = await controller.create('comp-uuid-1', { name: 'TI' });

      expect(mockService.create).toHaveBeenCalledWith('comp-uuid-1', { name: 'TI' });
      expect(result).toEqual(mockSector);
    });
  });

  describe('GET /companies/:companyId/sectors', () => {
    it('should return all sectors for company', async () => {
      mockService.findAll.mockResolvedValue([mockSector]);

      const result = await controller.findAll('comp-uuid-1');

      expect(mockService.findAll).toHaveBeenCalledWith('comp-uuid-1', undefined);
      expect(result).toEqual([mockSector]);
    });

    it('should filter by active=true', async () => {
      mockService.findAll.mockResolvedValue([mockSector]);

      await controller.findAll('comp-uuid-1', 'true');

      expect(mockService.findAll).toHaveBeenCalledWith('comp-uuid-1', true);
    });
  });

  describe('GET /companies/:companyId/sectors/:id', () => {
    it('should return a sector by id', async () => {
      mockService.findOne.mockResolvedValue(mockSector);

      const result = await controller.findOne('comp-uuid-1', 'sector-uuid-1');

      expect(mockService.findOne).toHaveBeenCalledWith('sector-uuid-1', 'comp-uuid-1');
      expect(result).toEqual(mockSector);
    });
  });

  describe('PATCH /companies/:companyId/sectors/:id', () => {
    it('should update a sector', async () => {
      mockService.update.mockResolvedValue({ ...mockSector, name: 'Updated' });

      const result = await controller.update('comp-uuid-1', 'sector-uuid-1', { name: 'Updated' });

      expect(mockService.update).toHaveBeenCalledWith('sector-uuid-1', 'comp-uuid-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('DELETE /companies/:companyId/sectors/:id', () => {
    it('should deactivate a sector and return status', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('comp-uuid-1', 'sector-uuid-1');

      expect(mockService.remove).toHaveBeenCalledWith('sector-uuid-1', 'comp-uuid-1');
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Sector deactivated',
      });
    });
  });
});
