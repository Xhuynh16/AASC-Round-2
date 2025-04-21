import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Đảm bảo payload có đúng các thông tin cần thiết
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Lưu thông tin người dùng vào request
      request.user = {
        id: payload.sub,
        username: payload.username,
      };

      console.log('User authenticated:', request.user);
      return true;
    } catch (error) {
      console.error('JWT Auth Error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
