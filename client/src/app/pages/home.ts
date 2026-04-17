import { Component, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LobbyService, CreateLobbyDto } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
  <main class="main-content">

    <!-- ═══════════════ HERO ═══════════════ -->
    <section class="hero-section glass-panel animate-fade-in" style="animation-delay: 0.2s; margin-bottom: 8px;">
      <div class="hero-content">
        <span class="badge">Fase de Preparación Activa</span>
        <h1>Estrategia a <span class="highlight-gradient">Ciegas</span></h1>
        <p class="subtitle">Decide el destino de tu facción. Ataca a tus rivales o asegura tus defensas sin saber cuál será el próximo movimiento de tus enemigos en este enfrentamiento todos contra todos.</p>

        <div class="action-panel glass-panel">
          <div class="action-panel-header">
            <h3>¿Listo para el combate?</h3>
            <p>Configura tu sala y lidera a tu facción a la victoria.</p>
          </div>
          <div class="action-buttons">
            <button class="btn btn-primary play-btn" (click)="openModal()">
              <span class="pulse-ring"></span>
              ⚔ CREAR PARTIDA
            </button>
            <div class="action-divider"></div>
            <button routerLink="/ranking" class="btn btn-secondary ranking-btn">
              CLASIFICACIÓN
            </button>
          </div>
        </div>
      </div>

      <div class="featured-champion">
        <div class="champion-card glass-panel">
          <div class="card-image-placeholder"></div>
          <div class="card-info">
            <h3>Atacar o Defender</h3>
            <span class="rolemage">Anticipa a tus enemigos</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ LOBBIES ═══════════════ -->
    <section class="lobbies-section animate-fade-in" style="animation-delay: 0.4s; margin: 24px 0;">
      <div class="lobbies-header">
        <div class="lobbies-title-group">
          <h2>Salas Disponibles</h2>
          <div class="live-indicator">
            <span class="live-dot"></span>
            <span>{{ lobbyService.activeCount() }} salas activas</span>
          </div>
        </div>
        <div class="lobbies-controls">
<<<<<<< HEAD
          <label class="search-label" for="search-lobby">Buscar sala</label>
          <input id="search-lobby" class="search-input" type="text" placeholder="Nombre o host..." [(ngModel)]="searchQuery">
=======
          <label class="search-label" for="search-sala">🔍 Buscar sala</label>
          <input class="search-input" id="search-sala" type="text" placeholder="Nombre o host..." [(ngModel)]="searchQuery">
>>>>>>> 5bd7a178dba3d5ccd4d22b532c28d5fea20ea22a
        </div>
      </div>

      <div class="lobbies-grid">
        <div
          class="lobby-card glass-panel hover-scale"
          *ngFor="let lobby of filteredLobbies()"
          [class.own-lobby]="lobby.isOwn">

          <div class="own-badge" *ngIf="lobby.isOwn">⭐ TU SALA</div>

          <div class="lobby-card-header">
            <div class="lobby-name-group">
              <span class="lobby-id">#{{ lobby.id }}</span>
              <span class="lobby-name">
                {{ lobby.name }}
                <span class="lock-icon" *ngIf="lobby.hasPassword" title="Sala privada">🔒</span>
              </span>
            </div>
            <span class="lobby-status-badge"
              [class.status-waiting]="lobby.status === 'Esperando'"
              [class.status-ingame]="lobby.status === 'En curso'">
              {{ lobby.status }}
            </span>
          </div>

          <p class="lobby-desc" *ngIf="lobby.description">{{ lobby.description }}</p>

          <div class="lobby-meta">
            <span class="meta-item"><span class="meta-icon">👤</span><span>{{ lobby.host }}</span></span>
            <span class="meta-item"><span class="meta-icon">🎮</span><span>{{ lobby.mode }}</span></span>
          </div>

          <div class="lobby-card-footer">
            <div class="player-bar-wrap">
              <div class="player-bar-track">
                <div class="player-bar-fill" [style.width.%]="(lobby.players / lobby.maxPlayers) * 100"></div>
              </div>
              <span class="player-count">{{ lobby.players }}/{{ lobby.maxPlayers }}</span>
            </div>

