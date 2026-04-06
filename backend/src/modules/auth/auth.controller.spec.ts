/**
 * AuthController — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../../shared/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = { login: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should return access_token from login', async () => {
    mockAuthService.login.mockResolvedValue({ access_token: 'jwt-token' });
    const req = { user: { id: 'u1', email: 'a@b.com', companyId: 'c1', sectorId: 's1', role: Role.ADMIN } };

    const result = await controller.login(req as any);

    expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
