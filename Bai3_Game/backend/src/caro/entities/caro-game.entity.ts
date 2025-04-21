import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GameStatus {
  WAITING = 'waiting', // Waiting for another player
  PLAYING = 'playing', // Game in progress
  FINISHED = 'finished', // Game finished
}

export type BoardCell = 'X' | 'O' | null;
export type Board = BoardCell[][];

@Entity('caro_games')
export class CaroGame {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  player1Id: number;

  @Column({ nullable: true })
  player2Id: number;

  @Column('simple-json')
  board: Board;

  @Column({ default: 'X' })
  currentTurn: 'X' | 'O';

  @Column({
    type: 'text',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({ nullable: true })
  winnerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
