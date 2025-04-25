import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TictactoeService } from './tictactoe.service';

interface Player {
  id: string;
  username: string;
  symbol: 'X' | 'O';
}

@WebSocketGateway({ namespace: 'tictactoe' })
export class TictactoeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly tictactoeService: TictactoeService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Initially, we don't add the player to waiting room. They must join manually.
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove player from waiting room if they were waiting
    this.tictactoeService.removePlayerFromWaitingRoom(client.id);
    
    // Handle player leaving a game
    const game = this.tictactoeService.getPlayerGame(client.id);
    if (game) {
      // Notify opponent that player has left
      game.players.forEach((player) => {
        if (player.id !== client.id) {
          this.server.to(player.id).emit('playerLeft', { message: 'Opponent has left the game.' });
        }
      });
      
      // Remove game
      this.tictactoeService.removePlayerFromGames(client.id);
    }
  }

  @SubscribeMessage('createGame')
  handleCreateGame(client: Socket, payload: { username: string, gameId?: string }) {
    const { username, gameId } = payload;
    
    // Check if player is already in a game
    if (this.tictactoeService.isPlayerInGame(client.id)) {
      return { error: 'You are already in a game.' };
    }
    
    // Create a new game
    const customId = gameId || undefined;
    const gameState = this.tictactoeService.createGame(client.id, username, undefined, undefined, customId);
    
    // Emit game created event to the player
    client.emit('gameCreated', {
      gameId: gameState.id,
      boardSize: gameState.boardSize,
      yourSymbol: 'X'
    });
    
    client.emit('waiting', { message: 'Waiting for an opponent...', gameId: gameState.id });
    
    return { status: 'created', gameId: gameState.id };
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, payload: { username: string, gameId?: string }) {
    const { username, gameId } = payload;
    
    // Check if player is already in a game
    if (this.tictactoeService.isPlayerInGame(client.id)) {
      return { error: 'You are already in a game.' };
    }
    
    // If gameId is provided, try to join that specific game
    if (gameId) {
      const result = this.tictactoeService.joinGame(gameId, client.id, username);
      
      if (!result.success) {
        return { error: result.error };
      }
      
      const game = result.game;
      
      // Make sure game exists before proceeding
      if (!game) {
        return { error: 'Game not found after joining.' };
      }
      
      // Find opponent
      const opponent = game.players.find((p) => p.id !== client.id);
      
      // Make sure opponent exists before proceeding
      if (!opponent) {
        return { error: 'Cannot find opponent in the game.' };
      }
      
      // Emit game started event to both players
      this.server.to(opponent.id).emit('gameStarted', {
        gameId: game.id,
        board: game.board,
        boardSize: game.boardSize,
        yourSymbol: 'X',
        currentTurn: game.currentTurn,
        opponent: { username: username || 'Player 2' }
      });
      
      client.emit('gameStarted', {
        gameId: game.id,
        board: game.board,
        boardSize: game.boardSize,
        yourSymbol: 'O',
        currentTurn: game.currentTurn,
        opponent: { username: opponent.username }
      });
      
      return { status: 'joined', gameId: game.id };
    } else {
      // If no gameId provided, add to waiting room or match with waiting player
      if (!this.tictactoeService.isPlayerWaiting(client.id)) {
        const opponent = this.tictactoeService.getWaitingPlayer();
        
        if (!opponent) {
          // No one waiting, add player to waiting room
          this.tictactoeService.addPlayerToWaitingRoom(client.id);
          client.emit('waiting', { message: 'Waiting for an opponent...' });
          return { status: 'waiting' };
        } else {
          // Someone is waiting, create a new game
          const opponentSocket = this.findSocketById(opponent);
          const opponentUsername = opponentSocket ? opponentSocket.handshake.query.username || 'Player 1' : 'Player 1';
          
          // Create game
          const gameState = this.tictactoeService.createGame(
            opponent,
            opponentUsername.toString(),
            client.id,
            username || 'Player 2'
          );
          
          // Emit game started event to both players
          this.server.to(opponent).emit('gameStarted', {
            gameId: gameState.id,
            board: gameState.board,
            boardSize: gameState.boardSize,
            yourSymbol: 'X',
            currentTurn: gameState.currentTurn,
            opponent: { username: username || 'Player 2' }
          });
          
          client.emit('gameStarted', {
            gameId: gameState.id,
            board: gameState.board,
            boardSize: gameState.boardSize,
            yourSymbol: 'O',
            currentTurn: gameState.currentTurn,
            opponent: { username: opponentUsername }
          });
          
          return { status: 'joined', gameId: gameState.id };
        }
      } else {
        return { error: 'You are already in the waiting room.' };
      }
    }
  }

  @SubscribeMessage('listGames')
  handleListGames() {
    const games = this.tictactoeService.getAllGames();
    const availableGames = games
      .filter((game) => game.status === 'waiting')
      .map((game) => ({
        id: game.id,
        createdBy: game.players[0].username
      }));
    
    return { games: availableGames };
  }

  @SubscribeMessage('makeMove')
  handleMove(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: any
  ) {
    try {
      console.log('[' + new Date().toISOString() + '] Received move from client', client.id);
      console.log('Raw data:', data);
      
      // Extract gameId and position
      let gameId: string | undefined;
      let position: number | undefined;
      
      if (Array.isArray(data)) {
        // Handle array format: [gameId, position]
        gameId = data[0];
        position = data[1];
        console.log('Extracted from array:', gameId, position);
      } else if (typeof data === 'object' && data !== null) {
        gameId = data.gameId;
        position = data.position;
        console.log('Extracted from object:', gameId, position);
      } else if (arguments.length >= 3) {
        // Direct parameters: client, gameId, position
        gameId = arguments[1];
        position = arguments[2];
        console.log('Extracted from arguments:', gameId, position);
      }
      
      console.log(`Extracted: gameId=${gameId}, position=${position}`);
      
      if (!gameId || position === undefined || position === null) {
        console.error('Invalid move data, missing gameId or position', { gameId, position });
        return { success: false, error: 'Missing game ID or position.' };
      }
      
      // Get game to do pre-validation
      const game = this.tictactoeService.getGame(gameId);
      if (!game) {
        console.error('Game not found before making move', { gameId });
        return { success: false, error: 'Game not found.' };
      }
      
      // Debug game status
      console.log(`Game status check: id=${game.id}, status=${game.status}, currentTurn=${game.currentTurn}`);
      console.log(`Board size: ${game.boardSize}x${game.boardSize}, position: ${position}`);
      
      // Ensure game status is 'playing'
      if (game.status !== 'playing') {
        console.error(`Game status is not 'playing'. Current status: ${game.status}`);
        return { success: false, error: `Game is not in playing state. Current status: ${game.status}` };
      }
      
      // Check if position is within bounds
      if (position < 0 || position >= game.boardSize * game.boardSize) {
        console.error(`Position out of bounds: ${position}, max allowed: ${game.boardSize * game.boardSize - 1}`);
        return { success: false, error: `Invalid position: ${position}. Must be between 0 and ${game.boardSize * game.boardSize - 1}` };
      }
      
      // Convert position to number if it's a string
      const positionNum = typeof position === 'string' ? parseInt(position, 10) : position;
      if (isNaN(positionNum)) {
        console.error('Invalid position value:', position);
        return { success: false, error: 'Invalid position value.' };
      }
      
      // Make the move
      console.log(`Making move: gameId=${gameId}, playerId=${client.id}, position=${positionNum}`);
      const result = this.tictactoeService.makeMove(gameId, client.id, positionNum);
      console.log('Move result:', result);
      
      if (!result.success) {
        console.error('Move failed:', result.error);
        return { success: false, error: result.error };
      }
      
      // Get updated game state
      const updatedGame = this.tictactoeService.getGame(gameId);
      if (!updatedGame) {
        console.error('Game not found after successful move');
        return { success: false, error: 'Game not found.' };
      }
      
      console.log(`Broadcasting updated game state to ${updatedGame.players.length} players`);
      console.log('Board state:', updatedGame.board);
      
      // Broadcast updated game state to both players
      updatedGame.players.forEach((p) => {
        console.log(`Sending gameUpdated to player ${p.id}`);
        this.server.to(p.id).emit('gameUpdated', {
          gameId: updatedGame.id,  // Add gameId to the response
          board: updatedGame.board,
          currentTurn: updatedGame.currentTurn,
          status: updatedGame.status,
          winner: updatedGame.winner,
          winningCells: updatedGame.winningCells
        });
      });
      
      console.log('Move processed successfully');
      return { success: true };
      
    } catch (error) {
      console.error('Error processing move:', error);
      return { success: false, error: 'Server error processing move.' };
    }
  }

  @SubscribeMessage('restartGame')
  handleRestart(client: Socket, payload: { gameId: string }) {
    const { gameId } = payload;
    
    // Restart the game
    const result = this.tictactoeService.restartGame(gameId);
    if (!result.success) {
      return { error: result.error };
    }
    
    // Get updated game state
    const game = this.tictactoeService.getGame(gameId);
    if (!game) {
      return { error: 'Game not found.' };
    }
    
    // Broadcast updated game state to both players
    game.players.forEach((p) => {
      this.server.to(p.id).emit('gameRestarted', {
        board: game.board,
        currentTurn: game.currentTurn
      });
    });
    
    return { success: true };
  }

  @SubscribeMessage('requestGameState')
  handleRequestGameState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ) {
    console.log(`Client ${client.id} requested game state, data:`, data);
    
    try {
      // Extract gameId from various possible formats
      let gameId: string | undefined;
      
      if (Array.isArray(data)) {
        // Data is in array format: [gameId]
        gameId = data[0];
        console.log('Extracted gameId from array:', gameId);
      } else if (typeof data === 'string') {
        // Direct gameId as string
        gameId = data;
        console.log('Using string directly as gameId:', gameId);
      } else if (typeof data === 'object' && data !== null && data.gameId) {
        // Object with gameId property
        gameId = data.gameId;
        console.log('Extracted gameId from object:', gameId);
      } else if (arguments.length >= 2) {
        // Direct parameter after client
        gameId = arguments[1];
        console.log('Using argument as gameId:', gameId);
      }
      
      console.log(`Extracted gameId: ${gameId}`);
      
      if (!gameId) {
        console.error('requestGameState: Missing gameId');
        return { success: false, error: 'Game ID is required.' };
      }
      
      console.log(`Looking for game with ID: ${gameId}`);
      
      // Get the game
      const game = this.tictactoeService.getGame(gameId);
      if (!game) {
        console.log(`Game ${gameId} not found`);
        return { success: false, error: 'Game not found.' };
      }
      
      // Check if client is a player in this game
      const player = game.players.find(p => p.id === client.id);
      if (!player) {
        console.log(`Client ${client.id} is not a player in game ${gameId}`);
        return { success: false, error: 'You are not a player in this game.' };
      }
      
      console.log(`Sending game state to player ${client.id} for game ${gameId}`);
      
      // Return current game state directly to the requesting client
      return {
        success: true,
        gameState: {
          id: game.id,
          board: game.board,
          boardSize: game.boardSize,
          currentTurn: game.currentTurn,
          status: game.status,
          winner: game.winner,
          winningCells: game.winningCells,
          yourSymbol: player.symbol
        }
      };
    } catch (error) {
      console.error('Error processing game state request:', error);
      return { success: false, error: 'Server error processing request.' };
    }
  }
  
  private findSocketById(id: string): Socket | undefined {
    // Try to find the socket directly using the get method
    try {
      const socket = this.server.sockets.sockets.get(id);
      return socket || undefined;
    } catch (error) {
      console.error('Error finding socket:', error);
      return undefined;
    }
  }
} 