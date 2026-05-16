import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';
import { WebSocketService } from '../services/websocket.service';
import type { StompSubscription } from '@stomp/stompjs';

interface RegionNode {
  id: string;
  name: string;
  type: string;
  owner: string;
  lives: number;
  maxLives: number;
  victorias: number;
  reinforceCost: number;
  icon: string;
  x: number;
  y: number;
  color: string;
}

interface LogEntry { time: string; text: string; isSummary: boolean; }

const POSITIONS = [
  { x: 18, y: 25 }, { x: 72, y: 25 },
  { x: 18, y: 68 }, { x: 72, y: 68 },
  { x: 45, y: 12 }, { x: 45, y: 80 },
  { x: 45, y: 46 }, { x: 80, y: 46 }
];
const TURN_SECONDS = 60;

@Component({
  selector: 'app-battle',
  imports: [RouterLink],
  template: `
    <div class="battle-container animate-fade-in">
      <div class="tech-grid"></div>

      <!-- Header -->
      <div class="battle-header glass-panel">
        <div class="header-left">
          <div class="turn-indicator" [class.my-turn]="isMyTurn()">
            <span class="pulse-dot"></span>
            {{ isMyTurn() ? 'TU TURNO' : 'TURNO DE ' + currentTurnPlayer() }}
          </div>
          <h1 class="hide-sm">RUNATERRA TACTICS</h1>
        </div>
        <div class="header-center">
          <div class="turn-timer" [class.urgent]="turnSecondsLeft() <= 10" [class.warning]="turnSecondsLeft() <= 20 && turnSecondsLeft() > 10">
            <span class="timer-icon">⏱</span>
            <span class="timer-val">{{ turnSecondsLeft() }}s</span>
          </div>
          <div class="round-badge">Ronda {{ roundNumber() }}</div>
        </div>
        <div class="header-right">
          <div class="user-coins">💰 {{ coins() }}</div>
          <button class="btn btn-ff" (click)="surrender()">SALIR</button>
        </div>
      </div>

      <div class="strategy-layout">
        <!-- MAP -->
        <div class="map-viewport glass-panel">
          <div class="map-canvas">
            @for (node of regions(); track node.id) {
              <div class="map-node-wrapper" [style.left.%]="node.x" [style.top.%]="node.y">

                <div class="player-label" [style.color]="node.color">{{ node.name }}</div>

                <div class="map-node"
                     [class.selected]="selectedId() === node.id"
                     [class.dead]="node.lives === 0"
                     [class.my-node]="node.owner === myName()"
                     [style.--node-color]="node.color"
                     (click)="selectNode(node)">
                  <span class="node-icon">{{ node.icon }}</span>
                  @if (node.lives === 0) {
                    <span class="dead-skull">☠️</span>
                  }
                </div>

                <div class="node-info">
                  <div class="node-faction">{{ node.type }}</div>
                  <div class="node-lives-bar">
                    <div class="node-lives-fill"
                         [style.width.%]="node.lives / node.maxLives * 100"
                         [style.background]="livesColor(node)">
                    </div>
                  </div>
                  <div class="node-stats-row">
                    <span [class.crit]="node.lives / node.maxLives < 0.3">🛡️{{ node.lives }}/{{ node.maxLives }}</span>
                    @if (node.victorias > 0) { <span>🏆{{ node.victorias }}</span> }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- COMMAND CENTER -->
        <div class="command-center glass-panel">

          @if (selectedNode(); as node) {
            <div class="panel-section">
              <div class="node-header">
                <span class="node-header-icon">{{ node.icon }}</span>
                <div>
                  <h2 [style.color]="node.color">{{ node.name }}</h2>
                  <p class="node-faction-label">{{ node.type }}</p>
                </div>
              </div>

              <div class="lives-display">
                <div class="lives-bar-big">
                  <div class="lives-bar-fill"
                       [style.width.%]="node.lives / node.maxLives * 100"
                       [style.background]="livesColor(node)">
                  </div>
                </div>
                <span class="lives-text" [class.crit]="node.lives / node.maxLives < 0.3">
                  🛡️ {{ node.lives }} / {{ node.maxLives }} vidas
                </span>
              </div>

              <div class="node-owner">
                {{ node.owner === myName() ? '🟢 Tu territorio' : '🔴 Territorio de ' + node.owner }}
              </div>

              @if (isMyTurn() && !hasActed() && node.lives > 0) {
                <div class="action-grid">
                  @if (node.owner !== myName()) {
                    <button class="btn btn-attack"
                            [disabled]="coins() < 150"
                            (click)="attack(node)">
                      ⚔️ ATACAR (150💰)
                    </button>
                  }
                  @if (node.owner === myName()) {
                    <button class="btn btn-reinforce"
                            [disabled]="coins() < node.reinforceCost || node.lives >= node.maxLives"
                            (click)="reinforce(node)">
                      🔧 REFORZAR ({{ node.reinforceCost }}💰)
                    </button>
                  }
                </div>
              }

              @if (isMyTurn() && hasActed()) {
                <div class="action-done">✅ Acción realizada. Finaliza tu turno.</div>
              }

              @if (!isMyTurn()) {
                <div class="waiting-turn">Espera tu turno...</div>
              }

              @if (node.lives === 0) {
                <div class="dead-notice">☠️ Esta región ha sido eliminada.</div>
              }
            </div>
          } @else {
            <div class="panel-section empty-selection">
              <span class="hint-icon">🛰️</span>
              <p>Selecciona una región en el mapa para emitir comandos.</p>
            </div>
          }

          <!-- Combat log -->
          <div class="battle-log">
            <h3>LOG DE COMBATE</h3>
            <div class="log-entries" id="logBox">
              @for (entry of logs(); track $index) {
                <div class="log-item" [class.summary]="entry.isSummary">
                  <span class="log-time">{{ entry.time }}</span>
                  <span class="log-text">{{ entry.text }}</span>
                </div>
              }
            </div>
          </div>

          <button class="btn btn-end-turn"
                  (click)="endTurn()"
                  [disabled]="!isMyTurn() || gameOver()">
            ⏭ FINALIZAR TURNO
          </button>
        </div>
      </div>

      <!-- Game over overlay -->
      @if (gameOver()) {
        <div class="game-over-overlay">
          <div class="game-over-panel glass-panel">
            <div class="result-icon">{{ isWinner() ? '🏆' : '💀' }}</div>
            <h2 [class.victory]="isWinner()" [class.defeat]="!isWinner()">
              {{ isWinner() ? '¡VICTORIA!' : 'DERROTA' }}
            </h2>
            <p class="result-msg">{{ gameOverMessage() }}</p>
            <a class="btn btn-primary" routerLink="/">VOLVER AL INICIO</a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .battle-container { position: relative; min-height: calc(100vh - 120px); display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }

    /* ── Header ── */
    .battle-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; gap: 12px; flex-wrap: wrap; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-center { display: flex; align-items: center; gap: 12px; }
    .header-right { display: flex; align-items: center; gap: 12px; }

    .turn-indicator {
      padding: 6px 14px; border-radius: 20px; background: rgba(0,0,0,0.4);
      border: 1px solid var(--accent-danger); color: var(--accent-danger);
      font-size: 0.78rem; font-weight: 800; display: flex; align-items: center; gap: 8px; white-space: nowrap;
    }
    .turn-indicator.my-turn { border-color: var(--accent-success); color: var(--accent-success); }
    .pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 1.5s infinite; flex-shrink: 0; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }

    .turn-timer {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 20px;
      background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
      font-weight: 800; font-size: 0.85rem; min-width: 72px; justify-content: center;
    }
    .turn-timer.warning { border-color: #f59e0b; color: #f59e0b; }
    .turn-timer.urgent  { border-color: #ef4444; color: #ef4444; animation: pulse 0.7s infinite; }
    .timer-icon { font-size: 0.9rem; }

    .round-badge { padding: 4px 12px; border-radius: 20px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: var(--accent-primary); font-size: 0.75rem; font-weight: 700; }

    .user-coins { font-weight: 700; color: var(--accent-gold); font-size: 1rem; }
    .btn-ff { font-size: 0.72rem; padding: 5px 10px; border: 1px solid rgba(239,68,68,0.4); color: #ef4444; background: transparent; border-radius: 6px; cursor: pointer; }
    .hide-sm { font-size: 1rem; }

    /* ── Layout ── */
    .strategy-layout { display: grid; grid-template-columns: 1fr 370px; gap: 20px; flex: 1; }

    /* ── Map ── */
    .map-viewport { position: relative; background: rgba(0,0,0,0.4); overflow: hidden; }
    .map-canvas { position: relative; width: 100%; height: 100%; min-height: 620px; }

    .map-node-wrapper {
      position: absolute; display: flex; flex-direction: column; align-items: center;
      gap: 4px; transform: translate(-50%, -50%); cursor: pointer;
    }

    .player-label {
      background: rgba(0,0,0,0.85); padding: 2px 10px; border-radius: 4px;
      font-size: 0.7rem; font-weight: 800; text-transform: uppercase; white-space: nowrap;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .map-node {
      width: 68px; height: 68px; border-radius: 50%;
      border: 3px solid var(--node-color, #888);
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.65); position: relative;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 0 8px color-mix(in srgb, var(--node-color, #888) 40%, transparent);
    }
    .map-node:hover { transform: scale(1.12); }
    .map-node.selected {
      transform: scale(1.18);
      box-shadow: 0 0 0 3px var(--node-color, #888), 0 0 20px color-mix(in srgb, var(--node-color, #888) 60%, transparent);
    }
    .map-node.my-node { border-width: 3px; }
    .map-node.dead { opacity: 0.3; filter: grayscale(1); cursor: default; transform: scale(1) !important; }
    .node-icon { font-size: 2rem; line-height: 1; }
    .dead-skull { position: absolute; font-size: 1.2rem; top: -4px; right: -4px; }

    .node-info { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 80px; }
    .node-faction { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; opacity: 0.7; white-space: nowrap; }
    .node-lives-bar { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .node-lives-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .node-stats-row { display: flex; gap: 8px; font-size: 0.62rem; font-weight: 700; }
    .node-stats-row .crit { color: #ef4444; }

    /* ── Command Center ── */
    .command-center { display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
    .panel-section { display: flex; flex-direction: column; gap: 10px; }

    .node-header { display: flex; align-items: center; gap: 12px; }
    .node-header-icon { font-size: 2.2rem; flex-shrink: 0; }
    .node-header h2 { font-size: 1.2rem; margin: 0; }
    .node-faction-label { font-size: 0.78rem; color: var(--accent-secondary); font-weight: 700; margin: 0; }

    .lives-display { display: flex; flex-direction: column; gap: 4px; }
    .lives-bar-big { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
    .lives-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
    .lives-text { font-size: 0.82rem; font-weight: 700; }
    .lives-text.crit { color: #ef4444; }

    .node-owner { font-size: 0.8rem; color: var(--text-muted); padding: 4px 0; }

    .action-grid { display: flex; flex-direction: column; gap: 8px; }
    .btn-attack  { padding: 12px; width: 100%; background: linear-gradient(135deg,#ef4444,#991b1b); color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.88rem; transition:opacity .2s; }
    .btn-attack:disabled  { opacity:.4; cursor:not-allowed; }
    .btn-reinforce { padding: 12px; width: 100%; background: linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.88rem; transition:opacity .2s; }
    .btn-reinforce:disabled { opacity:.4; cursor:not-allowed; }

    .action-done  { padding: 10px 12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius:8px; color:#10b981; font-size:0.82rem; font-weight:700; text-align:center; }
    .waiting-turn { padding: 10px 12px; background: rgba(0,0,0,0.2); border-radius:8px; color:var(--text-muted); font-size:0.82rem; text-align:center; font-style:italic; }
    .dead-notice  { color:#ef4444; font-size:0.82rem; font-style:italic; }

    .empty-selection { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:var(--text-muted); }
    .hint-icon { font-size:2.5rem; opacity:.15; margin-bottom:10px; }

    /* ── Log ── */
    .battle-log { flex:1; display:flex; flex-direction:column; gap:8px; min-height:0; }
    .battle-log h3 { font-size:0.75rem; color:var(--accent-gold); opacity:.8; text-transform:uppercase; letter-spacing:.05em; }
    .log-entries {
      flex:1; background:rgba(0,0,0,0.2); border-radius:10px; padding:10px;
      overflow-y:auto; max-height:220px; display:flex; flex-direction:column; gap:4px;
    }
    .log-item { font-family:monospace; font-size:0.73rem; padding-bottom:3px; border-bottom:1px solid rgba(255,255,255,0.03); }
    .log-item.summary { color:var(--accent-gold); font-weight:700; border-bottom-color:rgba(200,155,60,0.2); }
    .log-time { color:var(--text-muted); margin-right:6px; opacity:.6; }

    .btn-end-turn { padding:14px; width:100%; background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:#fff; border:none; border-radius:10px; font-weight:800; font-size:0.9rem; cursor:pointer; transition:opacity .2s; margin-top:auto; }
    .btn-end-turn:disabled { opacity:.35; cursor:not-allowed; }

    /* ── Game over ── */
    .game-over-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.88); display:flex; align-items:center; justify-content:center; z-index:200; }
    .game-over-panel { text-align:center; padding:48px 40px; max-width:420px; width:90%; display:flex; flex-direction:column; align-items:center; gap:20px; }
    .result-icon { font-size:4.5rem; }
    .game-over-panel h2 { font-size:2.2rem; margin:0; }
    .game-over-panel h2.victory { color:#f59e0b; }
    .game-over-panel h2.defeat  { color:#ef4444; }
    .result-msg { color:var(--text-muted); font-size:0.95rem; }

    @media (max-width: 1100px) {
      .strategy-layout { grid-template-columns: 1fr; }
      .map-canvas { min-height: 480px; }
      .hide-sm { display: none; }
    }
  `]
})
export class Battle implements OnInit, OnDestroy {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private auth      = inject(AuthService);
  private lobbyService = inject(LobbyService);
  private ws        = inject(WebSocketService);

