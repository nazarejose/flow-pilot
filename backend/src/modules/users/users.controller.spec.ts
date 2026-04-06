/**
 * UsersController — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../../shared/enums/role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /users', () => {
    it('should create a user', async () => {
      const dto = { email: 'a@b.com', password: '123', companyId: 'c1' };
      mockService.create.mockResolvedValue({ id: 'u1', ...dto });

      const result = await controller.create(dto as any);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('u1');
    });
  });

  describe('GET /users', () => {
    it('should return users from user company', async () => {
      mockService.findAll.mockResolvedValue([{ id: 'u1' }]);

      const result = await controller.findAll({ user: { companyId: 'c1' } });

      expect(mockService.findAll).toHaveBeenCalledWith('c1');
      expect(result).toEqual([{ id: 'u1' }]);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      mockService.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

      const result = await controller.findOne('u1');

      expect(mockService.findOne).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user', async () => {
      mockService.update.mockResolvedValue({ id: 'u1', role: Role.ADMIN });

      const result = await controller.update('u1', { role: Role.ADMIN } as any);

      expect(mockService.update).toHaveBeenCalledWith('u1', { role: Role.ADMIN });
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should deactivate user and return status', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('u1');

      expect(mockService.remove).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'User deactivated',
      });
    });
  });
});
