import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserProfile } from '../services/auth.service';
import { LobbyService } from '../services/lobby.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="profile-page animate-fade-in" *ngIf="user()">

      <!-- ═══════════ HEADER BANNER ═══════════ -->
      <div class="profile-banner glass-panel">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <div class="avatar-large" [style.background]="avatarGradient()">
            <span class="avatar-initial">{{ user()!.username[0].toUpperCase() }}</span>
            <div class="avatar-level">{{ user()!.level }}</div>
          </div>

          <div class="banner-info">
            <div class="banner-top-row">
              <h1 class="profile-username">{{ user()!.username }}</h1>
              <span class="title-badge">{{ user()!.title || 'Recluta Novato' }}</span>
            </div>
            <div class="profile-meta-row">
              <span class="meta-chip faction-chip">
                <span class="chip-icon">⚔</span> {{ user()!.faction || user()!.clan || 'Sin Facción' }}
              </span>
              <span class="meta-chip">
                <span class="chip-icon">📧</span> {{ user()!.email }}
              </span>
              <span class="meta-chip">
                <span class="chip-icon">📅</span> Desde {{ joinDate() }}
              </span>
            </div>
            <p class="profile-bio">{{ user()!.bio || '¡Listo para la batalla!' }}</p>
          </div>

          <button class="btn btn-secondary btn-edit" (click)="toggleEdit()">
            <span *ngIf="!editing()">✏️ Editar Perfil</span>
            <span *ngIf="editing()">✕ Cancelar</span>
          </button>
        </div>
      </div>

      <!-- ═══════════ EDIT PANEL ═══════════ -->
      <div class="edit-panel glass-panel animate-slide-down" *ngIf="editing()">
        <h3>⚙️ Configuración del Perfil</h3>

        <form class="edit-form" (ngSubmit)="saveProfile()">
          <div class="edit-grid">
            <div class="form-group">
              <label for="edit-bio">Biografía</label>
              <textarea id="edit-bio" class="form-control" rows="3"
                placeholder="Cuéntales a tus rivales quién eres..."
                [(ngModel)]="draft.bio" name="bio" maxlength="200"></textarea>
              <span class="char-count">{{ draft.bio.length }}/200</span>
            </div>

            <div class="form-group">
              <label for="edit-title">Título de Combate</label>
              <select id="edit-title" class="form-control" [(ngModel)]="draft.title" name="title">
                <option *ngFor="let t of availableTitles" [value]="t">{{ t }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="edit-clan">Clan</label>
              <input id="edit-clan" type="text" class="form-control"
                placeholder="Nombre de tu clan" [(ngModel)]="draft.clan" name="clan" maxlength="30">
            </div>

            <div class="form-group">
              <label>Color de Avatar</label>
              <div class="color-picker">
                <button type="button"
                  *ngFor="let c of availableColors"
                  class="color-swatch"
                  [style.background]="c"
                  [class.selected]="draft.avatarColor === c"
                  (click)="draft.avatarColor = c">
                  <span *ngIf="draft.avatarColor === c">✓</span>
                </button>
              </div>
            </div>
          </div>

          <div class="edit-actions">
            <button type="button" class="btn btn-secondary" (click)="toggleEdit()">Cancelar</button>
            <button type="submit" class="btn btn-primary">💾 Guardar Cambios</button>
          </div>

          <div class="save-feedback" *ngIf="saveMsg()">
            <span class="save-icon">✅</span> {{ saveMsg() }}
          </div>
        </form>
      </div>

      <!-- ═══════════ STATS GRID ═══════════ -->
      <div class="stats-section">
        <h2 class="section-title"><span class="title-accent">|</span> Estadísticas de Combate</h2>

        <div class="stats-grid">
          <div class="stat-card glass-panel">
            <div class="stat-icon win-icon">🏆</div>
            <div class="stat-value">{{ stats().wins }}</div>
            <div class="stat-label">Victorias</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon loss-icon">💀</div>
            <div class="stat-value">{{ stats().losses }}</div>
            <div class="stat-label">Derrotas</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon draw-icon">🤝</div>
            <div class="stat-value">{{ stats().draws }}</div>
            <div class="stat-label">Empates</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon points-icon">⭐</div>
            <div class="stat-value">{{ stats().totalPoints }}</div>
            <div class="stat-label">Puntos Totales</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon accuracy-icon">🎯</div>
            <div class="stat-value">{{ stats().accuracy }}%</div>
            <div class="stat-label">Precisión</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon streak-icon">🔥</div>
            <div class="stat-value">{{ stats().bestWinStreak }}</div>
            <div class="stat-label">Mejor Racha</div>
          </div>
        </div>
      </div>

      <!-- ═══════════ WIN/LOSS RATIO BAR ═══════════ -->
      <div class="ratio-section glass-panel">
        <h3>Ratio Victoria / Derrota</h3>
        <div class="ratio-bar-container">
          <div class="ratio-bar">
            <div class="ratio-fill ratio-win" [style.width.%]="winRate()">
              <span *ngIf="winRate() > 15">{{ winRate() }}% W</span>
            </div>
            <div class="ratio-fill ratio-loss" [style.width.%]="lossRate()">
              <span *ngIf="lossRate() > 15">{{ lossRate() }}% L</span>
            </div>
            <div class="ratio-fill ratio-draw" [style.width.%]="drawRate()">
              <span *ngIf="drawRate() > 10">{{ drawRate() }}% D</span>
            </div>
          </div>
          <div class="ratio-legend">
            <span class="legend-item"><span class="legend-dot win-dot"></span>Victorias</span>
            <span class="legend-item"><span class="legend-dot loss-dot"></span>Derrotas</span>
            <span class="legend-item"><span class="legend-dot draw-dot"></span>Empates</span>
          </div>
        </div>
      </div>

      <!-- ═══════════ ACTIVITY ═══════════ -->
      <div class="activity-section">
        <h2 class="section-title"><span class="title-accent">|</span> Actividad Reciente</h2>
        <div class="activity-grid">
          <div class="activity-card glass-panel" *ngIf="myLobby()">
            <div class="activity-icon" style="color: var(--accent-success);">🎮</div>
            <div class="activity-info">
              <span class="activity-title">Sala Activa</span>
              <span class="activity-desc">{{ myLobby()!.name }} — {{ myLobby()!.players }}/{{ myLobby()!.maxPlayers }} jugadores</span>
            </div>
            <a [routerLink]="['/lobby', myLobby()!.id]" class="btn btn-primary btn-sm-activity">IR →</a>
          </div>

          <div class="activity-card glass-panel" *ngIf="!myLobby()">
            <div class="activity-icon" style="color: var(--text-muted);">🔭</div>
            <div class="activity-info">
              <span class="activity-title">Sin Sala Activa</span>
              <span class="activity-desc">Crea o únete a una partida para comenzar.</span>
            </div>
            <a routerLink="/" class="btn btn-secondary btn-sm-activity">BUSCAR</a>
          </div>

          <div class="activity-card glass-panel">
            <div class="activity-icon">📊</div>
            <div class="activity-info">
              <span class="activity-title">Partidas Jugadas</span>
              <span class="activity-desc">{{ totalGames() }} batallas completadas</span>
            </div>
          </div>

          <div class="activity-card glass-panel">
            <div class="activity-icon">⚡</div>
            <div class="activity-info">
              <span class="activity-title">Racha Actual</span>
              <span class="activity-desc">{{ stats().winStreak }} victorias consecutivas</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- NOT LOGGED IN -->
    <div class="profile-not-logged animate-fade-in" *ngIf="!user()">
      <div class="glass-panel" style="text-align:center; padding: 60px 40px; max-width: 480px; margin: 60px auto;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
        <h2>Acceso Requerido</h2>
        <p class="text-muted" style="margin: 12px 0 24px;">Inicia sesión para ver tu perfil de comandante.</p>
        <a routerLink="/login" class="btn btn-primary" style="padding: 14px 32px;">🛡 INICIAR SESIÓN</a>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page Layout ── */
    .profile-page { display: flex; flex-direction: column; gap: 28px; padding-bottom: 40px; }

    /* ── Banner ── */
    .profile-banner {
      position: relative; overflow: hidden; border-radius: 24px; padding: 0;
    }
    .banner-bg {
      position: absolute; inset: 0; z-index: 0;
      background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.1) 50%, rgba(16,185,129,0.08) 100%);
    }
    .banner-bg::after {
      content: ''; position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E");
      background-size: 60px 60px;
    }
    .banner-content {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 28px;
      padding: 36px 40px;
    }

    /* ── Avatar ── */
    .avatar-large {
      width: 110px; height: 110px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      box-shadow: 0 0 30px rgba(139,92,246,0.3), inset 0 0 20px rgba(0,0,0,0.2);
      border: 3px solid rgba(255,255,255,0.15);
    }
    .avatar-initial {
      font-size: 2.8rem; font-weight: 800; color: white;
      font-family: var(--font-heading); text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .avatar-level {
      position: absolute; bottom: -4px; right: -4px;
      background: var(--accent-primary); color: white;
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.9rem;
      border: 3px solid var(--bg-main);
      box-shadow: 0 0 10px rgba(139,92,246,0.5);
      font-family: var(--font-heading);
    }

    /* ── Banner Info ── */
    .banner-info { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .banner-top-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .profile-username {
      font-size: 2.2rem; font-weight: 800; line-height: 1.1;
      background: linear-gradient(135deg, #fff 60%, var(--accent-secondary));
      -webkit-background-clip: text; color: transparent;
    }
    .title-badge {
      background: rgba(139,92,246,0.15); color: var(--accent-primary);
      padding: 4px 12px; border-radius: 20px; font-size: 0.82rem;
      font-weight: 700; border: 1px solid rgba(139,92,246,0.3);
      letter-spacing: 0.03em; white-space: nowrap;
    }

    .profile-meta-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 8px;
      font-size: 0.82rem; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.06);
    }
    .chip-icon { font-size: 0.9rem; }
    .faction-chip { color: var(--accent-gold); border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.08); }

    .profile-bio {
      color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;
      max-width: 600px; font-style: italic;
    }

    .btn-edit {
      align-self: flex-start; padding: 10px 20px; font-size: 0.88rem; white-space: nowrap;
      border-radius: 10px;
    }

    /* ── Edit Panel ── */
    .edit-panel { padding: 28px 32px; border-radius: 20px; }
    .edit-panel h3 { font-size: 1.3rem; margin-bottom: 20px; }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-down { animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .edit-form { display: flex; flex-direction: column; gap: 20px; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label {
      font-family: var(--font-heading); font-size: 0.82rem;
      color: var(--accent-secondary); letter-spacing: 0.05em;
    }
    .form-control {
      background: rgba(0,0,0,0.35); border: 1px solid var(--border-light);
      padding: 12px 16px; border-radius: 8px; color: white;
      font-family: var(--font-body); font-size: 0.95rem; outline: none;
      transition: all var(--transition-fast); width: 100%; resize: vertical;
    }
    .form-control:focus { border-color: var(--accent-primary); box-shadow: 0 0 10px rgba(139,92,246,0.3); }
    select.form-control { cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 14px center;
    }
    select.form-control option { background: #1e293b; color: white; }

    .char-count { font-size: 0.75rem; color: var(--text-muted); text-align: right; }

    .color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      border: 3px solid transparent; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 0.9rem;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: white; box-shadow: 0 0 12px rgba(255,255,255,0.3); transform: scale(1.1); }

    .edit-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .save-feedback {
      display: flex; align-items: center; gap: 8px;
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
      color: var(--accent-success); padding: 10px 16px; border-radius: 8px;
      font-weight: 600; font-size: 0.9rem;
      animation: slideDown 0.3s ease forwards;
    }

    /* ── Stats ── */
    .section-title {
      font-size: 1.6rem; display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
    }
    .title-accent {
      width: 4px; height: 28px; background: var(--accent-primary);
      border-radius: 2px; display: inline-block; flex-shrink: 0;
    }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;
    }
    .stat-card {
      text-align: center; padding: 24px 16px; border-radius: 16px;
      transition: all 0.3s ease; cursor: default;
    }
    .stat-card:hover { transform: translateY(-6px); border-color: rgba(139,92,246,0.3); }
    .stat-icon { font-size: 2rem; margin-bottom: 8px; }
    .stat-value {
      font-size: 2.2rem; font-weight: 800; font-family: var(--font-heading);
      background: linear-gradient(135deg, #fff, var(--accent-secondary));
      -webkit-background-clip: text; color: transparent;
    }
    .stat-label { font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

    /* ── Ratio Bar ── */
    .ratio-section { padding: 24px 28px; border-radius: 20px; }
    .ratio-section h3 { font-size: 1.1rem; margin-bottom: 16px; }
    .ratio-bar-container { display: flex; flex-direction: column; gap: 12px; }
    .ratio-bar {
      display: flex; height: 32px; border-radius: 12px; overflow: hidden;
      background: rgba(0,0,0,0.3);
    }
    .ratio-fill {
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white; white-space: nowrap;
      transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1);
      min-width: 0;
    }
    .ratio-win { background: linear-gradient(90deg, #10b981, #34d399); }
    .ratio-loss { background: linear-gradient(90deg, #ef4444, #f87171); }
    .ratio-draw { background: linear-gradient(90deg, #6366f1, #818cf8); }

    .ratio-legend { display: flex; gap: 20px; justify-content: center; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
    .win-dot { background: #10b981; }
    .loss-dot { background: #ef4444; }
    .draw-dot { background: #6366f1; }

    /* ── Activity ── */
    .activity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .activity-card {
      display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 16px;
      transition: all 0.3s ease;
    }
    .activity-card:hover { transform: translateY(-4px); border-color: rgba(139,92,246,0.25); }
    .activity-icon { font-size: 1.8rem; flex-shrink: 0; }
    .activity-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .activity-title { font-weight: 700; font-size: 0.95rem; }
    .activity-desc { font-size: 0.82rem; color: var(--text-muted); }
    .btn-sm-activity { padding: 8px 18px; font-size: 0.82rem; white-space: nowrap; flex-shrink: 0; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .banner-content { flex-direction: column; text-align: center; padding: 28px 20px; }
      .banner-top-row { justify-content: center; }
      .profile-meta-row { justify-content: center; }
      .profile-bio { max-width: 100%; }
      .btn-edit { align-self: center; }
      .edit-grid { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .profile-username { font-size: 1.6rem; }
    }
  `]
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private lobbyService = inject(LobbyService);
  private router = inject(Router);

  editing = signal(false);
  saveMsg = signal('');

  user = computed(() => this.auth.currentUser());

  stats = computed(() => {
    const u = this.user();
    return u?.stats ?? {
      wins: 0, losses: 0, draws: 0, gamesPlayed: 0,
      winStreak: 0, bestWinStreak: 0, accuracy: 0, totalPoints: 0,
    };
  });

  avatarGradient = computed(() => {
    const color = this.user()?.avatarColor ?? '#8b5cf6';
    return `linear-gradient(135deg, ${color}, ${this.shiftColor(color, -30)})`;
  });

  joinDate = computed(() => {
    const d = this.user()?.createdAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  totalGames = computed(() => {
    const s = this.stats();
    return s.wins + s.losses + s.draws;
  });

  winRate = computed(() => {
    const total = this.totalGames();
    return total ? Math.round((this.stats().wins / total) * 100) : 0;
  });
  lossRate = computed(() => {
    const total = this.totalGames();
    return total ? Math.round((this.stats().losses / total) * 100) : 0;
  });
  drawRate = computed(() => {
    const total = this.totalGames();
    return total ? Math.max(0, 100 - this.winRate() - this.lossRate()) : 0;
  });

  myLobby = computed(() => {
    const u = this.user();
    return u ? this.lobbyService.getUserLobby(u.username) ?? null : null;
  });

  draft = {
    bio: '',
    title: '',
    clan: '',
    avatarColor: '',
  };

  availableTitles = [
    'Recluta Novato', 'Estratega Aprendiz', 'Comandante en Prácticas',
    'Soldado Raso', 'Centinela', 'Táctico Junior',
    'Maestro de Campo', 'Élite Oscura', 'General Supremo',
  ];

  availableColors = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#3b82f6', '#84cc16',
    '#14b8a6', '#a855f7', '#f97316', '#6366f1',
  ];

  ngOnInit() {
    const u = this.auth.currentUser();
    if (!u) return;

    // Migrate old profiles
    const migrated = this.auth.ensureProfileDefaults(u);

    this.draft = {
      bio: migrated.bio || '',
      title: migrated.title || 'Recluta Novato',
      clan: migrated.clan || '',
      avatarColor: migrated.avatarColor || '#8b5cf6',
    };
  }

  toggleEdit() {
    this.editing.update(v => !v);
    this.saveMsg.set('');
    if (this.editing()) {
      const u = this.user()!;
      this.draft = {
        bio: u.bio || '',
        title: u.title || 'Recluta Novato',
        clan: u.clan || '',
        avatarColor: u.avatarColor || '#8b5cf6',
      };
    }
  }

  saveProfile() {
    const result = this.auth.updateProfile({
      bio: this.draft.bio.trim(),
      title: this.draft.title,
      clan: this.draft.clan.trim(),
      avatarColor: this.draft.avatarColor,
    });

    if (result.ok) {
      this.saveMsg.set('Perfil actualizado correctamente.');
      setTimeout(() => {
        this.editing.set(false);
        this.saveMsg.set('');
      }, 1500);
    }
  }

  private shiftColor(hex: string, amount: number): string {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
