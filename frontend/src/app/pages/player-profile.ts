import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

interface RegionMastery { games: number; wins: number; xp: number; level: number; }

interface PlayerStatsDto {
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

const STATS_API = 'http://51.107.3.232/api/stats';

const XP_THRESHOLDS = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270];

const MASTERY_LABELS: Record<number, string> = {
  1: 'Novato invocador', 2: 'Aprendiz de la Grieta', 3: 'Iniciado en combate',
  4: 'Veterano de batallas', 5: 'Experto del campo', 6: 'Élite de Runaterra',
  7: 'Maestro de la región', 8: 'Gran Maestro regional', 9: 'Leyenda de Runaterra',
  10: 'Invocador Supremo ★',
};

const ALL_FACTIONS = [
  'Demacia', 'Noxus', 'Ionia', 'Freljord', 'Piltover', 'Zaun',
  'Shurima', 'Shadow Isles', 'Targon', 'Bilgewater', 'Ixtal', 'Void', 'Tierras Perdidas'
];

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

function xpPercentInLevel(xp: number, level: number): number {
  if (level >= 10) return 100;
  const start = XP_THRESHOLDS[level - 1] ?? 0;
  const end   = XP_THRESHOLDS[level]     ?? 270;
  return Math.min(100, Math.round(((xp - start) / (end - start)) * 100));
}

