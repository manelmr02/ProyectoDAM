import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client;
  private readonly WS_URL = 'ws://51.107.3.232/ws';

  constructor() {
    this.client = new Client({
      brokerURL: this.WS_URL,
      reconnectDelay: 5000,
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client.connected) {
        resolve();
        return;
      }
      this.client.onConnect = () => resolve();
      this.client.onStompError = frame => reject(frame);
      if (!this.client.active) {
        this.client.activate();
      }
    });
  }

  subscribeToSala(salaId: string | number, callback: (data: any) => void): StompSubscription {
    return this.client.subscribe(`/topic/sala/${salaId}`, msg => {
      callback(JSON.parse(msg.body));
    });
  }

  subscribeToChat(salaId: string | number, callback: (msg: any) => void): StompSubscription {
    return this.client.subscribe(`/topic/sala/${salaId}/chat`, msg => {
      callback(JSON.parse(msg.body));
    });
  }

  sendChat(salaId: string | number, message: { sender: string; text: string; time: string }): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/sala/${salaId}/chat`,
      body: JSON.stringify(message)
    });
  }

  // --- Game (partida) methods ---

  subscribeToPartida(salaId: string, callback: (state: any) => void): StompSubscription {
    return this.client.subscribe(`/topic/partida/${salaId}`, msg => {
      callback(JSON.parse(msg.body));
    });
  }

  joinGame(salaId: string, player: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/join`,
      body: JSON.stringify({ type: 'JOIN', player })
    });
  }

  sendAttack(salaId: string, player: string, target: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/attack`,
      body: JSON.stringify({ type: 'ATTACK', player, target })
    });
  }

  sendReinforce(salaId: string, player: string, target: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/reinforce`,
      body: JSON.stringify({ type: 'REINFORCE', player, target })
    });
  }

  sendEndTurn(salaId: string, player: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/endTurn`,
      body: JSON.stringify({ type: 'END_TURN', player })
    });
  }

  sendSelectItem(salaId: string, player: string, itemId: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/selectItem`,
      body: JSON.stringify({ type: 'SELECT_ITEM', player, target: itemId })
    });
  }

  sendUltimate(salaId: string, player: string, target: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/ultimate`,
      body: JSON.stringify({ type: 'ULTIMATE', player, target })
    });
  }

  sendRecall(salaId: string, player: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/recall`,
      body: JSON.stringify({ type: 'RECALL', player })
    });
  }

  sendSurrender(salaId: string, player: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/partida/${salaId}/surrender`,
      body: JSON.stringify({ type: 'SURRENDER', player })
    });
  }

  disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }
}
