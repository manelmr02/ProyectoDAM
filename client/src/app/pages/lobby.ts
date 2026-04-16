import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { LobbyService, LobbyEntry } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';

interface ChatMessage { sender?: string; text: string; time: string; system?: boolean; }

// NPC phrases for random chat simulation
const PHRASES: { sender: string; text: string }[] = [
  { sender: 'ComandanteRex',  text: 'Prepárense para caer.' },
  { sender: 'NightStalker',   text: 'Esta vez no habrá piedad.' },
  { sender: 'IronFalcon',     text: '¿Alguien tiene estrategia?' },
  { sender: 'GhostReaper',    text: 'El mejor gana, siempre.' },
  { sender: 'ThunderBolt',    text: 'Vamos a por todas!' },
  { sender: 'DarkPhoenix',    text: 'Primera vez, pero no seré el último.' },
  { sender: 'CrimsonBlade',   text: 'La defensa gana campeonatos.' },
  { sender: 'ShadowMind',     text: '...' },
  { sender: 'NovaCaptain',    text: 'Atacamos o esperamos?' },
  { sender: 'FrostWarden',    text: 'Silencio antes de la tormenta.' },
];

@Component({
  selector: 'app-lobby',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Not authenticated -->
    <div class="lobby-empty animate-fade-in" *ngIf="notAuthenticated()">
      <span class="lobby-empty-icon">🔒</span>
      <h3>Sesión no iniciada</h3>
      <p>Debes iniciar sesión para acceder a una sala de juego.</p>
      <div style="display:flex; gap:12px; margin-top:8px;">
        <a routerLink="/login" class="btn btn-primary" style="text-decoration:none;">INICIAR SESIÓN</a>
        <a routerLink="/" class="btn btn-secondary" style="text-decoration:none;">← Volver al inicio</a>
      </div>
    </div>

    <!-- Loading -->
    <div class="lobby-empty animate-fade-in" *ngIf="!notAuthenticated() && !lobby()">
      <span class="lobby-empty-icon">🔭</span>
      <h3>Sala no encontrada</h3>
      <p>La sala fue eliminada o el enlace es incorrecto.</p>
      <a routerLink="/" class="btn btn-primary" style="margin-top:8px; text-decoration:none;">← Volver al inicio</a>
    </div>

    <div class="lobby-container animate-fade-in" *ngIf="!notAuthenticated() && lobby()">

      <!-- Header -->
      <div class="lobby-header glass-panel">
        <div class="lobby-info">
          <div class="lobby-back-row">
            <a routerLink="/" class="back-btn" title="Volver al inicio">← Salas</a>
            <span class="lobby-mode-pill">{{ lobby()!.mode }}</span>
            <span class="lobby-lock" *ngIf="lobby()!.hasPassword" title="Sala privada">🔒</span>
          </div>
          <h2>{{ lobby()!.name }}</h2>
          <div class="lobby-sub-info">
            <span>HOST: <strong>{{ lobby()!.host }}</strong></span>
            <span class="sep">·</span>
            <span [class.text-success]="readyCount() === lobby()!.playerList.length">
              {{ readyCount() }}/{{ lobby()!.playerList.length }} listos
            </span>
            <span class="sep">·</span>
            <span>{{ lobby()!.players }}/{{ lobby()!.maxPlayers }} jugadores</span>
          </div>
        </div>
        <div class="lobby-action">
          <button class="btn btn-share" (click)="shareLobby()" title="Compartir enlace de la sala">
            📋 COMPARTIR
          </button>
          <button class="btn btn-danger-link" *ngIf="isHost()" (click)="showDeleteModal.set(true)">
            🗑 BORRAR SALA
          </button>
          <button class="btn" [class.btn-primary]="!isReady()" [class.btn-secondary]="isReady()" (click)="toggleReady()">
            <span *ngIf="!isReady()">✔ ESTOY LISTO</span>
            <span *ngIf="isReady()">⏸ CANCELAR</span>
          </button>
        </div>
      </div>

      <!-- Share toast -->
      <div class="share-toast" *ngIf="showShareToast()">
        ✅ Enlace copiado al portapapeles
      </div>

      <!-- DELETE CONFIRMATION MODAL -->
      <div class="modal-overlay" *ngIf="showDeleteModal()" (click)="closeOnBackdrop($event)">
        <div class="modal-panel glass-panel animate-modal delete-modal">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-icon">⚠️</span>
              <div>
                <h2 class="modal-title">¿Borrar esta sala?</h2>
                <p class="modal-subtitle">Esta acción expulsará a todos los jugadores.</p>
              </div>
            </div>
          </div>
          <div class="modal-actions" style="margin-top: 12px;">
            <button class="btn btn-secondary" (click)="showDeleteModal.set(false)">No, mantener</button>
            <button class="btn btn-danger" (click)="confirmDelete()">SÍ, BORRAR SALA</button>
          </div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="lobby-grid">

        <!-- Player list -->
        <div class="players-panel glass-panel">
          <h3>Retadores Conectados <span class="player-badge">{{ lobby()!.playerList.length }}/{{ lobby()!.maxPlayers }}</span></h3>

          <!-- Occupied slots -->
          <div class="player-list">
            <div
              class="player-item"
              *ngFor="let p of lobby()!.playerList"
              [class.player-ready]="p.status === 'Ready'"
              [class.player-me]="p.name === myName()">

              <div class="player-avatar" [style.background]="p.avatarColor">
                {{ p.name.charAt(0).toUpperCase() }}
              </div>
              <div class="player-details">
                <div class="player-name-row">
                  <span class="player-name">{{ p.name }}</span>
                  <span class="owner-crown" *ngIf="p.isOwner" title="Host">👑</span>
                  <span class="me-tag" *ngIf="p.name === myName()">TÚ</span>
                </div>
                <span class="player-clan" *ngIf="p.clan">[{{ p.clan }}]</span>
              </div>
              <div class="player-status-dot" [class.ready]="p.status === 'Ready'" [title]="p.status">
                <span class="status-text">{{ p.status }}</span>
              </div>
            </div>
          </div>

          <!-- Empty slots -->
          <div class="empty-slots">
            <div class="empty-slot" *ngFor="let s of emptySlots()">
              <span class="empty-slot-icon">+</span>
              <span class="empty-slot-text">Esperando...</span>
            </div>
          </div>
        </div>

        <!-- Chat -->
        <div class="chat-panel glass-panel">
          <h3>Comunicaciones Tácticas</h3>
          <div class="chat-messages" #chatBox id="chatBox">
            <div class="msg" *ngFor="let msg of messages()" [class.system-msg]="msg.system" [class.my-msg]="msg.sender === myName()">
              <span class="msg-time">[{{ msg.time }}]</span>
              <span class="msg-sender" *ngIf="!msg.system">{{ msg.sender }}:</span>
              <span class="msg-text">{{ msg.text }}</span>
            </div>
          </div>
          <form class="chat-input-area" (ngSubmit)="sendMessage()">
            <input
              type="text"
              [placeholder]="auth.isLoggedIn() ? 'Escribe al lobby...' : 'Inicia sesión para escribir'"
              [(ngModel)]="chatInput"
              name="chatInput"
              id="chat-input"
              autocomplete="off"
              [disabled]="!auth.isLoggedIn()">
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="!auth.isLoggedIn()">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Empty ── */
    .lobby-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 80px 24px; text-align: center; color: var(--text-muted);
    }
    .lobby-empty-icon { font-size: 3rem; }

    /* ── Container ── */
    .lobby-container { display: flex; flex-direction: column; gap: 24px; padding: 24px 0; }

    /* ── Header ── */
    .lobby-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
    .lobby-info { display: flex; flex-direction: column; gap: 6px; }
    .lobby-back-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .back-btn { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: color var(--transition-fast); }
    .back-btn:hover { color: var(--accent-secondary); }
    .lobby-mode-pill { background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.3); color: var(--accent-primary); font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .lobby-lock { font-size: 0.95rem; }
    .lobby-header h2 { color: var(--accent-secondary); font-size: 1.6rem; }
    .lobby-sub-info { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted); }
    .sep { opacity: 0.4; }
    .text-success { color: var(--accent-success); font-weight: 700; }
    .lobby-action { flex-shrink: 0; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

    .btn-danger-link {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 700;
      transition: all var(--transition-normal);
    }
    .btn-danger-link:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }

    /* ── Grid ── */
    .lobby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; min-height: 500px; }
    .players-panel, .chat-panel { display: flex; flex-direction: column; gap: 14px; }

    .players-panel h3, .chat-panel h3 {
      font-size: 1rem; letter-spacing: 0.05em; text-transform: uppercase;
      color: var(--text-muted); display: flex; align-items: center; gap: 10px;
    }
    .player-badge {
      background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.3);
      color: var(--accent-primary); font-size: 0.7rem; padding: 2px 8px;
      border-radius: 20px; font-family: var(--font-body); font-weight: 700;
    }

    /* Player list */
    .player-list { display: flex; flex-direction: column; gap: 8px; }
    .player-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: rgba(0,0,0,0.2);
      border-radius: 10px; border-left: 3px solid transparent;
      transition: all 0.25s;
    }
    .player-item:hover { background: rgba(255,255,255,0.04); }
    .player-ready { border-left-color: var(--accent-success); background: rgba(16,185,129,0.05) !important; }
    .player-me { border-left-color: var(--accent-primary); }

    .player-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.95rem; color: white; flex-shrink: 0;
      font-family: var(--font-heading);
    }
    .player-details { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .player-name-row { display: flex; align-items: center; gap: 6px; }
    .player-name { font-weight: 700; color: var(--text-main); font-size: 0.93rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .owner-crown { font-size: 0.8rem; }
    .me-tag { font-size: 0.65rem; font-weight: 800; background: var(--accent-primary); color: white; padding: 1px 6px; border-radius: 4px; letter-spacing: 0.05em; }
    .player-clan { font-size: 0.75rem; color: var(--accent-gold); }

    .player-status-dot { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .status-text { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .player-status-dot.ready .status-text { color: var(--accent-success); }

    /* Empty slots */
    .empty-slots { display: flex; flex-direction: column; gap: 6px; }
    .empty-slot {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      border: 1px dashed rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.15);
    }
    .empty-slot-icon { width: 36px; height: 36px; border-radius: 50%; border: 1px dashed rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .empty-slot-text { font-size: 0.82rem; font-style: italic; }

    /* Chat */
    .chat-messages {
      flex: 1; background: rgba(0,0,0,0.3); border-radius: 10px;
      padding: 16px; overflow-y: auto; display: flex; flex-direction: column;
      gap: 6px; font-family: var(--font-body); font-size: 0.88rem;
      min-height: 300px; max-height: 420px;
    }
    .msg { display: flex; gap: 4px; flex-wrap: wrap; }
    .msg-time { color: var(--text-muted); font-size: 0.76rem; margin-right: 4px; flex-shrink: 0; }
    .msg-sender { font-weight: 700; color: var(--accent-primary); margin-right: 2px; }
    .my-msg .msg-sender { color: var(--accent-secondary); }
    .msg-text { color: var(--text-main); }
    .system-msg .msg-text { color: var(--accent-secondary); font-style: italic; }
    .system-msg .msg-sender { display: none; }

    .chat-input-area { display: flex; gap: 8px; }
    .chat-input-area input {
      flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--border-light);
      color: white; padding: 10px 14px; border-radius: 8px; outline: none;
      font-family: var(--font-body); font-size: 0.9rem; transition: border-color var(--transition-fast);
    }
    .chat-input-area input:focus { border-color: var(--accent-secondary); }
    .btn-sm { padding: 8px 18px; font-size: 0.88rem; white-space: nowrap; }
    .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Share button */
    .btn-share {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white; border: none; padding: 8px 16px;
      font-size: 0.85rem; font-weight: 700;
      transition: all var(--transition-normal);
    }
    .btn-share:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }

    /* Share toast */
    .share-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: rgba(16, 185, 129, 0.95); color: white;
      padding: 12px 24px; border-radius: 12px;
      font-weight: 700; font-size: 0.9rem;
      z-index: 3000; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
      animation: toastIn 0.3s ease-out;
    }
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

    .chat-input-area input:disabled {
      opacity: 0.5; cursor: not-allowed;
      background: rgba(0,0,0,0.15);
    }

    /* Modal Styles (extracted for consistency) */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-panel {
      width: 100%; max-width: 440px;
      background: rgba(15, 20, 35, 0.95);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 24px; border-radius: 16px;
    }
    @keyframes slideInModal {
      from { opacity: 0; transform: translateY(-20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-modal { animation: slideInModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .modal-header { display: flex; align-items: flex-start; margin-bottom: 20px; }
    .modal-title-group { display: flex; align-items: center; gap: 14px; }
    .modal-icon { font-size: 2rem; }
    .modal-title { font-size: 1.4rem; color: #fff; margin-bottom: 4px; }
    .modal-subtitle { color: var(--text-muted); font-size: 0.9rem; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
    
    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white; border: none; padding: 10px 20px; border-radius: 8px;
      font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); }

    @media (max-width: 768px) {
      .lobby-grid { grid-template-columns: 1fr; }
      .lobby-header { flex-direction: column; }
    }
  `]
})
export class Lobby implements OnInit, OnDestroy {
  private route         = inject(ActivatedRoute);
  private lobbyService  = inject(LobbyService);
  readonly auth         = inject(AuthService);

  lobby   = signal<LobbyEntry | null>(null);
  messages = signal<ChatMessage[]>([]);
  isReady = signal(false);
  showDeleteModal = signal(false);
  showShareToast = signal(false);
  notAuthenticated = signal(false);
  chatInput = '';

  private timers: ReturnType<typeof setTimeout>[] = [];

  myName = computed(() => this.auth.currentUser()?.username ?? '');
  
  isHost = computed(() => {
    const l = this.lobby();
    return l ? l.host === this.myName() : false;
  });

  private router = inject(Router);

  readyCount = computed(() =>
    (this.lobby()?.playerList ?? []).filter(p => p.status === 'Ready').length
  );

  emptySlots = computed(() => {
    const l = this.lobby();
    if (!l) return [];
    const free = l.maxPlayers - l.playerList.length;
    return Array(Math.max(0, free)).fill(null);
  });

  ngOnInit() {
    // Auth guard: block if not logged in
    if (!this.auth.currentUser()) {
      this.notAuthenticated.set(true);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const found = this.lobbyService.getLobbyById(id);

    if (!found) {
      this.lobby.set(null);
      return;
    }

    // Auto-join if not in list (e.g. on refresh or direct nav)
    const isMember = found.playerList.some(p => p.name === this.myName());
    if (!isMember && found.players < found.maxPlayers && found.status === 'Esperando') {
      const updated = this.lobbyService.joinLobby(found.id);
      if (updated) {
        this.lobby.set(updated);
      } else {
        this.lobby.set(found);
      }
    } else {
      this.lobby.set(found);
    }

    const currentLobby = this.lobby()!;

    // Initial system message
    this.addSystem(`Sala "${currentLobby.name}" cargada. ${currentLobby.players}/${currentLobby.maxPlayers} jugadores.`);

    // Announce existing players
    currentLobby.playerList.forEach((p, i) => {
      if (p.name !== this.myName()) {
        const t = setTimeout(() => {
          this.addSystem(`${p.name} está en la sala.`);
        }, (i + 1) * 400);
        this.timers.push(t);
      }
    });

    // Schedule NPC chat messages
    const chats = this.lobbyService.getNpcChats().filter(c =>
      found.playerList.some(p => p.name === c.sender)
    );

    chats.slice(0, 4).forEach((c, i) => {
      const delay = 3000 + i * 3500 + Math.random() * 2000;
      const t = setTimeout(() => {
        this.addMsg(c.sender, c.text);
        // Sometimes a player marks as ready after chatting
        if (Math.random() > 0.6) {
          const t2 = setTimeout(() => {
            this.lobbyService.updatePlayerStatus(found.id, c.sender, 'Ready');
            this.lobby.set(this.lobbyService.getLobbyById(found.id) ?? null);
            this.addSystem(`${c.sender} está LISTO.`);
          }, 1500);
          this.timers.push(t2);
        }
      }, delay);
      this.timers.push(t);
    });
  }

  ngOnDestroy() {
    this.timers.forEach(t => clearTimeout(t));
    const current = this.lobby();
    if (current) {
      this.lobbyService.leaveLobby(current.id);
    }
  }

  toggleReady() {
    const l = this.lobby();
    if (!l) return;
    this.isReady.update(v => !v);
    const newStatus = this.isReady() ? 'Ready' : 'Waiting';
    this.lobbyService.updatePlayerStatus(l.id, this.myName(), newStatus);
    this.lobby.set(this.lobbyService.getLobbyById(l.id) ?? null);
    this.addSystem(this.isReady()
      ? `${this.myName()} está LISTO.`
      : `${this.myName()} canceló el estado listo.`
    );
  }

  confirmDelete() {
    const l = this.lobby();
    if (!l) return;
    
    this.lobbyService.deleteLobby(l.id);
    this.showDeleteModal.set(false);
    this.router.navigate(['/']);
  }

  closeOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showDeleteModal.set(false);
    }
  }

  sendMessage() {
    if (!this.auth.isLoggedIn()) return;
    const text = this.chatInput.trim();
    if (!text) return;
    this.addMsg(this.myName(), text);
    this.chatInput = '';
    this.scrollChat();
  }

  shareLobby() {
    const l = this.lobby();
    if (!l) return;
    const url = `${window.location.origin}/lobby/${l.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showShareToast.set(true);
      setTimeout(() => this.showShareToast.set(false), 2500);
    }).catch(() => {
      // Fallback: prompt
      window.prompt('Copia este enlace:', url);
    });
  }

  private addSystem(text: string) {
    this.messages.update(m => [...m, { time: this.now(), text, system: true }]);
    this.scrollChat();
  }

  private addMsg(sender: string, text: string) {
    this.messages.update(m => [...m, { time: this.now(), sender, text }]);
    this.scrollChat();
  }

  private now(): string {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  private scrollChat() {
    setTimeout(() => {
      const box = document.getElementById('chatBox');
      if (box) box.scrollTop = box.scrollHeight;
    }, 50);
  }
}
