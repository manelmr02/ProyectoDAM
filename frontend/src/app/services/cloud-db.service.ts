import { Injectable, inject } from '@angular/core';

/**
 * CloudDbService
 * Este servicio manejará la conexión asíncrona con Firebase o Supabase.
 * Para implementar Firebase: 
 * 1. ng add @angular/fire
 * 2. Inyectar Firestore o Realtime Database aquí.
 */
@Injectable({
  providedIn: 'root'
})
export class CloudDbService {
  // Ej: private firestore = inject(Firestore);

  constructor() {
    console.log('CloudDbService initialized: Ready to integrate real-time sockets or database.');
  }

  /**
   * Ejemplo de pre-configuración asíncrona para traer info del lobby
   */
  async getLobbyData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ activePlayers: 1024, queueTime: '00:45' });
      }, 500);
    });
  }
}
