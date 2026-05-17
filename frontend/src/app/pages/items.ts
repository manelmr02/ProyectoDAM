import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface GameItem {
  id: string;
  name: string;
  effect: string;
  iconId: number;
  type: 'lives' | 'coins' | 'income' | 'reinforce' | 'resetReinforce';
  value: number;
}

const ITEM_CDN      = 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/item/';
const ITEM_FALLBACK = 'https://placehold.co/64x64/1a1a2e/c89b3c?text=?';

const ALL_ITEMS: GameItem[] = [
  { id: 'Eclipse',          name: 'Eclipse',                effect: '+8 vida',                   type: 'lives',         iconId: 6692,  value: 8   },
  { id: 'FiloInfinito',     name: 'Filo Infinito',           effect: '+1500 oro',                 type: 'coins',         iconId: 3031,  value: 1500 },
  { id: 'SedDeSangre',      name: 'Sed de Sangre',           effect: '+150 ingreso/turno',        type: 'income',        iconId: 3072,  value: 150 },
  { id: 'EgidaLegion',      name: 'Égida de la Legión',      effect: '+7 vida',                   type: 'lives',         iconId: 3105,  value: 7   },
  { id: 'CorazonHielo',     name: 'Corazón de Hielo',        effect: '-75 oro al reforzar',       type: 'reinforce',     iconId: 3110,  value: -75 },
  { id: 'VeloBanshee',      name: 'Velo de la Banshee',      effect: 'Resetea fallo de refuerzo', type: 'resetReinforce',iconId: 3102,  value: 0   },
  { id: 'DanzarinMuerte',   name: 'Danzarín de la Muerte',   effect: '+100 ingreso/turno',        type: 'income',        iconId: 6333,  value: 100 },
  { id: 'TridentePosei',    name: 'Tridente de Poseidón',    effect: '+1000 oro',                 type: 'coins',         iconId: 3078,  value: 1000 },
  { id: 'MareaNoche',       name: 'Marea de la Noche',       effect: '+6 vida',                   type: 'lives',         iconId: 6630,  value: 6   },
  { id: 'GarraDragon',      name: 'Garra del Dragón',        effect: '+9 vida',                   type: 'lives',         iconId: 3065,  value: 9   },
  { id: 'LichBane',         name: 'Lich Bane',               effect: '+200 ingreso/turno',        type: 'income',        iconId: 3100,  value: 200 },
  { id: 'HarvesterSorrow',  name: 'Harvester of Sorrow',     effect: '+500 oro',                  type: 'coins',         iconId: 4628,  value: 500 },
  { id: 'TempestadVolteo',  name: 'Tempestad de Volteo',     effect: '+1200 oro',                 type: 'coins',         iconId: 6696,  value: 1200 },
  { id: 'Incendio',         name: 'Incendio',                effect: '-100 oro al reforzar',      type: 'reinforce',     iconId: 3165,  value: -100 },
  { id: 'JoyaGuardian',     name: 'Joya del Guardián',       effect: '+5 vida',                   type: 'lives',         iconId: 3026,  value: 5   },
  { id: 'EspirituBosque',   name: 'Espíritu del Bosque',     effect: '+8 vida',                   type: 'lives',         iconId: 3085,  value: 8   },
  { id: 'KrakenAsesino',    name: 'Kraken Asesino',          effect: '+1500 oro',                 type: 'coins',         iconId: 6672,  value: 1500 },
  { id: 'EspadaSombria',    name: 'Espada Sombría',          effect: '-50 oro al reforzar',       type: 'reinforce',     iconId: 4636,  value: -50 },
  { id: 'MortalReminder',   name: 'Mortal Reminder',         effect: '+100 ingreso/turno',        type: 'income',        iconId: 3033,  value: 100 },
  { id: 'FuerzaNatura',     name: 'Fuerza de la Naturaleza', effect: 'Resetea fallo de refuerzo', type: 'resetReinforce',iconId: 4401,  value: 0   },
  { id: 'SunfireAegis',     name: 'Sunfire Aegis',           effect: '+10 vida',                  type: 'lives',         iconId: 3068,  value: 10  },
  { id: 'GuanteleteGlac',   name: 'Guantelete Glacial',      effect: '-75 oro al reforzar',       type: 'reinforce',     iconId: 6662,  value: -75 },
  { id: 'SombreroRabadon',  name: 'Sombrero de Rabadon',     effect: '+1000 oro',                 type: 'coins',         iconId: 3089,  value: 1000 },
  { id: 'VarillaVoid',      name: 'Varilla de Void',         effect: '+150 ingreso/turno',        type: 'income',        iconId: 3135,  value: 150 },
  { id: 'LudensTempest',    name: "Luden's Tempest",          effect: '+1500 oro',                 type: 'coins',         iconId: 6655,  value: 1500 },
  { id: 'ZhonyasHourglass', name: "Zhonya's Hourglass",       effect: 'Resetea fallo de refuerzo', type: 'resetReinforce',iconId: 3157,  value: 0   },
  { id: 'Thornmail',        name: 'Thornmail',               effect: '+7 vida',                   type: 'lives',         iconId: 3076,  value: 7   },
  { id: 'WitsEnd',          name: "Wit's End",                effect: '+100 ingreso/turno',        type: 'income',        iconId: 3091,  value: 100 },
  { id: 'SteraksGage',      name: "Sterak's Gage",            effect: '+9 vida',                   type: 'lives',         iconId: 3053,  value: 9   },
  { id: 'ImmortalShield',   name: 'Immortal Shieldbow',      effect: 'Resetea fallo de refuerzo', type: 'resetReinforce',iconId: 6673,  value: 0   },
];

