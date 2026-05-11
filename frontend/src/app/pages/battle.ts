import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-battle',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="battle-container animate-fade-in">
      <div class="battle-header glass-panel">
        <h1>⚔️ CONQUISTA DE RUNATERRA ⚔️</h1>
        <p class="subtitle">Turno de: <span class="current-player">{{ currentPlayer() }}</span></p>
      </div>

      <div class="risk-layout">
        <!-- Mapa de Regiones (Risk Style) -->
        <div class="risk-map glass-panel">
          <div class="regions-grid">
            <div 
              *ngFor="let reg of regions()" 
              class="region-card" 
              [class.selected]="selectedRegion() === reg"
              [class.enemy]="reg.owner !== myName()"
              [class.ally]="reg.owner === myName()"
              (click)="selectRegion(reg)">
              <div class="region-bg" [style.background-image]="'url(' + reg.img + ')'"></div>
              <div class="region-overlay">
                <span class="region-name">{{ reg.name }}</span>
                <div class="region-stats">
                  <span class="owner">{{ reg.owner }}</span>
                  <span class="troops">🛡️ {{ reg.troops }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de Control -->
        <div class="control-panel glass-panel">
          <div class="panel-header">
            <h3>Centro de Mando</h3>
          </div>
          
          <div class="selected-info" *ngIf="selectedRegion()">
            <p>Región seleccionada: <strong>{{ selectedRegion()!.name }}</strong></p>
            <p>Propietario: {{ selectedRegion()!.owner }}</p>
            <p>Estado: {{ selectedRegion()!.owner === myName() ? 'Aliada' : 'Enemiga' }}</p>
            
            <div class="actions" *ngIf="isMyTurn()">
              <button 
                class="btn btn-primary" 
                *ngIf="selectedRegion()!.owner !== myName()" 
                (click)="attackRegion()">
                Lanzar Ataque
              </button>
              <button 
                class="btn btn-secondary" 
                *ngIf="selectedRegion()!.owner === myName()" 
                (click)="fortifyRegion()">
                Reforzar
              </button>
            </div>
          </div>

          <div class="battle-log">
            <div class="log-entry" *ngFor="let log of logs()">{{ log }}</div>
          </div>

          <div class="turn-actions">
            <button class="btn btn-danger-outline" (click)="endTurn()" [disabled]="!isMyTurn()">Finalizar Turno</button>
            <button class="btn btn-danger-outline" routerLink="/">SURRENDER (FF)</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .battle-container { display: flex; flex-direction: column; gap: 24px; padding: 24px; max-width: 1200px; margin: 0 auto; }
    .battle-header { text-align: center; padding: 20px; }
    .battle-header h1 { color: var(--accent-gold); font-size: 2rem; letter-spacing: 0.1em; }
    .current-player { color: var(--accent-secondary); font-weight: 800; }

    .risk-layout { display: grid; grid-template-columns: 1fr 350px; gap: 24px; }

    /* Map Styles */
    .risk-map { padding: 20px; min-height: 600px; }
    .regions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    
    .region-card { 
      position: relative; height: 120px; border-radius: 12px; overflow: hidden; 
      border: 2px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;
    }
    .region-card:hover { transform: scale(1.05); border-color: var(--accent-gold); }
    .region-card.selected { border-color: var(--accent-secondary); box-shadow: 0 0 15px var(--accent-secondary); }
    .region-card.enemy { border-left: 6px solid var(--accent-danger); }
    .region-card.ally { border-left: 6px solid var(--accent-success); }

    .region-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.6); }
    .region-overlay { position: absolute; inset: 0; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; z-index: 1; }
    .region-name { font-family: var(--font-heading); font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
    .region-stats { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; }
    .owner { color: var(--text-muted); }
    .troops { background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; color: var(--accent-gold); font-weight: 700; }

    /* Control Panel */
    .control-panel { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
    .battle-log { 
      flex: 1; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; 
      font-family: monospace; font-size: 0.8rem; overflow-y: auto; height: 200px;
      border: 1px solid var(--border-light);
    }
    .log-entry { margin-bottom: 4px; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px; }

    .selected-info { background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; border: 1px solid var(--border-light); }
    .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    .turn-actions { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }

    @media (max-width: 1000px) {
      .risk-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class Battle implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  lobbyId = signal(0);
  myName = signal('');
  currentPlayer = signal('');
  isMyTurn = signal(true);
  
  regions = signal<any[]>([]);
  selectedRegion = signal<any | null>(null);
  logs = signal<string[]>([]);

  ngOnInit() {
    this.lobbyId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.myName.set(this.auth.currentUser()?.username ?? 'Invocador');
    this.currentPlayer.set(this.myName());
    
    this.initMap();
    this.logs.set(['¡Bienvenidos a la Conquista de Runaterra!', 'Es tu turno. Selecciona una región enemiga para atacar o una aliada para reforzar.']);
  }

  initMap() {
    const list = [
      { name: 'Demacia', owner: 'Garen', troops: 5, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/demacia_creature_01.jpg' },
      { name: 'Noxus', owner: 'Darius', troops: 8, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/noxus_mountains.jpg' },
      { name: 'Ionia', owner: 'Irelia', troops: 4, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/ionia_beauty_01.jpg' },
      { name: 'Freljord', owner: 'Ashe', troops: 6, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/freljord_mountains.jpg' },
      { name: 'Shurima', owner: 'Azir', troops: 7, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/shurima_temple_01.jpg' },
      { name: 'Aguas Estancadas', owner: 'Miss Fortune', troops: 3, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/bilgewater_bay.jpg' },
      { name: 'Islas de la Sombra', owner: 'Thresh', troops: 9, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/shadow_isles_mist.jpg' },
      { name: 'Targon', owner: 'Leona', troops: 4, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/targon_mountain.jpg' },
      { name: 'Piltover', owner: 'Vi', troops: 5, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/piltover_city.jpg' },
      { name: 'Zaun', owner: 'Jinx', troops: 5, img: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/zaun_undercity.jpg' },
    ];
    
    // Assign at least one region to player for simulation
    list[0].owner = this.myName();
    list[0].troops = 10;
    
    this.regions.set(list);
  }

  selectRegion(reg: any) {
    this.selectedRegion.set(reg);
  }

  attackRegion() {
    if (!this.isMyTurn()) return;
    const reg = this.selectedRegion();
    if (!reg) return;

    this.addLog(`Atacando ${reg.name}...`);
    
    // Random outcome simulation
    const success = Math.random() > 0.5;
    if (success) {
      this.addLog(`¡Victoria! Has conquistado ${reg.name}.`);
      reg.owner = this.myName();
      reg.troops = 2;
    } else {
      this.addLog(`Derrota. El enemigo ha repelido el ataque en ${reg.name}.`);
      reg.troops = Math.max(1, reg.troops - 1);
    }
  }

  fortifyRegion() {
    const reg = this.selectedRegion();
    if (reg) {
      reg.troops += 2;
      this.addLog(`Has reforzado ${reg.name} con 2 tropas adicionales.`);
    }
  }

  endTurn() {
    this.isMyTurn.set(false);
    this.currentPlayer.set('Enemigo AI');
    this.addLog('Fin del turno. La IA está moviendo sus piezas...');
    
    setTimeout(() => {
      this.isMyTurn.set(true);
      this.currentPlayer.set(this.myName());
      this.addLog('Es tu turno de nuevo.');
    }, 2000);
  }

  private addLog(msg: string) {
    const d = new Date();
    const time = `[${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}]`;
    this.logs.update(l => [`${time} ${msg}`, ...l]);
  }
}

