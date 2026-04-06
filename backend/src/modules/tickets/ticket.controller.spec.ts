import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TicketStatus } from './entities/ticket-status.enum';

describe('TicketController', () => {
  let controller: TicketController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    claim: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        { provide: TicketService, useValue: mockService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a ticket (POST /tickets)', async () => {
    const dto = { helpdeskId: 'hd-1', fieldValues: { category: 'Hardware' } };
    mockService.create.mockResolvedValue({ id: 'ticket-1', status: TicketStatus.OPEN });
    const req = { user: { companyId: 'comp-1', id: 'user-1' } };

    const result = await controller.create(dto as any, req);

    expect(mockService.create).toHaveBeenCalledWith('comp-1', 'user-1', dto);
    expect(result.id).toBe('ticket-1');
  });

  it('should list tickets with filters (GET /tickets)', async () => {
    mockService.findAll.mockResolvedValue([]);
    const req = { user: { companyId: 'comp-1', id: 'admin-1', role: 'admin' } };

    await controller.findAll(req, TicketStatus.OPEN);

    expect(mockService.findAll).toHaveBeenCalledWith('comp-1', req.user, { status: TicketStatus.OPEN });
  });

  it('should return requester own tickets (GET /tickets/mine)', async () => {
    mockService.findAll.mockResolvedValue([]);
    const req = { user: { companyId: 'comp-1', id: 'user-1', role: 'requester' } };

    await controller.findMyTickets(req);

    expect(mockService.findAll).toHaveBeenCalledWith('comp-1', { id: 'user-1', role: 'requester' }, { status: undefined });
  });

  it('should get single ticket (GET /tickets/:id)', async () => {
    mockService.findOne.mockResolvedValue({ id: 'ticket-1' });
    const req = { user: { companyId: 'comp-1', id: 'admin-1', role: 'admin' } };

    const result = await controller.findOne('ticket-1', req);

    expect(mockService.findOne).toHaveBeenCalledWith('ticket-1', 'comp-1', req.user);
    expect(result.id).toBe('ticket-1');
  });

  it('should update ticket status (PATCH /tickets/:id/status)', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 'ticket-1', status: TicketStatus.IN_PROGRESS });
    const dto = { status: TicketStatus.IN_PROGRESS };
    const req = { user: { companyId: 'comp-1', id: 'admin-1', role: 'admin' } };

    const result = await controller.updateStatus('ticket-1', dto as any, req);

    expect(mockService.updateStatus).toHaveBeenCalledWith('ticket-1', 'comp-1', req.user, dto);
    expect(result.status).toBe(TicketStatus.IN_PROGRESS);
  });

  it('should claim ticket (POST /tickets/:id/claim)', async () => {
    mockService.claim.mockResolvedValue({ id: 'ticket-1', assignedToId: 'att-1' });
    const req = { user: { companyId: 'comp-1', id: 'att-1', sectorId: 'sector-1' } };

    const result = await controller.claim('ticket-1', req);

    expect(mockService.claim).toHaveBeenCalledWith('ticket-1', 'comp-1', 'att-1', 'sector-1');
    expect(result.assignedToId).toBe('att-1');
  });

  it('should cancel ticket (PATCH /tickets/:id/cancel)', async () => {
    mockService.cancel.mockResolvedValue({ id: 'ticket-1', status: TicketStatus.CLOSED });
    const req = { user: { companyId: 'comp-1', id: 'user-1', role: 'requester' } };

    const result = await controller.cancel('ticket-1', req);

    expect(mockService.cancel).toHaveBeenCalledWith('ticket-1', 'comp-1', 'user-1');
    expect(result.status).toBe(TicketStatus.CLOSED);
  });
});
