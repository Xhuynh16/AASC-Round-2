export interface Player {
  id: string;
  username: string;
  symbol: 'X' | 'O';
}

export interface GameState {
  id: string;
  board: Array<'X' | 'O' | null>;
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'playing' | 'finished';
  winner: 'X' | 'O' | 'draw' | null;
  players: Player[];
}

export interface MovePayload {
  gameId: string;
  position: number;
} 