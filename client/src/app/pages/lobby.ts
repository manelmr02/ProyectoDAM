import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Player { name: string; clan: string; status: 'Ready' | 'Waiting'; }
interface ChatMessage { sender?: string; text: string; time: string; system?: boolean; }

@Component({
  selector: 'app-lobby',
  imports: [CommonModule],
  template: `
    <div class="lobby-container animate-fade-in">
      <div class="lobby-header glass-panel">
        <div class="lobby-info">
          <h2>Sala: Todos contra Todos #4029</h2>
          <p class="text-muted">Esperando retadores... ({{ players.length }}/10)</p>
        </div>
        <div class="lobby-action">
          <button class="btn btn-primary" [class.btn-secondary]="isReady" (click)="toggleReady()">
            {{ isReady ? 'CANCELAR' : 'ESTOY LISTO' }}
          </button>
        </div>
      </div>

      <div class="lobby-grid">
        <!-- Player List -->
        <div class="players-panel glass-panel">
          <h3>Retadores Conectados</h3>
          <div class="player-list">
            <div class="player-item" *ngFor="let p of players">
              <div class="player-avatar"></div>
              <div class="player-details">
                <span class="player-name">{{ p.name }}</span>
                <span class="player-clan" *ngIf="p.clan">[{{ p.clan }}]</span>
              </div>
              <div class="player-status" [class.ready]="p.status === 'Ready'">
                {{ p.status }}
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Panel -->
        <div class="chat-panel glass-panel">
          <h3>Comunicaciones</h3>
          <div class="chat-messages" id="chatBox">
            <div class="msg" *ngFor="let msg of messages" [class.system-msg]="msg.system">
              <span class="msg-time">[{{ msg.time }}]</span>
              <span class="msg-sender" *ngIf="!msg.system">{{ msg.sender }}:</span>
              <span class="msg-text">{{ msg.text }}</span>
            </div>
          </div>
          <form class="chat-input-area" (submit)="sendMessage($event)">
            <input type="text" placeholder="Escribe al lobby..." #chatInput>
            <button type="submit" class="btn btn-primary btn-sm">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lobby-container { display: flex; flex-direction: column; gap: 24px; padding: 24px 0; }
    .lobby-header { display: flex; justify-content: space-between; align-items: center; }
    .lobby-header h2 { color: var(--accent-secondary); margin-bottom: 4px; }
    .lobby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; min-height: 500px; }
    
    .players-panel, .chat-panel { display: flex; flex-direction: column; gap: 16px; }
    .player-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; min-height: 300px; }
    .player-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid transparent; transition: all 0.2s; }
    .player-item:hover { background: rgba(255,255,255,0.05); }
    .player-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-panel-hover); border: 1px solid var(--accent-primary); }
    .player-details { flex: 1; display: flex; flex-direction: column; }
    .player-name { font-weight: 600; color: var(--text-main); }
    .player-clan { font-size: 0.8rem; color: var(--accent-gold); margin-top: 2px; }
    .player-status { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .player-status.ready { color: var(--accent-success); }
    
    .chat-messages { flex: 1; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; font-family: var(--font-body); font-size: 0.9rem; min-height: 250px; }
    .msg-time { color: var(--text-muted); font-size: 0.8rem; margin-right: 8px; }
    .msg-sender { font-weight: 700; color: var(--accent-primary); margin-right: 4px; }
    .system-msg { color: var(--accent-secondary); font-style: italic; }
    .system-msg .msg-sender { display: none; }
    
    .chat-input-area { display: flex; gap: 8px; margin-top: 8px; }
    .chat-input-area input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); color: white; padding: 10px; border-radius: 6px; outline: none; }
    .chat-input-area input:focus { border-color: var(--accent-secondary); }
    .btn-sm { padding: 8px 16px; font-size: 0.9rem; }
    
    @media (max-width: 768px) {
      .lobby-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class Lobby implements OnInit {
  isReady = false;
  players: Player[] = [
    { name: 'Estratega Maestro', clan: '', status: 'Waiting' }
  ];
  messages: ChatMessage[] = [
    { time: '12:00', text: 'Sala 4029 creada. Esperando jugadores.', system: true }
  ];

  ngOnInit() {
    setTimeout(() => {
      this.players.push({ name: 'ComandanteRex', clan: 'Legion de Fuego', status: 'Waiting' });
      this.messages.push({ time: this.getTime(), text: 'ComandanteRex se ha unido al lobby.', system: true });
    }, 2000);
    setTimeout(() => {
     this.messages.push({ time: this.getTime(), sender: 'ComandanteRex', text: 'Hola a todos, prepárense para caer.' });
    }, 4500);
  }

  toggleReady() {
    this.isReady = !this.isReady;
    this.players[0].status = this.isReady ? 'Ready' : 'Waiting';
  }

  sendMessage(event: Event) {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).querySelector('input');
    if (input && input.value.trim()) {
      this.messages.push({ time: this.getTime(), sender: 'Estratega Maestro', text: input.value });
      input.value = '';
    }
  }

  getTime() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }
}