  myName            = signal('');
  coins             = signal(0);
  isMyTurn          = signal(false);
  currentTurnPlayer = signal('');
  hasActed          = signal(false);
  turnSecondsLeft   = signal(TURN_SECONDS);
  roundNumber       = signal(1);
  gameOver          = signal(false);
  isWinner          = signal(false);
  gameOverMessage   = signal('');

  regions    = signal<RegionNode[]>([]);
  selectedId = signal<string | null>(null);
  selectedNode = computed(() => this.regions().find(r => r.id === this.selectedId()) ?? null);
  logs       = signal<LogEntry[]>([]);

  private salaId        = '';
  private nodePositions = new Map<string, {x: number, y: number}>();
  private gameSub: StompSubscription | null = null;
  private lastLogCount  = 0;
  private prevTurnPlayer = '';
  private timerInterval: any = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async ngOnInit() {
    this.myName.set(this.auth.currentUser()?.username ?? '');
    this.salaId = this.route.snapshot.paramMap.get('id') || '';
    await this.initPositions();

    try {
      await this.ws.connect();
      this.gameSub = this.ws.subscribeToPartida(this.salaId, s => this.applyGameState(s));
      this.ws.joinGame(this.salaId, this.myName());
    } catch {
      this.addLog('No se pudo conectar al servidor.', false);
    }
  }

