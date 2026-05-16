import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';

interface RegionNode {
  id: string;
  name: string;
  type: string;
  owner: string;
  lives: number;
  victorias: number;
  cost: number;
  icon: string;
  x: number; // percentage
  y: number; // percentage
  color: string;
}

@Component({
  selector: 'app-battle',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="battle-container animate-fade-in">
      <div class="tech-grid"></div>

      <!-- Header Strategy Bar -->
      <div class="battle-header glass-panel">
        <div class="header-left">
          <div class="turn-indicator" [class.my-turn]="isMyTurn()">
            <span class="pulse-dot"></span>
            {{ isMyTurn() ? 'TU TURNO' : 'TURNO ENEMIGO' }}
          </div>
          <h1>ESTRATEGIA DE RUNATERRA</h1>
        </div>
        <div class="header-right">
          <div class="user-coins">
            <span class="coin-icon">💰</span> {{ coins() }} Monedas
          </div>
          <button class="btn btn-secondary btn-ff" routerLink="/">SURRENDER</button>
        </div>
      </div>

      <div class="strategy-layout">
        <!-- THE STRATEGIC MAP -->
        <div class="map-viewport glass-panel">
          <div class="map-canvas">
            <!-- Connection Lines (SVG) could be added here -->
            
            <div 
              *ngFor="let node of regions()" 
              class="map-node-wrapper"
              [style.left.%]="node.x"
              [style.top.%]="node.y">
              
              <div class="player-label">{{ node.name }}</div>

              <div 
                class="map-node"
                [class.selected]="selectedId() === node.id"
                [style.border-color]="node.color"
                (click)="selectNode(node)">
                
                <span class="map-node-icon">{{ node.icon }}</span>
                <span class="map-node-name">{{ node.type }}</span>
                
                <div class="map-node-stats">
                  <span class="node-lives">🛡️ {{ node.lives }}</span>
                  <span class="node-wins">🏆 {{ node.victorias }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COMMAND CENTER (Panel derecho) -->
        <div class="command-center glass-panel">
          <div class="panel-section" *ngIf="selectedNode() as node">
            <h2 [style.color]="node.color">{{ node.name }}</h2>
            <p class="node-type">{{ node.type }} | Coste: {{ node.cost }} 💰</p>
            <div class="node-description">
              Controlada por <strong>{{ node.owner }}</strong>. 
              {{ node.owner === myName() ? 'Esta región es parte de tu territorio.' : 'Territorio hostil. Preparado para la invasión.' }}
            </div>

            <div class="action-grid" *ngIf="isMyTurn()">
              <button 
                class="btn btn-primary action-btn attack" 
                *ngIf="node.owner !== myName()" 
                [disabled]="coins() < 100"
                (click)="attack(node)">
                ⚔️ LANZAR ATAQUE
              </button>
              <button 
                class="btn btn-secondary action-btn reinforce" 
                *ngIf="node.owner === myName()" 
                [disabled]="coins() < node.cost"
                (click)="reinforce(node)">
                🛡️ REFORZAR ({{ node.cost }})
              </button>
            </div>
          </div>

          <div class="panel-section empty-selection" *ngIf="!selectedNode()">
            <span class="hint-icon">🛰️</span>
            <p>Selecciona una región en el mapa para emitir comandos de combate.</p>
          </div>

          <div class="battle-log">
            <h3>LOG DE COMBATE</h3>
            <div class="log-entries">
              <div class="log-item" *ngFor="let log of logs()">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-text">{{ log.text }}</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary end-turn-btn" (click)="endTurn()" [disabled]="!isMyTurn()">
            FINALIZAR TURNO
          </button>
        </div>
      </div>
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
      background: rgba(0,0,0,0.8); color: var(--accent-gold); padding: 2px 12px; border-radius: 4px;
      font-size: 0.75rem; font-weight: 800; border: 1px solid var(--border-light);
      text-transform: uppercase; white-space: nowrap;
    }

    .command-center { display: flex; flex-direction: column; gap: 24px; }
    .node-type { color: var(--accent-secondary); font-size: 0.85rem; font-weight: 700; margin-top: -12px; }
    .node-description { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
    
    .action-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .action-btn { width: 100%; padding: 14px; font-size: 0.9rem; }
    .action-btn.attack { background: linear-gradient(135deg, #ef4444, #991b1b); }
    
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

    @media (max-width: 1100px) {
      .strategy-layout { grid-template-columns: 1fr; }
      .map-viewport { min-height: 500px; }
    }
  `]
})
export class Battle implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private lobbyService = inject(LobbyService);

  myName = signal('');
  coins = signal(1000);
  isMyTurn = signal(true);
  
  regions = signal<RegionNode[]>([]);
  selectedId = signal<string | null>(null);
  selectedNode = computed(() => this.regions().find(r => r.id === this.selectedId()) ?? null);
  
  logs = signal<{time: string, text: string}[]>([]);

  ngOnInit() {
    this.myName.set(this.auth.currentUser()?.username ?? 'Invocador');
    this.initMap();
    this.addLog('Sistemas Hextech en línea. Iniciando despliegue de Runaterra.');
  }

  initMap() {
    const lobbyId = Number(this.route.snapshot.paramMap.get('id'));
    const lobby = this.lobbyService.getLobbyById(lobbyId);
    
    if (!lobby) {
      this.addLog('Error: No se pudo cargar la información de la sala.');
      return;
    }

    // Logical positions for up to 8 players to avoid overlaps
    const positions = [
      { x: 15, y: 25 }, { x: 75, y: 25 }, // Top Left, Top Right
      { x: 15, y: 65 }, { x: 75, y: 65 }, // Bottom Left, Bottom Right
      { x: 45, y: 15 }, { x: 45, y: 75 }, // Top Center, Bottom Center
      { x: 45, y: 45 }, { x: 75, y: 45 }  // Center, Mid Right
    ];

    const factionData: any = {
      'Demacia': { icon: '🛡️', color: 'var(--faction-demacia)' },
      'Noxus': { icon: '🪓', color: 'var(--faction-noxus)' },
      'Freljord': { icon: '❄️', color: 'var(--faction-freljord)' },
      'Ionia': { icon: '🌸', color: 'var(--faction-ionia)' },
      'Piltover': { icon: '⚙️', color: 'var(--faction-piltover)' },
      'Zaun': { icon: '🧪', color: 'var(--faction-zaun)' },
      'Shurima': { icon: '⏳', color: 'var(--faction-shurima)' },
      'Shadow Isles': { icon: '👻', color: 'var(--faction-shadow)' },
      'Targon': { icon: '☀️', color: 'var(--faction-targon)' },
      'Bilgewater': { icon: '⚓', color: 'var(--faction-bilgewater)' },
      'Ixtal': { icon: '🌿', color: 'var(--faction-ixtal)' },
      'Void': { icon: '👾', color: 'var(--faction-void)' }
    };

    const list: RegionNode[] = lobby.playerList.map((player, index) => {
      const faction = player.faction || 'Demacia';
      const data = factionData[faction] || factionData['Demacia'];
      const pos = positions[index % positions.length];
      
      return {
        id: player.name,
        name: player.name,
        type: faction,
        owner: player.name,
        lives: 5,
        victorias: 0,
        cost: 250, // Base cost
        icon: data.icon,
        x: pos.x,
        y: pos.y,
        color: data.color
      };
    });
    
    this.regions.set(list);
  }

  selectNode(node: RegionNode) {
    this.selectedId.set(node.id);
  }

  attack(node: RegionNode) {
    if (!this.isMyTurn()) return;
    const ATTACK_COST = 150;
    
    if (this.coins() < ATTACK_COST) {
      this.addLog('Monedas insuficientes para lanzar el ataque.');
      return;
    }

    this.coins.update(c => c - ATTACK_COST);
    this.addLog(`Iniciando asalto a ${node.name} (-${ATTACK_COST} 💰)...`);
    console.log(`Gasto Ataque: ${ATTACK_COST}. Monedas restantes: ${this.coins()}`);
    
    // Success simulation
    const win = Math.random() > 0.4;
    if (win) {
      const reward = 200; // RN-16.2: Ganador recibe 200
      this.coins.update(c => c + reward);
      this.addLog(`¡VICTORIA! ${node.name} conquistada. Recompensa: +${reward} 💰`);
      node.owner = this.myName();
      node.victorias++;
    } else {
      const reward = 50; // RN-16.3: Perdedor recibe 50
      this.coins.update(c => c + reward);
      this.addLog(`DERROTA en ${node.name}. Recompensa de consolación: +${reward} 💰`);
      node.lives = Math.max(0, node.lives - 1);
    }
    this.updateRegions();
  }

  reinforce(node: RegionNode) {
    if (this.coins() < node.cost) {
      this.addLog('No tienes suficientes monedas.');
      return;
    }
    
    const cost = node.cost;
    this.coins.update(c => c - cost);
    console.log(`Gasto Refuerzo: ${cost}. Monedas restantes: ${this.coins()}`);
    
    node.lives = 5; // Reset lives to max
    this.addLog(`Has reforzado ${node.name} por ${cost} monedas.`);
    this.updateRegions();
  }

  endTurn() {
    this.isMyTurn.set(false);
    this.addLog('Turno finalizado. Procesando movimientos enemigos...');
    
    setTimeout(() => {
      this.isMyTurn.set(true);
      const income = 100; // Ingreso base por ronda
      this.coins.update(c => c + income);
      this.addLog(`Es tu turno. Ingresos de ronda: +${income} 💰`);
    }, 2500);
  }

  private updateRegions() {
    this.regions.set([...this.regions()]);
  }

  private addLog(text: string) {
    const d = new Date();
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    this.logs.update(l => [{time, text}, ...l]);
  }
}