<<<<<<< HEAD
            <button
              class="btn btn-share-inline"
              title="Copiar enlace de la sala"
              (click)="shareLobbyLink(lobby.id)">
=======
            <!-- Compartir sala -->
            <button class="btn-share" (click)="shareLobby(lobby, $event)" title="Compartir sala">
>>>>>>> 5bd7a178dba3d5ccd4d22b532c28d5fea20ea22a
              📋
            </button>

            <!-- Entrar a tu propia sala -->
            <button *ngIf="lobby.isOwn" class="btn btn-enter-own" (click)="enterLobby(lobby.id)">
              ENTRAR →
            </button>

            <!-- Unirse a sala ajena -->
            <button
              *ngIf="!lobby.isOwn"
              class="btn btn-join"
              [class.btn-disabled]="lobby.status === 'En curso' || (lobby.players >= lobby.maxPlayers && !isUserMember(lobby))"
              [disabled]="lobby.status === 'En curso' || (lobby.players >= lobby.maxPlayers && !isUserMember(lobby))"
              (click)="isUserMember(lobby) ? enterLobby(lobby.id) : joinLobby(lobby)">
              <span *ngIf="lobby.status === 'En curso'">EN JUEGO</span>
              <span *ngIf="lobby.status !== 'En curso' && lobby.players >= lobby.maxPlayers && !isUserMember(lobby)">LLENA</span>
              <span *ngIf="lobby.status !== 'En curso' && isUserMember(lobby)">ENTRAR</span>
              <span *ngIf="lobby.status !== 'En curso' && !isUserMember(lobby) && lobby.players < lobby.maxPlayers">UNIRSE</span>
            </button>
          </div>
        </div>

        <!-- Empty filtered -->
        <div class="empty-lobbies" *ngIf="filteredLobbies().length === 0 && lobbyService.lobbies().length > 0">
          <span class="empty-icon">🔍</span>
          <p>No se encontraron salas con ese nombre.</p>
        </div>
        <!-- Empty total -->
        <div class="empty-lobbies" *ngIf="lobbyService.lobbies().length === 0">
          <span class="empty-icon">🔭</span>
          <p>No hay salas activas. ¡Crea la primera!</p>
          <button class="btn btn-primary" (click)="openModal()">⚔ CREAR PARTIDA</button>
        </div>
      </div>
    </section>

    <!-- ═══════════════ NO SESSION ALERT ═══════════════ -->
    <div class="no-session-toast" *ngIf="showNoSessionAlert()">
      <span class="toast-icon">🔒</span>
      <span>Debes <a routerLink="/login" class="toast-link">iniciar sesión</a> para unirte o crear una sala.</span>
      <button class="toast-close" (click)="showNoSessionAlert.set(false)">✕</button>
    </div>

    <!-- Copied toast -->
    <div class="copied-toast" *ngIf="showCopiedToast()">
      <span>✅ Enlace de sala copiado al portapapeles</span>
    </div>

    <!-- ═══════════════ NEWS ═══════════════ -->
    <section class="news-section animate-fade-in" style="animation-delay: 0.5s; margin: 24px 0;">
      <h2>Inteligencia de Combate</h2>
      <div class="news-grid">
        <div class="news-card glass-panel hover-scale">
          <div class="news-image bg-patch"></div>
          <div class="news-content">
            <div class="news-tag patch">Reporte</div>
            <h4>Facciones al Límite</h4>
            <p>Las últimas defensas están cediendo, las estrategias agresivas dominan el meta.</p>
          </div>
        </div>
        <div class="news-card glass-panel hover-scale">
          <div class="news-image bg-event"></div>
          <div class="news-content">
            <div class="news-tag event">Recursos</div>
            <h4>Mejora de Defensas</h4>
            <p>Los escudos de facción tendrán una penalización reducida por predicciones erróneas.</p>
          </div>
        </div>
        <div class="news-card glass-panel hover-scale">
          <div class="news-image bg-esports"></div>
          <div class="news-content">
            <div class="news-tag esports">Top Jugadores</div>
            <h4>Los Maestros del Engaño</h4>
            <p>Repasamos el Top 10 de jugadores globales que han anticipado ataques enemigos de forma constante.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- ═══════════════ MODAL: SESIÓN REQUERIDA ═══════════════ -->
  <div class="modal-overlay" *ngIf="showLoginRequired()" (click)="closeOnBackdrop($event, 'login')">
    <div class="modal-panel glass-panel animate-modal" style="max-width:440px">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-icon">🔒</span>
          <div>
            <h2 class="modal-title">Sesión requerida</h2>
            <p class="modal-subtitle">Necesitas iniciar sesión para acceder a esta función</p>
          </div>
        </div>
        <button class="modal-close" (click)="showLoginRequired.set(false); unlockBody()">✕</button>
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px; line-height: 1.5;">
        Para crear partidas, unirte a salas o enviar mensajes debes tener una cuenta activa.
      </p>
      <div class="modal-actions" style="justify-content: stretch; flex-direction: column; gap: 10px;">
        <a routerLink="/login" class="btn btn-primary modal-submit-btn" style="width:100%;justify-content:center; text-decoration:none;" (click)="showLoginRequired.set(false); unlockBody()">
          INICIAR SESIÓN
        </a>
        <a routerLink="/register" class="btn btn-secondary" style="width:100%;justify-content:center; text-decoration:none;" (click)="showLoginRequired.set(false); unlockBody()">
          CREAR CUENTA
        </a>
      </div>
    </div>
  </div>

  <!-- ═══════════════ MODAL: YA TIENES SALA ═══════════════ -->
  <div class="modal-overlay" *ngIf="showExistingLobbyModal()" (click)="closeOnBackdrop($event, 'existing')">
    <div class="modal-panel glass-panel animate-modal" id="existing-lobby-modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-icon">⚠️</span>
          <div>
            <h2 class="modal-title">Ya tienes una sala activa</h2>
            <p class="modal-subtitle">Solo puedes tener una sala a la vez</p>
          </div>
        </div>
        <button class="modal-close" (click)="showExistingLobbyModal.set(false); unlockBody()">✕</button>
      </div>

      <div class="existing-lobby-info" *ngIf="existingLobby()">
        <div class="eli-label">Tu sala actual:</div>
        <div class="eli-card">
          <div class="eli-name">{{ existingLobby()!.name }}</div>
          <div class="eli-meta">
            <span>🎮 {{ existingLobby()!.mode }}</span>
            <span>👥 {{ existingLobby()!.players }}/{{ existingLobby()!.maxPlayers }}</span>
            <span class="eli-status">{{ existingLobby()!.status }}</span>
          </div>
        </div>
      </div>

      <div class="modal-actions" style="justify-content: stretch; flex-direction: column; gap: 10px;">
        <button class="btn btn-primary modal-submit-btn" style="width:100%;justify-content:center" (click)="goToExisting()">
          → ENTRAR A MI SALA
        </button>
        <button class="btn btn-danger-outline" style="width:100%;justify-content:center" (click)="deleteAndCreate()">
          🗑 ELIMINAR Y CREAR OTRA
        </button>
        <button class="btn btn-secondary" style="width:100%;justify-content:center" (click)="showExistingLobbyModal.set(false); unlockBody()">
          Cancelar
        </button>
      </div>
    </div>
  </div>

  <!-- ═══════════════ MODAL: PASSWORD ═══════════════ -->
  <div class="modal-overlay" *ngIf="showPasswordModal()" (click)="closeOnBackdrop($event, 'pass')">
    <div class="modal-panel glass-panel animate-modal" id="password-modal">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-icon">🔒</span>
          <div>
            <h2 class="modal-title">Sala Privada</h2>
            <p class="modal-subtitle">Introduce la contraseña para entrar</p>
          </div>
        </div>
        <button class="modal-close" (click)="showPasswordModal.set(false)">✕</button>
      </div>
      <div class="modal-form">
        <div class="mform-group">
          <label for="enter-pass">Contraseña</label>
          <input id="enter-pass" type="password" class="mform-control" [(ngModel)]="passwordInput" placeholder="••••••••">
        </div>
        <div class="alert-error-inline" *ngIf="passwordError()">{{ passwordError() }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="showPasswordModal.set(false)">Cancelar</button>
          <button class="btn btn-primary modal-submit-btn" (click)="confirmJoinWithPassword()">ENTRAR</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════ MODAL: CREAR PARTIDA ═══════════════ -->
  <div class="modal-overlay" *ngIf="showModal()" (click)="closeOnBackdrop($event, 'create')">
    <div class="modal-panel glass-panel animate-modal" id="create-lobby-modal">

      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-icon">⚔</span>
          <div>
            <h2 class="modal-title">Crear Partida</h2>
            <p class="modal-subtitle">Configura los parámetros de tu sala de combate</p>
          </div>
        </div>
        <button class="modal-close" (click)="closeModal()">✕</button>
      </div>

      <form class="modal-form" (ngSubmit)="confirmCreate()" #createForm="ngForm" novalidate>

        <div class="mform-group">
          <label for="room-name">Nombre de la Sala <span class="req">*</span></label>
          <input id="room-name" type="text" class="mform-control"
            [class.minvalid]="nameInput.invalid && nameInput.touched"
            placeholder="Ej: Asalto Final, Guerra de Clanes..."
            name="roomName" [(ngModel)]="draft.name" #nameInput="ngModel"
            required minlength="3" maxlength="40">
          <span class="mfield-error" *ngIf="nameInput.invalid && nameInput.touched">
            El nombre debe tener entre 3 y 40 caracteres.
          </span>
        </div>

        <div class="mform-group">
          <label for="room-desc">Descripción <span class="moptional">(Opcional)</span></label>
          <input id="room-desc" type="text" class="mform-control"
            placeholder="Describe tu partida..." name="roomDesc"
            [(ngModel)]="draft.description" maxlength="80">
        </div>

        <div class="mform-row">
          <div class="mform-group">
            <label for="max-players">Máx. Jugadores</label>
            <select id="max-players" class="mform-control" name="maxPlayers" [(ngModel)]="draft.maxPlayers">
              <option [value]="n" *ngFor="let n of [2,4,6,8,10]">{{ n }} jugadores</option>
            </select>
          </div>
          <div class="mform-group">
            <label for="mode">Modo de Juego</label>
            <select id="mode" class="mform-control" name="mode" [(ngModel)]="draft.mode">
              <option value="Todos contra Todos">Todos contra Todos</option>
              <option value="Por Equipos">Por Equipos</option>
              <option value="Eliminación">Eliminación</option>
            </select>
          </div>
        </div>

        <div class="mform-group">
          <label class="mcheckbox-label">
            <input type="checkbox" name="hasPassword" [(ngModel)]="draft.hasPassword">
            <span class="mcheckbox-custom"></span>
            Sala privada (con contraseña)
          </label>
        </div>

        <div class="mform-group" *ngIf="draft.hasPassword">
          <label for="room-pass">Contraseña de Sala <span class="req">*</span></label>
          <input id="room-pass" type="password" class="mform-control"
            placeholder="Mínimo 4 caracteres" name="roomPassword"
            [(ngModel)]="draft.password" [required]="draft.hasPassword" minlength="4">
        </div>

        <!-- Preview -->
        <div class="lobby-preview">
          <span class="preview-label">Vista previa</span>
          <div class="preview-card">
            <div class="preview-name">{{ draft.name || 'Nombre de la sala' }}</div>
            <div class="preview-meta">
              <span>🎮 {{ draft.mode }}</span>
              <span>👥 1/{{ draft.maxPlayers }}</span>
              <span *ngIf="draft.hasPassword">🔒 Privada</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary modal-submit-btn"
            [disabled]="createForm.invalid || (draft.hasPassword && !draft.password)">
            ⚔ CREAR SALA
          </button>
        </div>
      </form>
    </div>
  </div>
  `,
  styles: [`
    .play-btn { font-size: 1.1rem; padding: 16px 32px; flex: 1; animation: pulseGlow 2s infinite; }
    .ranking-btn { flex: 1; padding: 16px 24px; }

    /* Lobbies */
    .lobbies-section { display: flex; flex-direction: column; gap: 20px; }
    .lobbies-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .lobbies-title-group { display: flex; align-items: center; gap: 20px; padding-left: 16px; border-left: 4px solid var(--accent-secondary); }
    .lobbies-title-group h2 { font-size: 2rem; color: var(--text-main); }
    .live-indicator { display: flex; align-items: center; gap: 8px; color: var(--accent-success); font-size: 0.9rem; font-weight: 600; }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent-success); animation: pulseLive 1.5s ease-in-out infinite; }
    @keyframes pulseLive { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
<<<<<<< HEAD
    .lobbies-controls { display: flex; flex-direction: column; gap: 6px; }
    .search-label { font-family: var(--font-heading); font-size: 0.78rem; color: var(--accent-secondary); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; }
=======
    .lobbies-controls { display: flex; flex-direction: column; gap: 4px; }
    .search-label { font-size: 0.78rem; font-weight: 700; color: var(--accent-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
>>>>>>> 5bd7a178dba3d5ccd4d22b532c28d5fea20ea22a
    .search-input { background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); color: white; padding: 10px 16px; border-radius: 8px; outline: none; font-family: var(--font-body); font-size: 0.9rem; width: 220px; transition: all var(--transition-fast); }
    .search-input:focus { border-color: var(--accent-secondary); box-shadow: 0 0 10px rgba(6,182,212,0.2); }
    .lobbies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

    /* Lobby cards */
    .lobby-card { display: flex; flex-direction: column; gap: 12px; cursor: default; transition: all var(--transition-normal); position: relative; }
    .own-lobby { border-color: rgba(251,191,36,0.4); box-shadow: 0 0 20px rgba(251,191,36,0.1); }
    .own-badge { position: absolute; top: -10px; right: 12px; background: linear-gradient(135deg, #d97706, #fbbf24); color: #000; font-size: 0.7rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.05em; }
    .lobby-card-header { display: flex; align-items: center; justify-content: space-between; }
    .lobby-name-group { display: flex; flex-direction: column; gap: 2px; }
    .lobby-id { font-size: 0.75rem; color: var(--text-muted); }
    .lobby-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 6px; }
    .lobby-desc { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; font-style: italic; margin: -4px 0; }
    .lobby-status-badge { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.05em; white-space: nowrap; }
    .status-waiting { background: rgba(16,185,129,0.15); color: var(--accent-success); border: 1px solid rgba(16,185,129,0.3); }
    .status-ingame  { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .lobby-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.85rem; color: var(--text-muted); }
    .lobby-card-footer { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .player-bar-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
    .player-bar-track { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); overflow: hidden; }
    .player-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); transition: width 0.5s ease; }
    .player-count { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
    .btn-join { background: linear-gradient(135deg, var(--accent-secondary), #0891b2); color: white; padding: 8px 18px; font-size: 0.85rem; font-family: var(--font-heading); font-weight: 700; border-radius: 8px; border: none; cursor: pointer; transition: all var(--transition-normal); white-space: nowrap; }
    .btn-join:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(6,182,212,0.5); }
    .btn-disabled { background: rgba(255,255,255,0.08) !important; color: var(--text-muted) !important; cursor: not-allowed; box-shadow: none !important; }
    .btn-enter-own { background: linear-gradient(135deg, #d97706, #fbbf24); color: #000; padding: 8px 18px; font-size: 0.85rem; font-family: var(--font-heading); font-weight: 800; border-radius: 8px; border: none; cursor: pointer; transition: all var(--transition-normal); white-space: nowrap; }
    .btn-enter-own:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(251,191,36,0.5); }
    .btn-share-inline { width: 38px; height: 36px; border-radius: 8px; border: 1px solid rgba(16,185,129,0.35); background: rgba(16,185,129,0.12); color: #34d399; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: all var(--transition-fast); }
    .btn-share-inline:hover { background: rgba(16,185,129,0.25); border-color: rgba(16,185,129,0.55); transform: translateY(-1px); }
    .empty-lobbies { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 24px; color: var(--text-muted); background: var(--bg-panel); border: 1px dashed var(--border-light); border-radius: 16px; text-align: center; }
    .empty-icon { font-size: 2.5rem; }

    /* Modals */
<<<<<<< HEAD
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; }
    @keyframes slideInModal { from{opacity:0;transform:translateY(-30px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    .animate-modal { animation: slideInModal 0.28s cubic-bezier(0.34,1.44,0.64,1) forwards; }
    .modal-panel { width: 100%; max-width: 540px; background: rgba(10,14,26,0.95); border-color: rgba(139,92,246,0.3); max-height: 90vh; overflow-y: auto; margin: auto; }
=======
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; min-height: 100vh; }
    @keyframes slideInModal { from{opacity:0;transform:translateY(-30px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    .animate-modal { animation: slideInModal 0.28s cubic-bezier(0.34,1.44,0.64,1) forwards; }
    .modal-panel { width: 100%; max-width: 540px; background: rgba(10,14,26,0.95); border-color: rgba(139,92,246,0.3); max-height: 90vh; overflow-y: auto; margin: auto; }

    /* Share button */
    .btn-share { background: rgba(255,255,255,0.06); border: 1px solid var(--border-light); color: var(--text-muted); width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; transition: all var(--transition-fast); flex-shrink: 0; }
    .btn-share:hover { background: rgba(6,182,212,0.15); border-color: var(--accent-secondary); color: var(--accent-secondary); transform: translateY(-1px); }

    /* No session toast */
    .no-session-toast { display: flex; align-items: center; gap: 10px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); padding: 14px 20px; border-radius: 12px; font-size: 0.92rem; color: var(--text-main); animation: fadeIn 0.3s ease forwards; }
    .toast-icon { font-size: 1.2rem; flex-shrink: 0; }
    .toast-link { color: var(--accent-secondary); font-weight: 700; text-decoration: underline; }
    .toast-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 0 4px; margin-left: auto; }
    .toast-close:hover { color: white; }

    /* Copied toast */
    .copied-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: var(--accent-success); padding: 12px 24px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; z-index: 9999; animation: fadeIn 0.3s ease forwards; }
>>>>>>> 5bd7a178dba3d5ccd4d22b532c28d5fea20ea22a
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .modal-title-group { display: flex; align-items: center; gap: 14px; }
    .modal-icon { font-size: 2rem; line-height: 1; }
    .modal-title { font-size: 1.5rem; margin-bottom: 2px; }
    .modal-subtitle { color: var(--text-muted); font-size: 0.85rem; }
    .modal-close { background: rgba(255,255,255,0.06); border: 1px solid var(--border-light); color: var(--text-muted); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); flex-shrink: 0; }
    .modal-close:hover { background: rgba(239,68,68,0.2); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .modal-form { display: flex; flex-direction: column; gap: 18px; }
    .mform-group { display: flex; flex-direction: column; gap: 6px; }
    .mform-group label { font-family: var(--font-heading); font-size: 0.82rem; color: var(--accent-secondary); letter-spacing: 0.05em; }
    .req { color: var(--accent-danger); }
    .moptional { color: var(--text-muted); font-size: 0.78em; font-weight: 400; }
    .mform-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .mform-control { background: rgba(0,0,0,0.4); border: 1px solid var(--border-light); padding: 11px 14px; border-radius: 8px; color: white; font-family: var(--font-body); font-size: 0.93rem; outline: none; transition: all var(--transition-fast); width: 100%; }
    .mform-control:focus { border-color: var(--accent-primary); box-shadow: 0 0 10px rgba(139,92,246,0.3); }
    .minvalid { border-color: var(--accent-danger) !important; }
    .mfield-error { font-size: 0.78rem; color: var(--accent-danger); }
    .mcheckbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; color: var(--text-muted); user-select: none; font-family: var(--font-body); }
    .mcheckbox-label input[type=checkbox] { display: none; }
    .mcheckbox-custom { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; border: 2px solid var(--border-light); background: rgba(0,0,0,0.3); transition: all var(--transition-fast); position:relative; }
    .mcheckbox-label input:checked ~ .mcheckbox-custom { background: var(--accent-primary); border-color: var(--accent-primary); }
    .mcheckbox-label input:checked ~ .mcheckbox-custom::after { content:'✓'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:white; font-size:0.75rem; font-weight:900; }
    .lobby-preview { display: flex; flex-direction: column; gap: 8px; }
    .preview-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
    .preview-card { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
    .preview-name { font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: var(--text-main); }
    .preview-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-muted); }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .modal-submit-btn { padding: 12px 28px; font-size: 0.95rem; }
    .modal-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .alert-error-inline { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: var(--accent-danger); padding: 10px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 600; }

    /* Existing lobby modal */
    .existing-lobby-info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .eli-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: var(--text-muted); }
    .eli-card { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
    .eli-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; color: var(--text-main); }
    .eli-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-muted); }
    .eli-status { background: rgba(16,185,129,0.15); color: var(--accent-success); padding: 1px 8px; border-radius: 20px; border: 1px solid rgba(16,185,129,0.3); font-size: 0.75rem; font-weight: 700; }
    .btn-danger-outline { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.35); color: #ef4444; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em; transition: all var(--transition-normal); }
    .btn-danger-outline:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.6); }

    @media (max-width: 768px) {
      .lobbies-grid { grid-template-columns: 1fr; }
      .mform-row { grid-template-columns: 1fr; }
      .search-input { width: 100%; }
      .lobbies-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class Home {
  readonly lobbyService = inject(LobbyService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  searchQuery = '';
  showLoginRequired = signal(false);
  showModal = signal(false);
  showPasswordModal = signal(false);
  showExistingLobbyModal = signal(false);
  showNoSessionAlert = signal(false);
  showCopiedToast = signal(false);
  existingLobby = signal<import('../services/lobby.service').LobbyEntry | null>(null);
  passwordInput = '';
  passwordError = signal('');

  /** Lobby the user is trying to join (needs password check) */
  private pendingLobbyId: number | null = null;

  draft = this.emptyDraft();

  private emptyDraft(): CreateLobbyDto {
    return { name: '', description: '', maxPlayers: 10, mode: 'Todos contra Todos', hasPassword: false, password: '' };
  }

  filteredLobbies() {
    const q = this.searchQuery.trim().toLowerCase();
    const all = this.lobbyService.lobbies();
    if (!q) return all;
    return all.filter(l =>
      l.name.toLowerCase().includes(q) || l.host.toLowerCase().includes(q)
    );
  }

  // ── Modal: Crear ────────────────────────────────────────────────
  openModal() {
    // Require session to create a lobby
    if (!this.auth.isLoggedIn()) {
      this.showNoSessionAlert.set(true);
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.showLoginRequired.set(true);
      document.body.style.overflow = 'hidden';
      return;
    }
    const username = user.username;

    // Check if the user already owns a lobby
    const owned = this.lobbyService.getUserLobby(username);
    if (owned) {
      this.existingLobby.set(owned);
      this.showExistingLobbyModal.set(true);
      document.body.style.overflow = 'hidden';
      return;
    }

    this.draft = this.emptyDraft();
    this.showModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  /** Navigate to the user's current lobby */
  goToExisting() {
    const lobby = this.existingLobby();
    if (!lobby) return;
    this.showExistingLobbyModal.set(false);
    this.unlockBody();
    this.router.navigate(['/lobby', lobby.id]);
  }

  /** Delete the existing lobby then open the create modal */
  deleteAndCreate() {
    const lobby = this.existingLobby();
    if (!lobby) return;
    this.lobbyService.deleteLobby(lobby.id);
    this.showExistingLobbyModal.set(false);
    this.existingLobby.set(null);
    this.draft = this.emptyDraft();
    this.showModal.set(true);
    // overflow stays hidden (modal open)
  }

  unlockBody() {
    document.body.style.overflow = '';
  }

  closeModal() {
    this.showModal.set(false);
    document.body.style.overflow = '';
  }

  closeOnBackdrop(e: MouseEvent, which: 'create' | 'pass' | 'existing' | 'login') {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      if (which === 'create') this.closeModal();
      else if (which === 'pass') { this.showPasswordModal.set(false); this.unlockBody(); }
      else if (which === 'login') { this.showLoginRequired.set(false); this.unlockBody(); }
      else { this.showExistingLobbyModal.set(false); this.unlockBody(); }
    }
  }

  confirmCreate() {
    let lobby: import('../services/lobby.service').LobbyEntry;
    try {
      lobby = this.lobbyService.createLobby({ ...this.draft, maxPlayers: Number(this.draft.maxPlayers) });
    } catch {
      this.showModal.set(false);
      this.showLoginRequired.set(true);
      document.body.style.overflow = 'hidden';
      return;
    }
    this.closeModal();
    this.router.navigate(['/lobby', lobby.id]);
  }

  // ── Join logic ──────────────────────────────────────────────────
  joinLobby(lobby: { id: number; hasPassword: boolean; password?: string }) {
    if (!this.auth.currentUser()) {
      this.showLoginRequired.set(true);
      document.body.style.overflow = 'hidden';
      return;
    }
    if (lobby.hasPassword) {
      this.pendingLobbyId = lobby.id;
      this.passwordInput = '';
      this.passwordError.set('');
      this.showPasswordModal.set(true);
      document.body.style.overflow = 'hidden';
    } else {
      this.doJoin(lobby.id);
    }
  }

  confirmJoinWithPassword() {
    if (!this.pendingLobbyId) return;
    const lobby = this.lobbyService.getLobbyById(this.pendingLobbyId);
    if (lobby?.password !== this.passwordInput) {
      this.passwordError.set('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }
    this.showPasswordModal.set(false);
    document.body.style.overflow = '';
    this.doJoin(this.pendingLobbyId);
    this.pendingLobbyId = null;
  }

  private doJoin(id: number) {
    const joined = this.lobbyService.joinLobby(id);
    if (!joined) return;
    this.router.navigate(['/lobby', id]);
  }

  shareLobbyLink(id: number) {
    const url = `${window.location.origin}/lobby/${id}`;
    navigator.clipboard.writeText(url).catch(() => {
      window.prompt('Copia este enlace:', url);
    });
  }

  enterLobby(id: number) {
    if (!this.auth.currentUser()) {
      this.showLoginRequired.set(true);
      document.body.style.overflow = 'hidden';
      return;
    }
    this.router.navigate(['/lobby', id]);
  }

  /** Share lobby link to clipboard */
  shareLobby(lobby: any, event: Event) {
    event.stopPropagation();
    const url = `${window.location.origin}/lobby/${lobby.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showCopiedToast.set(true);
      setTimeout(() => this.showCopiedToast.set(false), 2500);
    });
  }

  /** Checks if the current user is already in the player list of a lobby */
  isUserMember(lobby: any) {
    const username = this.auth.currentUser()?.username;
    if (!username || !lobby.playerList) return false;
    return lobby.playerList.some((p: any) => p.name === username);
  }
}
