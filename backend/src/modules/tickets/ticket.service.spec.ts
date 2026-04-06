import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { TicketService } from './ticket.service';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './entities/ticket-status.enum';
import { Helpdesk } from '../helpdesks/entities/helpdesk.entity';

const mockTicket = (overrides: Partial<Ticket> = {}): Ticket =>
  ({
    id: 'ticket-1',
    helpdeskId: 'hd-1',
    companyId: 'comp-1',
    requesterId: 'user-req-1',
    assignedToId: null,
    status: TicketStatus.OPEN,
    fieldValues: { category: 'Hardware', description: 'Broken' },
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    helpdesk: { sectorId: 'sector-1' } as any,
    ...overrides,
  }) as Ticket;

const mockHelpdesk = (): Helpdesk =>
  ({
    id: 'hd-1',
    companyId: 'comp-1',
    sectorId: 'sector-1',
    name: 'Helpdesk TI',
    schema: [
      { name: 'category', type: 'select', label: 'Category', required: true, options: ['Hardware'] },
      { name: 'description', type: 'textarea', label: 'Description', required: true },
    ],
    published: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Helpdesk;

describe('TicketService', () => {
  let service: TicketService;
  let ticketRepo: Partial<Repository<Ticket>>;
  let helpdeskRepo: Partial<Repository<Helpdesk>>;

  const findOneTicket = jest.fn();
  const saveTicket = jest.fn();
  const createTicket = jest.fn();
  const findTickets = jest.fn();
  const findOneHelpdesk = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    ticketRepo = { findOne: findOneTicket, save: saveTicket, create: createTicket, find: findTickets };
    helpdeskRepo = { findOne: findOneHelpdesk };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        { provide: getRepositoryToken(Helpdesk), useValue: helpdeskRepo },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  describe('create', () => {
    it('should create a ticket with valid field_values and status open', async () => {
      findOneHelpdesk.mockResolvedValue(mockHelpdesk());
      createTicket.mockReturnValue(mockTicket());
      saveTicket.mockResolvedValue(mockTicket());

      const result = await service.create('comp-1', 'user-req-1', {
        helpdeskId: 'hd-1',
        fieldValues: { category: 'Hardware', description: 'Broken' },
      });

      expect(result.status).toBe(TicketStatus.OPEN);
      expect(createTicket).toHaveBeenCalled();
      expect(saveTicket).toHaveBeenCalled();
    });

    it('should throw NotFoundException if helpdesk is not published', async () => {
      findOneHelpdesk.mockResolvedValue({ ...mockHelpdesk(), published: false });

      await expect(
        service.create('comp-1', 'user-req-1', {
          helpdeskId: 'hd-1',
          fieldValues: { category: 'Hardware' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if required field is missing', async () => {
      findOneHelpdesk.mockResolvedValue(mockHelpdesk());

      await expect(
        service.create('comp-1', 'user-req-1', {
          helpdeskId: 'hd-1',
          fieldValues: { category: 'Hardware' }, // missing required 'description'
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should strip extra fields not in schema', async () => {
      findOneHelpdesk.mockResolvedValue(mockHelpdesk());
      createTicket.mockImplementation((dto: any) => mockTicket(dto));
      saveTicket.mockResolvedValue(mockTicket());

      await service.create('comp-1', 'user-req-1', {
        helpdeskId: 'hd-1',
        fieldValues: { category: 'Hardware', description: 'Test', extraField: 'remove me' },
      });

      expect(createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldValues: { category: 'Hardware', description: 'Test' },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all tickets for admin within company', async () => {
      findTickets.mockResolvedValue([mockTicket()]);

      const result = await service.findAll('comp-1', { id: 'admin-1', role: 'admin' });

      expect(result).toHaveLength(1);
      expect(findTickets).toHaveBeenCalledWith({
        where: { companyId: 'comp-1' },
        relations: ['helpdesk'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should bypass company filter for Super Admin', async () => {
      findTickets.mockResolvedValue([mockTicket(), mockTicket({ companyId: 'comp-2' })]);

      const result = await service.findAll('1', { id: 'admin-hq', role: 'admin' });

      expect(result).toHaveLength(2);
      expect(findTickets).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should return only tickets from attendant sector', async () => {
      findTickets.mockResolvedValue([mockTicket()]);

      const result = await service.findAll('comp-1', {
        id: 'att-1',
        role: 'attendant',
        sectorId: 'sector-1',
      });

      expect(result).toHaveLength(1);
    });

    it('should return only own tickets for requester', async () => {
      findTickets.mockResolvedValue([mockTicket()]);

      const result = await service.findAll('comp-1', {
        id: 'user-req-1',
        role: 'requester',
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return ticket when user has access', async () => {
      findOneTicket.mockResolvedValue(mockTicket());

      const result = await service.findOne('ticket-1', 'comp-1', {
        id: 'admin-1',
        role: 'admin',
      });

      expect(result.id).toBe('ticket-1');
    });

    it('should throw ForbiddenException for cross-company admin access', async () => {
      findOneTicket.mockResolvedValue(mockTicket()); // companyId: 'comp-1'

      await expect(
        service.findOne('ticket-1', 'comp-2', { id: 'admin-2', role: 'admin' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for requester accessing another ticket', async () => {
      findOneTicket.mockResolvedValue(mockTicket()); // requesterId: 'user-req-1'

      await expect(
        service.findOne('ticket-1', 'comp-1', { id: 'user-other', role: 'requester' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Super Admin to view any ticket', async () => {
      findOneTicket.mockResolvedValue(mockTicket());

      const result = await service.findOne('ticket-1', '1', { id: 'admin-hq', role: 'admin' });

      expect(result.id).toBe('ticket-1');
    });
  });

  describe('updateStatus', () => {
    it('should update status for admin', async () => {
      findOneTicket.mockResolvedValue(mockTicket());
      saveTicket.mockResolvedValue({ ...mockTicket(), status: TicketStatus.IN_PROGRESS });

      const result = await service.updateStatus('ticket-1', 'comp-1', {
        id: 'admin-1',
        role: 'admin',
      }, { status: TicketStatus.IN_PROGRESS });

      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should set closedAt when status is closed', async () => {
      findOneTicket.mockResolvedValue(mockTicket());
      saveTicket.mockImplementation((t: any) => ({ ...mockTicket(), ...t, status: TicketStatus.CLOSED, closedAt: expect.any(Date) }));

      await service.updateStatus('ticket-1', 'comp-1', {
        id: 'admin-1',
        role: 'admin',
      }, { status: TicketStatus.CLOSED });

      expect(saveTicket).toHaveBeenCalledWith(
        expect.objectContaining({ closedAt: expect.any(Date) }),
      );
    });

    it('should allow requester to close own ticket', async () => {
      findOneTicket.mockResolvedValue(mockTicket({ requesterId: 'user-req-1' }));
      saveTicket.mockResolvedValue({ ...mockTicket(), status: TicketStatus.CLOSED });

      const result = await service.updateStatus('ticket-1', 'comp-1', {
        id: 'user-req-1',
        role: 'requester',
      }, { status: TicketStatus.CLOSED });

      expect(result.status).toBe(TicketStatus.CLOSED);
    });

    it('should throw ForbiddenException if requester tries non-close status', async () => {
      findOneTicket.mockResolvedValue(mockTicket());

      await expect(
        service.updateStatus('ticket-1', 'comp-1', {
          id: 'user-req-1',
          role: 'requester',
        }, { status: TicketStatus.IN_PROGRESS }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if requester tries to close another ticket', async () => {
      findOneTicket.mockResolvedValue(mockTicket()); // requesterId: 'user-req-1'

      await expect(
        service.updateStatus('ticket-1', 'comp-1', {
          id: 'user-other',
          role: 'requester',
        }, { status: TicketStatus.CLOSED }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('claim', () => {
    it('should assign ticket to attendant and set in_progress', async () => {
      findOneTicket.mockResolvedValue(mockTicket());
      saveTicket.mockResolvedValue({
        ...mockTicket(),
        assignedToId: 'att-1',
        status: TicketStatus.IN_PROGRESS,
      });

      const result = await service.claim('ticket-1', 'comp-1', 'att-1', 'sector-1');

      expect(result.assignedToId).toBe('att-1');
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should throw ForbiddenException if attendant from different sector', async () => {
      findOneTicket.mockResolvedValue(mockTicket()); // sector: 'sector-1'

      await expect(
        service.claim('ticket-1', 'comp-1', 'att-1', 'sector-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if attendant from different company', async () => {
      findOneTicket.mockResolvedValue(mockTicket());

      await expect(
        service.claim('ticket-1', 'comp-2', 'att-1', 'sector-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('should close ticket for requester', async () => {
      findOneTicket.mockResolvedValue(mockTicket());
      saveTicket.mockResolvedValue({ ...mockTicket(), status: TicketStatus.CLOSED });

      const result = await service.cancel('ticket-1', 'comp-1', 'user-req-1');

      expect(result.status).toBe(TicketStatus.CLOSED);
    });
  });
});
