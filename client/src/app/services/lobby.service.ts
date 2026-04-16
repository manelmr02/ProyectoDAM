import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LobbyPlayer {
  name: string;
  clan: string;
  status: 'Ready' | 'Waiting';
  isOwner?: boolean;
  avatarColor: string;
}

export interface LobbyEntry {
  id: number;
  name: string;
  host: string;
  description: string;
  players: number;
  maxPlayers: number;
  status: 'Esperando' | 'En curso';
  mode: string;
  hasPassword: boolean;
  password?: string;
  isOwn?: boolean;
  createdAt: string;
  /** Full player list for when you're inside the lobby */
  playerList: LobbyPlayer[];
}

export interface CreateLobbyDto {
  name: string;
  description: string;
  maxPlayers: number;
  mode: string;
  hasPassword: boolean;
  password?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'payload_lobbies';
const STORAGE_VER = 'payload_lobbies_ver';
const CURRENT_VER = 2; // Incremented to force update Batalla Epica seed

const AVATAR_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#84cc16',
];

// Pool of NPC names to populate lobbies
const NPC_POOL: { name: string; clan: string }[] = [
  { name: 'ComandanteRex',   clan: 'Legion de Fuego' },
  { name: 'NightStalker',    clan: 'Sombras del Norte' },
  { name: 'ViperElite',      clan: 'Cobra Roja' },
  { name: 'ShadowMind',      clan: '' },
  { name: 'IronFalcon',      clan: 'Aguila de Hierro' },
  { name: 'GhostReaper',     clan: 'Espectros' },
  { name: 'ThunderBolt',     clan: 'Trueno Azul' },
  { name: 'DarkPhoenix',     clan: 'Ave Fenix' },
  { name: 'StealthHunter',   clan: '' },
  { name: 'CrimsonBlade',    clan: 'Filo Carmesi' },
  { name: 'NovaCaptain',     clan: 'Nova Corps' },
  { name: 'FrostWarden',     clan: '' },
];

