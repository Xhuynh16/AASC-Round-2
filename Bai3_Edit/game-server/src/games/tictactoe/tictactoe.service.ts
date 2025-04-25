import { Injectable } from '@nestjs/common';

interface Player {
  id: string;
  username: string;
  symbol: 'X' | 'O';
}

interface GameState {
  id: string;
  board: Array<'X' | 'O' | null>;
  boardSize: number;
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'playing' | 'finished';
  winner: 'X' | 'O' | 'draw' | null;
  players: Player[];
  winningCells?: number[];
}

@Injectable()
export class TictactoeService {
  private games: Map<string, GameState> = new Map();
  private waitingRoom: string[] = [];
  private playerGameMap: Map<string, string> = new Map(); // Maps player ID to game ID
  private readonly BOARD_SIZE = 15; // 15x15 board
  private readonly WIN_CONDITION = 5; // 5 in a row to win

  addPlayerToWaitingRoom(playerId: string): void {
    // Remove player from waiting room if they were already there
    const waitingIndex = this.waitingRoom.indexOf(playerId);
    if (waitingIndex !== -1) {
      this.waitingRoom.splice(waitingIndex, 1);
    }
    
    this.waitingRoom.push(playerId);
  }

  removePlayerFromWaitingRoom(playerId: string): void {
    const waitingIndex = this.waitingRoom.indexOf(playerId);
    if (waitingIndex !== -1) {
      this.waitingRoom.splice(waitingIndex, 1);
    }
  }

  isPlayerWaiting(playerId: string): boolean {
    return this.waitingRoom.includes(playerId);
  }

  getWaitingPlayer(): string | undefined {
    return this.waitingRoom.shift();
  }

  createGame(player1Id: string, player1Username: string, player2Id?: string, player2Username?: string, customGameId?: string): GameState {
    // Create a game ID or use the custom one provided
    const gameId = customGameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create game state - 15x15 board = 225 cells
    const gameState: GameState = {
      id: gameId,
      board: Array(this.BOARD_SIZE * this.BOARD_SIZE).fill(null),
      boardSize: this.BOARD_SIZE,
      currentTurn: 'X', // X always goes first
      status: player2Id ? 'playing' : 'waiting',
      winner: null,
      players: [
        { id: player1Id, username: player1Username || 'Player 1', symbol: 'X' } // First player gets X
      ]
    };

    // Add second player if provided
    if (player2Id) {
      gameState.players.push({ 
        id: player2Id, 
        username: player2Username || 'Player 2', 
        symbol: 'O' 
      });
    }
    
    // Store game state
    this.games.set(gameId, gameState);
    
    // Map players to the game
    this.playerGameMap.set(player1Id, gameId);
    if (player2Id) {
      this.playerGameMap.set(player2Id, gameId);
    }
    
    return gameState;
  }

  joinGame(gameId: string, playerId: string, playerUsername: string): { success: boolean; game?: GameState; error?: string } {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found.' };
    }
    
    if (game.status !== 'waiting') {
      return { success: false, error: 'Game is already full or finished.' };
    }
    
    // Add player to the game
    game.players.push({ 
      id: playerId, 
      username: playerUsername || 'Player 2', 
      symbol: 'O' 
    });
    
    // Update game status
    game.status = 'playing';
    
    // Map player to game
    this.playerGameMap.set(playerId, gameId);
    
    return { success: true, game };
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  getGameByCustomId(customId: string): GameState | undefined {
    for (const [_, game] of this.games.entries()) {
      if (game.id === customId) {
        return game;
      }
    }
    return undefined;
  }

  getPlayerGame(playerId: string): GameState | undefined {
    const gameId = this.playerGameMap.get(playerId);
    if (gameId) {
      return this.games.get(gameId);
    }
    return undefined;
  }

  removeGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      // Clean up player-game mapping for all players in this game
      game.players.forEach(player => {
        this.playerGameMap.delete(player.id);
      });
      
