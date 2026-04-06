import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import * as mentionValidator from './validators/mention-validator';

jest.mock('./validators/mention-validator');

const mockComment = {
  id: 'comment-uuid',
  ticketId: 'ticket-uuid',
  authorId: 'user-uuid',
  content: 'Hello world',
  createdAt: new Date(),
};

const mockTicket = {
  id: 'ticket-uuid',
  companyId: 'company-uuid',
  requesterId: 'requester-uuid',
  status: 'open',
  fieldValues: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCommentRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockTicketRepo = {
  findOne: jest.fn(),
};

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: jest.Mocked<Repository<Comment>>;
  let ticketRepo: jest.Mocked<Repository<Ticket>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
      ],
    }).compile();

    service = module.get(CommentsService);
    commentRepo = module.get(getRepositoryToken(Comment));
    ticketRepo = module.get(getRepositoryToken(Ticket));

    jest.clearAllMocks();
    (mentionValidator.extractMentions as jest.Mock).mockReturnValue([]);
  });

  describe('create', () => {
    const user = { id: 'user-uuid', role: 'admin', companyId: 'company-uuid' };
    const dto: CreateCommentDto = { content: 'Hello world' };

    it('should create a comment with valid content', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.create.mockReturnValue(mockComment as any);
      mockCommentRepo.save.mockResolvedValue(mockComment);

      const result = await service.create('ticket-uuid', 'company-uuid', user, dto);

      expect(result).toEqual(mockComment);
      expect(mockCommentRepo.save).toHaveBeenCalled();
    });

    it('should detect @mentions and log notifications', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.create.mockReturnValue(mockComment as any);
      mockCommentRepo.save.mockResolvedValue(mockComment);
      (mentionValidator.extractMentions as jest.Mock).mockReturnValue(['john', 'jane']);

      await service.create('ticket-uuid', 'company-uuid', user, dto);

      expect(mentionValidator.extractMentions).toHaveBeenCalledWith('Hello world');
    });

    it('should throw NotFoundException if ticket not found', async () => {
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('ticket-uuid', 'company-uuid', user, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot access ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      const requester = { id: 'other-user', role: 'requester', companyId: 'company-uuid' };

      await expect(
        service.create('ticket-uuid', 'company-uuid', requester, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByTicket', () => {
    const adminUser = { id: 'admin-uuid', role: 'admin', companyId: 'company-uuid' };
    const mockComments = [mockComment];

    it('should return all comments for admin with company match', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.find.mockResolvedValue(mockComments);

      const result = await service.findAllByTicket('ticket-uuid', 'company-uuid', adminUser);

      expect(result).toEqual(mockComments);
      expect(mockCommentRepo.find).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-uuid' },
        relations: ['author'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should allow Super Admin to view any ticket comments', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.find.mockResolvedValue(mockComments);

      const superAdmin = { id: 'admin-uuid', role: 'admin', companyId: '1' };
      const result = await service.findAllByTicket('ticket-uuid', '1', superAdmin);

      expect(result).toEqual(mockComments);
    });

    it('should return comments for requester who owns the ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.find.mockResolvedValue(mockComments);

      const requester = { id: 'requester-uuid', role: 'requester', companyId: 'company-uuid' };
      const result = await service.findAllByTicket('ticket-uuid', 'company-uuid', requester);

      expect(result).toEqual(mockComments);
    });

    it('should throw ForbiddenException if requester accessing another ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);

      const otherRequester = { id: 'other-user', role: 'requester', companyId: 'company-uuid' };

      await expect(
        service.findAllByTicket('ticket-uuid', 'company-uuid', otherRequester),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if attendant from different sector', async () => {
      ticketRepo.findOne.mockResolvedValue({ ...mockTicket, helpdesk: { sectorId: 'sector-uuid' } } as any);

      const attendant = { id: 'attendant-uuid', role: 'attendant', companyId: 'company-uuid', sectorId: 'other-sector' };

      await expect(
        service.findAllByTicket('ticket-uuid', 'company-uuid', attendant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow attendant with matching sector', async () => {
      ticketRepo.findOne.mockResolvedValue({ ...mockTicket, helpdesk: { sectorId: 'sector-uuid' } } as any);
      mockCommentRepo.find.mockResolvedValue(mockComments);

      const attendant = { id: 'attendant-uuid', role: 'attendant', companyId: 'company-uuid', sectorId: 'sector-uuid' };
      const result = await service.findAllByTicket('ticket-uuid', 'company-uuid', attendant);

      expect(result).toEqual(mockComments);
    });

    it('should throw ForbiddenException if attendant from different company', async () => {
      ticketRepo.findOne.mockResolvedValue({ ...mockTicket, helpdesk: { sectorId: 'sector-uuid' } } as any);

      const attendant = { id: 'attendant-uuid', role: 'attendant', companyId: 'other-company', sectorId: 'sector-uuid' };

      await expect(
        service.findAllByTicket('ticket-uuid', 'other-company', attendant),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    const adminUser = { id: 'admin-uuid', role: 'admin', companyId: 'company-uuid' };

    it('should return comment when user has access', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne('comment-uuid', 'ticket-uuid', 'company-uuid', adminUser);

      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if comment not found', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);
      mockCommentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('comment-uuid', 'ticket-uuid', 'company-uuid', adminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for cross-company admin access', async () => {
      ticketRepo.findOne.mockResolvedValue(mockTicket as any);

      const otherAdmin = { id: 'admin-uuid', role: 'admin', companyId: 'other-company' };

      await expect(
        service.findOne('comment-uuid', 'ticket-uuid', 'other-company', otherAdmin),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
