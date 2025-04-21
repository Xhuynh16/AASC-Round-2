import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaroGame, GameStatus, Board, BoardCell } from './entities/caro-game.entity';
import { JoinCaroGameDto } from './dto/join.dto';
import { MoveDto } from './dto/move.dto';

@Injectable()
export class CaroService {
  private readonly BOARD_SIZE = 15;
  private readonly WIN_CONDITION = 5; // 5 in a row to win

  constructor(
    @InjectRepository(CaroGame)
    private caroGameRepository: Repository<CaroGame>,
  ) {}

  async joinGame(userId: number, joinDto: JoinCaroGameDto): Promise<{ gameId: number }> {
    console.log('joinGame called with userId:', userId, 'and joinDto:', joinDto);

    // Đảm bảo userId có giá trị
    if (userId === null || userId === undefined) {
      console.error('userId is null or undefined!');
      // Sử dụng userId mặc định nếu không có giá trị
      userId = 1;
    }

    // If gameId is provided, try to join that specific game
    if (joinDto.gameId) {
      return this.joinExistingGame(userId, joinDto.gameId);
    }

    // Otherwise, find a game waiting for players or create a new one
    const waitingGame = await this.caroGameRepository.findOne({
      where: { status: GameStatus.WAITING },
      order: { createdAt: 'ASC' },
    });

    if (waitingGame) {
      return this.joinExistingGame(userId, waitingGame.id);
    }

    // Create a new game if no waiting games
    return this.createNewGame(userId);
  }

  private async joinExistingGame(userId: number, gameId: number): Promise<{ gameId: number }> {
    const game = await this.caroGameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    // Prevent joining if the player is already in the game
    if (game.player1Id === userId || game.player2Id === userId) {
      return { gameId: game.id };
    }

    // Prevent joining a game that's already full or finished
    if (game.status !== GameStatus.WAITING || game.player2Id !== null) {
      throw new BadRequestException('Game is not available for joining');
    }

    // Join the game
    game.player2Id = userId;
    game.status = GameStatus.PLAYING;
    await this.caroGameRepository.save(game);

    return { gameId: game.id };
  }

  private async createNewGame(userId: number): Promise<{ gameId: number }> {
    console.log('Creating new game with player1Id:', userId);

    // Create a new 15x15 board filled with nulls
    const board = Array(this.BOARD_SIZE)
      .fill(null)
      .map(() => Array(this.BOARD_SIZE).fill(null)) as Board;

    const newGame = this.caroGameRepository.create({
      player1Id: userId,
      board,
      status: GameStatus.WAITING,
      currentTurn: 'X',
    });

    console.log('Game entity created:', newGame);
    const savedGame = await this.caroGameRepository.save(newGame);
    console.log('Game saved successfully with ID:', savedGame.id);

    return { gameId: savedGame.id };
  }

  async getGameById(gameId: number): Promise<CaroGame> {
    const game = await this.caroGameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return game;
  }

  async processMove(
    userId: number,
    moveDto: MoveDto,
  ): Promise<{
    game: CaroGame;
    isGameOver: boolean;
    winner?: number;
    isDraw?: boolean;
  }> {
    const { gameId, x, y } = moveDto;
    const game = await this.getGameById(gameId);

    // Validate it's a valid move
    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is not in playing state');
    }

    const isPlayerTurn = this.isPlayerTurn(game, userId);
    if (!isPlayerTurn) {
      throw new BadRequestException('Not your turn');
    }

    if (game.board[y][x] !== null) {
      throw new BadRequestException('Cell is already occupied');
    }

    // Make the move
    const symbol = this.getPlayerSymbol(game, userId);
    game.board[y][x] = symbol;

    // Switch turns
    game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';

    // Check for win or draw
    const isWin = this.checkWin(game.board, x, y, symbol);
    const isDraw = this.checkDraw(game.board);

    if (isWin) {
      game.status = GameStatus.FINISHED;
      game.winnerId = userId;
      await this.caroGameRepository.save(game);
      return { game, isGameOver: true, winner: userId };
    }

    if (isDraw) {
      game.status = GameStatus.FINISHED;
      await this.caroGameRepository.save(game);
      return { game, isGameOver: true, isDraw: true };
    }

    // Save game state
    await this.caroGameRepository.save(game);
    return { game, isGameOver: false };
  }

  private isPlayerTurn(game: CaroGame, userId: number): boolean {
    if (game.currentTurn === 'X' && game.player1Id === userId) {
      return true;
    }
    if (game.currentTurn === 'O' && game.player2Id === userId) {
      return true;
    }
    return false;
  }

  private getPlayerSymbol(game: CaroGame, userId: number): BoardCell {
    if (game.player1Id === userId) {
      return 'X';
    }
    if (game.player2Id === userId) {
      return 'O';
    }
    return null;
  }

  private checkWin(board: Board, x: number, y: number, symbol: BoardCell): boolean {
    // Check horizontally, vertically, and diagonally for 5 in a row
    return (
      this.checkDirection(board, x, y, 1, 0, symbol) || // Horizontal
      this.checkDirection(board, x, y, 0, 1, symbol) || // Vertical
      this.checkDirection(board, x, y, 1, 1, symbol) || // Diagonal \
      this.checkDirection(board, x, y, 1, -1, symbol) // Diagonal /
    );
  }

  private checkDirection(
    board: Board,
    startX: number,
    startY: number,
    dirX: number,
    dirY: number,
    symbol: BoardCell,
  ): boolean {
    let count = 1; // Start with 1 (the current cell)

    // Check in the positive direction
    for (let i = 1; i < this.WIN_CONDITION; i++) {
      const newX = startX + i * dirX;
      const newY = startY + i * dirY;

      if (
        newX < 0 ||
        newX >= this.BOARD_SIZE ||
        newY < 0 ||
        newY >= this.BOARD_SIZE ||
        board[newY][newX] !== symbol
      ) {
        break;
      }
      count++;
    }

    // Check in the negative direction
    for (let i = 1; i < this.WIN_CONDITION; i++) {
      const newX = startX - i * dirX;
      const newY = startY - i * dirY;

      if (
        newX < 0 ||
        newX >= this.BOARD_SIZE ||
        newY < 0 ||
        newY >= this.BOARD_SIZE ||
        board[newY][newX] !== symbol
      ) {
        break;
      }
      count++;
    }

    return count >= this.WIN_CONDITION;
  }

  private checkDraw(board: Board): boolean {
    // Check if the board is full (no null cells)
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (board[y][x] === null) {
          return false;
        }
      }
    }
    return true;
  }
}
