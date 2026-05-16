import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ProfanityService } from './profanity.service';

export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winStreak: number;
  bestWinStreak: number;
  accuracy: number;       // % of correct predictions
  totalPoints: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  clan: string;
  level: number;
  createdAt: string;
  // Extended profile fields
  avatarColor: string;
  avatarImage?: string;
  bio: string;
  title: string;
  faction: string;
  defaultFaction?: string;
  clanTag?: string;
  regionalLevels?: Record<string, number>;
  stats: UserStats;
}

const AVATAR_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#84cc16',
  '#14b8a6', '#a855f7', '#f97316', '#6366f1',
];

const TITLES = [
  'Recluta Novato', 'Estratega Aprendiz', 'Comandante en Prácticas',
  'Soldado Raso', 'Centinela', 'Táctico Junior',
];

const FACTIONS = [
  'Demacia', 'Noxus', 'Ionia', 'Freljord', 'Piltover',
  'Zaun', 'Shurima', 'Shadow Isles', 'Targon', 'Bilgewater',
  'Ixtal', 'The Void'
];

function generateDefaultProfile(): Partial<UserProfile> {
  return {
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    bio: '¡Listo para la batalla!',
    title: TITLES[Math.floor(Math.random() * TITLES.length)],
    faction: FACTIONS[Math.floor(Math.random() * FACTIONS.length)],
    regionalLevels: {
      'Demacia': 1, 'Noxus': 1, 'Ionia': 1, 'Freljord': 1, 'Piltover': 1,
      'Zaun': 1, 'Shurima': 1, 'Shadow Isles': 1, 'Targon': 1, 'Bilgewater': 1,
      'Ixtal': 1, 'The Void': 1
    },
    stats: {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
      winStreak: 0,
      bestWinStreak: 0,
      accuracy: 0,
      totalPoints: 0,
    },
  };
}

interface StoredUser extends UserProfile {
  passwordHash: string;
}

const USERS_KEY   = 'payload_users';
const SESSION_KEY = 'payload_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private profanity = inject(ProfanityService);
  private http = inject(HttpClient);
  private apiUrl = 'http://51.107.3.232/api/auth';

  // ── Reactive state ──────────────────────────────────────────────
  readonly currentUser = signal<UserProfile | null>(this.loadSession());
  readonly isLoggedIn  = computed(() => this.currentUser() !== null);

  // ── Private helpers ─────────────────────────────────────────────
  private loadSession(): UserProfile | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }

  private getUsers(): StoredUser[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /** Non-cryptographic hash — demo only, not for production */
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const chr = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(36);
  }

  private startSession(profile: UserProfile): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    this.currentUser.set(profile);
  }

  // ── Public API ──────────────────────────────────────────────────
  async register(
    username: string,
    email: string,
    password: string,
    clan = ''
  ): Promise<{ ok: boolean; error?: string }> {
    if (this.profanity.containsBannedSubstring(username)) {
      return { ok: false, error: 'El nombre de usuario contiene palabras no permitidas.' };
    }

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, { username, email, password, clan })
      );
      
      // Store token
      localStorage.setItem('token', response.token);
      
      const defaults = generateDefaultProfile();
      const profile: UserProfile = {
        ...defaults,
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        clan: response.user.clan || defaults.faction!,
        avatarColor: response.user.avatarColor || defaults.avatarColor!,
        bio: response.user.bio || defaults.bio!,
        level: response.user.level || 1,
        stats: response.user.stats || defaults.stats!
      } as UserProfile;

      this.startSession(profile);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.error?.error || 'Error al conectar con el servidor.' };
    }
  }

  async login(
    usernameOrEmail: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/login`, { usernameOrEmail, password })
      );
      
      localStorage.setItem('token', response.token);
      
      const defaults = generateDefaultProfile();
      const localUsers = this.getUsers();
      const localMatch = localUsers.find(u => u.username === response.user.username);

      const profile: UserProfile = {
        ...defaults,
        ...localMatch,
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        clan: response.user.clan || localMatch?.clan || defaults.faction!,
        avatarColor: response.user.avatarColor || localMatch?.avatarColor || defaults.avatarColor!,
        avatarImage: response.user.avatarImage || localMatch?.avatarImage,
        bio: response.user.bio || localMatch?.bio || defaults.bio!,
        level: response.user.level || 1,
        stats: response.user.stats || defaults.stats!
      } as UserProfile;

      this.startSession(profile);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.error?.error || 'Usuario o contraseña incorrectos.' };
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  /** Update profile fields (persists to localStorage) */
  updateProfile(updates: Partial<UserProfile>): { ok: boolean; error?: string } {
    const current = this.currentUser();
    if (!current) return { ok: false, error: 'No has iniciado sesión.' };

    // Filter bio if present
    if (updates.bio) {
      updates.bio = this.profanity.filterText(updates.bio);
    }
    // Filter clan if present
    if (updates.clan) {
      if (this.profanity.hasProfanity(updates.clan)) {
        return { ok: false, error: 'El nombre del clan contiene palabras no permitidas.' };
      }
    }
    // Filter clan tag if present
    if (updates.clanTag) {
      if (this.profanity.containsBannedSubstring(updates.clanTag)) {
        return { ok: false, error: 'El tag del clan contiene palabras no permitidas.' };
      }
    }

    const updated: UserProfile = { ...current, ...updates };

    // Update in users list
    const users = this.getUsers();
    const idx = users.findIndex(u => u.username === current.username);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveUsers(users);
    }

    // Update session
    this.startSession(updated);
    return { ok: true };
  }

  /** Migrates old profiles without extended fields or with legacy random stats */
  ensureProfileDefaults(profile: UserProfile): UserProfile {
    const isLegacyStats = profile.stats && profile.stats.gamesPlayed === 0 && (profile.stats.totalPoints > 0 || profile.stats.accuracy > 0);
    
    if (!profile.stats || isLegacyStats) {
      const defaults = generateDefaultProfile();
      const migrated: UserProfile = {
        ...profile,
        avatarColor: profile.avatarColor || defaults.avatarColor!,
        avatarImage: (profile as any).avatarImage || undefined,
        bio: profile.bio || defaults.bio!,
        title: profile.title || defaults.title!,
        faction: profile.faction || defaults.faction!,
        clanTag: (profile as any).clanTag || '',
        stats: defaults.stats!,
      };
      this.startSession(migrated);
      // Also update in stored users
      const users = this.getUsers();
      const idx = users.findIndex(u => u.username === profile.username);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...migrated };
        this.saveUsers(users);
      }
      return migrated;
    }
    return profile;
  }
}
