import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CaroService } from './caro.service';
import { MoveDto } from './dto/move.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface GameData {
  gameId: number;
  userId: number;
}

interface MoveData extends MoveDto {
  userId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'caro',
})
export class CaroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to track which room/game each socket is in
  private playerGameMap = new Map<string, number>();

  constructor(private readonly caroService: CaroService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Chỉ ghi log khi client kết nối, không cần phải xác thực ở đây
      // vì sẽ xác thực khi gọi các event cụ thể
      console.log('Client connected to Caro gateway:', client.id);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    // Remove player from tracking map
    this.playerGameMap.delete(client.id);
    console.log('Client disconnected from Caro gateway:', client.id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-game')
  async handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: GameData) {
    try {
      const { gameId, userId } = data;
      console.log(`User ${userId} joining game ${gameId}`);

      // Join the socket to a room with the game ID
      client.join(`game-${gameId}`);

      // Store which game this socket belongs to
      this.playerGameMap.set(client.id, gameId);

      // Get the current game state
      const game = await this.caroService.getGameById(gameId);
      console.log(`Current game state for game ${gameId}:`, game);

      // Notify everyone in the room about the new player
      this.server.to(`game-${gameId}`).emit('game-update', {
        game,
        message: 'A player has joined the game',
      });

      return { success: true, game };
    } catch (error) {
      console.error('Error in handleJoinGame:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('move')
  async handleMove(@ConnectedSocket() client: Socket, @MessageBody() data: MoveData) {
    try {
      const { gameId, x, y, userId } = data;
      console.log(`User ${userId} making move at (${x},${y}) in game ${gameId}`);

      const moveDto: MoveDto = { gameId, x, y };

      // Process the move
      const result = await this.caroService.processMove(userId, moveDto);
      console.log(`Move result for game ${gameId}:`, result);

      // Broadcast the updated game state to all players in the room
      this.server.to(`game-${gameId}`).emit('game-update', {
        game: result.game,
        lastMove: { x, y, playerId: userId },
      });

      // If the game is over, send game-over event
      if (result.isGameOver) {
        console.log(`Game ${gameId} is over. Winner: ${result.winner}, isDraw: ${result.isDraw}`);
        this.server.to(`game-${gameId}`).emit('game-over', {
          game: result.game,
          winner: result.winner,
          isDraw: result.isDraw,
        });
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error in handleMove:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
