/**
 * AuthService — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../../shared/enums/role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashed-pass',
    companyId: 'comp-uuid-1',
    sectorId: 'sector-uuid-1',
    role: Role.ADMIN,
    active: true,
    company: null,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };
  const mockJwtService = { sign: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('should return user payload when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'correct-pass');

      expect(result).toEqual({
        id: 'user-uuid-1',
        email: 'test@example.com',
        companyId: 'comp-uuid-1',
        sectorId: 'sector-uuid-1',
        role: Role.ADMIN,
      });
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('missing@example.com', 'pass');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-pass');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token with correct JWT payload', async () => {
      mockJwtService.sign.mockReturnValue('fake-jwt-token');

      const result = await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-uuid-1',
          email: 'test@example.com',
          companyId: 'comp-uuid-1',
          sectorId: 'sector-uuid-1',
          role: Role.ADMIN,
        },
        expect.objectContaining({ expiresIn: expect.anything(), secret: expect.anything() }),
      );
      expect(result).toEqual({ access_token: 'fake-jwt-token' });
    });
  });
});
