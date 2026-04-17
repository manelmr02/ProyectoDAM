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
        <h1>⚔️ COMBATE EN CURSO ⚔️</h1>
        <p class="subtitle">Sala #{{ lobbyId }} - {{ lobbyName() }}</p>
      </div>

      <div class="battle-arena glass-panel">
        <div class="visualizer">
          <div class="player-side left">
            <div class="placeholder-avatar">🛡️</div>
            <div class="name">{{ playerName() }}</div>
            <div class="hp-bar"><div class="hp-fill" style="width: 80%"></div></div>
          </div>
          <div class="vs">VS</div>
          <div class="player-side right">
            <div class="placeholder-avatar">🔥</div>
            <div class="name">Rival Desconocido</div>
            <div class="hp-bar"><div class="hp-fill" style="width: 100%"></div></div>
          </div>
        </div>
        
        <div class="battle-log">
          <div class="log-entry system">¡El combate ha comenzado!</div>
          <div class="log-entry">Estás analizando la estrategia del enemigo...</div>
          <div class="log-entry warning">El enemigo parece estar preparando un ataque masivo.</div>
        </div>

        <div class="battle-actions">
          <button class="btn btn-primary">ATACAR</button>
          <button class="btn btn-secondary">DEFENDER</button>
          <button class="btn btn-danger-outline" routerLink="/">RETIRADA</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .battle-container { display: flex; flex-direction: column; gap: 24px; padding: 40px 0; max-width: 900px; margin: 0 auto; }
    .battle-header { text-align: center; }
    .battle-header h1 { color: var(--accent-danger); font-size: 2.5rem; text-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; }

    .battle-arena { display: flex; flex-direction: column; gap: 40px; }
    .visualizer { display: flex; align-items: center; justify-content: space-between; padding: 20px; }
    .player-side { display: flex; flex-direction: column; align-items: center; gap: 12px; flex: 1; }
    .placeholder-avatar { font-size: 4rem; width: 120px; height: 120px; background: rgba(0,0,0,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--border-light); }
    .name { font-family: var(--font-heading); font-weight: 700; font-size: 1.2rem; }
    .hp-bar { width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; }
    .hp-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); transition: width 0.3s; }
    .vs { font-size: 2rem; font-weight: 900; color: var(--accent-gold); font-style: italic; margin: 0 20px; }

    .battle-log { background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; font-family: monospace; height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-light); }
    .log-entry { font-size: 0.9rem; color: #ccc; }
    .log-entry.system { color: var(--accent-secondary); font-weight: 700; }
    .log-entry.warning { color: var(--accent-gold); }

    .battle-actions { display: flex; gap: 16px; justify-content: center; }
    .btn-danger-outline { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
  `]
})
export class Battle implements OnInit {
  private route = inject(ActivatedRoute);
  private lobbyService = inject(LobbyService);
  private auth = inject(AuthService);

  lobbyId: number = 0;
  lobbyName = signal('');
  playerName = signal('');

  ngOnInit() {
    this.lobbyId = Number(this.route.snapshot.paramMap.get('id'));
    const lobby = this.lobbyService.getLobbyById(this.lobbyId);
    if (lobby) {
      this.lobbyName.set(lobby.name);
    }
    this.playerName.set(this.auth.currentUser()?.username ?? 'Héroe');
  }
}
