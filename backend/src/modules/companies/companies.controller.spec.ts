/**
 * CompaniesController — TDD Unit Tests
 *
 * Verifies HTTP layer behavior: route handling, parsing, validation, status codes.
 * Uses mock service so each layer is tested in isolation.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockCompany = {
  id: 'test-uuid-1',
  name: 'Test Corp',
  cnpj: '12345678000100',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: CompaniesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtGuard = { canActivate: () => true };
  const mockRolesGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockService,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtGuard,
        },
        {
          provide: RolesGuard,
          useValue: mockRolesGuard,
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    service = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /companies', () => {
    it('should create a company and return it', async () => {
      const createDto: CreateCompanyDto = { name: 'Test Corp' };
      mockService.create.mockResolvedValue(mockCompany);

      const result = await controller.create(createDto);

      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('GET /companies', () => {
    it('should return all companies when no filter', async () => {
      mockService.findAll.mockResolvedValue([mockCompany]);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockCompany]);
    });

    it('should filter by active=true', async () => {
      mockService.findAll.mockResolvedValue([mockCompany]);

      await controller.findAll('true');

      expect(mockService.findAll).toHaveBeenCalledWith(true);
    });

    it('should filter by active=false', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll('false');

      expect(mockService.findAll).toHaveBeenCalledWith(false);
    });
  });

  describe('GET /companies/:id', () => {
    it('should return a company by id', async () => {
      mockService.findOne.mockResolvedValue(mockCompany);

      const result = await controller.findOne('test-uuid-1');

      expect(mockService.findOne).toHaveBeenCalledWith('test-uuid-1');
      expect(result).toEqual(mockCompany);
    });
  });

  describe('PATCH /companies/:id', () => {
    it('should update a company', async () => {
      const updateDto = { name: 'Updated Corp' };
      mockService.update.mockResolvedValue({ ...mockCompany, name: 'Updated Corp' });

      const result = await controller.update('test-uuid-1', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('test-uuid-1', updateDto);
      expect(result).toEqual(expect.objectContaining({ name: 'Updated Corp' }));
    });
  });

  describe('DELETE /companies/:id', () => {
    it('should deactivate a company and return status', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('test-uuid-1');

      expect(mockService.remove).toHaveBeenCalledWith('test-uuid-1');
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Company deactivated',
      });
    });
  });
});
