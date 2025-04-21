import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Line98Game, GameStatus } from './entities/line98-game.entity';
import { StartDto } from './dto/start.dto';
import { MoveDto } from './dto/move.dto';

@Injectable()
export class Line98Service {
  private readonly EMPTY_CELL = 0;
  private readonly BALL_OFFSET = 1; // Balls colors start from 1 (1-5 for colors, negative for "next" balls)

  constructor(
    @InjectRepository(Line98Game)
    private line98GameRepository: Repository<Line98Game>,
  ) {}

  async startGame(userId: number, startDto: StartDto): Promise<Line98Game> {
    const { gridSize = 9, colorCount = 5, initialBallCount = 3 } = startDto;

    // Initialize an empty board
    const cells: number[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => this.EMPTY_CELL),
    );

    // Generate initial balls
    const initialBalls = this.generateRandomBalls(cells, initialBallCount, colorCount);

    // Generate next balls (shown as preview)
    const nextColors = this.generateNextColors(colorCount, initialBallCount);

    const game = this.line98GameRepository.create({
      userId,
      board: {
        cells,
        nextColors,
      },
      status: GameStatus.ACTIVE,
      score: 0,
    });

    // Place initial balls on the board
    initialBalls.forEach((ball) => {
      cells[ball.row][ball.col] = ball.color;
    });

