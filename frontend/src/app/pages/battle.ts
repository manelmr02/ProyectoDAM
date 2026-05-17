import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';
import { WebSocketService } from '../services/websocket.service';
import type { StompSubscription } from '@stomp/stompjs';

interface RegionNode {
  id: string; name: string; type: string; owner: string;
  lives: number; maxLives: number; victorias: number;
  reinforceCost: number; icon: string; x: number; y: number; color: string;
}

interface LogEntry { time: string; text: string; isSummary: boolean; }
interface ItemCard { id: string; name: string; effect: string; iconId: number; type: string; value: number; }

const POSITIONS = [
  { x: 18, y: 25 }, { x: 72, y: 25 },
  { x: 18, y: 68 }, { x: 72, y: 68 },
  { x: 45, y: 12 }, { x: 45, y: 80 },
  { x: 45, y: 46 }, { x: 80, y: 46 },
  { x: 30, y: 46 }, { x: 60, y: 36 },
  { x: 12, y: 55 }, { x: 88, y: 55 },
  { x: 60, y: 60 }, { x: 30, y: 15 }
];
const TURN_SECONDS  = 60;
const ITEM_CDN      = 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/item/';
const ITEM_FALLBACK = 'https://placehold.co/64x64/1a1a2e/c89b3c?text=?';

const ULTIMATE_FACTIONS = new Set(['Noxus', 'Shadow Isles', 'Void', 'Shurima', 'Zaun', 'Bilgewater', 'Ixtal', 'Tierras Perdidas']);
const RECALL_FACTIONS   = new Set(['Demacia', 'Freljord', 'Ionia', 'Piltover', 'Targon', 'Tierras Perdidas']);

