import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

interface RegionMastery { games: number; wins: number; xp: number; level: number; }

interface PlayerStats {
  id: string;
  username: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lp: number;
  regionsEliminated: number;
  winRate: number;
  rankTier: string;
  regionMastery: Record<string, RegionMastery>;
}

const TIERS = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda', 'Diamante', 'Maestro', 'Gran Maestro', 'Challenger'];

function getLpRank(lp: number): string {
  if (lp >= 3600) return 'Challenger';
  if (lp >= 3200) return 'Gran Maestro';
  if (lp >= 2800) return 'Maestro';
  const tiers = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda', 'Diamante'];
  const divs  = ['IV', 'III', 'II', 'I'];
  return `${tiers[Math.floor(lp / 400)]} ${divs[Math.floor((lp % 400) / 100)]}`;
}

function getRankColor(lp: number): string {
  if (lp >= 3600) return '#F4D03F';
  if (lp >= 3200) return '#FF6B6B';
  if (lp >= 2800) return '#C084FC';
  if (lp >= 2400) return '#93C5FD';
  if (lp >= 2000) return '#4ADE80';
  if (lp >= 1600) return '#22D3EE';
  if (lp >= 1200) return '#FBBF24';
  if (lp >= 800)  return '#94A3B8';
  if (lp >= 400)  return '#CD7F32';
  return '#8B7355';
}

function getRankEmoji(lp: number): string {
  if (lp >= 3600) return '👑';
  if (lp >= 3200) return '🔥';
  if (lp >= 2800) return '💎';
  if (lp >= 2400) return '💠';
  if (lp >= 2000) return '💚';
  if (lp >= 1600) return '🌊';
  if (lp >= 1200) return '🥇';
  if (lp >= 800)  return '🥈';
  if (lp >= 400)  return '🥉';
  return '⚔️';
}

const API = 'http://51.107.3.232/api/stats';

