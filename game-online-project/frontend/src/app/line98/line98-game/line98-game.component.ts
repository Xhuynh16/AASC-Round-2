import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line98Service, Line98GameState, MoveData, PathResult } from '../services/line98.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Constants for rendering
const COLORS = [
  '#888888', // Empty/Gray
  '#FF5252', // Red
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FFC107', // Yellow
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4'  // Cyan
];

// Animation constants
const ANIMATION_SPEED = 8; // Frames per step
const ANIMATION_DURATION = 500; // ms for path animation
const PULSE_DURATION = 1000; // ms for pulse animation

@Component({
  selector: 'app-line98-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <h2>Line 98</h2>
        <div class="game-info">
          <div class="score">Score: {{ gameState?.score || 0 }}</div>
          <div class="status" *ngIf="gameState?.status === 'game_over'">Game Over</div>
        </div>
        <div class="game-controls">
          <button (click)="startNewGame()">New Game</button>
          <button (click)="getHint()" [disabled]="!gameState || gameState.status === 'game_over'">Hint</button>
          <button (click)="goBack()">Back</button>
        </div>
      </div>

      <canvas #gameCanvas></canvas>

      <div class="game-message" *ngIf="message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background-color: #f0f0f0;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }

    .game-header {
      width: 100%;
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }

    h2 {
      text-align: center;
      margin-bottom: 10px;
    }

    .game-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .score {
      font-weight: bold;
    }

    .status {
      color: #FF5252;
      font-weight: bold;
    }

    .game-controls {
      display: flex;
      justify-content: space-between;
    }

    button {
      padding: 8px 16px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 0 5px;
      transition: background-color 0.3s;
    }

    button:hover {
      background-color: #0b7dda;
    }

    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    canvas {
      border: 2px solid #333;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .game-message {
      margin-top: 15px;
      padding: 10px;
      background-color: #FFF9C4;
      border-radius: 4px;
      text-align: center;
    }
  `]
})
export class Line98GameComponent implements OnInit, AfterViewInit {
  @ViewChild('gameCanvas') gameCanvasRef!: ElementRef<HTMLCanvasElement>;
  
  gameState: Line98GameState | null = null;
  selectedCell: { row: number, col: number } | null = null;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  cellSize = 50;
  gridSize = 9;
  gameId: number | null = null;
  message = '';
  
  // Animation properties
  animating = false;
  animationPath: { row: number, col: number }[] = [];
  animationFrame = 0;
  animationStartTime = 0;
  animationProgress = 0;
  
  // Ball pulse animation
  pulseBalls: Map<string, { radius: number, increasing: boolean, startTime: number }> = new Map();
  
  // Hint properties
  hintCell: { fromRow: number, fromCol: number, toRow: number, toCol: number } | null = null;
  showingHint = false;
  
  // Animation frame ID for cancellation
  animationFrameId: number | null = null;
  
  constructor(
    private line98Service: Line98Service,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.startNewGame();
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.startAnimationLoop();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.canvas) {
      this.setCanvasSize();
      this.drawGame();
    }
  }

  private initCanvas(): void {
    this.canvas = this.gameCanvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.setCanvasSize();
    this.drawGame();

    this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
  }

  private setCanvasSize(): void {
    const containerWidth = this.canvas.parentElement?.clientWidth || 600;
    const maxSize = Math.min(containerWidth, 600);
    this.cellSize = Math.floor(maxSize / this.gridSize);
    
    this.canvas.width = this.cellSize * this.gridSize;
    this.canvas.height = this.cellSize * this.gridSize;
  }

  private drawGame(): void {
    if (!this.ctx || !this.gameState) return;
    
    const { ctx, cellSize, gridSize } = this;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background grid with a gradient
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#e0e0e0');
    gradient.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, gridSize * cellSize);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(gridSize * cellSize, i * cellSize);
      ctx.stroke();
    }
    
    // Draw cells and balls
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellValue = this.gameState.board.cells[row][col];
        
        // Skip empty cells
        if (cellValue === 0) continue;
        
        // Draw ball
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        let radius = cellSize * 0.4;
        
        // Check if this ball is pulsing
        const key = `${row},${col}`;
        if (this.pulseBalls.has(key)) {
          const pulseInfo = this.pulseBalls.get(key)!;
          radius = pulseInfo.radius;
        }
        
        // Determine color index and adjust for colorArray bounds
        const colorIndex = Math.abs(cellValue);
        const color = COLORS[colorIndex % COLORS.length];
        
        this.drawBall(x, y, radius, color);
      }
    }
    
    // Draw path animation if in progress
    if (this.animating && this.animationPath.length > 0) {
      this.drawPathAnimation();
    }
    
    // Draw selected cell highlight
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        col * cellSize + 2,
        row * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
      
      // Draw pulsing ball for selected cell
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;
      const cellValue = this.gameState.board.cells[row][col];
      const colorIndex = Math.abs(cellValue);
      const color = COLORS[colorIndex % COLORS.length];
      
      // Always ensure the selected cell has a pulse animation
      const key = `${row},${col}`;
      if (!this.pulseBalls.has(key)) {
        this.pulseBalls.set(key, {
          radius: cellSize * 0.4,
          increasing: true,
          startTime: performance.now()
        });
      }
    }
    
    // Draw hint highlight if showing
    if (this.showingHint && this.hintCell) {
      const { fromRow, fromCol, toRow, toCol } = this.hintCell;
      
      // Highlight from cell
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        fromCol * cellSize + 2, 
        fromRow * cellSize + 2, 
        cellSize - 4, 
        cellSize - 4
      );
      
      // Highlight to cell
      ctx.strokeStyle = '#0000FF';
      ctx.strokeRect(
        toCol * cellSize + 2, 
        toRow * cellSize + 2, 
        cellSize - 4, 
        cellSize - 4
      );
      
      // Reset line dash
      ctx.setLineDash([]);
    }
  }

  private drawBall(x: number, y: number, radius: number, color: string): void {
    const { ctx } = this;
    
    // Create gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3, 
      y - radius * 0.3, 
      radius * 0.1,
      x, 
      y, 
      radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, color);
    gradient.addColorStop(1, this.darkenColor(color, 30));
    
    // Draw main ball
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }

  private darkenColor(color: string, percent: number): string {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Darken
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private drawPathAnimation(): void {
    if (!this.ctx || this.animationPath.length < 2) return;
    
    const { ctx, cellSize } = this;
    const now = performance.now();
    const elapsed = now - this.animationStartTime;
    this.animationProgress = Math.min(1, elapsed / ANIMATION_DURATION);
    
    // Calculate current position along the path
    const pathIndex = Math.min(
      Math.floor(this.animationProgress * (this.animationPath.length - 1)), 
      this.animationPath.length - 2
    );
    
    const startPos = this.animationPath[pathIndex];
    const endPos = this.animationPath[pathIndex + 1];
    
    // Calculate sub-progress within the current path segment
    const subProgress = (this.animationProgress * (this.animationPath.length - 1)) % 1;
    
    // Interpolate position
    const x = (startPos.col + (endPos.col - startPos.col) * subProgress) * cellSize + cellSize / 2;
    const y = (startPos.row + (endPos.row - startPos.row) * subProgress) * cellSize + cellSize / 2;
    
    // Get the color of the moving ball
    const startCell = this.animationPath[0];
    const cellValue = this.gameState!.board.cells[startCell.row][startCell.col];
    const colorIndex = Math.abs(cellValue);
    const color = COLORS[colorIndex % COLORS.length];
    
    // Draw the moving ball
    this.drawBall(x, y, cellSize * 0.4, color);
    
    // Draw path trace
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < pathIndex; i++) {
      const curr = this.animationPath[i];
      const next = this.animationPath[i + 1];
      
      ctx.moveTo(
        curr.col * cellSize + cellSize / 2,
        curr.row * cellSize + cellSize / 2
      );
      ctx.lineTo(
        next.col * cellSize + cellSize / 2,
        next.row * cellSize + cellSize / 2
      );
    }
    
    // Add the partial segment
    ctx.moveTo(
      startPos.col * cellSize + cellSize / 2,
      startPos.row * cellSize + cellSize / 2
    );
    ctx.lineTo(x, y);
    
    ctx.stroke();
    
    // Check if animation is complete
    if (this.animationProgress >= 1) {
      this.animating = false;
      this.animationPath = [];
    }
  }

  private startAnimationLoop(): void {
    // Cancel any existing animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    const animate = () => {
      // Update pulse animations
      const now = performance.now();
      
      this.pulseBalls.forEach((info, key) => {
        const elapsed = now - info.startTime;
        
        // Calculate pulse using a sine wave
        const pulseFactor = 0.1; // Range of pulse (10% of the base radius)
        const baseRadius = this.cellSize * 0.4;
        info.radius = baseRadius * (1 + pulseFactor * Math.sin(elapsed / 200));
        
        // Remove the pulse after the duration
        if (elapsed > PULSE_DURATION && key !== `${this.selectedCell?.row},${this.selectedCell?.col}`) {
          this.pulseBalls.delete(key);
        }
      });
      
      this.drawGame();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private getCellFromCoordinates(x: number, y: number): { row: number, col: number } | null {
    const { cellSize, gridSize } = this;
    
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    
    return null;
  }

  private handleCanvasClick(event: MouseEvent): void {
    if (!this.gameState || this.gameState.status === 'game_over' || this.animating) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cell = this.getCellFromCoordinates(x, y);
    if (!cell) return;
    
    const { row, col } = cell;
    const cellValue = this.gameState.board.cells[row][col];
    
    // Hide hint if it's showing
    if (this.showingHint) {
      this.showingHint = false;
      this.hintCell = null;
    }
    
    // If a cell is already selected
    if (this.selectedCell) {
      // If the same cell is clicked again, deselect it
      if (this.selectedCell.row === row && this.selectedCell.col === col) {
        this.selectedCell = null;
        return;
      }
      
      // If an empty cell is clicked, attempt to move
      if (cellValue === 0) {
        this.moveBall(this.selectedCell.row, this.selectedCell.col, row, col);
      } else {
        // If another ball is clicked, select it instead
        this.selectedCell = { row, col };
        // Add pulse animation to the newly selected ball
        this.pulseBalls.set(`${row},${col}`, {
          radius: this.cellSize * 0.4,
          increasing: true,
          startTime: performance.now()
        });
      }
    } else {
      // If no cell is selected, select this one if it has a ball
      if (cellValue > 0) {
        this.selectedCell = { row, col };
        // Add pulse animation to the selected ball
        this.pulseBalls.set(`${row},${col}`, {
          radius: this.cellSize * 0.4,
          increasing: true,
          startTime: performance.now()
        });
      }
    }
    
    this.drawGame();
  }

  private async moveBall(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    if (!this.gameId || this.animating) return;
    
    try {
      // Get the path before making the move
      const path = await this.findPath(fromRow, fromCol, toRow, toCol);
      
      if (!path || path.length < 2) {
        this.message = 'No valid path to that location';
        setTimeout(() => this.message = '', 2000);
        return;
      }
      
      // Start animation
      this.animating = true;
      this.animationPath = path;
      this.animationStartTime = performance.now();
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
      
      // Make the actual move on the server
      const moveData: MoveData = { fromRow, fromCol, toRow, toCol };
      const updatedGameState = await firstValueFrom(this.line98Service.moveBall(this.gameId, moveData));
      if (updatedGameState) {
        this.gameState = updatedGameState;
      }
      
      // Clear selection and animation
      this.selectedCell = null;
      this.animating = false;
      this.animationPath = [];
      
      // Add a pulse effect to the destination cell
      this.pulseBalls.set(`${toRow},${toCol}`, {
        radius: this.cellSize * 0.4,
        increasing: true,
        startTime: performance.now()
      });
      
      this.drawGame();
    } catch (error: any) {
      console.error('Error moving ball:', error);
      this.message = 'Failed to move ball: ' + (error.message || 'Unknown error');
      setTimeout(() => this.message = '', 3000);
      
      // Clear animation
      this.animating = false;
      this.animationPath = [];
    }
  }

  private async findPath(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<{ row: number, col: number }[] | null> {
    if (!this.gameState || !this.gameId) return null;
    
    try {
      // Get path from server
      const pathResult = await firstValueFrom(this.line98Service.findPath(
        this.gameId, 
        fromRow, 
        fromCol, 
        toRow, 
        toCol
      ));
      
      if (pathResult && pathResult.path && pathResult.path.length > 0) {
        return pathResult.path;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding path:', error);
      return null;
    }
  }

  async startNewGame(): Promise<void> {
    this.message = 'Starting new game...';
    this.gameId = null;
    this.selectedCell = null;
    this.showingHint = false;
    this.hintCell = null;
    this.animating = false;
    this.animationPath = [];
    this.pulseBalls.clear();
    
    try {
      const game = await firstValueFrom(this.line98Service.startGame());
      this.gameState = game;
      this.gameId = game.id;
      this.message = '';
      this.drawGame();
    } catch (error: any) {
      console.error('Error starting game:', error);
      this.message = 'Failed to start game: ' + (error.message || 'Unknown error');
    }
  }

  async getHint(): Promise<void> {
    if (!this.gameId || !this.gameState || this.gameState.status === 'game_over') return;
    
    try {
      const hint = await firstValueFrom(this.line98Service.getHint(this.gameId));
      this.hintCell = hint;
      this.showingHint = true;
      this.drawGame();
      
      // Auto-hide hint after 3 seconds
      setTimeout(() => {
        this.showingHint = false;
        this.hintCell = null;
        this.drawGame();
      }, 3000);
    } catch (error: any) {
      console.error('Error getting hint:', error);
      this.message = 'Failed to get hint: ' + (error.message || 'Unknown error');
      setTimeout(() => this.message = '', 3000);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    // Cancel the animation frame when component is destroyed
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
} 