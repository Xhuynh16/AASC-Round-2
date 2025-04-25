export interface Cell {
  x: number;
  y: number;
  color?: number;
  isNewBall?: boolean;
}

export interface GameState {
  board: Cell[][];
  score: number;
  nextColors: number[];
}

export interface MovePayload {
  from: Cell;
  to: Cell;
} 