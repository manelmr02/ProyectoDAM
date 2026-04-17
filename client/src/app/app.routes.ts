import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Lobby } from './pages/lobby';
import { Ranking } from './pages/ranking';
import { Profile } from './pages/profile';
import { Battle } from './pages/battle';

export const routes: Routes = [
  { path: '',              component: Home },
  { path: 'login',         component: Login },
  { path: 'register',      component: Register },
  { path: 'lobby/:id',     component: Lobby },
  { path: 'lobby',         component: Lobby },
  { path: 'battle/:id',    component: Battle },
  { path: 'ranking',       component: Ranking },
  { path: 'profile',       component: Profile },
  { path: '**',            redirectTo: '' }
];