  ngOnDestroy() {
    this.gameSub?.unsubscribe();
    this.clearTimer();
  }

  // ── State application ─────────────────────────────────────────────────────

  private applyGameState(state: any) {
    const newTurnPlayer = state.currentTurnPlayer ?? '';
    const turnChanged   = newTurnPlayer !== this.prevTurnPlayer;

    this.currentTurnPlayer.set(newTurnPlayer);
    this.isMyTurn.set(newTurnPlayer === this.myName());
    this.coins.set(state.coins?.[this.myName()] ?? 0);
    this.roundNumber.set(state.roundNumber ?? 1);

    if (turnChanged) {
      this.prevTurnPlayer = newTurnPlayer;
      this.hasActed.set(false);
      this.startTimer(state.turnStartTime ?? Date.now());
    }

    // Sync server-side hasActed flag
    if (state.hasActedThisTurn && newTurnPlayer === this.myName()) {
      this.hasActed.set(true);
    }

    // Rebuild regions
    const keys: string[] = Object.keys(state.regions ?? {});
    const updated: RegionNode[] = keys.map((key, i) => {
      const r   = state.regions[key];
      const pos = this.nodePositions.get(key) ?? POSITIONS[i % POSITIONS.length];
      return {
        id: key, name: key,
        type: r.faction ?? key,
        owner: r.owner ?? key,
        lives: r.lives ?? 0,
        maxLives: r.maxLives ?? 10,
        victorias: r.victorias ?? 0,
        reinforceCost: r.reinforceCost ?? 280,
        icon: r.icon ?? '🛡️',
        color: r.color ?? '#c89b3c',
        x: pos.x, y: pos.y
      };
    });
    this.regions.set(updated);

    // Append new log entries
    const serverLog: string[] = state.log ?? [];
    for (let i = this.lastLogCount; i < serverLog.length; i++) {
      const text = serverLog[i];
      this.addLog(text, text.startsWith('══'));
    }
    this.lastLogCount = serverLog.length;
    this.scrollLog();

    // Game over
    if (state.status === 'FINISHED' && !this.gameOver()) {
      this.clearTimer();
      this.gameOver.set(true);
      if (state.winner === this.myName()) {
        this.isWinner.set(true);
        this.gameOverMessage.set('Has conquistado Runaterra. ¡La gloria es tuya!');
      } else if (state.winner) {
        this.gameOverMessage.set(state.winner + ' ha ganado la batalla.');
      } else {
        this.gameOverMessage.set('Todos los jugadores han sido eliminados. Empate.');
      }
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  selectNode(node: RegionNode) {
    if (node.lives > 0) this.selectedId.set(node.id);
  }

  attack(node: RegionNode) {
    if (!this.isMyTurn() || this.hasActed() || node.owner === this.myName()) return;
    this.hasActed.set(true);
    this.ws.sendAttack(this.salaId, this.myName(), node.id);
  }

  reinforce(node: RegionNode) {
    if (!this.isMyTurn() || this.hasActed() || node.owner !== this.myName()) return;
    this.hasActed.set(true);
    this.ws.sendReinforce(this.salaId, this.myName(), node.id);
  }

  endTurn() {
    if (!this.isMyTurn()) return;
    this.clearTimer();
    this.ws.sendEndTurn(this.salaId, this.myName());
  }

  surrender() { this.router.navigate(['/']); }

  // ── Turn timer ────────────────────────────────────────────────────────────

  private startTimer(startTimeMs: number) {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
      const left    = Math.max(0, TURN_SECONDS - elapsed);
      this.turnSecondsLeft.set(left);
      if (left === 0) {
        this.clearTimer();
        if (this.isMyTurn() && !this.gameOver()) {
          this.endTurn();
        }
      }
    }, 500);
    // Set immediately so there's no flicker
    const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
    this.turnSecondsLeft.set(Math.max(0, TURN_SECONDS - elapsed));
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  livesColor(node: RegionNode): string {
    if (node.maxLives === 0) return '#10b981';
    const pct = node.lives / node.maxLives;
    if (pct > 0.55) return '#10b981';
    if (pct > 0.25) return '#f59e0b';
    return '#ef4444';
  }

  private async initPositions() {
    try {
      const lobby = await this.lobbyService.getLobbyById(this.salaId);
      if (lobby) {
        lobby.playerList.forEach((p, i) => {
          this.nodePositions.set(p.name, POSITIONS[i % POSITIONS.length]);
        });
      }
    } catch { /* fall back to index-based */ }
  }

  private addLog(text: string, isSummary: boolean) {
    const d = new Date();
    const time = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    this.logs.update(l => [{ time, text, isSummary }, ...l]);
  }

  private scrollLog() {
    setTimeout(() => {
      const box = document.getElementById('logBox');
      if (box) box.scrollTop = 0;
    }, 30);
  }
}
