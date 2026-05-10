import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfanityService {
  /**
   * List of banned words. In a real app, this would be much longer and possibly
   * fetched from an external source or database.
   */
  private readonly BANNED_WORDS = [
    // English
    'nigger', 'nigga', 'faggot', 'retard', 'cunt', 'pussy', 'dick', 'cock', 'bastard',
    'bitch', 'asshole', 'fuck', 'shit', 'whore', 'slut',
    // Spanish
    'maricon', 'marica', 'puta', 'puto', 'zorra', 'zorro', 'gilipollas', 'subnormal',
    'retrasado', 'cabron', 'mamon', 'pendejo', 'chinga', 'culiao', 'concha', 'coño',
    'polla', 'nabo', 'cojon', 'joder', 'mierda', 'baboso', 'estupido', 'estupida',
    // Variations / Slurs
    'n1gger', 'fagg0t', 'pvt4', 'sh1t', 'fvck'
  ];

  /**
   * Checks if a text contains any banned words (case insensitive).
   */
  hasProfanity(text: string): boolean {
    if (!text) return false;
    const normalized = text.toLowerCase();
    
    // Check for exact matches and sub-string matches with word boundaries
    return this.BANNED_WORDS.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(normalized);
    });
  }

  /**
   * Checks if a text contains any banned words as a substring (strict check).
   * Useful for usernames or tags where people might try to hide words.
   */
  containsBannedSubstring(text: string): boolean {
    if (!text) return false;
    const normalized = text.toLowerCase().replace(/\s+/g, '');
    return this.BANNED_WORDS.some(word => normalized.includes(word));
  }

  /**
   * Replaces banned words with asterisks.
   */
  filterText(text: string): string {
    if (!text) return '';
    let filtered = text;
    
    this.BANNED_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    return filtered;
  }
}
