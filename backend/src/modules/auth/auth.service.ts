import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<{
    id: string;
    email: string;
    companyId: string;
    sectorId?: string;
    role: string;
  } | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      sectorId: user.sectorId,
      role: user.role,
    };
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      sectorId: user.sectorId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 86400,
        secret: process.env.JWT_SECRET || 'flow-pilot-secret-key',
      }),
    };
  }
}
