import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

const API_URL = 'http://localhost:3000';

export interface Line98GameState {
  id: number;
  userId: number;
  board: {
    cells: number[][];
    nextColors: number[];
  };
  status: 'active' | 'game_over';
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoveData {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export interface HintResult {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export interface PathResult {
  path: { row: number, col: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class Line98Service {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  startGame(
    gridSize: number = 9,
    colorCount: number = 5,
    initialBallCount: number = 3
  ): Observable<Line98GameState> {
    return this.http.post<Line98GameState>(
      `${API_URL}/line98/start`,
      { gridSize, colorCount, initialBallCount },
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      }
    );
  }

  moveBall(gameId: number, moveData: MoveData): Observable<Line98GameState> {
    return this.http.post<Line98GameState>(
      `${API_URL}/line98/move/${gameId}`,
      moveData,
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      }
    );
  }

  findPath(
    gameId: number,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): Observable<PathResult> {
    return this.http.post<PathResult>(
      `${API_URL}/line98/find-path/${gameId}`,
      { fromRow, fromCol, toRow, toCol },
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      }
    );
  }

  getHint(gameId: number): Observable<HintResult> {
    return this.http.get<HintResult>(
      `${API_URL}/line98/hint/${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      }
    );
  }

  getGame(gameId: number): Observable<Line98GameState> {
    return this.http.get<Line98GameState>(
      `${API_URL}/line98/${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      }
    );
  }
} 