import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, catchError } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { GameState, GameUpdate, GameOverEvent, JoinGameResponse } from './models/caro.model';

@Injectable({
  providedIn: 'root'
})
export class CaroService {
  private socket: Socket | null = null;
  private gameUpdateSubject = new Subject<GameUpdate>();
  private gameOverSubject = new Subject<GameOverEvent>();
  private apiUrl = `${environment.apiUrl}/caro`;

  constructor(private http: HttpClient) {}

  // API calls
  joinGame(gameId?: number): Observable<JoinGameResponse> {
    console.log('Joining caro game with gameId:', gameId);
    return this.http.post<JoinGameResponse>(`${this.apiUrl}/join`, { gameId })
      .pipe(
        catchError(error => {
          console.error('Error joining game:', error);
          throw error;
        })
      );
  }

  // Get current game state from backend
  getGameState(gameId: number): Observable<GameState> {
    console.log(`Fetching game state for gameId: ${gameId}`);
    return this.http.get<GameState>(`${this.apiUrl}/games/${gameId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).pipe(
      catchError(error => {
        console.error('Error fetching game state:', error);
        throw error;
      })
    );
  }
  
  private extractUserIdFromToken(): number {
    const token = localStorage.getItem('token');
    let userId = 1; // Default
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || payload.id || 1;
      } catch (e) {
        console.error('Error extracting userId from token:', e);
      }
    }
    
    return userId;
  }

  // WebSocket methods
  connectToGameSocket(gameId: number, userId: number): void {
    console.log('Connecting to socket for game:', gameId, 'user:', userId);
    // Create a new socket connection if not already connected
    if (!this.socket || !this.socket.connected) {
      const token = localStorage.getItem('token');
      console.log('Using token for socket connection:', token ? 'Token exists' : 'No token');
      
      this.socket = io(`${environment.apiUrl}/caro`, {
        auth: {
          token: token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
      });

      // Set up event listeners
      this.setupSocketListeners();
    }

    // Join the specific game room
    this.socket.emit('join-game', { gameId, userId });
  }

  makeMove(gameId: number, x: number, y: number, userId: number): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    console.log(`Sending move: gameId=${gameId}, x=${x}, y=${y}, userId=${userId}`);
    this.socket.emit('move', { gameId, x, y, userId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Observable streams for component subscriptions
  gameUpdates(): Observable<GameUpdate> {
    return this.gameUpdateSubject.asObservable();
  }

  gameOver(): Observable<GameOverEvent> {
    return this.gameOverSubject.asObservable();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    this.socket.on('game-update', (data: GameUpdate) => {
      console.log('Received game update:', data);
      this.gameUpdateSubject.next(data);
    });

    this.socket.on('game-over', (data: GameOverEvent) => {
      console.log('Game over event received:', data);
      this.gameOverSubject.next(data);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
    
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }
}
