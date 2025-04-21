import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './auth/auth.routes';
import { USER_ROUTES } from './user/user.routes';
import { LINE98_ROUTES } from './line98/line98.routes';
import { CARO_ROUTES } from './caro/caro.routes';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  ...AUTH_ROUTES,
  ...USER_ROUTES,
  ...LINE98_ROUTES,
  ...CARO_ROUTES,
];
