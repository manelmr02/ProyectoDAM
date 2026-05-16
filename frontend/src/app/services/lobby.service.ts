import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ProfanityService } from './profanity.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LobbyPlayer {
  name: string;
  clan: string;
  clanTag?: string;
  status: 'Ready' | 'Waiting';
  isOwner?: boolean;
  avatarColor: string;
  avatarImage?: string;
  faction?: string;
  regionLevel?: number;
}

export interface LobbyEntry {
  id: string; // MongoDB ID
  name: string;
  host: string;
  description: string;
  players: number;
  maxPlayers: number;
  status: 'LOBBY' | 'IN_GAME' | 'FINISHED';
  mode: string;
  hasPassword: boolean;
  password?: string;
  playerList: LobbyPlayer[];
  startReadyTime?: number | null;
}

export interface CreateLobbyDto {
  name: string;
  description: string;
  maxPlayers: number;
  mode: string;
  hasPassword: boolean;
  password?: string;
  faction?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LobbyService {
  private auth = inject(AuthService);
  private profanity = inject(ProfanityService);
  private http = inject(HttpClient);
  private readonly API_URL = 'http://51.107.3.232/api/salas';

  /** All lobbies — reactive signal */
  readonly lobbies = signal<LobbyEntry[]>([]);

  readonly activeCount = computed(
    () => this.lobbies().filter(l => l.status === 'LOBBY').length
  );

  constructor() {
    this.refreshLobbies();
    // Polling fallback cada 5s para sincronización
    setInterval(() => this.refreshLobbies(), 5000);
  }

  async refreshLobbies() {
    try {
      const data = await firstValueFrom(this.http.get<any[]>(this.API_URL));
      const mapped: LobbyEntry[] = data.map(s => this.mapToLobbyEntry(s));
      this.lobbies.set(mapped);
    } catch (error) {
      console.error('Error al cargar salas:', error);
    }
  }

  private mapToLobbyEntry(s: any): LobbyEntry {
    return {
      id: s.id,
      name: s.nombre,
      host: s.creador,
      description: s.nombre,
      players: s.jugadores?.length || 0,
      maxPlayers: s.maxJugadores,
      status: s.estado || 'LOBBY',
      mode: 'Standard',
      hasPassword: s.esPrivada,
      playerList: (s.jugadores || []).map((p: any) => ({
        name: p.nombre,
        faction: p.faction,
        status: p.status,
        avatarImage: p.avatarImage,
        avatarColor: p.avatarColor,
        isOwner: p.nombre === s.creador,
        clan: ''
      }))
    };
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async getLobbyById(id: string | number): Promise<LobbyEntry | undefined> {
    try {
      const s = await firstValueFrom(this.http.get<any>(`${this.API_URL}/${id}`));
      const mapped = this.mapToLobbyEntry(s);
      
      // Actualizamos la sala en nuestra lista local si ya existe
      this.lobbies.update(list => {
        const index = list.findIndex(l => l.id.toString() === id.toString());
        if (index !== -1) {
          const newList = [...list];
          newList[index] = mapped;
          return newList;
        }
        return [...list, mapped];
      });

      return mapped;
    } catch (e) {
      // Si falla la red o no existe, intentamos el local como último recurso
      return this.lobbies().find(l => l.id.toString() === id.toString());
    }
  }

  getUserLobby(username: string): LobbyEntry | undefined {
    return this.lobbies().find(l => l.playerList.some(p => p.name === username));
  }

  async deleteLobby(id: string | number) {
    await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
    this.refreshLobbies();
  }

  async createLobby(dto: CreateLobbyDto): Promise<LobbyEntry> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No has iniciado sesión.');

    if (this.profanity.hasProfanity(dto.name)) {
      throw new Error('El nombre de la sala contiene palabras no permitidas.');
    }

    const body = {
      nombre: dto.name,
      creador: user.username,
      maxJugadores: dto.maxPlayers,
      esPrivada: dto.hasPassword,
      password: dto.password,
      estado: 'LOBBY'
    };

    const s = await firstValueFrom(this.http.post<any>(this.API_URL, body));
    
    // Al crear, el creador debe unirse automáticamente (pasando la pass si es privada)
    return this.joinLobby(s.id, dto.password) as Promise<LobbyEntry>;
  }

  async joinLobby(id: string | number, password?: string): Promise<LobbyEntry | null> {
    const user = this.auth.currentUser();
    if (!user) return null;

    const participante = {
      nombre: user.username,
      faction: user.faction || 'Demacia',
      status: 'Waiting',
      avatarImage: user.avatarImage,
      avatarColor: user.avatarColor || '#8b5cf6'
    };

    try {
      const url = password ? `${this.API_URL}/${id}/unirse?password=${password}` : `${this.API_URL}/${id}/unirse`;
      const s = await firstValueFrom(this.http.post<any>(url, participante));
      const updated = this.mapToLobbyEntry(s);
      this.refreshLobbies();
      return updated;
    } catch (e) {
      console.error('Error al unirse:', e);
      return null;
    }
  }

  async leaveLobby(id: string | number) {
    const user = this.auth.currentUser();
    if (!user) return;

    await firstValueFrom(this.http.post(`${this.API_URL}/${id}/salir?username=${user.username}`, {}));
    this.refreshLobbies();
  }

  async updatePlayerStatus(lobbyId: string | number, playerName: string, status: 'Ready' | 'Waiting') {
    const s = await firstValueFrom(
      this.http.put<any>(`${this.API_URL}/${lobbyId}/estado?username=${playerName}&estado=${status}`, {})
    );
    
    const updated = this.mapToLobbyEntry(s);
    
    // Lógica de cuenta atrás (local por ahora, hasta tener WebSockets)
    const allReady = updated.playerList.length >= 2 && updated.playerList.every(p => p.status === 'Ready');
    if (allReady) {
      updated.startReadyTime = Date.now();
    }

    this.lobbies.update(list => list.map(l => l.id === updated.id ? updated : l));
    return updated;
  }

  async changePlayerFaction(lobbyId: string | number, playerName: string, newFaction: string, level: number) {
    // Implementar si es necesario un endpoint específico, o re-unirse con nuevos datos
    this.refreshLobbies();
  }
}
