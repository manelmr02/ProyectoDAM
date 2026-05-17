import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, UserProfile } from '../services/auth.service';
import { LobbyService } from '../services/lobby.service';
import { ClanService } from '../services/clan.service';
import { firstValueFrom } from 'rxjs';

interface PlayerStatsDto {
  username: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lp: number;
  regionsEliminated: number;
  winRate: number;
  rankTier: string;
  regionMastery: Record<string, { games: number; wins: number; xp: number; level: number }>;
}

const STATS_API  = 'http://51.107.3.232/api/stats';
const USERS_API  = 'http://51.107.3.232/api/usuarios';

const XP_THRESHOLDS = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270];

function getLpRank(lp: number): string {
  if (lp >= 3600) return 'Challenger';
  if (lp >= 3200) return 'Gran Maestro';
  if (lp >= 2800) return 'Maestro';
  const tiers = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda', 'Diamante'];
  const divs  = ['IV', 'III', 'II', 'I'];
  return `${tiers[Math.floor(lp / 400)]} ${divs[Math.floor((lp % 400) / 100)]}`;
}

function xpPercentInLevel(xp: number, level: number): number {
  if (level >= 10) return 100;
  const start = XP_THRESHOLDS[level - 1] ?? 0;
  const end   = XP_THRESHOLDS[level]     ?? 270;
  return Math.min(100, Math.round(((xp - start) / (end - start)) * 100));
}

