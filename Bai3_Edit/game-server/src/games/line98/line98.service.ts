import { Injectable } from '@nestjs/common';

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

@Injectable()
export class Line98Service {
  private readonly BOARD_SIZE = 9;
  private readonly COLORS = [1, 2, 3, 4, 5, 6, 7]; // 1-7 represent different colors
  private readonly MIN_LINE_LENGTH = 5; // Minimum line length to be removed

  createNewGame(): GameState {
    // Initialize empty board
    const board: Cell[][] = Array(this.BOARD_SIZE)
      .fill(null)
      .map((_, y) => 
        Array(this.BOARD_SIZE)
          .fill(null)
          .map((_, x) => ({ x, y }))
      );
    
    // Add initial balls (3 balls)
    for (let i = 0; i < 3; i++) {
      this.addRandomBall(board);
    }
    
    // Generate next colors
    const nextColors = this.generateNextColors(3);
    
    return { board, score: 0, nextColors };
  }

  isValidMove(gameState: GameState, from: Cell, to: Cell): boolean {
    const { board } = gameState;
    
    // Check if source has a ball
    if (!board[from.y][from.x].color) {
      return false;
    }
    
    // Check if destination is empty
    if (board[to.y][to.x].color) {
      return false;
    }
    
    // Check if there is a valid path
    return this.findPath(gameState, from, to) !== null;
  }

  processMove(gameState: GameState, from: Cell, to: Cell): void {
    const { board } = gameState;
    const path = this.findPath(gameState, from, to);
    
    if (!path) return;
    
    // Move ball
    board[to.y][to.x].color = board[from.y][from.x].color;
    board[from.y][from.x].color = undefined;
    board[from.y][from.x].isNewBall = undefined;
    
    // Check if move created a line
    let linesRemoved = this.checkLines(gameState);
    
    // If no lines were removed, add new balls
    if (!linesRemoved) {
      // Mark all balls as not new
      for (let y = 0; y < this.BOARD_SIZE; y++) {
        for (let x = 0; x < this.BOARD_SIZE; x++) {
          if (board[y][x].color) {
            board[y][x].isNewBall = false;
          }
        }
      }
      
      // Add three new balls with colors from nextColors
      for (let i = 0; i < 3; i++) {
        const emptyCells = this.findEmptyCells(board);
        if (emptyCells.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { x, y } = emptyCells[randomIndex];
        
        board[y][x].color = gameState.nextColors[i];
        board[y][x].isNewBall = true;
      }
      
      // Generate new nextColors
      gameState.nextColors = this.generateNextColors(3);
      
      // Check if new balls created lines
      this.checkLines(gameState);
    }
  }

  findBestMove(gameState: GameState): { from: Cell, to: Cell } | null {
    const { board } = gameState;
    const balls: Cell[] = [];
    const emptyCells: Cell[] = [];
    
    // Find all balls and empty cells
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (board[y][x].color) {
          balls.push(board[y][x]);
        } else {
          emptyCells.push(board[y][x]);
        }
      }
    }
    
    // Strategy 1: Find a move that creates a line
    for (const ball of balls) {
      for (const emptyCell of emptyCells) {
        if (this.findPath(gameState, ball, emptyCell)) {
          // Try the move
          const testState = this.copyGameState(gameState);
          const testFrom = testState.board[ball.y][ball.x];
          const testTo = testState.board[emptyCell.y][emptyCell.x];
          
          testState.board[testTo.y][testTo.x].color = testState.board[testFrom.y][testFrom.x].color;
          testState.board[testFrom.y][testFrom.x].color = undefined;
          
          if (this.willCreateLine(testState, testTo)) {
            return { from: ball, to: emptyCell };
          }
        }
      }
    }
    
    // Strategy 2: Find a move that positions a ball to potentially create a line later
    let bestMove: { from: Cell, to: Cell, score: number } | null = null;
    
    for (const ball of balls) {
      for (const emptyCell of emptyCells) {
        if (this.findPath(gameState, ball, emptyCell)) {
          const potentialScore = this.countPotentialMatches(gameState, emptyCell);
          
          if (!bestMove || potentialScore > bestMove.score) {
            bestMove = { from: ball, to: emptyCell, score: potentialScore };
          }
        }
      }
    }
    
    if (bestMove) {
      return { from: bestMove.from, to: bestMove.to };
    }
    
