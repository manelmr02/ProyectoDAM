import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Lobby } from './pages/lobby';
import { Ranking } from './pages/ranking';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'lobby', component: Lobby },
  { path: 'ranking', component: Ranking },
  { path: '**', redirectTo: '' }
];
