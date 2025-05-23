export interface GameState {
  id: number;
  board: (string | null)[][];
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'playing' | 'finished';
  player1Id: number;
  player2Id: number | null;
  winnerId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GameUpdate {
  game: GameState;
  message?: string;
  lastMove?: {
    x: number;
    y: number;
    playerId: number;
  };
}

export interface GameOverEvent {
  game: GameState;
  winner?: number;
  isDraw?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JoinGameResponse {
  gameId: number;
  message?: string;
}
