import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Line98Service } from './line98.service';

interface Cell {
  x: number;
  y: number;
  color?: number;
  isNewBall?: boolean;
}

interface GameState {
  board: Cell[][];
  score: number;
  nextColors: number[];
}

@WebSocketGateway({ namespace: 'line98' })
export class Line98Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameStates: Map<string, GameState> = new Map();

  constructor(private readonly line98Service: Line98Service) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    
    // Initialize game state for new player
    const userId = this.getUserIdFromClient(client);
    if (!this.gameStates.has(userId)) {
      this.gameStates.set(userId, this.line98Service.createNewGame());
    }
    
    // Send initial game state to client
    client.emit('gameState', this.gameStates.get(userId));
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('move')
  handleMove(client: Socket, payload: { from: Cell, to: Cell }) {
    const userId = this.getUserIdFromClient(client);
    const gameState = this.gameStates.get(userId);
    
    if (!gameState) return;
    
    const { from, to } = payload;
    
    // Check if move is valid
    if (!this.line98Service.isValidMove(gameState, from, to)) {
      client.emit('invalidMove', { message: 'Invalid move' });
      return;
    }
    
    // Process move
    this.line98Service.processMove(gameState, from, to);
    
    // Emit updated game state
    client.emit('gameState', gameState);
  }

  @SubscribeMessage('hint')
  handleHint(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    const gameState = this.gameStates.get(userId);
    
    if (!gameState) return;
    
    // Find best move
    const bestMove = this.line98Service.findBestMove(gameState);
    
    if (bestMove) {
      client.emit('hint', bestMove);
    } else {
      client.emit('hint', { message: 'No good moves available' });
    }
  }

  @SubscribeMessage('newGame')
  handleNewGame(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    this.gameStates.set(userId, this.line98Service.createNewGame());
    client.emit('gameState', this.gameStates.get(userId));
  }

  private getUserIdFromClient(client: Socket): string {
    // In production, extract user ID from JWT token
    return client.id;
  }
} 