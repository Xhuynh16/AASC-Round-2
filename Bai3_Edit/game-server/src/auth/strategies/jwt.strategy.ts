import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract the token from cookies first
        (request: Request) => {
          const cookie = request?.cookies?.access_token;
          if (cookie) return cookie;
          return null;
        },
        // Fallback to Authorization header if cookie is not present
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: 'your_jwt_secret', // In production, use environment variable
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
} 