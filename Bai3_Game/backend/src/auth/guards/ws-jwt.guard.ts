import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = client.handshake.auth?.token as string;

      if (!token) {
        throw new WsException('Unauthorized - No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token);

      // Lưu thông tin user vào client
      (client as any).data = { user: payload };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized - Invalid token');
    }
  }
}