@Component({
  selector: 'app-player-profile',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="player-profile-page animate-fade-in">

      @if (loading()) {
        <div class="state-panel glass-panel">
          <div class="loading-pulse">⏳ Cargando perfil...</div>
        </div>
      } @else if (error()) {
        <div class="state-panel glass-panel">
          <span style="color:var(--accent-danger)">⚠️ No se encontró el perfil de este invocador.</span>
          <a routerLink="/ranking" class="btn btn-secondary" style="margin-top:16px;">← Volver al ranking</a>
        </div>
      } @else if (stats()) {

        <!-- Banner -->
        <div class="banner glass-panel">
          <div class="banner-bg"></div>
          <div class="banner-content">
            <div class="avatar-circle" [style.background]="avatarBg()">
              <span class="avatar-letter">{{ stats()!.username[0].toUpperCase() }}</span>
            </div>
            <div class="banner-info">
              <div class="banner-top">
                <h1 class="username">{{ stats()!.username }}</h1>
                @if (isOwnProfile()) {
                  <span class="own-badge">TÚ</span>
                }
                <span class="rank-badge" [style.color]="rankColor()" [style.border-color]="rankColor()">
                  {{ getLpRank(stats()!.lp) }}
                </span>
                <span class="lp-badge">{{ stats()!.lp }} LP</span>
              </div>
              <div class="banner-meta">
                <span class="meta-chip">🏆 {{ stats()!.wins }} victorias</span>
                <span class="meta-chip">💀 {{ stats()!.losses }} derrotas</span>
                <span class="meta-chip">🎮 {{ stats()!.gamesPlayed }} partidas</span>
                <span class="meta-chip">💥 {{ stats()!.regionsEliminated }} regiones elim.</span>
              </div>
            </div>
            <div class="banner-actions">
              @if (isOwnProfile()) {
                <a routerLink="/profile" class="btn btn-primary">✏️ Editar mi perfil</a>
              }
              <a routerLink="/ranking" class="btn btn-secondary">← Ranking</a>
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-card glass-panel">
            <div class="stat-icon">🎯</div>
            <div class="stat-val">{{ formatWinRate(stats()!.winRate) }}%</div>
            <div class="stat-label">Winrate</div>
            <div class="wr-bar-bg">
              <div class="wr-bar-fill" [style.width.%]="stats()!.winRate" [class.high]="stats()!.winRate >= 60"></div>
            </div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">⭐</div>
            <div class="stat-val" [style.color]="rankColor()">{{ stats()!.lp }}</div>
            <div class="stat-label">LP Totales</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">🏆</div>
            <div class="stat-val">{{ stats()!.wins }}</div>
            <div class="stat-label">Victorias</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">💥</div>
            <div class="stat-val">{{ stats()!.regionsEliminated }}</div>
            <div class="stat-label">Reg. Eliminadas</div>
          </div>
        </div>

        <!-- Win/loss bar -->
        <div class="ratio-panel glass-panel">
          <h3>Ratio Victoria / Derrota</h3>
          <div class="ratio-bar">
            <div class="ratio-win" [style.width.%]="winRate()">
              @if (winRate() > 12) { <span>{{ winRate() }}% V</span> }
            </div>
            <div class="ratio-loss" [style.width.%]="lossRate()">
              @if (lossRate() > 12) { <span>{{ lossRate() }}% D</span> }
            </div>
          </div>
        </div>

        <!-- Region mastery -->
        <div class="mastery-section glass-panel">
          <h2 class="section-title"><span class="title-accent">|</span> Dominio de Regiones</h2>
          <div class="mastery-grid">
            @for (reg of masteryList(); track reg.name) {
              <div class="mastery-card" [class.max-level]="reg.level >= 10">
                <div class="mastery-header">
                  <span class="mastery-name">{{ reg.name }}</span>
                  <span class="mastery-level" [class.max]="reg.level >= 10">Nv. {{ reg.level }}</span>
                </div>
                @if (reg.level < 10) {
                  <div class="mastery-bar-bg">
                    <div class="mastery-bar-fill" [style.width.%]="reg.xpPct"></div>
                  </div>
                } @else {
                  <div class="max-badge">★ {{ reg.wins }} victorias</div>
                }
                <div class="mastery-desc">{{ reg.description }}</div>
              </div>
            }
          </div>
        </div>

      }
    </div>
  `,
  styles: [`
    .player-profile-page { display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; }

    /* State */
    .state-panel { padding: 60px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .loading-pulse { color: var(--accent-secondary); font-size: 1.1rem; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    /* Banner */
    .banner { position: relative; overflow: hidden; border-radius: 20px; padding: 0; }
    .banner-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.08) 50%, rgba(16,185,129,0.06) 100%);
    }
    .banner-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 24px; padding: 32px 36px; flex-wrap: wrap; }
    .avatar-circle {
      width: 90px; height: 90px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 24px rgba(139,92,246,0.3); border: 3px solid rgba(255,255,255,0.15);
    }
    .avatar-letter { font-size: 2.4rem; font-weight: 800; color: white; font-family: var(--font-heading); }
    .banner-info { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .banner-top { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .username {
      font-size: 2rem; font-weight: 800; line-height: 1;
      background: linear-gradient(135deg, #fff 60%, var(--accent-secondary));
      -webkit-background-clip: text; color: transparent;
    }
    .own-badge {
      background: var(--accent-primary); color: white; padding: 2px 10px;
      border-radius: 12px; font-size: 0.72rem; font-weight: 800;
    }
    .rank-badge {
      border: 1px solid; padding: 3px 12px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700; background: rgba(0,0,0,0.2);
    }
    .lp-badge {
      background: rgba(200,155,60,0.15); color: var(--accent-gold);
      padding: 3px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 800;
      border: 1px solid rgba(200,155,60,0.3);
    }
    .banner-meta { display: flex; gap: 10px; flex-wrap: wrap; }
    .meta-chip {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
      padding: 4px 12px; border-radius: 8px; font-size: 0.8rem; color: var(--text-muted);
    }
    .banner-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }

    /* Stats row */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
    .stat-card { text-align: center; padding: 24px 16px; border-radius: 16px; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-icon { font-size: 1.8rem; margin-bottom: 8px; }
    .stat-val {
      font-size: 2rem; font-weight: 800; font-family: var(--font-heading);
      background: linear-gradient(135deg, #fff, var(--accent-secondary));
      -webkit-background-clip: text; color: transparent;
    }
    .stat-label { font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.07em; }
    .wr-bar-bg { width: 60%; margin: 8px auto 0; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .wr-bar-fill { height: 100%; background: var(--accent-primary); border-radius: 2px; }
    .wr-bar-fill.high { background: var(--accent-success); }

    /* Ratio bar */
    .ratio-panel { padding: 20px 24px; border-radius: 16px; }
    .ratio-panel h3 { font-size: 1rem; margin-bottom: 12px; }
    .ratio-bar { display: flex; height: 28px; border-radius: 10px; overflow: hidden; background: rgba(0,0,0,0.3); }
    .ratio-win, .ratio-loss {
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; color: white;
      transition: width 0.6s ease; min-width: 0;
    }
    .ratio-win  { background: linear-gradient(90deg, #10b981, #34d399); }
    .ratio-loss { background: linear-gradient(90deg, #ef4444, #f87171); }

    /* Mastery */
    .mastery-section { padding: 24px; border-radius: 20px; }
    .section-title { font-size: 1.5rem; display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .title-accent { width: 4px; height: 26px; background: var(--accent-primary); border-radius: 2px; display: inline-block; }
    .mastery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
    .mastery-card {
      background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); padding: 12px 14px;
      border-radius: 12px; display: flex; flex-direction: column; gap: 7px; transition: transform 0.2s, border-color 0.2s;
    }
    .mastery-card:hover { transform: translateY(-3px); border-color: rgba(200,155,60,0.3); }
    .mastery-card.max-level { border-color: rgba(200,155,60,0.5); background: rgba(200,155,60,0.07); }
    .mastery-header { display: flex; justify-content: space-between; align-items: center; }
    .mastery-name { font-weight: 800; color: var(--accent-gold); font-size: 0.85rem; }
    .mastery-level {
      font-size: 0.72rem; font-weight: 700; color: white;
      background: rgba(139,92,246,0.2); padding: 2px 7px; border-radius: 8px;
    }
    .mastery-level.max { background: rgba(200,155,60,0.25); color: var(--accent-gold); }
    .mastery-bar-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .mastery-bar-fill { height: 100%; background: var(--accent-secondary); border-radius: 2px; }
    .max-badge {
      font-size: 0.72rem; font-weight: 800; color: var(--accent-gold);
      background: rgba(200,155,60,0.15); padding: 3px 8px; border-radius: 6px; text-align: center;
    }
    .mastery-desc { font-size: 0.68rem; color: var(--text-muted); font-style: italic; line-height: 1.3; }

    @media (max-width: 768px) {
      .banner-content { flex-direction: column; text-align: center; padding: 24px 20px; }
      .banner-top { justify-content: center; }
      .banner-meta { justify-content: center; }
      .banner-actions { flex-direction: row; justify-content: center; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class PlayerProfile implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);

  loading = signal(true);
  error   = signal(false);
  stats   = signal<PlayerStatsDto | null>(null);

  isOwnProfile = computed(() => {
    const me = this.auth.currentUser()?.username;
    return !!me && me === this.stats()?.username;
  });

  rankColor = computed(() => getRankColor(this.stats()?.lp ?? 0));

  winRate  = computed(() => {
    const s = this.stats();
    return s?.gamesPlayed ? Math.round(s.wins / s.gamesPlayed * 100) : 0;
  });
  lossRate = computed(() => {
    const s = this.stats();
    return s?.gamesPlayed ? Math.round(s.losses / s.gamesPlayed * 100) : 0;
  });

  avatarBg = computed(() => {
    const colors = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6','#a855f7'];
    const name = this.stats()?.username ?? '';
    const idx  = name.charCodeAt(0) % colors.length;
    return `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx + 3) % colors.length]})`;
  });

  masteryList = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return ALL_FACTIONS.map(f => {
      const m = s.regionMastery?.[f];
      const level = m?.level ?? 1;
      const xp    = m?.xp    ?? 0;
      const wins  = m?.wins  ?? 0;
      return {
        name:        f,
        level,
        xpPct:       xpPercentInLevel(xp, level),
        wins,
        description: MASTERY_LABELS[level] ?? 'Novato invocador',
      };
    });
  });

  readonly getLpRank = getLpRank;

  async ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) { this.router.navigate(['/ranking']); return; }

    // If viewing own profile → redirect to the full editable profile
    if (this.auth.currentUser()?.username === username) {
      this.router.navigate(['/profile']);
      return;
    }

    try {
      const data = await firstValueFrom(
        this.http.get<PlayerStatsDto>(`${STATS_API}/${encodeURIComponent(username)}`)
      );
      this.stats.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  formatWinRate(wr: number): string {
    return (Math.round(wr * 10) / 10).toFixed(1);
  }
}
