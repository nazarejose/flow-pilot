import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { HelpdeskPermissionsController } from './helpdesk-permissions.controller';
import { HelpdeskService } from './helpdesk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('HelpdeskPermissionsController', () => {
  let controller: HelpdeskPermissionsController;

  const mockService = {
    addCompanyPermission: jest.fn(),
    listCompanyPermissions: jest.fn(),
    removeCompanyPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelpdeskPermissionsController],
      providers: [
        { provide: HelpdeskService, useValue: mockService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HelpdeskPermissionsController>(HelpdeskPermissionsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should list companies for a helpdesk (GET /helpdesks/:id/companies)', async () => {
    mockService.listCompanyPermissions.mockResolvedValue(['comp-1', 'comp-2']);
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.listHelpdeskCompanies('hd-1', req);

    expect(mockService.listCompanyPermissions).toHaveBeenCalledWith('hd-1', 'comp-1');
    expect(result).toEqual(['comp-1', 'comp-2']);
  });

  it('should add company access (POST /helpdesks/:id/companies)', async () => {
    mockService.addCompanyPermission.mockResolvedValue(undefined);
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.addHelpdeskCompany('hd-1', {
      companyId: 'comp-3',
    }, req);

    expect(mockService.addCompanyPermission).toHaveBeenCalledWith('hd-1', 'comp-1');
    expect(result.message).toBe('Company access granted');
  });

  it('should remove company access (DELETE /helpdesks/:id/companies/:companyId)', async () => {
    mockService.removeCompanyPermission.mockResolvedValue(undefined);

    const result = await controller.removeHelpdeskCompany('hd-1', 'comp-2');

    expect(mockService.removeCompanyPermission).toHaveBeenCalledWith('hd-1', 'comp-2');
    expect(result.message).toBe('Company access removed');
  });
});