@Component({
  selector: 'app-ranking',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ranking-container animate-fade-in">

      <!-- Header -->
      <div class="glass-panel ranking-header">
        <div class="header-text">
          <h2>Clasificación Global</h2>
          <p class="text-muted">Los mejores Invocadores de Runaterra</p>
        </div>
        <div class="header-stats">
          <div class="hstat">
            <span class="hstat-val">{{ players().length }}</span>
            <span class="hstat-label">Invocadores</span>
          </div>
          <div class="hstat-sep"></div>
          <div class="hstat">
            <span class="hstat-val">{{ players()[0]?.username ?? '—' }}</span>
            <span class="hstat-label">Líder actual</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-panel glass-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label>Buscar invocador</label>
            <div class="search-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" class="filter-input" placeholder="Nombre..."
                [(ngModel)]="filterName" (ngModelChange)="applyFilters()" />
            </div>
          </div>
          <div class="filter-group">
            <label>Rango</label>
            <select class="filter-input" [(ngModel)]="filterTier" (ngModelChange)="applyFilters()">
              <option value="">Todos los rangos</option>
              @for (t of tiers; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>
          <div class="filter-group">
            <label>Winrate mínimo</label>
            <select class="filter-input" [(ngModel)]="filterMinWinrate" (ngModelChange)="applyFilters()">
              <option [value]="0">Cualquiera</option>
              <option [value]="40">40%+</option>
              <option [value]="50">50%+</option>
              <option [value]="60">60%+</option>
              <option [value]="70">70%+</option>
            </select>
          </div>
          <button class="btn btn-secondary btn-reset" (click)="resetFilters()">✕ Limpiar</button>
        </div>
      </div>

      <!-- Loading / empty states -->
      @if (loading()) {
        <div class="state-panel glass-panel">
          <div class="loading-pulse">⏳ Cargando ranking...</div>
        </div>
      } @else if (error()) {
        <div class="state-panel glass-panel">
          <span style="color:var(--accent-danger)">⚠️ No se pudo cargar el ranking. ¿Servidor activo?</span>
        </div>
      } @else if (players().length === 0) {
        <div class="state-panel glass-panel">
          <span class="text-muted">🔭 Ningún invocador coincide con los filtros.</span>
        </div>
      } @else {

        <!-- Top-3 podium -->
        @if (!hasActiveFilters() && players().length >= 3) {
          <div class="podium-row">
            <!-- 2nd -->
            <div class="podium-card podium-2 glass-panel" (click)="goToProfile(players()[1].username)" title="Ver perfil">
              <div class="podium-pos">🥈 #2</div>
              <div class="podium-name">{{ players()[1].username }}</div>
              <div class="podium-rank" [style.color]="getRankColor(players()[1].lp)">
                {{ getRankEmoji(players()[1].lp) }} {{ getLpRank(players()[1].lp) }}
              </div>
              <div class="podium-lp">{{ players()[1].lp }} LP</div>
            </div>
            <!-- 1st -->
            <div class="podium-card podium-1 glass-panel" (click)="goToProfile(players()[0].username)" title="Ver perfil">
              <div class="podium-crown">👑</div>
              <div class="podium-pos">#1</div>
              <div class="podium-name">{{ players()[0].username }}</div>
              <div class="podium-rank" [style.color]="getRankColor(players()[0].lp)">
                {{ getRankEmoji(players()[0].lp) }} {{ getLpRank(players()[0].lp) }}
              </div>
              <div class="podium-lp">{{ players()[0].lp }} LP</div>
            </div>
            <!-- 3rd -->
            <div class="podium-card podium-3 glass-panel" (click)="goToProfile(players()[2].username)" title="Ver perfil">
              <div class="podium-pos">🥉 #3</div>
              <div class="podium-name">{{ players()[2].username }}</div>
              <div class="podium-rank" [style.color]="getRankColor(players()[2].lp)">
                {{ getRankEmoji(players()[2].lp) }} {{ getLpRank(players()[2].lp) }}
              </div>
              <div class="podium-lp">{{ players()[2].lp }} LP</div>
            </div>
          </div>
        }

        <!-- Full table -->
        <div class="ranking-board glass-panel">
          <table class="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Invocador</th>
                <th>Rango</th>
                <th>LP</th>
                <th class="hide-mobile">V</th>
                <th class="hide-mobile">D</th>
                <th class="hide-mobile">Partidas</th>
                <th>Winrate</th>
                <th class="hide-mobile">Elim.</th>
              </tr>
            </thead>
            <tbody>
              @for (p of players(); track p.username; let i = $index) {
                <tr [class.top-1]="i === 0" [class.top-3]="i > 0 && i < 3"
                    class="clickable-row" (click)="goToProfile(p.username)" title="Ver perfil de {{ p.username }}">
                  <td class="rank-num">
                    @if (i === 0) { <span class="medal">👑</span> }
                    @else if (i === 1) { <span class="medal">🥈</span> }
                    @else if (i === 2) { <span class="medal">🥉</span> }
                    @else { #{{ i + 1 }} }
                  </td>
                  <td>
                    <div class="player-col">
                      <strong>{{ p.username }}</strong>
                    </div>
                  </td>
                  <td>
                    <span class="rank-badge" [style.color]="getRankColor(p.lp)" [style.border-color]="getRankColor(p.lp)">
                      {{ getRankEmoji(p.lp) }} {{ getLpRank(p.lp) }}
                    </span>
                  </td>
                  <td class="lp-col">{{ p.lp }}</td>
                  <td class="hide-mobile win-col">{{ p.wins }}</td>
                  <td class="hide-mobile loss-col">{{ p.losses }}</td>
                  <td class="hide-mobile">{{ p.gamesPlayed }}</td>
                  <td>
                    <div class="winrate-cell">
                      <span class="winrate-val" [class.high]="p.winRate >= 60" [class.mid]="p.winRate >= 50 && p.winRate < 60">
                        {{ p.winRate | number:'1.1-1' }}%
                      </span>
                      <div class="winrate-bar-bg">
                        <div class="winrate-bar-fill" [style.width.%]="p.winRate" [class.high]="p.winRate >= 60"></div>
                      </div>
                    </div>
                  </td>
                  <td class="hide-mobile elim-col">{{ p.regionsEliminated }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `,
  styles: [`
    .ranking-container { display: flex; flex-direction: column; gap: 20px; padding: 24px 0; }

    /* Header */
    .ranking-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; }
    .header-text h2 { color: var(--accent-gold); font-size: 1.8rem; margin-bottom: 4px; }
    .header-stats { display: flex; align-items: center; gap: 16px; }
    .hstat { text-align: center; }
    .hstat-val { display: block; font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); color: white; }
    .hstat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .hstat-sep { width: 1px; height: 40px; background: var(--border-light); }

    /* Filters */
    .filters-panel { padding: 20px 28px; }
    .filter-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 140px; }
    .filter-group label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .search-wrap { position: relative; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 0.9rem; }
    .filter-input {
      background: rgba(0,0,0,0.35); border: 1px solid var(--border-light);
      color: white; padding: 10px 14px; border-radius: 8px; outline: none;
      font-size: 0.9rem; width: 100%; transition: border-color 0.2s;
    }
    .search-wrap .filter-input { padding-left: 36px; }
    .filter-input:focus { border-color: var(--accent-primary); }
    select.filter-input { appearance: none; cursor: pointer; }
    select.filter-input option { background: #1e293b; }
    .btn-reset { align-self: flex-end; padding: 10px 18px; white-space: nowrap; flex-shrink: 0; }

    /* State */
    .state-panel { padding: 40px; text-align: center; font-size: 1rem; }
    .loading-pulse { color: var(--accent-secondary); animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    /* Podium */
    .podium-row { display: flex; justify-content: center; align-items: flex-end; gap: 12px; }
    .podium-card {
      flex: 1; max-width: 220px; padding: 20px 16px; text-align: center; border-radius: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      cursor: pointer; transition: transform 0.2s;
    }
    .podium-card:hover { transform: translateY(-4px); }
    .podium-1 {
      order: 2; border: 2px solid var(--accent-gold);
      background: linear-gradient(180deg, rgba(200,155,60,0.15) 0%, transparent 100%);
      padding-bottom: 28px;
    }
    .podium-2 { order: 1; border: 1px solid rgba(148,163,184,0.3); }
    .podium-3 { order: 3; border: 1px solid rgba(139,115,85,0.3); }
    .podium-crown { font-size: 2rem; }
    .podium-pos { font-size: 1.1rem; font-weight: 800; color: var(--accent-gold); }
    .podium-name { font-size: 1rem; font-weight: 700; color: white; }
    .podium-rank { font-size: 0.82rem; font-weight: 700; }
    .podium-lp { font-size: 1.3rem; font-weight: 800; font-family: var(--font-heading); color: white; }

    /* Table */
    .ranking-board { padding: 0; overflow: hidden; overflow-x: auto; }
    .ranking-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 620px; }
    .ranking-table th {
      background: rgba(0,0,0,0.35); padding: 14px 16px;
      font-family: var(--font-heading); color: var(--text-muted);
      text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.08em;
    }
    .ranking-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .ranking-table tbody tr { transition: background 0.15s; }
    .ranking-table tbody tr.clickable-row { cursor: pointer; }
    .ranking-table tbody tr:hover td { background: rgba(139,92,246,0.07); }
    .ranking-table tbody tr.clickable-row:hover .player-col strong { color: var(--accent-secondary); text-decoration: underline; }
    .ranking-table tr:last-child td { border-bottom: none; }

    .top-1 td { background: rgba(200,155,60,0.06); }
    .top-3 td { background: rgba(139,92,246,0.03); }

    .rank-num { font-weight: 800; color: var(--text-muted); font-size: 0.9rem; white-space: nowrap; }
    .medal { font-size: 1.2rem; }

    .player-col strong { color: var(--text-main); font-size: 0.98rem; }

    .rank-badge {
      display: inline-flex; align-items: center; gap: 5px;
      border: 1px solid; padding: 3px 10px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700; white-space: nowrap;
      background: rgba(0,0,0,0.25);
    }

    .lp-col { font-family: var(--font-heading); font-weight: 800; font-size: 1.05rem; color: white; }
    .win-col { color: var(--accent-success); font-weight: 700; }
    .loss-col { color: #f87171; font-weight: 700; }
    .elim-col { color: var(--accent-gold); font-weight: 700; }

    .winrate-cell { display: flex; flex-direction: column; gap: 4px; min-width: 70px; }
    .winrate-val { font-weight: 700; font-size: 0.9rem; color: var(--text-muted); }
    .winrate-val.high { color: var(--accent-success); }
    .winrate-val.mid { color: var(--accent-gold); }
    .winrate-bar-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .winrate-bar-fill { height: 100%; background: var(--accent-primary); border-radius: 2px; transition: width 0.6s ease; }
    .winrate-bar-fill.high { background: var(--accent-success); }

    @media (max-width: 768px) {
      .ranking-header { flex-direction: column; gap: 16px; text-align: center; }
      .filter-row { flex-direction: column; }
      .filter-group { min-width: 100%; }
      .btn-reset { width: 100%; }
      .podium-row { gap: 6px; }
      .podium-card { max-width: 160px; padding: 14px 10px; }
      .ranking-table { min-width: auto; }
      .ranking-table th, .ranking-table td { padding: 10px 8px; }
    }
  `]
})
export class Ranking implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private auth   = inject(AuthService);

  players = signal<PlayerStats[]>([]);
  loading = signal(true);
  error = signal(false);

  filterName     = '';
  filterTier     = '';
  filterMinWinrate = 0;

  tiers = TIERS;

  readonly getLpRank    = getLpRank;
  readonly getRankColor = getRankColor;
  readonly getRankEmoji = getRankEmoji;

  hasActiveFilters = computed(() =>
    this.filterName.trim() !== '' || this.filterTier !== '' || this.filterMinWinrate > 0
  );

  async ngOnInit() {
    await this.loadRanking();
  }

  async applyFilters() {
    await this.loadRanking();
  }

  resetFilters() {
    this.filterName = '';
    this.filterTier = '';
    this.filterMinWinrate = 0;
    this.loadRanking();
  }

  goToProfile(username: string) {
    const me = this.auth.currentUser()?.username;
    if (me && me === username) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/player', username]);
    }
  }

  private async loadRanking() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const params: Record<string, string> = {};
      if (this.filterName.trim())    params['name']       = this.filterName.trim();
      if (this.filterTier)           params['tier']        = this.filterTier;
      if (this.filterMinWinrate > 0) params['minWinrate'] = String(this.filterMinWinrate);

      const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      const url = `${API}/ranking${qs ? '?' + qs : ''}`;

      const data = await firstValueFrom(this.http.get<PlayerStats[]>(url));
      this.players.set(data ?? []);
    } catch {
      this.error.set(true);
      this.players.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
