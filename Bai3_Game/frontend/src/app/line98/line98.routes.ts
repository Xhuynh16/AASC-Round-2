import { Routes } from '@angular/router';
import { Line98GameComponent } from './line98-game/line98-game.component';
import { authGuard } from '../shared/guards/auth.guard';

export const LINE98_ROUTES: Routes = [
  {
    path: 'line98',
    component: Line98GameComponent,
    canActivate: [authGuard]
  }
]; 