const NPC_CHATS: { sender: string; text: string }[] = [
  { sender: 'ComandanteRex',  text: 'Prepárense para caer.' },
  { sender: 'NightStalker',   text: 'Esta vez no habrá piedad.' },
  { sender: 'IronFalcon',     text: '¿Alguien tiene estrategia?' },
  { sender: 'GhostReaper',    text: 'El mejor gana. Siempre.' },
  { sender: 'ThunderBolt',    text: 'Vamos a por todas!' },
  { sender: 'DarkPhoenix',    text: 'Primera vez aquí, pero no seré el último.' },
  { sender: 'ShadowMind',     text: 'Silencio es poder.' },
  { sender: 'CrimsonBlade',   text: 'La defensa gana campeonatos.' },
  { sender: 'NovaCaptain',    text: '¿Alguien ataca primero?' },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LobbyService {
  private auth = inject(AuthService);

  /** All lobbies — reactive signal */
  readonly lobbies = signal<LobbyEntry[]>(this.load());

  readonly activeCount = computed(
    () => this.lobbies().filter(l => l.status === 'Esperando').length
  );

  // ── Persistence ─────────────────────────────────────────────────────────────

  private load(): LobbyEntry[] {
    try {
      const ver = Number(localStorage.getItem(STORAGE_VER) ?? '0');
      const raw = localStorage.getItem(STORAGE_KEY);
      let saved: LobbyEntry[] = raw ? JSON.parse(raw) : [];

      // Migration/Reset if version changed
      if (ver < CURRENT_VER) {
        const userLobbies = saved.filter(l => l.isOwn);
        const seeds = this.seedLobbies();
        // Merge user lobbies with new seeds
        return [...userLobbies, ...seeds];
      }

      if (saved.length === 0) return this.seedLobbies();
      return saved;
    } catch {
      return this.seedLobbies();
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lobbies()));
    localStorage.setItem(STORAGE_VER, CURRENT_VER.toString());
  }

  // ── Seed (initial demo data) ─────────────────────────────────────────────────

  private seedLobbies(): LobbyEntry[] {
    const seed: LobbyEntry[] = [
      {
        id: 4029,
        name: 'Batalla Épica',
        host: 'ComandanteRex',
        description: 'Partida abierta para todos los niveles.',
        players: 4,
        maxPlayers: 10,
        status: 'Esperando',
        mode: 'Todos contra Todos',
        hasPassword: false,
        createdAt: new Date().toISOString(),
        playerList: this.buildNpcList(['ComandanteRex', 'NightStalker', 'IronFalcon', 'GhostReaper'], 'ComandanteRex'),
      },
      {
        id: 4030,
        name: 'Guerra Fría',
        host: 'NightStalker',
        description: '',
        players: 7,
        maxPlayers: 10,
        status: 'Esperando',
        mode: 'Todos contra Todos',
        hasPassword: true,
        password: '1234',
        createdAt: new Date().toISOString(),
        playerList: this.buildNpcList(
          ['NightStalker','GhostReaper','ThunderBolt','DarkPhoenix','StealthHunter','CrimsonBlade','NovaCaptain'],
          'NightStalker'
        ),
      },
      {
        id: 4028,
        name: 'Asalto Final',
        host: 'ViperElite',
        description: 'Partida avanzada, solo veteranos.',
        players: 10,
        maxPlayers: 10,
        status: 'En curso',
        mode: 'Eliminación',
        hasPassword: false,
        createdAt: new Date().toISOString(),
        playerList: this.buildNpcList(
          ['ViperElite','ShadowMind','IronFalcon','GhostReaper','ThunderBolt','DarkPhoenix','ComandanteRex','NightStalker','CrimsonBlade','NovaCaptain'],
          'ViperElite'
        ),
      },
      {
        id: 4031,
        name: 'Estrategia Oscura',
        host: 'ShadowMind',
        description: '',
        players: 2,
        maxPlayers: 6,
        status: 'Esperando',
        mode: 'Por Equipos',
        hasPassword: false,
        createdAt: new Date().toISOString(),
        playerList: this.buildNpcList(['ShadowMind','FrostWarden'], 'ShadowMind'),
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private buildNpcList(names: string[], owner: string): LobbyPlayer[] {
    return names.map((name, i) => {
      const npc = NPC_POOL.find(n => n.name === name);
      return {
        name,
        clan: npc?.clan ?? '',
        status: Math.random() > 0.5 ? 'Ready' : 'Waiting',
        isOwner: name === owner,
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      };
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  getLobbyById(id: number): LobbyEntry | undefined {
    return this.lobbies().find(l => l.id === id);
  }

  /** Returns the lobby owned by the given username, or undefined */
  getUserLobby(username: string): LobbyEntry | undefined {
    return this.lobbies().find(l => l.host === username && l.isOwn);
  }

  /** Deletes a lobby by ID (only the owner should call this) */
  deleteLobby(id: number): void {
    this.lobbies.update(list => list.filter(l => l.id !== id));
    this.save();
  }

  createLobby(dto: CreateLobbyDto): LobbyEntry {
    const user = this.auth.currentUser();
    if (!user) {
      throw new Error('No has iniciado sesión.');
    }
    const host = user.username;

    // Prevent creating multiple rooms: remove all previous owned rooms
    this.lobbies.update(list => list.filter(l => !(l.isOwn && l.host === host)));

    const authorColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const lobby: LobbyEntry = {
      id: Date.now() % 100000,
      name: dto.name,
      description: dto.description,
      host,
      players: 1,
      maxPlayers: dto.maxPlayers,
      status: 'Esperando',
      mode: dto.mode,
      hasPassword: dto.hasPassword,
      password: dto.hasPassword ? dto.password : undefined,
      isOwn: true,
      createdAt: new Date().toISOString(),
      playerList: [{
        name: host,
        clan: user?.clan ?? '',
        status: 'Waiting',
        isOwner: true,
        avatarColor: authorColor,
      }],
    };

    this.lobbies.update(list => [lobby, ...list]);
    this.save();
    return lobby;
  }

  /** Add the current user to an existing lobby (or find the first open one) */
  joinLobby(id: number): LobbyEntry | null {
    const user = this.auth.currentUser();
    if (!user) return null; // Block unauthenticated users
    const username = user.username;
    const clan     = user.clan ?? '';

    const target = this.getLobbyById(id);
    if (!target || target.status === 'En curso') return null;

    // Don't double-add
    const alreadyIn = target.playerList.some(p => p.name === username);
    if (!alreadyIn && target.players >= target.maxPlayers) return null;
    if (!alreadyIn) {
      const updated: LobbyEntry = {
        ...target,
        players: target.players + 1,
        playerList: [
          ...target.playerList,
          {
            name: username,
            clan,
            status: 'Waiting',
            isOwner: false,
            avatarColor: AVATAR_COLORS[target.playerList.length % AVATAR_COLORS.length],
          }
        ],
      };
      this.lobbies.update(list => list.map(l => l.id === id ? updated : l));
      this.save();
      return updated;
    }
    return target;
  }

  /** Removes the current user from the lobby (unless they are the host) */
  leaveLobby(id: number): void {
    const user = this.auth.currentUser();
    const username = user?.username;
    if (!username) return;

    const target = this.getLobbyById(id);
    if (!target) return;

    // A host doesn't "leave" their own room by navigating away
    if (target.host === username) return;

    const isMember = target.playerList.some(p => p.name === username);
    if (isMember) {
      const updated: LobbyEntry = {
        ...target,
        players: Math.max(0, target.players - 1),
        playerList: target.playerList.filter(p => p.name !== username),
      };
      this.lobbies.update(list => list.map(l => l.id === id ? updated : l));
      this.save();
    }
  }

  updatePlayerStatus(lobbyId: number, playerName: string, status: 'Ready' | 'Waiting'): void {
    this.lobbies.update(list =>
      list.map(l => {
        if (l.id !== lobbyId) return l;
        return {
          ...l,
          playerList: l.playerList.map(p =>
            p.name === playerName ? { ...p, status } : p
          ),
        };
      })
    );
    this.save();
  }

  /** Get a pool of NPC chat messages for a lobby's simulation */
  getNpcChats(): { sender: string; text: string }[] {
    return [...NPC_CHATS].sort(() => Math.random() - 0.5);
  }

  /** Reset to demo data (useful for dev) */
  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.lobbies.set(this.seedLobbies());
  }
}