      // Remove game
      this.games.delete(gameId);
    }
  }

  removePlayerFromGames(playerId: string): void {
    const gameId = this.playerGameMap.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        this.removeGame(gameId);
      }
      this.playerGameMap.delete(playerId);
    }
  }

  isPlayerInGame(playerId: string): boolean {
    return this.playerGameMap.has(playerId);
  }

  makeMove(gameId: string, playerId: string, position: number): { success: boolean; error?: string } {
    // Get game state
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found.' };
    }
    
    // Check if it's the player's turn
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'You are not part of this game.' };
    }
    
    if (game.currentTurn !== player.symbol) {
      return { success: false, error: 'Not your turn.' };
    }
    
    // Check if the move is valid
    const boardSize = game.boardSize * game.boardSize;
    if (
      position < 0 || 
      position >= boardSize || 
      game.board[position] !== null || 
      game.status !== 'playing'
    ) {
      return { success: false, error: 'Invalid move.' };
    }
    
    // Make the move
    game.board[position] = player.symbol;
    
    // Check for win or draw
    const result = this.checkWinner(game.board, position, player.symbol, game.boardSize);
    if (result.winner) {
      game.winner = player.symbol;
      game.status = 'finished';
      game.winningCells = result.winningCells;
    } else if (this.isBoardFull(game.board)) {
      game.winner = 'draw';
      game.status = 'finished';
    }
    
    // Switch turns if game is still active
    if (game.status === 'playing') {
      game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }
    
    return { success: true };
  }

  restartGame(gameId: string): { success: boolean; error?: string } {
    // Get game state
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found.' };
    }
    
    // Check if the game is finished
    if (game.status !== 'finished') {
      return { success: false, error: 'Cannot restart a game that is not finished.' };
    }
    
    // Reset game state
    game.board = Array(game.boardSize * game.boardSize).fill(null);
    game.currentTurn = 'X';
    game.status = 'playing';
    game.winner = null;
    game.winningCells = undefined;
    
    return { success: true };
  }

  checkWinner(board: Array<'X' | 'O' | null>, lastMovePos: number, symbol: 'X' | 'O', boardSize: number): { winner: boolean; winningCells?: number[] } {
    const row = Math.floor(lastMovePos / boardSize);
    const col = lastMovePos % boardSize;
    
    // Check directions: horizontal, vertical, diagonal(↗↙), diagonal(↖↘)
    const directions = [
      { rowDir: 0, colDir: 1 },  // horizontal
      { rowDir: 1, colDir: 0 },  // vertical
      { rowDir: 1, colDir: 1 },  // diagonal ↘
      { rowDir: 1, colDir: -1 }  // diagonal ↙
    ];
    
    for (const direction of directions) {
      const result = this.checkDirection(board, row, col, symbol, boardSize, direction.rowDir, direction.colDir);
      if (result.winner) {
        return result;
      }
    }
    
    return { winner: false };
  }

  checkDirection(
    board: Array<'X' | 'O' | null>, 
    row: number, 
    col: number, 
    symbol: 'X' | 'O', 
    boardSize: number, 
    rowDir: number, 
    colDir: number
  ): { winner: boolean; winningCells?: number[] } {
    const winningCells: number[] = [];
    
    // Check in the positive direction
    let count = 0;
    let r = row;
    let c = col;
    
    // Check up to 4 cells in each direction (plus the current cell = 9 total)
    for (let i = 0; i < this.WIN_CONDITION; i++) {
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) {
        break;
      }
      
      const pos = r * boardSize + c;
      if (board[pos] === symbol) {
        count++;
        winningCells.push(pos);
      } else {
        break;
      }
      
      r += rowDir;
      c += colDir;
    }
    
    // Check in the negative direction (opposite)
    r = row - rowDir;
    c = col - colDir;
    
    for (let i = 0; i < this.WIN_CONDITION - 1; i++) {
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) {
        break;
      }
      
      const pos = r * boardSize + c;
      if (board[pos] === symbol) {
        count++;
        winningCells.push(pos);
      } else {
        break;
      }
      
      r -= rowDir;
      c -= colDir;
    }
    
    return { 
      winner: count >= this.WIN_CONDITION,
      winningCells: count >= this.WIN_CONDITION ? winningCells : undefined
    };
  }

  isBoardFull(board: Array<'X' | 'O' | null>): boolean {
    return board.every(cell => cell !== null);
  }

  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }
} 