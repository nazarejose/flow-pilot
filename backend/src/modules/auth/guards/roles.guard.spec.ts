/**
 * RolesGuard — TDD Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../../../shared/enums/role.enum';
import { ROLES_KEY } from '../roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user: null }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when no roles required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
    const req = mockExecutionContext.switchToHttp().getRequest();
    req.user = { role: Role.ADMIN };

    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should deny access when user has wrong role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
    const req = mockExecutionContext.switchToHttp().getRequest();
    req.user = { role: Role.REQUESTER };

    expect(guard.canActivate(mockExecutionContext)).toBe(false);
  });

  it('should deny access when user has no role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
    const req = mockExecutionContext.switchToHttp().getRequest();
    req.user = {};

    expect(guard.canActivate(mockExecutionContext)).toBe(false);
  });

  it('should deny access when user is null', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
    const req = mockExecutionContext.switchToHttp().getRequest();
    req.user = null;

    expect(guard.canActivate(mockExecutionContext)).toBe(false);
  });
});
