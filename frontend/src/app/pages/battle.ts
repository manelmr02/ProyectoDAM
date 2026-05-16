import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';
import { WebSocketService } from '../services/websocket.service';
import type { StompSubscription } from '@stomp/stompjs';

interface RegionNode {
  id: string;      // original player name (key into server regions map)
  name: string;
  type: string;    // faction
  owner: string;
  lives: number;
  victorias: number;
  cost: number;
  icon: string;
  x: number;
  y: number;
  color: string;
}

const POSITIONS = [
  { x: 15, y: 25 }, { x: 75, y: 25 },
  { x: 15, y: 65 }, { x: 75, y: 65 },
  { x: 45, y: 15 }, { x: 45, y: 75 },
  { x: 45, y: 45 }, { x: 75, y: 45 }
];

@Component({
  selector: 'app-battle',
  imports: [RouterLink],
  template: `
    <div class="battle-container animate-fade-in">
      <div class="tech-grid"></div>

      <div class="battle-header glass-panel">
        <div class="header-left">
          <div class="turn-indicator" [class.my-turn]="isMyTurn()">
            <span class="pulse-dot"></span>
            {{ isMyTurn() ? 'TU TURNO' : 'TURNO DE ' + currentTurnPlayer() }}
          </div>
          <h1>ESTRATEGIA DE RUNATERRA</h1>
        </div>
        <div class="header-right">
          <div class="user-coins">
            <span class="coin-icon">💰</span> {{ coins() }} Monedas
          </div>
          <button class="btn btn-secondary btn-ff" (click)="surrender()">SURRENDER</button>
        </div>
      </div>

      <div class="strategy-layout">
        <div class="map-viewport glass-panel">
          <div class="map-canvas">
            @for (node of regions(); track node.id) {
              <div
                class="map-node-wrapper"
                [style.left.%]="node.x"
                [style.top.%]="node.y">

                <div class="player-label" [style.color]="node.color">{{ node.name }}</div>

                <div
                  class="map-node"
                  [class.selected]="selectedId() === node.id"
                  [class.dead]="node.lives === 0"
                  [style.border-color]="node.color"
                  (click)="selectNode(node)">

                  <span class="map-node-icon">{{ node.icon }}</span>
                  <span class="map-node-name">{{ node.type }}</span>

                  <div class="map-node-stats">
                    <span class="node-lives" [class.critical]="node.lives <= 1">🛡️ {{ node.lives }}</span>
                    <span class="node-wins">🏆 {{ node.victorias }}</span>
                  </div>

                  @if (node.owner !== node.name) {
                    <div class="owner-badge">Controlado por {{ node.owner }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <div class="command-center glass-panel">
          @if (selectedNode(); as node) {
            <div class="panel-section">
              <h2 [style.color]="node.color">{{ node.name }}</h2>
              <p class="node-type">{{ node.type }} | Coste refuerzo: {{ node.cost }} 💰</p>
              <div class="node-description">
                Controlada por <strong>{{ node.owner }}</strong>.
                {{ node.owner === myName() ? 'Esta región es parte de tu territorio.' : 'Territorio hostil.' }}
              </div>

              @if (isMyTurn() && node.lives > 0) {
                <div class="action-grid">
                  @if (node.owner !== myName()) {
                    <button
                      class="btn btn-primary action-btn attack"
                      [disabled]="coins() < 150"
                      (click)="attack(node)">
                      ⚔️ LANZAR ATAQUE (150💰)
                    </button>
                  }
                  @if (node.owner === myName()) {
                    <button
                      class="btn btn-secondary action-btn reinforce"
                      [disabled]="coins() < node.cost || node.lives === 5"
                      (click)="reinforce(node)">
                      🛡️ REFORZAR ({{ node.cost }}💰)
                    </button>
                  }
                </div>
              }

              @if (isMyTurn() && node.lives === 0) {
                <div class="dead-notice">Esta región ha sido destruida.</div>
              }
            </div>
          } @else {
            <div class="panel-section empty-selection">
              <span class="hint-icon">🛰️</span>
              <p>Selecciona una región en el mapa para emitir comandos.</p>
            </div>
          }

          <div class="battle-log">
            <h3>LOG DE COMBATE</h3>
            <div class="log-entries">
              @for (log of logs(); track log.time + log.text) {
                <div class="log-item">
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-text">{{ log.text }}</span>
                </div>
              }
            </div>
          </div>

          <button
            class="btn btn-primary end-turn-btn"
            (click)="endTurn()"
            [disabled]="!isMyTurn() || gameOver()">
            FINALIZAR TURNO
          </button>
        </div>
      </div>

      @if (gameOver()) {
        <div class="game-over-overlay">
          <div class="game-over-panel glass-panel">
            <div class="result-icon">{{ isWinner() ? '🏆' : '💀' }}</div>
            <h2>{{ isWinner() ? '¡VICTORIA!' : 'DERROTA' }}</h2>
            <p>{{ gameOverMessage() }}</p>
            <button class="btn btn-primary" routerLink="/">VOLVER AL INICIO</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .battle-container { position: relative; min-height: calc(100vh - 120px); display: flex; flex-direction: column; gap: 20px; padding: 20px 0; }

    .battle-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; }
    .header-left { display: flex; align-items: center; gap: 24px; }
    .turn-indicator {
      padding: 6px 16px; border-radius: 20px; background: rgba(0,0,0,0.4);
      border: 1px solid var(--accent-danger); color: var(--accent-danger);
      font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 8px;
    }
    .turn-indicator.my-turn { border-color: var(--accent-success); color: var(--accent-success); }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }

    .header-right { display: flex; align-items: center; gap: 20px; }
    .user-coins { font-weight: 700; color: var(--accent-gold); font-size: 1.1rem; }
    .btn-ff { font-size: 0.75rem; padding: 6px 12px; border-color: rgba(239,68,68,0.4); color: #ef4444; }

    .strategy-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; flex: 1; }

    .map-viewport { position: relative; background: rgba(0,0,0,0.4); overflow: hidden; border: 1px solid var(--border-light); }
    .map-canvas { position: relative; width: 100%; height: 100%; min-height: 650px; }

    .map-node-wrapper { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 8px; transform: translate(-50%, -50%); }
    .player-label {
      background: rgba(0,0,0,0.8); padding: 2px 12px; border-radius: 4px;
      font-size: 0.75rem; font-weight: 800; border: 1px solid var(--border-light);
      text-transform: uppercase; white-space: nowrap;
    }
    .map-node {
      width: 90px; height: 90px; border-radius: 50%; border: 2px solid;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; background: rgba(0,0,0,0.6); gap: 2px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .map-node:hover { transform: scale(1.1); box-shadow: 0 0 16px currentColor; }
    .map-node.selected { box-shadow: 0 0 24px 4px currentColor; transform: scale(1.1); }
    .map-node.dead { opacity: 0.35; filter: grayscale(1); cursor: default; }
    .map-node-icon { font-size: 1.6rem; }
    .map-node-name { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; opacity: 0.8; }
    .map-node-stats { display: flex; gap: 6px; font-size: 0.65rem; }
    .node-lives.critical { color: #ef4444; font-weight: 900; }
    .owner-badge { font-size: 0.55rem; color: var(--accent-gold); text-align: center; }

    .command-center { display: flex; flex-direction: column; gap: 24px; }
    .node-type { color: var(--accent-secondary); font-size: 0.85rem; font-weight: 700; margin-top: -12px; }
    .node-description { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }

    .action-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .action-btn { width: 100%; padding: 14px; font-size: 0.9rem; }
    .action-btn.attack { background: linear-gradient(135deg, #ef4444, #991b1b); }
    .dead-notice { color: var(--text-muted); font-size: 0.85rem; font-style: italic; }

    .empty-selection { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); }
    .hint-icon { font-size: 3rem; opacity: 0.2; margin-bottom: 12px; }

    .battle-log { flex: 1; display: flex; flex-direction: column; gap: 12px; }
    .battle-log h3 { font-size: 0.8rem; color: var(--accent-gold); opacity: 0.8; }
    .log-entries {
      flex: 1; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;
      overflow-y: auto; max-height: 250px; display: flex; flex-direction: column; gap: 6px;
    }
    .log-item { font-family: monospace; font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px; }
    .log-time { color: var(--text-muted); margin-right: 8px; }

    .end-turn-btn { margin-top: auto; padding: 16px; width: 100%; }

    .game-over-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .game-over-panel {
      text-align: center; padding: 48px; max-width: 400px; width: 90%;
      display: flex; flex-direction: column; align-items: center; gap: 20px;
    }
    .result-icon { font-size: 4rem; }
    .game-over-panel h2 { font-size: 2rem; margin: 0; }

    @media (max-width: 1100px) {
      .strategy-layout { grid-template-columns: 1fr; }
      .map-viewport { min-height: 500px; }
    }
  `]
})
export class Battle implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private lobbyService = inject(LobbyService);
  private ws = inject(WebSocketService);

  myName = signal('');
  coins = signal(1000);
  isMyTurn = signal(false);
  currentTurnPlayer = signal('');
  gameOver = signal(false);
  isWinner = signal(false);
  gameOverMessage = signal('');

  regions = signal<RegionNode[]>([]);
  selectedId = signal<string | null>(null);
  selectedNode = computed(() => this.regions().find(r => r.id === this.selectedId()) ?? null);
  logs = signal<{time: string, text: string}[]>([]);

  private salaId = '';
  private nodePositions = new Map<string, {x: number, y: number}>();
  private gameSub: StompSubscription | null = null;
  private lastLogCount = 0;

  async ngOnInit() {
    this.myName.set(this.auth.currentUser()?.username ?? '');
    this.salaId = this.route.snapshot.paramMap.get('id') || '';

    // Set up positions from lobby data first
    await this.initPositions();

    // Connect to WebSocket and join game
    try {
      await this.ws.connect();
      this.gameSub = this.ws.subscribeToPartida(this.salaId, state => this.applyGameState(state));
      this.ws.joinGame(this.salaId, this.myName());
    } catch {
      this.addLog('No se pudo conectar al servidor. Reconectando...');
    }
  }

  ngOnDestroy() {
    this.gameSub?.unsubscribe();
  }

  private async initPositions() {
    try {
      const lobby = await this.lobbyService.getLobbyById(this.salaId);
      if (lobby) {
        lobby.playerList.forEach((player, index) => {
          this.nodePositions.set(player.name, POSITIONS[index % POSITIONS.length]);
        });
      }
    } catch {
      // Positions will fall back to index-based assignment
    }
  }

  private applyGameState(state: any) {
    this.currentTurnPlayer.set(state.currentTurnPlayer ?? '');
    this.isMyTurn.set(state.currentTurnPlayer === this.myName());
    this.coins.set(state.coins?.[this.myName()] ?? 0);

    // Rebuild region list from server state
    const regionKeys: string[] = Object.keys(state.regions ?? {});
    const updated: RegionNode[] = regionKeys.map((key, index) => {
      const r = state.regions[key];
      const pos = this.nodePositions.get(key) ?? POSITIONS[index % POSITIONS.length];
      return {
        id: key,
        name: key,
        type: r.faction ?? key,
        owner: r.owner ?? key,
        lives: r.lives ?? 0,
        victorias: r.victorias ?? 0,
        cost: r.cost ?? 250,
        icon: r.icon ?? '🛡️',
        color: r.color ?? '#c89b3c',
        x: pos.x,
        y: pos.y
      };
    });
    this.regions.set(updated);

    // Append new log entries from server
    const serverLog: string[] = state.log ?? [];
    for (let i = this.lastLogCount; i < serverLog.length; i++) {
      this.addLog(serverLog[i]);
    }
    this.lastLogCount = serverLog.length;

    // Handle game over
    if (state.status === 'FINISHED' && !this.gameOver()) {
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

  selectNode(node: RegionNode) {
    if (node.lives > 0) this.selectedId.set(node.id);
  }

  attack(node: RegionNode) {
    if (!this.isMyTurn() || node.owner === this.myName()) return;
    this.ws.sendAttack(this.salaId, this.myName(), node.id);
  }

  reinforce(node: RegionNode) {
    if (!this.isMyTurn() || node.owner !== this.myName()) return;
    this.ws.sendReinforce(this.salaId, this.myName(), node.id);
  }

  endTurn() {
    if (!this.isMyTurn()) return;
    this.ws.sendEndTurn(this.salaId, this.myName());
  }

  surrender() {
    this.router.navigate(['/']);
  }

  private addLog(text: string) {
    const d = new Date();
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    this.logs.update(l => [{ time, text }, ...l]);
  }
}
