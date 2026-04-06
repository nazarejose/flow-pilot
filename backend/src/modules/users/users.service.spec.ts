/**
 * UsersService — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../../shared/enums/role.enum';

jest.mock('bcrypt');

const mockUser: User = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  password: 'hashed-pass',
  companyId: 'comp-uuid-1',
  sectorId: 'sector-uuid-1',
  role: Role.ADMIN,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  company: null,
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: Partial<Repository<User>>;

  const findOne = jest.fn();
  const findBy = jest.fn();
  const create = jest.fn();
  const save = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    repo = {
      findOne,
      findBy,
      create,
      save,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    const createDto = {
      email: 'new@example.com',
      password: 'plain-pass',
      companyId: 'comp-uuid-1',
      role: Role.ADMIN,
    };

    it('should hash password and create user', async () => {
      const savedUser = { ...mockUser, email: createDto.email, id: 'new-id' };
      findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
      create.mockReturnValue(savedUser);
      save.mockResolvedValue(savedUser);

      const result = await service.create(createDto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-pass', 10);
      expect(findOne).toHaveBeenCalledWith({ where: { email: createDto.email } });
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-new', email: createDto.email }),
      );
      expect(result).toEqual(savedUser);
    });

    it('should throw ConflictException if email exists', async () => {
      findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return users filtered by companyId', async () => {
      const users = [mockUser];
      findBy.mockResolvedValue(users);

      const result = await service.findAll('comp-uuid-1');

      expect(findBy).toHaveBeenCalledWith({ companyId: 'comp-uuid-1' });
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return user with company relation', async () => {
      findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        relations: ['company'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    it('should return user by email', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      repo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findByEmail('test@example.com');

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.company', 'company');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.password');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.email = :email', { email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      repo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user and hash new password if provided', async () => {
      const existing = { ...mockUser };
      const updated = { ...existing, name: 'updated' };
      findOne.mockResolvedValue(existing);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-pass');
      save.mockResolvedValue(updated);

      await service.update('user-uuid-1', { password: 'new-pass' });

      expect(bcrypt.hash).toHaveBeenCalledWith('new-pass', 10);
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ password: 'new-hashed-pass' }));
    });

    it('should update user without changing password', async () => {
      const existing = { ...mockUser };
      findOne.mockResolvedValue(existing);
      save.mockResolvedValue({ ...existing, active: false });

      await service.update('user-uuid-1', { active: false });

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { active: false })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should deactivate user', async () => {
      const existing = { ...mockUser };
      findOne.mockResolvedValue(existing);
      save.mockResolvedValue({ ...existing, active: false });

      await service.remove('user-uuid-1');

      expect(save).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });

    it('should throw NotFoundException for non-existent user', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