const TYPE_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  lives:         { label: 'Vida',           color: '#4ADE80', icon: '🛡️', desc: 'Aumentan las vidas máximas de tu región.' },
  coins:         { label: 'Oro inmediato',  color: '#FBBF24', icon: '💰', desc: 'Otorgan oro al instante para reforzar o invertir.' },
  income:        { label: 'Ingreso',        color: '#06B6D4', icon: '📈', desc: 'Aumentan el oro recibido cada turno de forma permanente.' },
  reinforce:     { label: 'Refuerzo',       color: '#C084FC', icon: '⚒️', desc: 'Reducen el coste de refuerzo de tu región.' },
  resetReinforce:{ label: 'Seguro',         color: '#FF6B6B', icon: '🔁', desc: 'Cancelan automáticamente el próximo fallo en un refuerzo.' },
};

const TYPE_ORDER: GameItem['type'][] = ['lives', 'income', 'coins', 'reinforce', 'resetReinforce'];

@Component({
  selector: 'app-items',
  imports: [RouterLink],
  template: `
    <div class="items-page animate-fade-in">

      <!-- Hero -->
      <div class="items-hero glass-panel">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <span class="hero-badge">Arsenal de Runaterra</span>
          <h1>Ítems <span class="gradient-text">de Batalla</span></h1>
          <p>Cada tres rondas recibirás uno de tres ítems al azar. Elige sabiamente: el ítem correcto puede cambiar el destino de la partida.</p>
        </div>
        <div class="item-counts">
          @for (type of typeOrder; track type) {
            <div class="count-chip" [style.border-color]="typeMeta[type].color" [style.color]="typeMeta[type].color">
              <span>{{ typeMeta[type].icon }}</span>
              <span>{{ countByType(type) }} {{ typeMeta[type].label }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar glass-panel">
        <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="activeFilter.set('all')">
          Todos ({{ allItems.length }})
        </button>
        @for (type of typeOrder; track type) {
          <button class="filter-btn"
            [class.active]="activeFilter() === type"
            [style.--btn-color]="typeMeta[type].color"
            (click)="activeFilter.set(type)">
            {{ typeMeta[type].icon }} {{ typeMeta[type].label }} ({{ countByType(type) }})
          </button>
        }
      </div>

      <!-- Category sections -->
      @for (type of typeOrder; track type) {
        @if (activeFilter() === 'all' || activeFilter() === type) {
          <div class="category-section glass-panel">
            <div class="category-header" [style.border-color]="typeMeta[type].color">
              <span class="category-icon" [style.background]="typeMeta[type].color + '22'" [style.border-color]="typeMeta[type].color">
                {{ typeMeta[type].icon }}
              </span>
              <div>
                <h2 class="category-name" [style.color]="typeMeta[type].color">{{ typeMeta[type].label }}</h2>
                <p class="category-desc">{{ typeMeta[type].desc }}</p>
              </div>
              <span class="category-count" [style.color]="typeMeta[type].color">{{ countByType(type) }} ítems</span>
            </div>

            <div class="items-grid">
              @for (item of itemsByType(type); track item.id) {
                <div class="item-card" [style.--item-color]="typeMeta[item.type].color">
                  <div class="item-icon-wrap">
                    <img [src]="ITEM_CDN + item.iconId + '.png'"
                         [alt]="item.name"
                         (error)="onImgError($event)"
                         class="item-icon">
                  </div>
                  <div class="item-info">
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-effect" [style.color]="typeMeta[item.type].color">
                      {{ typeMeta[item.type].icon }} {{ item.effect }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <div class="back-row">
        <a routerLink="/" class="btn btn-secondary">← Inicio</a>
        <a routerLink="/rangos" class="btn btn-primary">Ver rangos →</a>
      </div>
    </div>
  `,
  styles: [`
    .items-page { display: flex; flex-direction: column; gap: 24px; padding-bottom: 48px; }

    /* Hero */
    .items-hero { position: relative; overflow: hidden; padding: 0; border-radius: 20px; }
    .hero-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(6,182,212,0.08) 60%, rgba(74,222,128,0.06) 100%);
    }
    .hero-content { position: relative; z-index: 1; padding: 44px 48px 24px; }
    .hero-badge {
      display: inline-block; background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3);
      color: #FBBF24; font-size: 0.78rem; font-weight: 700; padding: 4px 14px; border-radius: 20px;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
    }
    .hero-content h1 { font-size: 2.6rem; line-height: 1.1; margin-bottom: 14px; }
    .gradient-text {
      background: linear-gradient(135deg, #FBBF24, #06B6D4, #4ADE80);
      -webkit-background-clip: text; color: transparent;
    }
    .hero-content p { color: var(--text-muted); font-size: 1rem; max-width: 580px; line-height: 1.6; }
    .item-counts {
      position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 10px;
      padding: 0 48px 36px;
    }
    .count-chip {
      display: flex; align-items: center; gap: 6px; border: 1px solid;
      background: rgba(0,0,0,0.25); padding: 6px 14px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700;
    }

    /* Filter */
    .filter-bar {
      display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 20px;
      border-radius: 14px;
    }
    .filter-btn {
      background: rgba(0,0,0,0.25); border: 1px solid var(--border-light);
      color: var(--text-muted); padding: 7px 16px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700; cursor: pointer; font-family: var(--font-heading);
      transition: all 0.2s; letter-spacing: 0.03em;
    }
    .filter-btn:hover { border-color: var(--btn-color, var(--accent-primary)); color: var(--btn-color, var(--accent-primary)); }
    .filter-btn.active { background: rgba(139,92,246,0.2); border-color: var(--accent-primary); color: var(--accent-primary); }

    /* Category */
    .category-section { border-radius: 18px; }
    .category-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
      padding-bottom: 16px; border-bottom: 1px solid;
      flex-wrap: wrap;
    }
    .category-icon {
      width: 48px; height: 48px; border-radius: 12px; border: 1px solid;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; flex-shrink: 0;
    }
    .category-name { font-size: 1.3rem; font-weight: 800; margin-bottom: 3px; }
    .category-desc { font-size: 0.82rem; color: var(--text-muted); }
    .category-count { margin-left: auto; font-size: 0.82rem; font-weight: 700; background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 20px; }

    /* Items grid */
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .item-card {
      display: flex; align-items: center; gap: 12px;
      background: rgba(0,0,0,0.25); border: 1px solid var(--border-light);
      border-radius: 12px; padding: 12px 14px;
      transition: all 0.2s; cursor: default;
    }
    .item-card:hover {
      border-color: var(--item-color);
      box-shadow: 0 0 12px color-mix(in srgb, var(--item-color) 30%, transparent);
      transform: translateY(-2px);
    }
    .item-icon-wrap {
      width: 48px; height: 48px; border-radius: 10px; overflow: hidden;
      flex-shrink: 0; background: rgba(0,0,0,0.4);
    }
    .item-icon { width: 48px; height: 48px; display: block; }
    .item-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .item-name { font-size: 0.85rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-effect { font-size: 0.75rem; font-weight: 700; }

    .back-row { display: flex; gap: 12px; justify-content: flex-end; }

    @media (max-width: 768px) {
      .hero-content { padding: 28px 20px 16px; }
      .item-counts { padding: 0 20px 24px; }
      .hero-content h1 { font-size: 2rem; }
      .items-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
      .category-count { display: none; }
    }
  `]
})
export class Items {
  readonly allItems = ALL_ITEMS;
  readonly typeMeta = TYPE_META;
  readonly typeOrder = TYPE_ORDER;
  readonly ITEM_CDN = ITEM_CDN;

  activeFilter = signal<string>('all');

  itemsByType(type: GameItem['type']): GameItem[] {
    return ALL_ITEMS.filter(i => i.type === type);
  }

  countByType(type: GameItem['type']): number {
    return ALL_ITEMS.filter(i => i.type === type).length;
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = ITEM_FALLBACK;
  }
}
