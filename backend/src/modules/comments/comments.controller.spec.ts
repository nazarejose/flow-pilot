import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const mockCommentsService = {
  create: jest.fn(),
  findAllByTicket: jest.fn(),
  findOne: jest.fn(),
};

describe('CommentsController', () => {
  let controller: CommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const dto: CreateCommentDto = { content: 'test comment' };
      const mockUser = { companyId: 'company-uuid', id: 'user-uuid', role: 'requester' };
      const mockComment = { id: 'comment-id', content: 'test comment' };

      mockCommentsService.create.mockResolvedValue(mockComment);

      const result = await controller.create('ticket-uuid', { user: mockUser }, dto);

      expect(result).toEqual(mockComment);
      expect(mockCommentsService.create).toHaveBeenCalledWith(
        'ticket-uuid',
        'company-uuid',
        mockUser,
        dto,
      );
    });
  });

  describe('findAll', () => {
    it('should return all comments for a ticket', async () => {
      const mockUser = { companyId: 'company-uuid', id: 'user-uuid', role: 'admin' };
      const mockComments = [{ id: 'c1' }, { id: 'c2' }];

      mockCommentsService.findAllByTicket.mockResolvedValue(mockComments);

      const result = await controller.findAll('ticket-uuid', { user: mockUser });

      expect(result).toEqual(mockComments);
      expect(mockCommentsService.findAllByTicket).toHaveBeenCalledWith(
        'ticket-uuid',
        'company-uuid',
        mockUser,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single comment', async () => {
      const mockUser = { companyId: 'company-uuid', id: 'user-uuid', role: 'admin' };
      const mockComment = { id: 'comment-id' };

      mockCommentsService.findOne.mockResolvedValue(mockComment);

      const result = await controller.findOne('ticket-uuid', 'comment-id', { user: mockUser });

      expect(result).toEqual(mockComment);
      expect(mockCommentsService.findOne).toHaveBeenCalledWith(
        'comment-id',
        'ticket-uuid',
        'company-uuid',
        mockUser,
      );
    });
  });
});
