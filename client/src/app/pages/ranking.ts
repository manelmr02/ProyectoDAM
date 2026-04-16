import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ranking',
  imports: [CommonModule],
  template: `
    <div class="ranking-container animate-fade-in">
      <div class="glass-panel text-center">
        <h2>Clasificación Global</h2>
        <p class="text-muted">Los mejores estrategas de Payload</p>
      </div>

      <div class="ranking-board glass-panel">
        <table class="ranking-table">
          <thead>
            <tr>
              <th>Rango</th>
              <th>Jugador / Clan</th>
              <th>Puntos de Guerra (Elo)</th>
              <th>Ataques Realizados ⚔️</th>
              <th>Defensas Acertadas 🛡️</th>
              <th>Ratio de Precisión</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of topPlayers; let i = index" [class.top-3]="i < 3">
              <td class="rank-num">#{{ i + 1 }}</td>
              <td>
                <div class="player-col">
                  <strong>{{ p.name }}</strong>
                  <span class="clan-tag" *ngIf="p.clan">[{{ p.clan }}]</span>
                </div>
              </td>
              <td class="elo">{{ p.elo }}</td>
              <td>{{ p.attacks }}</td>
              <td>{{ p.defenses }}</td>
              <td class="ratio" [class.high-ratio]="p.ratio > 60">{{ p.ratio }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .ranking-container { display: flex; flex-direction: column; gap: 24px; padding: 24px 0; }
    .text-center { text-align: center; }
    .text-center h2 { color: var(--accent-gold); margin-bottom: 8px; }
    .ranking-board { padding: 0; overflow: hidden; overflow-x: auto; }
    
    .ranking-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 700px; }
    .ranking-table th { background: rgba(0,0,0,0.3); padding: 16px; font-family: var(--font-heading); color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
    .ranking-table td { padding: 16px; border-bottom: 1px solid var(--border-light); }
    .ranking-table tr:hover td { background: rgba(255,255,255,0.02); }
    .ranking-table tr:last-child td { border-bottom: none; }
    
    .rank-num { font-weight: 800; color: var(--accent-secondary); font-size: 1.1rem; }
    .top-3 .rank-num { color: var(--accent-gold); font-size: 1.3rem; }
    
    .player-col { display: flex; flex-direction: column; gap: 4px; }
    .player-col strong { color: var(--text-main); font-size: 1.1rem; }
    .clan-tag { font-size: 0.8rem; color: var(--accent-primary); font-weight: 600; }
    
    .elo { font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; color: white; }
    .ratio { font-weight: 700; color: var(--text-muted); }
    .ratio.high-ratio { color: var(--accent-success); }
  `]
})
export class Ranking {
  topPlayers = [
    { name: 'FakerEstratega', clan: 'Alba', elo: 2400, attacks: 150, defenses: 80, ratio: 75 },
    { name: 'Muro_Infranqueable', clan: 'Defensores', elo: 2250, attacks: 40, defenses: 200, ratio: 68 },
    { name: 'ShadowNinja', clan: 'Ninjas Oscuros', elo: 2100, attacks: 180, defenses: 20, ratio: 62 },
    { name: 'X_Destroyer_X', clan: '', elo: 1950, attacks: 110, defenses: 40, ratio: 55 },
    { name: 'ElProfeta', clan: 'Visionarios', elo: 1900, attacks: 60, defenses: 90, ratio: 58 }
  ];
}
