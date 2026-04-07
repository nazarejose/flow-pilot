import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'flow-pilot-secret-key',
    });
  }

  validate(payload: any) {
    return {
      id: payload.sub,
      name: payload.name,
      sub: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      sectorId: payload.sectorId,
      role: payload.role,
    };
  }
}