    return this.line98GameRepository.save(game);
  }

  async moveBall(userId: number, gameId: number, moveDto: MoveDto): Promise<Line98Game> {
    const game = await this.findGameById(gameId, userId);

    if (game.status === GameStatus.GAME_OVER) {
      throw new BadRequestException('Game is already over');
    }

    const { cells, nextColors } = game.board;
    const { fromRow, fromCol, toRow, toCol } = moveDto;

    // Validate from position contains a ball
    if (cells[fromRow][fromCol] <= this.EMPTY_CELL) {
      throw new BadRequestException('No ball at the starting position');
    }

    // Validate to position is empty
    if (cells[toRow][toCol] !== this.EMPTY_CELL) {
      throw new BadRequestException('Destination position is not empty');
    }

    // Check if there's a valid path using BFS
    const path = this.findPath(cells, fromRow, fromCol, toRow, toCol);
    if (!path) {
      throw new BadRequestException('No valid path found for this move');
    }

    // Move the ball
    const ballColor = cells[fromRow][fromCol];
    cells[fromRow][fromCol] = this.EMPTY_CELL;
    cells[toRow][toCol] = ballColor;

    // Check for matching lines of 5 or more
    const linesRemoved = this.checkAndRemoveLines(cells);

    let gameOver = false;
    let newNextColors: number[] = [];

    // If no lines were removed, add new balls
    if (linesRemoved === 0) {
      // Get empty cells count
      const emptyCellsCount = this.countEmptyCells(cells);

      // Check if game is over (not enough empty cells)
      if (emptyCellsCount < nextColors.length) {
        game.status = GameStatus.GAME_OVER;
        gameOver = true;
      } else {
        // Place next balls on the board
        nextColors.forEach((color) => {
          const position = this.findRandomEmptyPosition(cells);
          if (position) {
            cells[position.row][position.col] = color;
          }
        });

        // Check if placing new balls created any lines
        this.checkAndRemoveLines(cells);

        // Generate next colors if game is still active
        if (!gameOver) {
          newNextColors = this.generateNextColors(5, 3); // Always use 5 colors, 3 balls
        }
      }
    } else {
      // Update score - 10 points per removed ball
      game.score += linesRemoved * 10;

      // If lines were removed, don't add new balls but generate new next colors
      newNextColors = nextColors;
    }

    // Update game board
    game.board = {
      cells,
      nextColors: gameOver ? [] : newNextColors,
    };

    // Check for game over again after all actions
    if (!gameOver && this.countEmptyCells(cells) === 0) {
      game.status = GameStatus.GAME_OVER;
    }

    return this.line98GameRepository.save(game);
  }

  async getHint(
    userId: number,
    gameId: number,
  ): Promise<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> {
    const game = await this.findGameById(gameId, userId);

    if (game.status === GameStatus.GAME_OVER) {
      throw new BadRequestException('Game is already over');
    }

    const { cells } = game.board;
    const gridSize = cells.length;

    // Try to find a move that would create a line of 5 or more
    for (let fromRow = 0; fromRow < gridSize; fromRow++) {
      for (let fromCol = 0; fromCol < gridSize; fromCol++) {
        // Skip empty cells
        if (cells[fromRow][fromCol] <= this.EMPTY_CELL) continue;

        const ballColor = cells[fromRow][fromCol];

        // Try all possible destination cells
        for (let toRow = 0; toRow < gridSize; toRow++) {
          for (let toCol = 0; toCol < gridSize; toCol++) {
            // Skip non-empty cells
            if (cells[toRow][toCol] !== this.EMPTY_CELL) continue;

            // Check if there's a valid path
            const path = this.findPath(cells, fromRow, fromCol, toRow, toCol);
            if (!path) continue;

            // Simulate the move
            const cellsCopy: number[][] = JSON.parse(JSON.stringify(cells));
            cellsCopy[fromRow][fromCol] = this.EMPTY_CELL;
            cellsCopy[toRow][toCol] = ballColor;

            // Check if this creates a line
            if (this.wouldCreateLine(cellsCopy, toRow, toCol)) {
              return { fromRow, fromCol, toRow, toCol };
            }
          }
        }
      }
    }

    // If no move creates a line, just return any valid move
    for (let fromRow = 0; fromRow < gridSize; fromRow++) {
      for (let fromCol = 0; fromCol < gridSize; fromCol++) {
        if (cells[fromRow][fromCol] <= this.EMPTY_CELL) continue;

        for (let toRow = 0; toRow < gridSize; toRow++) {
          for (let toCol = 0; toCol < gridSize; toCol++) {
            if (cells[toRow][toCol] !== this.EMPTY_CELL) continue;

            const path = this.findPath(cells, fromRow, fromCol, toRow, toCol);
            if (path) {
              return { fromRow, fromCol, toRow, toCol };
            }
          }
        }
      }
    }

    throw new BadRequestException('No valid moves available');
  }

  async findGameById(id: number, userId: number): Promise<Line98Game> {
    const game = await this.line98GameRepository.findOne({
      where: { id, userId },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return game;
  }

  async findPathForClient(
    userId: number,
    gameId: number,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): Promise<{ path: { row: number; col: number }[] }> {
    const game = await this.findGameById(gameId, userId);
    if (game.status === GameStatus.GAME_OVER) {
      throw new BadRequestException('Game is already over');
    }
    const { cells } = game.board;
    // Validate from position contains a ball
    if (cells[fromRow][fromCol] <= this.EMPTY_CELL) {
      throw new BadRequestException('No ball at the starting position');
    }
    // Validate to position is empty
    if (cells[toRow][toCol] !== this.EMPTY_CELL) {
      throw new BadRequestException('Destination position is not empty');
    }
    // Find the path
    const path = this.findPath(cells, fromRow, fromCol, toRow, toCol);
    if (!path) {
      return { path: [] };
    }
    return { path };
  }

  private generateRandomBalls(
    cells: number[][],
    count: number,
    colorCount: number,
  ): { row: number; col: number; color: number }[] {
    const balls: { row: number; col: number; color: number }[] = [];
    const gridSize = cells.length;

    for (let i = 0; i < count; i++) {
      const position = this.findRandomEmptyPosition(cells);
      if (position) {
        const color = this.generateRandomColor(colorCount);
        balls.push({ ...position, color });
        // Mark the position as taken to avoid duplicate selection
        cells[position.row][position.col] = -1; // Temporary marker
      }
    }

    // Reset the temporary markers
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (cells[row][col] === -1) {
          cells[row][col] = this.EMPTY_CELL;
        }
      }
    }

    return balls;
  }

  private generateNextColors(colorCount: number, ballCount: number): number[] {
    const colors: number[] = [];
    for (let i = 0; i < ballCount; i++) {
      colors.push(this.generateRandomColor(colorCount));
    }
    return colors;
  }

  private generateRandomColor(colorCount: number): number {
    return Math.floor(Math.random() * colorCount) + this.BALL_OFFSET;
  }

  private findRandomEmptyPosition(cells: number[][]): { row: number; col: number } | null {
    const gridSize = cells.length;
    const emptyCells: { row: number; col: number }[] = [];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (cells[row][col] === this.EMPTY_CELL) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }

  private countEmptyCells(cells: number[][]): number {
    const gridSize = cells.length;
    let count = 0;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (cells[row][col] === this.EMPTY_CELL) {
          count++;
        }
      }
    }

    return count;
  }

  private findPath(
    cells: number[][],
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): { row: number; col: number }[] | null {
    if (fromRow === toRow && fromCol === toCol) {
      return null; // Can't move to the same position
    }

    const gridSize = cells.length;
    const visited: boolean[][] = Array(gridSize)
      .fill(0)
      .map(() => Array(gridSize).fill(false));
    const queue = [{ row: fromRow, col: fromCol, path: [] as { row: number; col: number }[] }];
    visited[fromRow][fromCol] = true;

    // Directions: up, right, down, left
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];

    while (queue.length > 0) {
      const { row, col, path } = queue.shift() as {
        row: number;
        col: number;
        path: { row: number; col: number }[];
      };

      // Check all four directions
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        // Check if the new position is within the grid
        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
          continue;
        }

        // Check if the new position is unvisited and empty
        if (!visited[newRow][newCol] && cells[newRow][newCol] === this.EMPTY_CELL) {
          // Create a new path by appending the current position
          const newPath: { row: number; col: number }[] = [...path, { row, col }];

          // Check if we reached the destination
          if (newRow === toRow && newCol === toCol) {
            // Return the complete path including the destination
            return [...newPath, { row: newRow, col: newCol }];
          }

          // Mark as visited and add to queue
          visited[newRow][newCol] = true;
          queue.push({ row: newRow, col: newCol, path: newPath });
        }
      }
    }

    return null; // No path found
  }

  private checkAndRemoveLines(cells: number[][]): number {
    const gridSize = cells.length;
    const markedForRemoval: boolean[][] = Array(gridSize)
      .fill(0)
      .map(() => Array(gridSize).fill(false));
    let totalRemoved = 0;

    // Check horizontal lines
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize - 4; col++) {
        const color = cells[row][col];
        if (color <= this.EMPTY_CELL) continue; // Skip empty cells

        let lineLength = 1;
        let currentCol = col + 1;

        while (currentCol < gridSize && cells[row][currentCol] === color) {
          lineLength++;
          currentCol++;
        }

        if (lineLength >= 5) {
          for (let i = 0; i < lineLength; i++) {
            markedForRemoval[row][col + i] = true;
          }
        }
      }
    }

    // Check vertical lines
    for (let col = 0; col < gridSize; col++) {
      for (let row = 0; row < gridSize - 4; row++) {
        const color = cells[row][col];
        if (color <= this.EMPTY_CELL) continue; // Skip empty cells

        let lineLength = 1;
        let currentRow = row + 1;

        while (currentRow < gridSize && cells[currentRow][col] === color) {
          lineLength++;
          currentRow++;
        }

        if (lineLength >= 5) {
          for (let i = 0; i < lineLength; i++) {
            markedForRemoval[row + i][col] = true;
          }
        }
      }
    }

    // Check diagonal lines (top-left to bottom-right)
    for (let row = 0; row < gridSize - 4; row++) {
      for (let col = 0; col < gridSize - 4; col++) {
        const color = cells[row][col];
        if (color <= this.EMPTY_CELL) continue; // Skip empty cells

        let lineLength = 1;
        let currentRow = row + 1;
        let currentCol = col + 1;

        while (
          currentRow < gridSize &&
          currentCol < gridSize &&
          cells[currentRow][currentCol] === color
        ) {
          lineLength++;
          currentRow++;
          currentCol++;
        }

        if (lineLength >= 5) {
          for (let i = 0; i < lineLength; i++) {
            markedForRemoval[row + i][col + i] = true;
          }
        }
      }
    }

    // Check diagonal lines (top-right to bottom-left)
    for (let row = 0; row < gridSize - 4; row++) {
      for (let col = 4; col < gridSize; col++) {
        const color = cells[row][col];
        if (color <= this.EMPTY_CELL) continue; // Skip empty cells

        let lineLength = 1;
        let currentRow = row + 1;
        let currentCol = col - 1;

        while (
          currentRow < gridSize &&
          currentCol >= 0 &&
          cells[currentRow][currentCol] === color
        ) {
          lineLength++;
          currentRow++;
          currentCol--;
        }

        if (lineLength >= 5) {
          for (let i = 0; i < lineLength; i++) {
            markedForRemoval[row + i][col - i] = true;
          }
        }
      }
    }

    // Remove marked cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (markedForRemoval[row][col]) {
          cells[row][col] = this.EMPTY_CELL;
          totalRemoved++;
        }
      }
    }

    return totalRemoved;
  }

  private wouldCreateLine(cells: number[][], row: number, col: number): boolean {
    const gridSize = cells.length;
    const color = cells[row][col];
    if (color <= this.EMPTY_CELL) return false;

    // Check horizontal
    let count = 1;
    let c = col - 1;
    while (c >= 0 && cells[row][c] === color) {
      count++;
      c--;
    }
    c = col + 1;
    while (c < gridSize && cells[row][c] === color) {
      count++;
      c++;
    }
    if (count >= 5) return true;

    // Check vertical
    count = 1;
    let r = row - 1;
    while (r >= 0 && cells[r][col] === color) {
      count++;
      r--;
    }
    r = row + 1;
    while (r < gridSize && cells[r][col] === color) {
      count++;
      r++;
    }
    if (count >= 5) return true;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    r = row - 1;
    c = col - 1;
    while (r >= 0 && c >= 0 && cells[r][c] === color) {
      count++;
      r--;
      c--;
    }
    r = row + 1;
    c = col + 1;
    while (r < gridSize && c < gridSize && cells[r][c] === color) {
      count++;
      r++;
      c++;
    }
    if (count >= 5) return true;

    // Check diagonal (top-right to bottom-left)
    count = 1;
    r = row - 1;
    c = col + 1;
    while (r >= 0 && c < gridSize && cells[r][c] === color) {
      count++;
      r--;
      c++;
    }
    r = row + 1;
    c = col - 1;
    while (r < gridSize && c >= 0 && cells[r][c] === color) {
      count++;
      r++;
      c--;
    }
    if (count >= 5) return true;

    return false;
  }
}
