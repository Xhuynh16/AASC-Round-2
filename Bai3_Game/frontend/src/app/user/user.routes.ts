import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from '../shared/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
]; 