import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-container">
      <header>
        <h1>Game Online</h1>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
    }
    
    header {
      background-color: #333;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    
    main {
      flex: 1;
      padding: 20px;
    }
    
    footer {
      background-color: #333;
      color: white;
      text-align: center;
      padding: 1rem;
      margin-top: auto;
    }
  `]
})
export class AppComponent {
  title = 'Game Online Platform';
}
