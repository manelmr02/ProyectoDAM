import { Injectable } from '@angular/core';

export interface Clan {
  id: string;
  name: string;
  tag: string;
  owner: string;
  members: string[];
}

const CLANS_KEY = 'payload_clans';

@Injectable({ providedIn: 'root' })
export class ClanService {

  getClans(): Clan[] {
    try {
      const raw = localStorage.getItem(CLANS_KEY);
      return raw ? JSON.parse(raw) as Clan[] : [];
    } catch {
      return [];
    }
  }

  saveClans(clans: Clan[]): void {
    localStorage.setItem(CLANS_KEY, JSON.stringify(clans));
  }

  getClanByTagOrName(query: string): Clan | undefined {
    if (!query) return undefined;
    const clans = this.getClans();
    const q = query.toLowerCase();
    return clans.find(c => c.tag.toLowerCase() === q || c.name.toLowerCase() === q || c.id === q);
  }
  
  createClan(name: string, tag: string, owner: string): { ok: boolean; clan?: Clan; error?: string } {
    const clans = this.getClans();
    if (clans.find(c => c.tag.toLowerCase() === tag.toLowerCase())) {
      return { ok: false, error: 'La etiqueta (Tag) de clan ya está en uso.' };
    }
    if (clans.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'Ese nombre de clan ya existe.' };
    }

    const t = tag.toUpperCase().slice(0, 4);

    const newClan: Clan = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name,
      tag: t,
      owner,
      members: [owner],
    };

    clans.push(newClan);
    this.saveClans(clans);
    return { ok: true, clan: newClan };
  }
  
  joinClan(nameOrTag: string, username: string): { ok: boolean; clan?: Clan; error?: string } {
      const clans = this.getClans();
      const q = nameOrTag.toLowerCase();
      const clanIdx = clans.findIndex(c => c.tag.toLowerCase() === q || c.name.toLowerCase() === q);
      
      if (clanIdx === -1) {
          return { ok: false, error: 'No se encontró un clan con ese nombre o tag.' };
      }
      
      if (!clans[clanIdx].members.includes(username)) {
          clans[clanIdx].members.push(username);
          this.saveClans(clans);
      }
      
      return { ok: true, clan: clans[clanIdx] };
  }
  
  leaveClan(clanName: string, username: string): void {
      const clans = this.getClans();
      const clanIdx = clans.findIndex(c => c.name === clanName);
      if (clanIdx !== -1) {
          clans[clanIdx].members = clans[clanIdx].members.filter(m => m !== username);
          if (clans[clanIdx].members.length === 0) {
              // Delete clan if empty
              clans.splice(clanIdx, 1);
          } else if (clans[clanIdx].owner === username) {
              // Reassign owner
              clans[clanIdx].owner = clans[clanIdx].members[0];
          }
          this.saveClans(clans);
      }
  }
}
