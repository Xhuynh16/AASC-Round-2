import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../shared/entities/user.entity';

export enum GameStatus {
  ACTIVE = 'active',
  GAME_OVER = 'game_over',
}

@Entity('line98_games')
export class Line98Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('simple-json')
  board: {
    cells: number[][];
    nextColors: number[];
  };

  @Column({
    type: 'varchar',
    default: GameStatus.ACTIVE,
  })
  status: GameStatus;

  @Column({ default: 0 })
  score: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