const ULTIMATE_NAMES: Record<string, string> = {
  'Noxus': 'Conquista Total', 'Shadow Isles': 'Bruma Negra',
  'Void': 'Aniquilación del Vacío', 'Shurima': 'Ascensión Solar',
  'Zaun': 'Virus Químico', 'Bilgewater': 'Cañonazo Pirata',
  'Ixtal': 'Tormenta Elemental', 'Tierras Perdidas': 'Justicia Demaciana'
};
const RECALL_NAMES: Record<string, string> = {
  'Demacia': 'Muralla Demaciana', 'Freljord': 'Glaciar Eterno',
  'Ionia': 'Equilibrio del Espíritu', 'Piltover': 'Protocolo Hextech',
  'Targon': 'Bendición Celestial', 'Tierras Perdidas': 'Destino Maleable'
};

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
          <button class="btn-exit" (click)="showSurrenderModal.set(true)">SALIR</button>
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
                  @if (node.lives === 0) { <span class="dead-skull">☠️</span> }
                </div>
                <div class="node-info">
                  <div class="node-faction">{{ node.type }}</div>
                  <div class="node-lives-bar">
                    <div class="node-lives-fill" [style.width.%]="node.lives / node.maxLives * 100" [style.background]="livesColor(node)"></div>
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
                  <div class="lives-bar-fill" [style.width.%]="node.lives / node.maxLives * 100" [style.background]="livesColor(node)"></div>
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
                    <!-- Normal attack -->
                    <button class="btn btn-attack"
                            [disabled]="coins() < 150"
                            (click)="attack(node)">
                      ⚔️ ATACAR (150💰)
                    </button>
                    <!-- ULTIMATE -->
                    @if (hasUltimate()) {
                      <button class="btn btn-ultimate"
                              [disabled]="coins() < abilityCost()"
                              (click)="ultimate(node)">
                        ⚡ {{ ultimateName() }} ({{ abilityCost() }}💰)
                      </button>
                    }
                  }

                  @if (node.owner === myName()) {
                    <!-- Normal reinforce -->
                    <button class="btn btn-reinforce"
                            [disabled]="coins() < node.reinforceCost || node.lives >= node.maxLives"
                            (click)="reinforce(node)">
                      🔧 REFORZAR ({{ node.reinforceCost }}💰)
                    </button>
                    @if (node.lives < node.maxLives) {
                      <div class="reinforce-fail-info"
                           [class.warn]="reinforcePct() >= 40"
                           [class.danger]="reinforcePct() >= 60">
                        Prob. de fallo: {{ reinforcePct() }}%
                      </div>
                    }
                    <!-- RECALL -->
                    @if (hasRecall()) {
                      <button class="btn btn-recall"
                              [disabled]="coins() < abilityCost()"
                              (click)="recall()">
                        ✨ {{ recallName() }} ({{ abilityCost() }}💰)
                      </button>
                    }
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

          <!-- Inventory -->
          @if (myItems().length > 0) {
            <div class="inventory-section">
              <div class="inventory-label">INVENTARIO</div>
              <div class="inventory-icons">
                @for (item of myItems(); track $index) {
                  <img class="inv-icon"
                       [src]="ITEM_CDN + item.iconId + '.png'"
                       [title]="item.name + ' · ' + item.effect"
                       [alt]="item.name"
                       (error)="$any($event.target).src = ITEM_FALLBACK">
                }
              </div>
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

      <!-- ── ITEM SELECTION MODAL ── -->
      @if (pendingItems()) {
        <div class="modal-overlay">
          <div class="item-modal glass-panel">
            <div class="item-modal-header">
              <div class="item-modal-title">🎴 ¡Elige tu objeto!</div>
              <div class="item-modal-sub">Selecciona un objeto para potenciar tu facción.</div>
            </div>
            <div class="item-cards-row">
              @for (item of pendingItems()!; track item.id) {
                <div class="item-card glass-panel" (click)="selectItem(item)">
                  <img class="item-icon"
                       [src]="ITEM_CDN + item.iconId + '.png'"
                       [alt]="item.name"
                       (error)="$any($event.target).src = ITEM_FALLBACK">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-effect"
                       [class.effect-lives]="item.type === 'lives'"
                       [class.effect-coins]="item.type === 'coins'"
                       [class.effect-income]="item.type === 'income'"
                       [class.effect-reinforce]="item.type === 'reinforce'"
                       [class.effect-reset]="item.type === 'resetReinforce'">
                    {{ item.effect }}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── SURRENDER MODAL ── -->
      @if (showSurrenderModal()) {
        <div class="modal-overlay">
          <div class="confirm-modal glass-panel">
            <div class="confirm-icon">🏳️</div>
            <h3>¿Seguro que quieres rendirte?</h3>
            <p>Tu región será eliminada y el resto de jugadores serán notificados.</p>
            <div class="confirm-buttons">
              <button class="btn-surrender-confirm" (click)="confirmSurrender()">Rendirse</button>
              <button class="btn btn-secondary" (click)="showSurrenderModal.set(false)">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ── GAME OVER ── -->
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
    .header-left   { display: flex; align-items: center; gap: 16px; }
    .header-center { display: flex; align-items: center; gap: 12px; }
    .header-right  { display: flex; align-items: center; gap: 12px; }

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
    .round-badge { padding: 4px 12px; border-radius: 20px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: var(--accent-primary); font-size: 0.75rem; font-weight: 700; }
    .user-coins  { font-weight: 700; color: var(--accent-gold); font-size: 1rem; }
    .btn-exit    { font-size: 0.72rem; padding: 5px 10px; border: 1px solid rgba(239,68,68,0.4); color: #ef4444; background: transparent; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
    .btn-exit:hover { background: rgba(239,68,68,0.12); }
    .hide-sm { font-size: 1rem; }

    /* ── Layout ── */
    .strategy-layout { display: grid; grid-template-columns: 1fr 370px; gap: 20px; flex: 1; }

    /* ── Map ── */
    .map-viewport { position: relative; background: rgba(0,0,0,0.4); overflow: hidden; }
    .map-canvas   { position: relative; width: 100%; height: 100%; min-height: 620px; }

    .map-node-wrapper { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 4px; transform: translate(-50%, -50%); cursor: pointer; }
    .player-label { background: rgba(0,0,0,0.85); padding: 2px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; border: 1px solid rgba(255,255,255,0.08); }
    .map-node {
      width: 68px; height: 68px; border-radius: 50%;
      border: 3px solid var(--node-color, #888);
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.65); position: relative;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 0 8px color-mix(in srgb, var(--node-color, #888) 40%, transparent);
    }
    .map-node:hover  { transform: scale(1.12); }
    .map-node.selected { transform: scale(1.18); box-shadow: 0 0 0 3px var(--node-color, #888), 0 0 20px color-mix(in srgb, var(--node-color, #888) 60%, transparent); }
    .map-node.dead   { opacity: 0.3; filter: grayscale(1); cursor: default; transform: scale(1) !important; }
    .node-icon       { font-size: 2rem; line-height: 1; }
    .dead-skull      { position: absolute; font-size: 1.2rem; top: -4px; right: -4px; }

    .node-info        { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 80px; }
    .node-faction     { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; opacity: 0.7; white-space: nowrap; }
    .node-lives-bar   { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .node-lives-fill  { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .node-stats-row   { display: flex; gap: 8px; font-size: 0.62rem; font-weight: 700; }
    .node-stats-row .crit { color: #ef4444; }

    /* ── Command Center ── */
    .command-center { display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
    .panel-section  { display: flex; flex-direction: column; gap: 10px; }

    .node-header      { display: flex; align-items: center; gap: 12px; }
    .node-header-icon { font-size: 2.2rem; flex-shrink: 0; }
    .node-header h2   { font-size: 1.2rem; margin: 0; }
    .node-faction-label { font-size: 0.78rem; color: var(--accent-secondary); font-weight: 700; margin: 0; }

    .lives-display  { display: flex; flex-direction: column; gap: 4px; }
    .lives-bar-big  { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
    .lives-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
    .lives-text     { font-size: 0.82rem; font-weight: 700; }
    .lives-text.crit { color: #ef4444; }

    .node-owner  { font-size: 0.8rem; color: var(--text-muted); padding: 4px 0; }

    .action-grid { display: flex; flex-direction: column; gap: 8px; }
    .btn-attack    { padding: 11px; width: 100%; background: linear-gradient(135deg,#ef4444,#991b1b); color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.86rem; transition:opacity .2s; }
    .btn-attack:disabled { opacity:.4; cursor:not-allowed; }
    .btn-reinforce { padding: 11px; width: 100%; background: linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.86rem; transition:opacity .2s; }
    .btn-reinforce:disabled { opacity:.4; cursor:not-allowed; }

    .btn-ultimate {
      padding: 11px; width: 100%;
      background: linear-gradient(135deg,#f59e0b,#b45309);
      color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.84rem;
      transition: opacity .2s, box-shadow .2s;
      box-shadow: 0 0 12px rgba(245,158,11,0.3);
    }
    .btn-ultimate:not(:disabled):hover { box-shadow: 0 0 20px rgba(245,158,11,0.5); }
    .btn-ultimate:disabled { opacity:.4; cursor:not-allowed; box-shadow: none; }

    .btn-recall {
      padding: 11px; width: 100%;
      background: linear-gradient(135deg,#10b981,#065f46);
      color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.84rem;
      transition: opacity .2s, box-shadow .2s;
      box-shadow: 0 0 12px rgba(16,185,129,0.3);
    }
    .btn-recall:not(:disabled):hover { box-shadow: 0 0 20px rgba(16,185,129,0.5); }
    .btn-recall:disabled { opacity:.4; cursor:not-allowed; box-shadow: none; }

    .reinforce-fail-info {
      font-size: 0.74rem; font-weight: 700; text-align: center;
      padding: 3px 8px; border-radius: 6px;
      background: rgba(255,255,255,0.04); color: var(--text-muted);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .reinforce-fail-info.warn   { color: #f59e0b; border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); }
    .reinforce-fail-info.danger { color: #ef4444; border-color: rgba(239,68,68,0.3);  background: rgba(239,68,68,0.08); }

    .action-done  { padding: 10px 12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius:8px; color:#10b981; font-size:0.82rem; font-weight:700; text-align:center; }
    .waiting-turn { padding: 10px 12px; background: rgba(0,0,0,0.2); border-radius:8px; color:var(--text-muted); font-size:0.82rem; text-align:center; font-style:italic; }
    .dead-notice  { color:#ef4444; font-size:0.82rem; font-style:italic; }
    .empty-selection { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:var(--text-muted); }
    .hint-icon { font-size:2.5rem; opacity:.15; margin-bottom:10px; }

    /* ── Inventory ── */
    .inventory-section {
      padding: 8px 12px; border-radius: 10px;
      background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column; gap: 6px;
    }
    .inventory-label {
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.07em;
      color: var(--accent-gold); opacity: 0.7; text-transform: uppercase;
    }
    .inventory-icons {
      display: flex; flex-wrap: wrap; gap: 4px;
    }
    .inv-icon {
      width: 34px; height: 34px; border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.5); object-fit: contain;
      cursor: default; transition: transform 0.15s;
    }
    .inv-icon:hover { transform: scale(1.18); }

    /* ── Log ── */
    .battle-log   { flex:1; display:flex; flex-direction:column; gap:8px; min-height:0; }
    .battle-log h3 { font-size:0.75rem; color:var(--accent-gold); opacity:.8; text-transform:uppercase; letter-spacing:.05em; }
    .log-entries  { flex:1; background:rgba(0,0,0,0.2); border-radius:10px; padding:10px; overflow-y:auto; max-height:200px; display:flex; flex-direction:column; gap:4px; }
    .log-item { font-family:monospace; font-size:0.73rem; padding-bottom:3px; border-bottom:1px solid rgba(255,255,255,0.03); }
    .log-item.summary { color:var(--accent-gold); font-weight:700; border-bottom-color:rgba(200,155,60,0.2); }
    .log-time { color:var(--text-muted); margin-right:6px; opacity:.6; }

    .btn-end-turn { padding:14px; width:100%; background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:#fff; border:none; border-radius:10px; font-weight:800; font-size:0.9rem; cursor:pointer; transition:opacity .2s; margin-top:auto; }
    .btn-end-turn:disabled { opacity:.35; cursor:not-allowed; }

    /* ── Shared modal overlay ── */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); display:flex; align-items:center; justify-content:center; z-index:200; backdrop-filter:blur(4px); }

    /* ── Item modal ── */
    .item-modal { padding:36px 32px; max-width:660px; width:95%; display:flex; flex-direction:column; gap:24px; }
    .item-modal-header { text-align:center; }
    .item-modal-title  { font-size:1.4rem; font-weight:800; color:var(--accent-gold); margin-bottom:6px; }
    .item-modal-sub    { color:var(--text-muted); font-size:0.88rem; }

    .item-cards-row { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
    .item-card {
      width:170px; padding:20px 14px; display:flex; flex-direction:column;
      align-items:center; gap:10px; cursor:pointer; border-radius:14px;
      background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
      transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s, border-color 0.18s;
      text-align:center;
    }
    .item-card:hover { transform:scale(1.08) translateY(-4px); border-color:var(--accent-gold); box-shadow:0 10px 32px rgba(200,155,60,0.25); }
    .item-icon { width:64px; height:64px; border-radius:10px; border:2px solid rgba(255,255,255,0.12); object-fit:contain; background:rgba(0,0,0,0.5); }
    .item-name   { font-size:0.8rem; font-weight:800; color:white; line-height:1.3; }
    .item-effect { font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; }
    .effect-lives     { color:#10b981; background:rgba(16,185,129,0.12); }
    .effect-coins     { color:var(--accent-gold); background:rgba(200,155,60,0.12); }
    .effect-income    { color:#60a5fa; background:rgba(96,165,250,0.12); }
    .effect-reinforce { color:#a78bfa; background:rgba(167,139,250,0.12); }
    .effect-reset     { color:#f472b6; background:rgba(244,114,182,0.12); }

    /* ── Surrender modal ── */
    .confirm-modal { padding:40px 36px; max-width:380px; width:90%; text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px; }
    .confirm-icon   { font-size:3rem; }
    .confirm-modal h3 { font-size:1.2rem; margin:0; }
    .confirm-modal p  { color:var(--text-muted); font-size:0.88rem; margin:0; }
    .confirm-buttons  { display:flex; gap:12px; margin-top:8px; }
    .btn-surrender-confirm { padding:10px 22px; background:#dc2626; color:#fff; border:none; border-radius:8px; font-weight:800; cursor:pointer; font-size:0.9rem; transition:opacity .2s; }
    .btn-surrender-confirm:hover { opacity:0.85; }

    /* ── Game over ── */
    .game-over-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.88); display:flex; align-items:center; justify-content:center; z-index:200; }
    .game-over-panel   { text-align:center; padding:48px 40px; max-width:420px; width:90%; display:flex; flex-direction:column; align-items:center; gap:20px; }
    .result-icon       { font-size:4.5rem; }
    .game-over-panel h2 { font-size:2.2rem; margin:0; }
    .game-over-panel h2.victory { color:#f59e0b; }
    .game-over-panel h2.defeat  { color:#ef4444; }
    .result-msg        { color:var(--text-muted); font-size:0.95rem; }

    @media (max-width: 1100px) {
      .strategy-layout { grid-template-columns: 1fr; }
      .map-canvas { min-height: 480px; }
      .hide-sm { display: none; }
      .item-cards-row { gap: 10px; }
      .item-card { width: 145px; }
    }
  `]
})
export class Battle implements OnInit, OnDestroy {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private auth         = inject(AuthService);
  private lobbyService = inject(LobbyService);
  private ws           = inject(WebSocketService);

  readonly ITEM_CDN      = ITEM_CDN;
  readonly ITEM_FALLBACK = ITEM_FALLBACK;

  myName             = signal('');
  coins              = signal(0);
  isMyTurn           = signal(false);
  currentTurnPlayer  = signal('');
  hasActed           = signal(false);
  turnSecondsLeft    = signal(TURN_SECONDS);
  roundNumber        = signal(1);
  gameOver           = signal(false);
  isWinner           = signal(false);
  gameOverMessage    = signal('');
  showSurrenderModal = signal(false);
  pendingItems       = signal<ItemCard[] | null>(null);
  myFaction          = signal('');
  reinforceCountRaw  = signal(0);
  myItems            = signal<ItemCard[]>([]);

  reinforcePct = computed(() => Math.min(80, this.reinforceCountRaw() * 20));
  abilityCost  = computed(() => this.myFaction() === 'Tierras Perdidas' ? 5000 : 3000);
  hasUltimate  = computed(() => ULTIMATE_FACTIONS.has(this.myFaction()));
  hasRecall    = computed(() => RECALL_FACTIONS.has(this.myFaction()));
  ultimateName = computed(() => ULTIMATE_NAMES[this.myFaction()] ?? 'Ataque Definitivo');
  recallName   = computed(() => RECALL_NAMES[this.myFaction()] ?? 'Restauración');

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
    this.reinforceCountRaw.set(state.reinforceCount?.[this.myName()] ?? 0);

    // Pending item choices
    const pending = state.pendingItemChoices?.[this.myName()];
    this.pendingItems.set(pending?.length ? (pending as ItemCard[]) : null);

    // Player inventory
    const items = state.playerItems?.[this.myName()];
    this.myItems.set(items?.length ? (items as ItemCard[]) : []);

    if (turnChanged) {
      this.prevTurnPlayer = newTurnPlayer;
      this.hasActed.set(false);
      this.startTimer(state.turnStartTime ?? Date.now());
    }

    if (state.hasActedThisTurn && newTurnPlayer === this.myName()) {
      this.hasActed.set(true);
    }

    // Rebuild regions + read my faction
    const keys: string[] = Object.keys(state.regions ?? {});
    const updated: RegionNode[] = keys.map((key, i) => {
      const r   = state.regions[key];
      const pos = this.nodePositions.get(key) ?? POSITIONS[i % POSITIONS.length];
      if (r.owner === this.myName()) this.myFaction.set(r.faction ?? '');
      return {
        id: key, name: key, type: r.faction ?? key,
        owner: r.owner ?? key,
        lives: r.lives ?? 0, maxLives: r.maxLives ?? 10,
        victorias: r.victorias ?? 0, reinforceCost: r.reinforceCost ?? 280,
        icon: r.icon ?? '🛡️', color: r.color ?? '#c89b3c',
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

    if (state.status === 'FINISHED' && !this.gameOver()) {
      this.clearTimer();
      this.gameOver.set(true);
      this.lobbyService.refreshLobbies();
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

  ultimate(node: RegionNode) {
    if (!this.isMyTurn() || this.hasActed() || node.owner === this.myName()) return;
    this.hasActed.set(true);
    this.ws.sendUltimate(this.salaId, this.myName(), node.id);
  }

  recall() {
    if (!this.isMyTurn() || this.hasActed()) return;
    this.hasActed.set(true);
    this.ws.sendRecall(this.salaId, this.myName());
  }

  endTurn() {
    if (!this.isMyTurn()) return;
    this.clearTimer();
    this.ws.sendEndTurn(this.salaId, this.myName());
  }

  selectItem(item: ItemCard) {
    this.ws.sendSelectItem(this.salaId, this.myName(), item.id);
    this.pendingItems.set(null);
  }

  confirmSurrender() {
    this.showSurrenderModal.set(false);
    this.ws.sendSurrender(this.salaId, this.myName());
    this.router.navigate(['/']);
  }

  // ── Turn timer ────────────────────────────────────────────────────────────

  private startTimer(startTimeMs: number) {
    this.clearTimer();
    const update = () => {
      const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
      const left    = Math.max(0, TURN_SECONDS - elapsed);
      this.turnSecondsLeft.set(left);
      if (left === 0) {
        this.clearTimer();
        if (this.isMyTurn() && !this.gameOver()) this.endTurn();
      }
    };
    update();
    this.timerInterval = setInterval(update, 500);
  }

  private clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
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
