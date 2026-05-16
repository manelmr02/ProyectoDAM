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

  disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }
}