const MASTERY_LABELS: Record<number, string> = {
  1:  'Novato invocador',
  2:  'Aprendiz de la Grieta',
  3:  'Iniciado en combate',
  4:  'Veterano de batallas',
  5:  'Experto del campo',
  6:  'Élite de Runaterra',
  7:  'Maestro de la región',
  8:  'Gran Maestro regional',
  9:  'Leyenda de Runaterra',
  10: 'Invocador Supremo ★',
};

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (user()) {
    <div class="profile-page animate-fade-in">

      <!-- ═══════════ HEADER BANNER ═══════════ -->
      <div class="profile-banner glass-panel">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <div class="avatar-container">
            <div class="avatar-large"
              [style.background]="(pendingAvatarPreview() || user()!.avatarImage) ? 'url(' + (pendingAvatarPreview() || user()!.avatarImage) + ') center/cover no-repeat' : avatarGradient()">
              @if (!pendingAvatarPreview() && !user()!.avatarImage) {
                <span class="avatar-initial">{{ user()!.username[0].toUpperCase() }}</span>
              }
              <div class="avatar-level" title="Nivel de usuario">LV.{{ displayLevel() }}</div>
            </div>
            @if (pendingAvatarPreview() && !editing()) {
              <div class="preview-actions">
                <button type="button" class="btn btn-primary" style="padding:6px 14px;font-size:0.82rem;" (click)="confirmPreview()">✔ Guardar foto</button>
                <button type="button" class="btn btn-secondary" style="padding:6px 14px;font-size:0.82rem;" (click)="pendingAvatarPreview.set('')">✕ Cancelar</button>
              </div>
            }
            <div class="avatar-overlay" (click)="fileInput.click()">
              <div class="overlay-content">
                <span class="pencil-icon">✏️</span>
                <span class="overlay-text">Cambiar foto</span>
              </div>
            </div>
            <input #fileInput type="file" style="display: none;" accept="image/*" (change)="onFileSelected($event)">
          </div>

          <div class="banner-info">
            <div class="banner-top-row">
              <h1 class="profile-username">{{ user()!.username }}</h1>
              <span class="title-badge">{{ combatRank() }}</span>
              @if (playerStats()) {
                <span class="lp-badge">{{ playerStats()!.lp }} LP</span>
              }
            </div>
            <div class="profile-meta-row">
              @if (user()!.clan) {
                <span class="meta-chip faction-chip">
                  <span class="chip-icon">⚔</span>
                  @if (user()!.clanTag) { <span>[{{ user()!.clanTag }}] </span> }{{ user()!.clan }}
                </span>
              }
              <span class="meta-chip region-chip">
                <span class="chip-icon">🗺</span> {{ user()!.defaultFaction || user()!.faction || 'Sin Región' }}
              </span>
              <span class="meta-chip">
                <span class="chip-icon">📧</span> {{ user()!.email }}
              </span>
              <span class="meta-chip">
                <span class="chip-icon">📅</span> Desde {{ joinDate() }}
              </span>
            </div>
            <p class="profile-bio">{{ user()!.bio || '¡Nos vemos en la Grieta!' }}</p>
          </div>

          <button class="btn btn-secondary btn-edit" (click)="toggleEdit()">
            @if (!editing()) { <span>✏️ Editar Perfil</span> }
            @else { <span>✕ Cancelar</span> }
          </button>
        </div>

        @if (saveMsg() && !editing()) {
          <div class="banner-feedback">
            <span class="save-icon">✅</span> {{ saveMsg() }}
          </div>
        }
      </div>

      <!-- ═══════════ EDIT PANEL ═══════════ -->
      @if (editing()) {
        <div class="edit-panel glass-panel animate-slide-down">
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
                <label for="edit-faction">Región Predeterminada</label>
                <select id="edit-faction" class="form-control" [(ngModel)]="draft.defaultFaction" name="defaultFaction">
                  @for (f of availableFactions; track f) {
                    <option [value]="f">{{ f }}</option>
                  }
                </select>
                <p class="form-hint">Aparecerás con esta región al unirte a salas.</p>
              </div>

              <div class="form-group">
                <label>Liga / División</label>
                <div class="rank-display">
                  <span class="rank-icon">🎖️</span>
                  <span class="rank-name">{{ combatRank() }}</span>
                  @if (playerStats()) {
                    <span class="rank-lp">{{ playerStats()!.lp }} LP</span>
                  }
                </div>
              </div>

              @if (!user()!.clanTag) {
                <div class="form-group">
                  <label for="edit-clan">Clan a unirse o crear (Nombre)</label>
                  <input id="edit-clan" type="text" class="form-control"
                    placeholder="Nombre del clan" [(ngModel)]="draft.clan" name="clan" maxlength="30">
                  <p class="form-hint">Escribe el nombre exacto de un clan para unirte, o un nombre nuevo para crearlo.</p>
                </div>
              }

              @if (user()!.clanTag) {
                <div class="form-group">
                  <label>Tu Clan</label>
                  <div style="background: rgba(0,0,0,0.35); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span><b>[{{user()!.clanTag}}]</b> {{user()!.clan}}</span>
                    <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" (click)="leaveClan()">Salir del clan</button>
                  </div>
                </div>
              }

              <div class="form-group">
                <label>Avatar Personalizado</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <button type="button" class="btn btn-secondary" style="padding: 10px 16px; font-size: 0.85rem;" (click)="fileInput.click()">
                    📁 Seleccionar Archivo
                  </button>
                  @if (draft.avatarImage) {
                    <button type="button" class="btn btn-secondary" style="padding: 10px 16px; font-size: 0.85rem; border-color: var(--accent-danger); color: var(--accent-danger);" (click)="draft.avatarImage = undefined">
                      ✕ Eliminar Foto
                    </button>
                  }
                </div>
              </div>

              <div class="form-group">
                <label>Color de Avatar</label>
                <div class="color-picker">
                  @for (c of availableColors; track c) {
                    <button type="button"
                      class="color-swatch"
                      [style.background]="c"
                      [class.selected]="draft.avatarColor === c"
                      (click)="draft.avatarColor = c">
                      @if (draft.avatarColor === c) { <span>✓</span> }
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="edit-actions">
              <button type="button" class="btn btn-secondary" (click)="toggleEdit()">Cancelar</button>
              <button type="submit" class="btn btn-primary">💾 Guardar Cambios</button>
            </div>

            @if (saveMsg()) {
              <div class="save-feedback">
                <span class="save-icon">✅</span> {{ saveMsg() }}
              </div>
            }
          </form>
        </div>
      }

      <!-- ═══════════ REGIONAL LEVELS ═══════════ -->
      <div class="regional-section glass-panel">
        <h2 class="section-title"><span class="title-accent">|</span> Dominio de Regiones</h2>
        <div class="regional-grid">
          @for (reg of regionsList(); track reg.name) {
            <div class="regional-card" [class.max-level]="reg.level >= 10">
              <div class="reg-header">
                <div class="reg-name">{{ reg.name }}</div>
                <div class="reg-level" [class.max]="reg.level >= 10">Nv. {{ reg.level }}</div>
              </div>
              @if (reg.level < 10) {
                <div class="reg-progress-bar">
                  <div class="reg-progress-fill" [style.width.%]="reg.xpPct"></div>
                </div>
              } @else {
                <div class="max-badge">★ {{ reg.totalWins }} victorias totales</div>
              }
              <div class="reg-description">{{ reg.description }}</div>
            </div>
          }
        </div>
      </div>

      <!-- ═══════════ STATS GRID ═══════════ -->
      <div class="stats-section">
        <h2 class="section-title"><span class="title-accent">|</span> Estadísticas de Temporada</h2>
        <div class="stats-grid">
          <div class="stat-card glass-panel">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">{{ apiWins() }}</div>
            <div class="stat-label">Victorias</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">💀</div>
            <div class="stat-value">{{ apiLosses() }}</div>
            <div class="stat-label">Derrotas</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">🎮</div>
            <div class="stat-value">{{ apiGamesPlayed() }}</div>
            <div class="stat-label">Partidas</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ playerStats()?.lp ?? 100 }}</div>
            <div class="stat-label">LP Totales</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ apiWinRate() }}%</div>
            <div class="stat-label">Winrate</div>
          </div>
          <div class="stat-card glass-panel">
            <div class="stat-icon">💥</div>
            <div class="stat-value">{{ playerStats()?.regionsEliminated ?? 0 }}</div>
            <div class="stat-label">Regiones Elim.</div>
          </div>
        </div>
      </div>

      <!-- ═══════════ WIN/LOSS RATIO BAR ═══════════ -->
      <div class="ratio-section glass-panel">
        <h3>Ratio Victoria / Derrota</h3>
        <div class="ratio-bar-container">
          <div class="ratio-bar">
            <div class="ratio-fill ratio-win" [style.width.%]="winRate()">
              @if (winRate() > 15) { <span>{{ winRate() }}% W</span> }
            </div>
            <div class="ratio-fill ratio-loss" [style.width.%]="lossRate()">
              @if (lossRate() > 15) { <span>{{ lossRate() }}% L</span> }
            </div>
          </div>
          <div class="ratio-legend">
            <span class="legend-item"><span class="legend-dot win-dot"></span>Victorias</span>
            <span class="legend-item"><span class="legend-dot loss-dot"></span>Derrotas</span>
          </div>
        </div>
      </div>

      <!-- ═══════════ ACTIVITY ═══════════ -->
      <div class="activity-section">
        <h2 class="section-title"><span class="title-accent">|</span> Actividad Reciente</h2>
        <div class="activity-grid">
          @if (myLobby()) {
            <div class="activity-card glass-panel">
              <div class="activity-icon" style="color: var(--accent-success);">🎮</div>
              <div class="activity-info">
                <span class="activity-title">Sala Activa</span>
                <span class="activity-desc">{{ myLobby()!.name }} — {{ myLobby()!.players }}/{{ myLobby()!.maxPlayers }} jugadores</span>
              </div>
              <a [routerLink]="['/lobby', myLobby()!.id]" class="btn btn-primary btn-sm-activity">IR →</a>
            </div>
          } @else {
            <div class="activity-card glass-panel">
              <div class="activity-icon" style="color: var(--text-muted);">🔭</div>
              <div class="activity-info">
                <span class="activity-title">Sin Sala Activa</span>
                <span class="activity-desc">Crea o únete a una partida para comenzar.</span>
              </div>
              <a routerLink="/" class="btn btn-secondary btn-sm-activity">BUSCAR</a>
            </div>
          }

          <div class="activity-card glass-panel">
            <div class="activity-icon">📊</div>
            <div class="activity-info">
              <span class="activity-title">Partidas Jugadas</span>
              <span class="activity-desc">{{ apiGamesPlayed() }} batallas completadas</span>
            </div>
          </div>

          <div class="activity-card glass-panel">
            <div class="activity-icon">🌍</div>
            <div class="activity-info">
              <span class="activity-title">Regiones Eliminadas</span>
              <span class="activity-desc">{{ playerStats()?.regionsEliminated ?? 0 }} regiones conquistadas</span>
            </div>
          </div>
        </div>
      </div>

    </div>
    } <!-- end @if (user()) -->

    <!-- NOT LOGGED IN -->
    @if (!user()) {
      <div class="profile-not-logged animate-fade-in">
        <div class="glass-panel" style="text-align:center; padding: 60px 40px; max-width: 480px; margin: 60px auto;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
          <h2>Acceso Requerido</h2>
          <p class="text-muted" style="margin: 12px 0 24px;">Inicia sesión para ver tu perfil de invocador.</p>
          <a routerLink="/login" class="btn btn-primary" style="padding: 14px 32px;">🛡 INICIAR SESIÓN</a>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Page Layout ── */
    .profile-page { display: flex; flex-direction: column; gap: 28px; padding-bottom: 40px; }

    /* ── Banner ── */
    .profile-banner { position: relative; overflow: hidden; border-radius: 24px; padding: 0; }
    .banner-bg {
      position: absolute; inset: 0; z-index: 0;
      background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.1) 50%, rgba(16,185,129,0.08) 100%);
    }
    .banner-bg::after {
      content: ''; position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E");
      background-size: 60px 60px;
    }
    .banner-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 28px; padding: 36px 40px; }

    /* ── Avatar ── */
    .avatar-container { position: relative; width: 110px; flex-shrink: 0; cursor: pointer; }
    .preview-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
    .avatar-large {
      width: 110px; height: 110px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; position: relative;
      box-shadow: 0 0 30px rgba(139,92,246,0.3), inset 0 0 20px rgba(0,0,0,0.2);
      border: 3px solid rgba(255,255,255,0.15); transition: all 0.3s ease; z-index: 1;
    }
    .avatar-container:hover .avatar-large { filter: brightness(0.6) blur(2px); transform: scale(1.02); }
    .avatar-overlay {
      position: absolute; top: 0; left: 0; width: 110px; height: 110px;
      display: flex; align-items: center; justify-content: center;
      z-index: 2; opacity: 0; transition: all 0.3s ease; border-radius: 50%;
    }
    .avatar-container:hover .avatar-overlay { opacity: 1; }
    .overlay-content { display: flex; flex-direction: column; align-items: center; gap: 4px; color: white; }
    .pencil-icon { font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .overlay-text { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
    .avatar-initial { font-size: 2.8rem; font-weight: 800; color: white; font-family: var(--font-heading); text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
    .avatar-level {
      position: absolute; bottom: -2px; right: -2px;
      background: var(--accent-primary); color: white; padding: 3px 8px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;
      border: 2px solid #1a1a2e; box-shadow: 0 0 12px rgba(139,92,246,0.5); font-family: var(--font-heading); z-index: 5;
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
      background: rgba(139,92,246,0.15); color: var(--accent-primary); padding: 4px 12px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700; border: 1px solid rgba(139,92,246,0.3); letter-spacing: 0.03em; white-space: nowrap;
    }
    .lp-badge {
      background: rgba(200,155,60,0.15); color: var(--accent-gold); padding: 4px 12px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 800; border: 1px solid rgba(200,155,60,0.3); letter-spacing: 0.03em; white-space: nowrap;
    }

    .profile-meta-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 8px;
      font-size: 0.82rem; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.06);
    }
    .chip-icon { font-size: 0.9rem; }
    .faction-chip { color: var(--accent-gold); border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.08); }
    .region-chip  { color: var(--accent-secondary); border-color: rgba(6,182,212,0.2); background: rgba(6,182,212,0.08); }
    .profile-bio { color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; max-width: 600px; font-style: italic; }
    .btn-edit { align-self: flex-start; padding: 10px 20px; font-size: 0.88rem; white-space: nowrap; border-radius: 10px; }

    /* ── Edit Panel ── */
    .edit-panel { padding: 28px 32px; border-radius: 20px; }
    .edit-panel h3 { font-size: 1.3rem; margin-bottom: 20px; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-down { animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .edit-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-family: var(--font-heading); font-size: 0.82rem; color: var(--accent-secondary); letter-spacing: 0.05em; }
    .form-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
    .form-control {
      background: rgba(0,0,0,0.35); border: 1px solid var(--border-light); padding: 12px 16px; border-radius: 8px;
      color: white; font-family: var(--font-body); font-size: 0.95rem; outline: none;
      transition: all var(--transition-fast); width: 100%; resize: vertical;
    }
    .form-control:focus { border-color: var(--accent-primary); box-shadow: 0 0 10px rgba(139,92,246,0.3); }
    select.form-control {
      cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 14px center;
    }
    select.form-control option { background: #1e293b; color: white; }
    .char-count { font-size: 0.75rem; color: var(--text-muted); text-align: right; }
    .rank-display {
      background: rgba(0,0,0,0.35); padding: 12px 16px; border-radius: 8px;
      display: flex; align-items: center; gap: 10px; border: 1px solid var(--border-light);
    }
    .rank-icon { font-size: 1.2rem; }
    .rank-name { font-weight: 700; color: var(--accent-primary); }
    .rank-lp { font-size: 0.85rem; color: var(--accent-gold); font-weight: 700; }
    .rank-hint { font-size: 0.75rem; color: var(--text-muted); }
    .color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      border: 3px solid transparent; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: white; box-shadow: 0 0 12px rgba(255,255,255,0.3); transform: scale(1.1); }
    .edit-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .save-feedback {
      display: flex; align-items: center; gap: 8px;
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
      color: var(--accent-success); padding: 10px 16px; border-radius: 8px;
      font-weight: 600; font-size: 0.9rem; animation: slideDown 0.3s ease forwards;
    }
    .banner-feedback {
      position: absolute; bottom: 20px; right: 40px; background: rgba(16,185,129,0.9);
      backdrop-filter: blur(8px); color: white; padding: 8px 16px; border-radius: 20px;
      font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10;
      animation: slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }

    /* ── Section titles ── */
    .section-title { font-size: 1.6rem; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .title-accent { width: 4px; height: 28px; background: var(--accent-primary); border-radius: 2px; display: inline-block; flex-shrink: 0; }

    /* ── Regional Mastery ── */
    .regional-section { padding: 24px; border-radius: 20px; }
    .regional-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-top: 10px; }
    .regional-card {
      background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); padding: 14px 16px; border-radius: 12px;
      display: flex; flex-direction: column; gap: 8px; transition: transform 0.2s, border-color 0.2s;
    }
    .regional-card:hover { transform: translateY(-4px); border-color: rgba(200,155,60,0.3); }
    .regional-card.max-level { border-color: rgba(200,155,60,0.5); background: rgba(200,155,60,0.07); }
    .reg-header { display: flex; justify-content: space-between; align-items: center; }
    .reg-name { font-weight: 800; color: var(--accent-gold); font-size: 0.88rem; }
    .reg-level { font-size: 0.75rem; color: white; font-weight: 700; background: rgba(139,92,246,0.2); padding: 2px 8px; border-radius: 10px; }
    .reg-level.max { background: rgba(200,155,60,0.25); color: var(--accent-gold); }
    .reg-progress-bar { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .reg-progress-fill { height: 100%; background: var(--accent-secondary); border-radius: 3px; transition: width 0.6s ease; }
    .max-badge {
      font-size: 0.75rem; font-weight: 800; color: var(--accent-gold);
      background: rgba(200,155,60,0.15); padding: 4px 10px; border-radius: 8px; text-align: center;
    }
    .reg-description { font-size: 0.71rem; color: var(--text-muted); font-style: italic; line-height: 1.3; }

    /* ── Stats ── */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
    .stat-card { text-align: center; padding: 24px 16px; border-radius: 16px; transition: all 0.3s ease; cursor: default; }
    .stat-card:hover { transform: translateY(-6px); border-color: rgba(139,92,246,0.3); }
    .stat-icon { font-size: 2rem; margin-bottom: 8px; }
    .stat-value {
      font-size: 2.2rem; font-weight: 800; font-family: var(--font-heading);
      background: linear-gradient(135deg, #fff, var(--accent-secondary)); -webkit-background-clip: text; color: transparent;
    }
    .stat-label { font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

    /* ── Ratio Bar ── */
    .ratio-section { padding: 24px 28px; border-radius: 20px; }
    .ratio-section h3 { font-size: 1.1rem; margin-bottom: 16px; }
    .ratio-bar-container { display: flex; flex-direction: column; gap: 12px; }
    .ratio-bar { display: flex; height: 32px; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.3); }
    .ratio-fill {
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white; white-space: nowrap;
      transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); min-width: 0;
    }
    .ratio-win { background: linear-gradient(90deg, #10b981, #34d399); }
    .ratio-loss { background: linear-gradient(90deg, #ef4444, #f87171); }
    .ratio-legend { display: flex; gap: 20px; justify-content: center; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
    .win-dot { background: #10b981; }
    .loss-dot { background: #ef4444; }

    /* ── Activity ── */
    .activity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .activity-card {
      display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 16px; transition: all 0.3s ease;
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
  private clanService = inject(ClanService);
  private http = inject(HttpClient);
  private router = inject(Router);

  editing              = signal(false);
  saveMsg              = signal('');
  playerStats          = signal<PlayerStatsDto | null>(null);
  pendingAvatarPreview = signal<string>('');

  displayLevel = computed(() => {
    const s = this.playerStats();
    if (!s) return this.user()?.level ?? 1;
    const xp = s.gamesPlayed * 10 + s.wins * 20;
    return Math.floor(Math.sqrt(xp / 15)) + 1;
  });

  user = computed(() => this.auth.currentUser());

  combatRank = computed(() => {
    const stats = this.playerStats();
    if (stats) return getLpRank(stats.lp);
    const wins = this.user()?.stats?.wins ?? 0;
    if (wins >= 101) return 'Challenger';
    if (wins >= 51)  return 'Gran Maestro';
    if (wins >= 31)  return 'Diamante';
    if (wins >= 16)  return 'Platino';
    if (wins >= 6)   return 'Oro';
    return 'Hierro';
  });

  apiWins        = computed(() => this.playerStats()?.wins        ?? this.user()?.stats?.wins        ?? 0);
  apiLosses      = computed(() => this.playerStats()?.losses      ?? this.user()?.stats?.losses      ?? 0);
  apiGamesPlayed = computed(() => this.playerStats()?.gamesPlayed ?? (this.user()?.stats?.wins ?? 0) + (this.user()?.stats?.losses ?? 0));
  apiWinRate     = computed(() => {
    const s = this.playerStats();
    if (s) return Math.round(s.winRate * 10) / 10;
    const total = this.apiGamesPlayed();
    return total ? Math.round(this.apiWins() / total * 1000) / 10 : 0;
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

  winRate = computed(() => {
    const total = this.apiGamesPlayed();
    return total ? Math.round(this.apiWins() / total * 100) : 0;
  });
  lossRate = computed(() => {
    const total = this.apiGamesPlayed();
    return total ? Math.round(this.apiLosses() / total * 100) : 0;
  });

  myLobby = computed(() => {
    const u = this.user();
    return u ? this.lobbyService.getUserLobby(u.username) ?? null : null;
  });

  readonly allFactions = [
    'Demacia', 'Noxus', 'Ionia', 'Freljord', 'Piltover', 'Zaun',
    'Shurima', 'Shadow Isles', 'Targon', 'Bilgewater', 'Ixtal', 'Void', 'Tierras Perdidas'
  ];

  availableFactions = [...this.allFactions];

  regionsList = computed(() => {
    const u = this.user();
    const stats = this.playerStats();
    if (!u) return [];
    return this.allFactions.map(f => {
      const mastery = stats?.regionMastery?.[f];
      const level   = mastery?.level ?? 1;
      const xp      = mastery?.xp    ?? 0;
      const wins    = mastery?.wins   ?? 0;
      return {
        name:       f,
        level,
        xp,
        xpPct:      xpPercentInLevel(xp, level),
        totalWins:  wins,
        description: MASTERY_LABELS[level] ?? 'Novato invocador',
      };
    });
  });

  draft = {
    bio: '', title: '', clan: '', clanTag: '',
    avatarColor: '', avatarImage: undefined as string | undefined,
    defaultFaction: 'Demacia',
  };

  availableColors = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#3b82f6', '#84cc16',
    '#14b8a6', '#a855f7', '#f97316', '#6366f1',
  ];

  async ngOnInit() {
    const u = this.auth.currentUser();
    if (!u) return;

    const migrated = this.auth.ensureProfileDefaults(u);
    this.draft = {
      bio:           migrated.bio           || '',
      title:         migrated.title         || 'Hierro',
      clan:          migrated.clan          || '',
      clanTag:       migrated.clanTag       || '',
      avatarColor:   migrated.avatarColor   || '#8b5cf6',
      avatarImage:   migrated.avatarImage,
      defaultFaction: migrated.defaultFaction || 'Demacia',
    };

    try {
      const [stats, userInfo] = await Promise.all([
        firstValueFrom(this.http.get<PlayerStatsDto>(`${STATS_API}/${encodeURIComponent(u.username)}`)).catch(() => null),
        firstValueFrom(this.http.get<any>(`${USERS_API}/by-username/${encodeURIComponent(u.username)}`)).catch(() => null),
      ]);

      if (stats) {
        this.playerStats.set(stats);
        const xp = stats.gamesPlayed * 10 + stats.wins * 20;
        const computedLevel = Math.floor(Math.sqrt(xp / 15)) + 1;
        const updates: Partial<any> = {};
        if (computedLevel !== u.level) updates['level'] = computedLevel;
        if (userInfo?.createdAt && userInfo.createdAt !== u.createdAt) updates['createdAt'] = userInfo.createdAt;
        if (Object.keys(updates).length) this.auth.updateProfile(updates);
      } else if (userInfo?.createdAt && userInfo.createdAt !== u.createdAt) {
        this.auth.updateProfile({ createdAt: userInfo.createdAt });
      }
    } catch { /* no stats yet */ }
  }

  toggleEdit() {
    this.editing.update(v => !v);
    this.saveMsg.set('');
    this.pendingAvatarPreview.set('');
    if (this.editing()) {
      const u = this.user()!;
      this.draft = {
        bio:           u.bio           || '',
        title:         u.title         || 'Hierro',
        clan:          u.clan          || '',
        clanTag:       u.clanTag       || '',
        avatarColor:   u.avatarColor   || '#8b5cf6',
        avatarImage:   u.avatarImage,
        defaultFaction: u.defaultFaction || u.faction || 'Demacia',
      };
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result as string;
        this.pendingAvatarPreview.set(base64);
        if (this.editing()) {
          this.draft.avatarImage = base64;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  confirmPreview() {
    const base64 = this.pendingAvatarPreview();
    if (!base64) return;
    this.auth.updateProfile({ avatarImage: base64 });
    this.syncToBackend({ avatarImage: base64 });
    this.pendingAvatarPreview.set('');
    this.saveMsg.set('Foto de perfil actualizada.');
    setTimeout(() => this.saveMsg.set(''), 2000);
  }

  private syncToBackend(updates: Record<string, any>) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.http.put(`${USERS_API}/${userId}`, updates).subscribe({ error: () => {} });
  }

  leaveClan() {
    if (this.user()!.clan) {
      this.clanService.leaveClan(this.user()!.clan, this.user()!.username);
      this.auth.updateProfile({ clan: '', clanTag: '' });
      this.editing.set(false);
      setTimeout(() => this.toggleEdit(), 10);
    }
  }

  saveProfile() {
    const clanChanged = this.draft.clan    !== (this.user()!.clan    || '');
    const tagChanged  = this.draft.clanTag !== (this.user()!.clanTag || '');

    if (clanChanged || tagChanged) {
      if (this.draft.clan && !this.user()!.clanTag) {
        const existing = this.clanService.getClanByTagOrName(this.draft.clan.trim());
        if (existing) {
          const res = this.clanService.joinClan(this.draft.clan.trim(), this.user()!.username);
          if (!res.ok) { this.saveMsg.set('Error: ' + res.error); return; }
          this.draft.clanTag = res.clan!.tag;
          this.draft.clan    = res.clan!.name;
        } else {
          const autoTag = this.draft.clan.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CLN';
          const res = this.clanService.createClan(this.draft.clan.trim(), autoTag, this.user()!.username);
          if (!res.ok) { this.saveMsg.set('Error: ' + res.error); return; }
          this.draft.clanTag = res.clan!.tag;
          this.draft.clan    = res.clan!.name;
        }
      } else if (!this.draft.clan && this.user()!.clanTag) {
        this.leaveClan();
        return;
      }
    }

    const result = this.auth.updateProfile({
      bio:           this.draft.bio.trim(),
      title:         this.draft.title,
      clan:          this.draft.clan.trim(),
      clanTag:       this.draft.clanTag?.trim() || '',
      avatarColor:   this.draft.avatarColor,
      avatarImage:   this.draft.avatarImage,
      defaultFaction: this.draft.defaultFaction,
      faction:       this.draft.defaultFaction,
    });

    if (result.ok) {
      this.syncToBackend({
        avatarImage: this.draft.avatarImage ?? '',
        avatarColor: this.draft.avatarColor,
        bio:         this.draft.bio.trim(),
      });
      this.saveMsg.set('Perfil actualizado correctamente.');
      setTimeout(() => { this.editing.set(false); this.saveMsg.set(''); }, 1500);
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
