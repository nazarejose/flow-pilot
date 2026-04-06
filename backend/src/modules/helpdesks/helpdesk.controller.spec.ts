import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { HelpdeskController } from './helpdesk.controller';
import { HelpdeskService } from './helpdesk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('HelpdeskController', () => {
  let controller: HelpdeskController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCompany: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelpdeskController],
      providers: [
        { provide: HelpdeskService, useValue: mockService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HelpdeskController>(HelpdeskController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a helpdesk (POST /helpdesks)', async () => {
    const dto = {
      sectorId: 'sector-1',
      name: 'Helpdesk TI',
      schema: [],
    };
    mockService.create.mockResolvedValue({ id: 'hd-1', ...dto, published: false });
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.create(dto as any, req);

    expect(mockService.create).toHaveBeenCalledWith('comp-1', dto);
    expect(result.id).toBe('hd-1');
  });

  it('should list all helpdesks (GET /helpdesks)', async () => {
    mockService.findAll.mockResolvedValue([]);
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.findAll(req);

    expect(mockService.findAll).toHaveBeenCalledWith('comp-1', { companyId: 'comp-1' });
    expect(result).toEqual([]);
  });

  it('should return my helpdesks (GET /helpdesks/mine)', async () => {
    mockService.findByCompany.mockResolvedValue([{ id: 'hd-1' }]);
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.getMyHelpdesks(req);

    expect(mockService.findByCompany).toHaveBeenCalledWith('comp-1');
    expect(result).toHaveLength(1);
  });

  it('should return single helpdesk (GET /helpdesks/:id)', async () => {
    mockService.findOne.mockResolvedValue({ id: 'hd-1' });
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.findOne('hd-1', req);

    expect(mockService.findOne).toHaveBeenCalledWith('hd-1', 'comp-1', { companyId: 'comp-1' });
    expect(result.id).toBe('hd-1');
  });

  it('should update (PATCH /helpdesks/:id)', async () => {
    mockService.update.mockResolvedValue({ id: 'hd-1', name: 'Updated' });
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.update('hd-1', { name: 'Updated' }, req);

    expect(mockService.update).toHaveBeenCalledWith('hd-1', 'comp-1', { name: 'Updated' });
  });

  it('should publish (POST /helpdesks/:id/publish)', async () => {
    mockService.publish.mockResolvedValue({ id: 'hd-1', published: true });
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.publish('hd-1', req);

    expect(mockService.publish).toHaveBeenCalledWith('hd-1', 'comp-1');
    expect(result.published).toBe(true);
  });

  it('should unpublish (POST /helpdesks/:id/unpublish)', async () => {
    mockService.unpublish.mockResolvedValue({ id: 'hd-1', published: false });
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.unpublish('hd-1', req);

    expect(mockService.unpublish).toHaveBeenCalledWith('hd-1', 'comp-1');
    expect(result.published).toBe(false);
  });

  it('should remove (DELETE /helpdesks/:id)', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const req = { user: { companyId: 'comp-1' } };

    const result = await controller.remove('hd-1', req);

    expect(mockService.remove).toHaveBeenCalledWith('hd-1', 'comp-1');
    expect(result.message).toBe('Helpdesk deactivated');
  });
});