    // Strategy 3: Just find any valid move
    for (const ball of balls) {
      for (const emptyCell of emptyCells) {
        if (this.findPath(gameState, ball, emptyCell)) {
          return { from: ball, to: emptyCell };
        }
      }
    }
    
    return null;
  }

  private addRandomBall(board: Cell[][]): void {
    const emptyCells = this.findEmptyCells(board);
    
    if (emptyCells.length === 0) return;
    
    // Pick random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { x, y } = emptyCells[randomIndex];
    
    // Set random color
    board[y][x].color = this.getRandomColor();
    board[y][x].isNewBall = true;
  }

  private findEmptyCells(board: Cell[][]): Cell[] {
    const emptyCells: Cell[] = [];
    
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (!board[y][x].color) {
          emptyCells.push(board[y][x]);
        }
      }
    }
    
    return emptyCells;
  }

  private getRandomColor(): number {
    const index = Math.floor(Math.random() * this.COLORS.length);
    return this.COLORS[index];
  }

  private generateNextColors(count: number): number[] {
    const colors: number[] = [];
    
    for (let i = 0; i < count; i++) {
      colors.push(this.getRandomColor());
    }
    
    return colors;
  }

  private findPath(gameState: GameState, from: Cell, to: Cell): Cell[] | null {
    const { board } = gameState;
    const visited: boolean[][] = Array(this.BOARD_SIZE)
      .fill(null)
      .map(() => Array(this.BOARD_SIZE).fill(false));
    
    const queue: { cell: Cell; path: Cell[] }[] = [];
    queue.push({ cell: from, path: [from] });
    visited[from.y][from.x] = true;
    
    while (queue.length > 0) {
      const { cell, path } = queue.shift()!;
      
      // Check if we reached the destination
      if (cell.x === to.x && cell.y === to.y) {
        return path;
      }
      
      // Check neighbors (up, right, down, left)
      const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }  // left
      ];
      
      for (const { dx, dy } of directions) {
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        
        // Check if neighbor is within bounds and not visited
        if (
          nx >= 0 && nx < this.BOARD_SIZE &&
          ny >= 0 && ny < this.BOARD_SIZE &&
          !visited[ny][nx]
        ) {
          // Check if neighbor is empty or is the destination
          if (!board[ny][nx].color || (nx === to.x && ny === to.y)) {
            visited[ny][nx] = true;
            const newPath = [...path, board[ny][nx]];
            queue.push({ cell: board[ny][nx], path: newPath });
          }
        }
      }
    }
    
    // No path found
    return null;
  }

  private checkLines(gameState: GameState): boolean {
    const { board } = gameState;
    let linesRemoved = false;
    
    // Helper function to check if a cell has a ball of the same color
    const isSameColor = (x: number, y: number, color: number): boolean => {
      return x >= 0 && x < this.BOARD_SIZE && 
             y >= 0 && y < this.BOARD_SIZE && 
             board[y][x].color === color;
    };
    
    // Cells to be removed
    const cellsToRemove: Cell[] = [];
    
    // Check horizontal lines
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE - this.MIN_LINE_LENGTH + 1; x++) {
        if (board[y][x].color) {
          let length = 1;
          const color = board[y][x].color;
          
          while (x + length < this.BOARD_SIZE && board[y][x + length].color === color) {
            length++;
          }
          
          if (length >= this.MIN_LINE_LENGTH) {
            linesRemoved = true;
            for (let i = 0; i < length; i++) {
              cellsToRemove.push(board[y][x + i]);
            }
          }
        }
      }
    }
    
    // Check vertical lines
    for (let x = 0; x < this.BOARD_SIZE; x++) {
      for (let y = 0; y < this.BOARD_SIZE - this.MIN_LINE_LENGTH + 1; y++) {
        if (board[y][x].color) {
          let length = 1;
          const color = board[y][x].color;
          
          while (y + length < this.BOARD_SIZE && board[y + length][x].color === color) {
            length++;
          }
          
          if (length >= this.MIN_LINE_LENGTH) {
            linesRemoved = true;
            for (let i = 0; i < length; i++) {
              cellsToRemove.push(board[y + i][x]);
            }
          }
        }
      }
    }
    
    // Check diagonal lines (top-left to bottom-right)
    for (let y = 0; y < this.BOARD_SIZE - this.MIN_LINE_LENGTH + 1; y++) {
      for (let x = 0; x < this.BOARD_SIZE - this.MIN_LINE_LENGTH + 1; x++) {
        if (board[y][x].color) {
          let length = 1;
          const color = board[y][x].color;
          
          while (
            x + length < this.BOARD_SIZE && 
            y + length < this.BOARD_SIZE && 
            board[y + length][x + length].color === color
          ) {
            length++;
          }
          
          if (length >= this.MIN_LINE_LENGTH) {
            linesRemoved = true;
            for (let i = 0; i < length; i++) {
              cellsToRemove.push(board[y + i][x + i]);
            }
          }
        }
      }
    }
    
    // Check diagonal lines (top-right to bottom-left)
    for (let y = 0; y < this.BOARD_SIZE - this.MIN_LINE_LENGTH + 1; y++) {
      for (let x = this.MIN_LINE_LENGTH - 1; x < this.BOARD_SIZE; x++) {
        if (board[y][x].color) {
          let length = 1;
          const color = board[y][x].color;
          
          while (
            x - length >= 0 && 
            y + length < this.BOARD_SIZE && 
            board[y + length][x - length].color === color
          ) {
            length++;
          }
          
          if (length >= this.MIN_LINE_LENGTH) {
            linesRemoved = true;
            for (let i = 0; i < length; i++) {
              cellsToRemove.push(board[y + i][x - i]);
            }
          }
        }
      }
    }
    
    // Remove balls and update score
    for (const cell of cellsToRemove) {
      if (cell.color) {
        gameState.score += 1;
        cell.color = undefined;
        cell.isNewBall = undefined;
      }
    }
    
    return linesRemoved;
  }

  private willCreateLine(gameState: GameState, cell: Cell): boolean {
    // Check if placing a ball at this cell would create a line
    const { board } = gameState;
    const color = cell.color;
    
    if (!color) return false;
    
    // Helper function to count consecutive same-colored balls in a direction
    const countInDirection = (dx: number, dy: number): number => {
      let count = 0;
      let x = cell.x + dx;
      let y = cell.y + dy;
      
      while (
        x >= 0 && x < this.BOARD_SIZE &&
        y >= 0 && y < this.BOARD_SIZE &&
        board[y][x].color === color
      ) {
        count++;
        x += dx;
        y += dy;
      }
      
      return count;
    };
    
    // Check horizontal
    const horizontalCount = countInDirection(-1, 0) + countInDirection(1, 0) + 1;
    if (horizontalCount >= this.MIN_LINE_LENGTH) return true;
    
    // Check vertical
    const verticalCount = countInDirection(0, -1) + countInDirection(0, 1) + 1;
    if (verticalCount >= this.MIN_LINE_LENGTH) return true;
    
    // Check diagonal (top-left to bottom-right)
    const diagonal1Count = countInDirection(-1, -1) + countInDirection(1, 1) + 1;
    if (diagonal1Count >= this.MIN_LINE_LENGTH) return true;
    
    // Check diagonal (top-right to bottom-left)
    const diagonal2Count = countInDirection(1, -1) + countInDirection(-1, 1) + 1;
    if (diagonal2Count >= this.MIN_LINE_LENGTH) return true;
    
    return false;
  }

  private copyGameState(gameState: GameState): GameState {
    return {
      board: JSON.parse(JSON.stringify(gameState.board)),
      score: gameState.score,
      nextColors: [...gameState.nextColors]
    };
  }

  private countPotentialMatches(gameState: GameState, cell: Cell): number {
    let score = 0;
    const { board } = gameState;
    
    // Count adjacent balls of same color (potential matches)
    const directions = [
      { dx: -1, dy: 0 },  // left
      { dx: 1, dy: 0 },   // right
      { dx: 0, dy: -1 },  // up
      { dx: 0, dy: 1 },   // down
      { dx: -1, dy: -1 }, // top-left
      { dx: 1, dy: -1 },  // top-right
      { dx: -1, dy: 1 },  // bottom-left
      { dx: 1, dy: 1 }    // bottom-right
    ];
    
    for (const { dx, dy } of directions) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      
      if (
        nx >= 0 && nx < this.BOARD_SIZE &&
        ny >= 0 && ny < this.BOARD_SIZE &&
        board[ny][nx].color
      ) {
        score++;
      }
    }
    
    return score;
  }
} 