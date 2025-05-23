import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaroService } from './caro.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameState, GameUpdate, GameOverEvent, JoinGameResponse } from './models/caro.model';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-caro',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
  template: `
    <!-- FontAwesome CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Game join section -->
    <div class="caro-container" *ngIf="!gameState">
      <div class="game-header">
        <h1>Cờ Caro Online</h1>
        <p class="subtitle">Chơi game cờ caro cùng bạn bè</p>
      </div>
      
      <mat-card class="game-join">
        <mat-card-content>
          <div class="join-options">
            <div class="option-card new-game" (click)="createNewGame()">
              <div class="option-icon">
                <i class="fa fa-plus-circle"></i>
              </div>
              <div class="option-content">
                <h3>Tạo ván mới</h3>
                <p>Tạo ván cờ caro mới và mời bạn bè tham gia</p>
              </div>
            </div>
            
            <div class="option-separator">
              <span>hoặc</span>
            </div>
            
            <div class="option-card join-game">
              <div class="option-icon">
                <i class="fa fa-users"></i>
              </div>
              <div class="option-content">
                <h3>Tham gia ván có sẵn</h3>
                <p>Nhập ID ván cờ mà bạn bè đã chia sẻ</p>
                <div class="join-form">
                  <mat-form-field appearance="outline" class="game-id-input">
                    <mat-label>Nhập ID ván chơi</mat-label>
                    <input matInput type="number" [(ngModel)]="gameIdToJoin">
                    <button *ngIf="gameIdToJoin" matSuffix mat-icon-button aria-label="Clear" 
                        (click)="gameIdToJoin = null">
                      <i class="fa fa-times"></i>
                    </button>
                  </mat-form-field>
                  <button mat-raised-button color="primary" 
                      [disabled]="!gameIdToJoin" 
                      (click)="joinExistingGame()">
                    Tham gia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    
    <!-- Game play section -->
    <div class="caro-container" *ngIf="gameState">
      <mat-card class="game-info">
        <mat-card-header>
          <mat-card-title>
            <div class="game-title">Cờ Caro Online</div>
          </mat-card-title>
          <mat-card-subtitle *ngIf="gameState" class="game-id-display">
            <span class="game-id-label">ID Ván: </span>
            <span class="game-id-value">{{ gameState.id }}</span>
            <button mat-icon-button (click)="copyGameId()" matTooltip="Sao chép ID">
              <i class="fa fa-copy"></i>
            </button>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="30"></mat-spinner>
            <p>Đang tải game...</p>
          </div>
          <div *ngIf="gameState && !loading">
            <div class="game-status-panel">
              <div class="status" [ngClass]="{'active': gameState.status === 'playing'}">
                <i class="fa {{ getStatusIcon() }}"></i>
                {{ getStatusText() }}
              </div>
              <div *ngIf="gameState.status === 'playing'" class="turn-indicator">
                Lượt: <span class="turn-symbol" [ngClass]="{'x-turn': gameState.currentTurn === 'X', 'o-turn': gameState.currentTurn === 'O'}">{{ gameState.currentTurn }}</span>
              </div>
              <div class="player-info">
                <div class="player" [ngClass]="{'current-player': playerSymbol === 'X'}">
                  Player X: <span class="player-id">{{ gameState.player1Id === userId ? 'Bạn' : gameState.player1Id }}</span>
                  <span *ngIf="playerSymbol === 'X'" class="player-indicator">(Bạn)</span>
                </div>
                <div class="player" [ngClass]="{'current-player': playerSymbol === 'O'}">
                  Player O: <span class="player-id">{{ gameState.player2Id === userId ? 'Bạn' : gameState.player2Id }}</span>
                  <span *ngIf="playerSymbol === 'O'" class="player-indicator">(Bạn)</span>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
        <mat-card-actions *ngIf="gameState">
          <button mat-raised-button color="warn" (click)="leaveGame()">
            <i class="fa fa-sign-out-alt"></i> Thoát game
          </button>
        </mat-card-actions>
      </mat-card>

      <div *ngIf="gameState" class="board-container">
        <div class="grid-container" [ngClass]="{'finished': gameState.status === 'finished'}">
          <div 
            *ngFor="let row of gameState.board; let y = index" 
            class="row"
          >
            <div 
              *ngFor="let cell of row; let x = index" 
              class="cell"
              [ngClass]="{
                'x-cell': cell === 'X',
                'o-cell': cell === 'O',
                'playable': isPlayable(x, y),
                'winning-cell': isWinningCell(x, y)
              }"
              [attr.data-symbol]="playerSymbol"
              (click)="makeMove(x, y)"
            >
              {{ cell }}
            </div>
          </div>
        </div>
        
        <div *ngIf="gameState.status === 'finished'" class="game-result">
          <div class="result-message" [ngClass]="{
            'x-win': gameState.winnerId === gameState.player1Id,
            'o-win': gameState.winnerId === gameState.player2Id,
            'draw': gameState.winnerId === null
          }">
            <h2>{{ getResultMessage() }}</h2>
            <button mat-raised-button color="primary" (click)="leaveGame()">
              Chơi ván mới
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .caro-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 20px auto;
      max-width: 800px;
      padding: 20px;
      gap: 20px;
    }
    
    .game-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .game-header h1 {
      font-size: 36px;
      color: #3f51b5;
      margin-bottom: 5px;
    }
    
    .subtitle {
      color: #666;
      font-size: 18px;
    }

    .game-join, .game-info {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }
    
    .game-title {
      font-size: 24px;
      font-weight: 500;
    }
    
    .game-id-display {
      display: flex;
      align-items: center;
      font-size: 14px;
    }
    
    .game-id-label {
      margin-right: 5px;
      font-weight: bold;
    }
    
    .game-id-value {
      background-color: #f0f0f0;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 5px;
    }
    
    .option-card {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      margin-bottom: 20px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .option-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .option-icon {
      font-size: 24px;
      color: #3f51b5;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
    }
    
    .option-content {
      flex: 1;
      padding-left: 15px;
    }
    
    .option-content h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }
    
    .option-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .option-separator {
      text-align: center;
      position: relative;
      margin: 20px 0;
    }
    
    .option-separator::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background-color: #e0e0e0;
      z-index: 0;
    }
    
    .option-separator span {
      position: relative;
      background-color: #fff;
      padding: 0 15px;
      color: #999;
      z-index: 1;
    }
    
    .join-form {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    /* Game board styles */
    .board-container {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .grid-container {
      display: grid;
      grid-template-columns: repeat(15, 1fr);
      border: 2px solid #333;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .grid-container.finished {
      opacity: 0.8;
    }
    
    .cell {
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid #ddd;
      font-size: 24px;
      font-weight: bold;
      cursor: default;
      background-color: #fff;
      user-select: none;
      transition: all 0.2s;
    }
    
    .playable {
      cursor: pointer;
      background-color: #f9f9f9;
    }
    
    .playable:hover {
      background-color: #f0f0f0;
    }
    
    /* Make hover effect match player's symbol color */
    .playable:hover:before {
      content: attr(data-symbol);
      position: absolute;
      color: rgba(0, 0, 0, 0.1);
      font-size: 24px;
      font-weight: bold;
    }
    
    .x-cell {
      color: #ff5722;
    }
    
    .o-cell {
      color: #2196f3;
    }
    
    .winning-cell {
      background-color: #fffde7;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .game-status-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 10px 0;
      padding: 10px;
      border-radius: 6px;
      background-color: #f5f5f5;
    }
    
    .status {
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status.active {
      color: #4caf50;
      font-weight: bold;
    }
    
    .turn-indicator {
      display: flex;
      align-items: center;
      font-size: 16px;
      gap: 8px;
    }
    
    .turn-symbol {
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      font-weight: bold;
    }
    
    .x-turn {
      color: #ff5722;
      background-color: rgba(255, 87, 34, 0.1);
    }
    
    .o-turn {
      color: #2196f3;
      background-color: rgba(33, 150, 243, 0.1);
    }
    
    .game-result {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.8);
      z-index: 10;
    }
    
    .result-message {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .result-message h2 {
      margin: 0;
    }
    
    .x-win h2 {
      color: #ff5722;
    }
    
    .o-win h2 {
      color: #2196f3;
    }
    
    .draw h2 {
      color: #9e9e9e;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px;
    }
    
    .player-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
      padding: 8px;
      background-color: #fff;
      border-radius: 6px;
      border-left: 3px solid #ddd;
    }
    
    .player {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .player.current-player {
      background-color: #f0f7ff;
      font-weight: 500;
    }
    
    .player:first-child {
      color: #ff5722;
    }
    
    .player:last-child {
      color: #2196f3;
    }
    
    .player-id {
      margin-left: 4px;
      font-weight: bold;
    }
    
    .player-indicator {
      margin-left: 6px;
      font-size: 12px;
      background-color: #e0f7fa;
      padding: 2px 6px;
      border-radius: 10px;
      color: #00838f;
    }
    
    @media screen and (max-width: 600px) {
      .cell {
        width: 30px;
        height: 30px;
        font-size: 18px;
      }
      
      .game-title {
        font-size: 20px;
      }
    }
  `]
})
export class CaroComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  loading = false;
  gameIdToJoin: number | null = null;
  playerSymbol: 'X' | 'O' | null = null;
  userId: number;
  
  private subscriptions: Subscription[] = [];
  private winningCells: {x: number, y: number}[] = [];

  constructor(
    private caroService: CaroService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Get the user ID from the JWT token
    const token = this.authService.getToken();
    if (token) {
      try {
        // Extract user ID from JWT payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        
        // Backend JWT strategy uses 'sub' field for user ID
        this.userId = payload.sub || payload.id;
        
        if (!this.userId) {
          console.warn('No user ID found in token, using default value');
          this.userId = 1;
        }
        console.log('Using user ID:', this.userId);
      } catch (e) {
        console.error('Error decoding token:', e);
        this.userId = 1; // Default to user 1 if token parsing fails
      }
    } else {
      // Not logged in, redirect to login
      this.snackBar.open('Please login first', 'Login', { duration: 3000 });
      this.router.navigate(['/login']);
      this.userId = 1; // Default value, won't be used due to redirect
    }
  }

  ngOnInit(): void {
    // Extract the user ID from the token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    try {
      // Get userId from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = payload.sub || payload.id;
      console.log('User ID from token:', this.userId);
    } catch (e) {
      console.error('Error parsing token:', e);
      this.snackBar.open('Authentication error', 'Login', { duration: 5000 })
        .onAction().subscribe(() => {
          this.router.navigate(['/login']);
        });
      return;
    }
    
    // Check if there's a game ID in the route
    this.route.queryParams.subscribe(params => {
      const gameId = params['id'];
      if (gameId) {
        console.log('Game ID from route:', gameId);
        this.joinGame(parseInt(gameId, 10));
      }
    });
    
    // Set up subscription for game updates
    this.subscriptions.push(
      this.caroService.gameUpdates().subscribe(update => {
        console.log('Game update received:', update);
        
        if (update.game) {
          this.gameState = update.game;
          
          // Show whose turn it is
          const turnMessage = `${update.game.currentTurn === 'X' ? 'X' : 'O'}'s turn`;
          this.snackBar.open(turnMessage, '', { duration: 2000 });
          
          // Determine player's symbol after game update
          this.determinePlayerSymbol();
          
          // Display any message from the update
          if (update.message) {
            this.snackBar.open(update.message, 'OK', { duration: 3000 });
          }
          
          // Highlight last move if available
          if (update.lastMove) {
            // Implement highlighting of last move (could be done with CSS)
            console.log('Last move:', update.lastMove);
          }
        }
      })
    );
    
    // Set up subscription for game over events
    this.subscriptions.push(
      this.caroService.gameOver().subscribe(event => {
        console.log('Game over event received:', event);
        
        if (event.game) {
          this.gameState = event.game;
          
          // Determine and highlight winning cells if any
          if (event.winner && !event.isDraw) {
            // In a real implementation, the backend would provide the winning cells
            // For now, we'll just show a message
            const winnerSymbol = event.winner === this.gameState.player1Id ? 'X' : 'O';
            const message = event.isDraw ? 'Game ended in a draw!' : `${winnerSymbol} wins!`;
            this.snackBar.open(message, 'New Game', { duration: 5000 })
              .onAction().subscribe(() => {
                this.leaveGame();
                this.createNewGame();
              });
          }
        }
      })
    );
  }

  private determinePlayerSymbol(): void {
    if (!this.gameState) return;
    
    if (this.gameState.player1Id === this.userId) {
      this.playerSymbol = 'X';
      console.log('This user is player X');
    } else if (this.gameState.player2Id === this.userId) {
      this.playerSymbol = 'O';
      console.log('This user is player O');
    } else {
      // User is just a spectator
      this.playerSymbol = null;
      console.log('User is spectating the game');
      this.snackBar.open('You are in spectator mode', 'OK', { duration: 3000 });
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Disconnect from socket
    this.caroService.disconnect();
  }

  createNewGame(): void {
    this.loading = true;
    this.joinGame();
  }

  joinExistingGame(): void {
    if (!this.gameIdToJoin) {
      this.snackBar.open('Vui lòng nhập ID ván chơi', 'Đóng', { duration: 3000 });
      return;
    }
    
    this.loading = true;
    this.joinGame(this.gameIdToJoin);
  }

  joinGame(gameId?: number): void {
    this.caroService.joinGame(gameId).subscribe({
      next: (response: JoinGameResponse) => {
        const gameId = response.gameId;
        console.log('Successfully joined game with ID:', gameId);
        
        // Update URL with game ID for sharing
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { id: gameId },
          queryParamsHandling: 'merge',
        });
        
        // Fetch the game state after joining
        this.fetchGameState(gameId);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Join game error:', err);
        let errorMessage = 'Error joining game';
        let isAuthError = false;
        
        // Check for 401 Unauthorized or 403 Forbidden
        if (err.status === 401 || err.status === 403) {
          errorMessage = 'Authentication error. Please login again.';
          isAuthError = true;
        }
        // Check for 404 Not Found
        else if (err.status === 404) {
          errorMessage = 'Game with this ID was not found. Please check the ID and try again.';
        }
        // Try to extract detailed error information
        else if (err.error && err.error.message) {
          errorMessage += ': ' + err.error.message;
        } else if (err.message) {
          errorMessage += ': ' + err.message;
        } else if (typeof err.error === 'string') {
          errorMessage += ': ' + err.error;
        } else {
          errorMessage += ': ' + err.status + ' ' + err.statusText;
        }
        
        // Show error with retry option
        const actionText = isAuthError ? 'Login' : 'Retry';
        const snackBarRef = this.snackBar.open(errorMessage, actionText, { duration: 10000 });
        
        snackBarRef.onAction().subscribe(() => {
          if (isAuthError) {
            this.authService.logout();
            this.router.navigate(['/login']);
          } else {
            console.log('Retrying to join game...');
            this.joinGame(gameId);
          }
        });
      }
    });
  }

  fetchGameState(gameId: number): void {
    // Use caroService to get the game state
    this.caroService.getGameState(gameId).subscribe({
      next: (game: GameState) => {
        this.gameState = game;
        this.loading = false;
        
        console.log('Game state received:', this.gameState);
        console.log('Current user ID:', this.userId);
        console.log('Player1ID:', this.gameState.player1Id);
        console.log('Player2ID:', this.gameState.player2Id);
        
        // Determine which symbol the player is using
        if (this.gameState && this.gameState.player1Id === this.userId) {
          this.playerSymbol = 'X';
          console.log('This user is player X');
        } else if (this.gameState && this.gameState.player2Id === this.userId) {
          this.playerSymbol = 'O';
          console.log('This user is player O');
        } else {
          // Handle case where userId doesn't match either player
          console.warn('User is not a player in this game. Watching only.');
          this.playerSymbol = null;
        }
        
        // Connect to the WebSocket for this game
        this.caroService.connectToGameSocket(this.gameState.id, this.userId);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error fetching game state:', err);
        this.snackBar.open('Error loading game state', 'Retry', { duration: 5000 })
          .onAction().subscribe(() => this.fetchGameState(gameId));
      }
    });
  }

  leaveGame(): void {
    // Disconnect socket
    this.caroService.disconnect();
    
    // Reset game state
    this.gameState = null;
    this.gameIdToJoin = null;
    
    // Remove game ID from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge',
    });
    
    this.snackBar.open('Đã thoát game', 'OK', { duration: 3000 });
  }

  makeMove(x: number, y: number): void {
    if (!this.gameState) {
      console.log('Game state is null');
      return;
    }
    
    // Check if the cell is empty
    if (this.gameState.board[y][x] !== null) {
      console.log(`Cell (${x},${y}) is already occupied`);
      return;
    }
    
    // Check if the game is in playing state
    if (this.gameState.status !== 'playing') {
      console.log(`Game is not in playing state: ${this.gameState.status}`);
      return;
    }
    
    // Check if it's the player's turn
    if (
      (this.playerSymbol === 'X' && this.gameState.currentTurn !== 'X') || 
      (this.playerSymbol === 'O' && this.gameState.currentTurn !== 'O')
    ) {
      console.log(`Not your turn. Your symbol: ${this.playerSymbol}, Current turn: ${this.gameState.currentTurn}`);
      this.snackBar.open('Chưa đến lượt của bạn!', 'OK', { duration: 2000 });
      return;
    }
    
    console.log(`Making move at (${x},${y}) for user ${this.userId} with symbol ${this.playerSymbol}`);
    
    // Use the correct user ID based on player symbol
    const userId = this.playerSymbol === 'X' 
      ? this.gameState.player1Id 
      : this.gameState.player2Id;
      
    if (userId) {
      this.caroService.makeMove(this.gameState.id, x, y, userId);
    } else {
      console.error('Invalid user ID for the current player');
      this.snackBar.open('Lỗi: Không thể xác định người chơi', 'OK', { duration: 3000 });
    }
  }

  isPlayable(x: number, y: number): boolean {
    if (!this.gameState) {
      return false;
    }
    
    // Check if game is in playing state
    if (this.gameState.status !== 'playing') {
      return false;
    }
    
    // Check if cell is already occupied
    if (this.gameState.board[y][x] !== null) {
      return false;
    }
    
    // Check if it's the player's turn
    if (this.playerSymbol === null) {
      // Spectator cannot play
      return false;
    }
    
    // X can only play when it's X's turn, O can only play when it's O's turn
    return (this.playerSymbol === 'X' && this.gameState.currentTurn === 'X') || 
           (this.playerSymbol === 'O' && this.gameState.currentTurn === 'O');
  }

  copyGameId(): void {
    if (this.gameState) {
      navigator.clipboard.writeText(this.gameState.id.toString())
        .then(() => {
          this.snackBar.open('ID ván đã được sao chép!', 'OK', { duration: 2000 });
        })
        .catch(err => {
          console.error('Không thể sao chép ID:', err);
        });
    }
  }

  getStatusIcon(): string {
    if (!this.gameState) {
      return 'hourglass-half';
    }

    switch(this.gameState.status) {
      case 'waiting':
        return 'user-plus';
      case 'playing':
        return 'gamepad';
      case 'finished':
        return this.gameState.winnerId ? 'trophy' : 'handshake';
      default:
        return 'question-circle';
    }
  }

  getStatusText(): string {
    if (!this.gameState) {
      return 'Đang tải...';
    }

    switch(this.gameState.status) {
      case 'waiting':
        return 'Đang chờ người chơi thứ hai (Chia sẻ ID game để mời bạn bè)';
      case 'playing':
        return 'Ván đang diễn ra';
      case 'finished':
        return 'Ván đã kết thúc';
      default:
        return 'Không xác định';
    }
  }

  getResultMessage(): string {
    if (!this.gameState || this.gameState.status !== 'finished') {
      return '';
    }

    if (this.gameState.winnerId === null) {
      return 'Kết quả hòa!';
    }

    // Hiển thị X thắng hoặc O thắng
    if (this.gameState.winnerId === this.gameState.player1Id) {
      return 'X thắng!';
    } else {
      return 'O thắng!';
    }
  }

  // Hàm kiểm tra xem một ô có phải là ô thuộc đường thắng không
  isWinningCell(x: number, y: number): boolean {
    // TODO: Triển khai đúng logic để highlight các ô thắng
    // Hiện tại chỉ là giả lập, trong triển khai thực tế sẽ cần lưu trữ thông tin các ô tạo thành đường thắng
    return false;
  }
}
