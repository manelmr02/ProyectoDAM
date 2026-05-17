import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface RankTier {
  name: string;
  color: string;
  glow: string;
  icon: string;
  lpMin: number;
  lpMax: number | null;
  divisions: number;
  description: string;
}

const TIERS: RankTier[] = [
  { name: 'Hierro',    color: '#8B7355', glow: 'rgba(139,115,85,0.4)',   icon: '⚙️',  lpMin: 0,    lpMax: 399,  divisions: 4, description: 'El punto de partida. Cada invocador comienza aquí, forjando su camino hacia la gloria.' },
  { name: 'Bronce',   color: '#CD7F32', glow: 'rgba(205,127,50,0.4)',   icon: '🥉',  lpMin: 400,  lpMax: 799,  divisions: 4, description: 'Los primeros pasos hacia la maestría. El instinto comienza a tomar forma.' },
  { name: 'Plata',    color: '#94A3B8', glow: 'rgba(148,163,184,0.4)',  icon: '🥈',  lpMin: 800,  lpMax: 1199, divisions: 4, description: 'Invocadores con talento emergente. La estrategia empieza a diferenciarse del caos.' },
  { name: 'Oro',      color: '#FBBF24', glow: 'rgba(251,191,36,0.4)',   icon: '🥇',  lpMin: 1200, lpMax: 1599, divisions: 4, description: 'Competidores serios. La mitad superior del campo de batalla.' },
  { name: 'Platino',  color: '#22D3EE', glow: 'rgba(34,211,238,0.4)',   icon: '💎',  lpMin: 1600, lpMax: 1999, divisions: 4, description: 'Élite táctica. Solo el 15% de los jugadores alcanza esta categoría.' },
  { name: 'Esmeralda',color: '#4ADE80', glow: 'rgba(74,222,128,0.4)',   icon: '💚',  lpMin: 2000, lpMax: 2399, divisions: 4, description: 'Maestros de la región. Dominio completo de las mecánicas avanzadas.' },
  { name: 'Diamante', color: '#93C5FD', glow: 'rgba(147,197,253,0.4)',  icon: '🔷',  lpMin: 2400, lpMax: 2799, divisions: 4, description: 'La cima del juego clasificatorio. Menos del 3% de jugadores.' },
  { name: 'Maestro',  color: '#C084FC', glow: 'rgba(192,132,252,0.4)',  icon: '👑',  lpMin: 2800, lpMax: 3199, divisions: 1, description: 'Invocadores de élite absoluta. Sin divisiones: la lucha es continua.' },
  { name: 'Gran Maestro', color: '#FF6B6B', glow: 'rgba(255,107,107,0.4)', icon: '🔥', lpMin: 3200, lpMax: 3599, divisions: 1, description: 'Los cien mejores del servidor. Cada LP cuenta.' },
  { name: 'Challenger', color: '#F4D03F', glow: 'rgba(244,208,63,0.5)', icon: '🏆', lpMin: 3600, lpMax: null, divisions: 1, description: 'El rango más alto. La élite de la élite. Solo los mejores de Runaterra.' },
];

const DIVISIONS = ['IV', 'III', 'II', 'I'];

@Component({
  selector: 'app-ranks',
  imports: [RouterLink],
  template: `
    <div class="ranks-page animate-fade-in">

      <!-- Hero -->
      <div class="ranks-hero glass-panel">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <span class="hero-badge">Sistema de rangos</span>
          <h1>La Escalada <span class="gradient-text">hacia el Poder</span></h1>
          <p>Desde las fraguas del Hierro hasta el trono del Challenger. Cada victoria en Runaterra te acerca a la cima.</p>
        </div>
        <div class="lp-explainer">
          <div class="lp-card">
            <div class="lp-icon">⚔️</div>
            <div class="lp-value win">+30 LP</div>
            <div class="lp-label">por victoria</div>
          </div>
          <div class="lp-sep">VS</div>
          <div class="lp-card">
            <div class="lp-icon">💀</div>
            <div class="lp-value loss">-10 LP</div>
            <div class="lp-label">por derrota</div>
          </div>
        </div>
      </div>

      <!-- LP rules -->
      <div class="rules-section glass-panel">
        <h2 class="section-title"><span class="title-accent">|</span> ¿Cómo funcionan los LP?</h2>
        <div class="rules-grid">
          <div class="rule-card">
            <div class="rule-icon">📊</div>
            <h4>400 LP por rango</h4>
            <p>Cada rango (Hierro → Diamante) abarca 400 LP divididos en 4 divisiones de 100 LP cada una.</p>
          </div>
          <div class="rule-card">
            <div class="rule-icon">⬆️</div>
            <h4>Divisiones dentro del rango</h4>
            <p>Cada rango tiene 4 divisiones: IV, III, II y I. Subes de división al acumular 100 LP.</p>
          </div>
          <div class="rule-card">
            <div class="rule-icon">🏅</div>
            <h4>Rangos especiales</h4>
            <p>Maestro, Gran Maestro y Challenger no tienen divisiones. El ranking es continuo y en tiempo real.</p>
          </div>
          <div class="rule-card">
            <div class="rule-icon">🛡️</div>
            <h4>Mínimo 0 LP</h4>
            <p>Los LP nunca bajan de 0. Las derrotas en la división IV de un rango no te hacen descender.</p>
          </div>
        </div>
      </div>

      <!-- Visual rank ladder -->
      <div class="ladder-section glass-panel">
        <h2 class="section-title"><span class="title-accent">|</span> Escalera de Rangos</h2>
        <div class="ladder">
          @for (tier of tiers; track tier.name; let i = $index) {
            <div class="ladder-tier" [style.--tier-color]="tier.color" [style.--tier-glow]="tier.glow">
              <div class="tier-bar" [style.width.%]="tierBarWidth(tier)" [style.background]="tier.color"></div>
              <div class="tier-content">
                <div class="tier-left">
                  <span class="tier-icon">{{ tier.icon }}</span>
                  <div>
                    <div class="tier-name" [style.color]="tier.color">{{ tier.name }}</div>
                    <div class="tier-lp-range">
                      {{ tier.lpMin }} LP
                      @if (tier.lpMax) { — {{ tier.lpMax }} LP }
                      @else { + (sin límite) }
                    </div>
                  </div>
                </div>
                <div class="tier-divisions">
                  @if (tier.divisions === 4) {
                    @for (div of divisions; track div) {
                      <span class="div-chip" [style.border-color]="tier.color" [style.color]="tier.color">
                        {{ tier.name }} {{ div }}
                      </span>
                    }
                  } @else {
                    <span class="div-chip special" [style.border-color]="tier.color" [style.color]="tier.color">
                      Sin divisiones
                    </span>
                  }
                </div>
                <div class="tier-desc">{{ tier.description }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- LP chart -->
      <div class="chart-section glass-panel">
        <h2 class="section-title"><span class="title-accent">|</span> Distribución de LP por Rango</h2>
        <div class="chart-bars">
          @for (tier of tiersForChart; track tier.name) {
            <div class="chart-col">
              <div class="chart-bar-wrap">
                <div class="chart-bar"
                  [style.height.%]="tier.heightPct"
                  [style.background]="chartBarStyle(tier)"
                  [style.box-shadow]="'0 0 12px ' + tier.glow">
                  <span class="chart-lp">{{ tier.lpMin }}</span>
                </div>
              </div>
              <div class="chart-label" [style.color]="tier.color">{{ tier.icon }}</div>
              <div class="chart-name">{{ tier.name }}</div>
            </div>
          }
        </div>
        <div class="chart-legend">
          <span class="legend-item">⬆️ Eje vertical = LP mínimo para alcanzar el rango</span>
        </div>
      </div>

      <!-- Tips -->
      <div class="tips-section glass-panel">
        <h2 class="section-title"><span class="title-accent">|</span> Consejos para Subir</h2>
        <div class="tips-grid">
          <div class="tip-card">
            <span class="tip-num">01</span>
            <h4>Consistencia ante todo</h4>
            <p>Con +30 LP por victoria y -10 por derrota, ganar 1 de cada 4 partidas ya es rentable en LP.</p>
          </div>
          <div class="tip-card">
            <span class="tip-num">02</span>
            <h4>Domina tu región</h4>
            <p>Jugar siempre la misma región sube tu maestría regional, desbloqueando ventajas tácticas.</p>
          </div>
          <div class="tip-card">
            <span class="tip-num">03</span>
            <h4>Ítems de economía</h4>
            <p>Los ítems de ingreso (+oro/turno) son los más valiosos a largo plazo. Priorízalos.</p>
          </div>
          <div class="tip-card">
            <span class="tip-num">04</span>
            <h4>Aprende los ultes</h4>
            <p>Cada facción tiene una habilidad especial. Conocerlas marca la diferencia en los turnos clave.</p>
          </div>
        </div>
      </div>

      <div class="back-row">
        <a routerLink="/" class="btn btn-secondary">← Volver al inicio</a>
        <a routerLink="/ranking" class="btn btn-primary">Ver clasificación →</a>
      </div>
    </div>
  `,
  styles: [`
    .ranks-page { display: flex; flex-direction: column; gap: 28px; padding-bottom: 48px; }

    /* Hero */
    .ranks-hero { position: relative; overflow: hidden; padding: 0; border-radius: 20px; }
    .hero-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(244,208,63,0.08) 60%, rgba(255,107,107,0.06) 100%);
    }
    .hero-content { position: relative; z-index: 1; padding: 44px 48px 32px; }
    .hero-badge {
      display: inline-block; background: rgba(244,208,63,0.15); border: 1px solid rgba(244,208,63,0.3);
      color: #F4D03F; font-size: 0.78rem; font-weight: 700; padding: 4px 14px; border-radius: 20px;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
    }
    .hero-content h1 { font-size: 2.8rem; line-height: 1.1; margin-bottom: 14px; }
    .gradient-text {
      background: linear-gradient(135deg, #F4D03F, #FF6B6B, #C084FC);
      -webkit-background-clip: text; color: transparent;
    }
    .hero-content p { color: var(--text-muted); font-size: 1.05rem; max-width: 560px; line-height: 1.6; }
    .lp-explainer {
      position: relative; z-index: 1; display: flex; align-items: center; gap: 20px;
      padding: 0 48px 44px;
    }
    .lp-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; padding: 20px 32px;
    }
    .lp-icon { font-size: 1.8rem; }
    .lp-value { font-family: var(--font-heading); font-size: 2rem; font-weight: 800; }
    .lp-value.win  { color: #4ADE80; }
    .lp-value.loss { color: #F87171; }
    .lp-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .lp-sep { font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--text-muted); }

    /* Rules */
    .section-title { font-size: 1.5rem; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .title-accent { width: 4px; height: 26px; background: var(--accent-primary); border-radius: 2px; display: inline-block; }
    .rules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .rule-card {
      background: rgba(0,0,0,0.25); border: 1px solid var(--border-light);
      border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 8px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .rule-card:hover { transform: translateY(-3px); border-color: rgba(139,92,246,0.3); }
    .rule-icon { font-size: 1.6rem; }
    .rule-card h4 { font-size: 0.95rem; font-weight: 700; color: var(--accent-secondary); }
    .rule-card p { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }

    /* Ladder */
    .ladder { display: flex; flex-direction: column; gap: 10px; }
    .ladder-tier {
      position: relative; border-radius: 12px; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ladder-tier:hover { transform: translateX(4px); box-shadow: 0 0 16px var(--tier-glow); }
    .tier-bar {
      position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      border-radius: 4px 0 0 4px;
    }
    .tier-content {
      display: grid; grid-template-columns: 220px 1fr 1fr;
      align-items: center; gap: 16px; padding: 14px 16px 14px 24px;
    }
    .tier-left { display: flex; align-items: center; gap: 14px; }
    .tier-icon { font-size: 1.6rem; }
    .tier-name { font-family: var(--font-heading); font-weight: 800; font-size: 1.05rem; }
    .tier-lp-range { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .tier-divisions { display: flex; flex-wrap: wrap; gap: 6px; }
    .div-chip {
      font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px;
      border: 1px solid; background: rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .div-chip.special { font-style: italic; }
    .tier-desc { font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; }

    /* Chart */
    .chart-bars {
      display: flex; align-items: flex-end; gap: 10px; height: 240px;
      background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px 20px 0;
      border: 1px solid var(--border-light);
    }
    .chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; }
    .chart-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
    .chart-bar {
      width: 100%; border-radius: 6px 6px 0 0; position: relative;
      display: flex; align-items: flex-start; justify-content: center;
      min-height: 8px; transition: height 0.6s cubic-bezier(0.34,1.56,0.64,1);
    }
    .chart-lp { font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.7); padding-top: 4px; }
    .chart-label { font-size: 1.1rem; padding: 4px 0 2px; }
    .chart-name { font-size: 0.6rem; color: var(--text-muted); text-align: center; white-space: nowrap; font-weight: 700; }
    .chart-legend { margin-top: 12px; font-size: 0.78rem; color: var(--text-muted); text-align: center; }

    /* Tips */
    .tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .tip-card {
      background: rgba(0,0,0,0.2); border: 1px solid var(--border-light);
      border-radius: 14px; padding: 20px 20px 20px 16px; display: flex; flex-direction: column; gap: 8px;
      border-left: 3px solid var(--accent-primary); transition: transform 0.2s;
    }
    .tip-card:hover { transform: translateY(-3px); }
    .tip-num { font-family: var(--font-heading); font-size: 0.72rem; color: var(--accent-primary); letter-spacing: 0.12em; font-weight: 800; }
    .tip-card h4 { font-size: 0.95rem; color: var(--text-main); }
    .tip-card p { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }

    .back-row { display: flex; gap: 12px; justify-content: flex-end; }

    @media (max-width: 900px) {
      .hero-content { padding: 32px 24px 20px; }
      .lp-explainer { padding: 0 24px 32px; }
      .hero-content h1 { font-size: 2rem; }
      .tier-content { grid-template-columns: 1fr; gap: 8px; padding: 12px 12px 12px 20px; }
      .tier-divisions { display: none; }
      .chart-bars { height: 160px; }
      .chart-lp { display: none; }
    }
  `]
})
export class Ranks {
  readonly tiers = TIERS;
  readonly divisions = DIVISIONS;

  readonly tiersForChart = TIERS.map(t => ({
    ...t,
    heightPct: t.lpMax ? Math.round(((t.lpMax + 1) / 3600) * 100) : 100,
  }));

  tierBarWidth(tier: RankTier): number {
    if (!tier.lpMax) return 100;
    const total = 3600;
    return Math.min(100, Math.round(((tier.lpMax + 1) / total) * 100));
  }

  chartBarStyle(tier: any): string {
    return `linear-gradient(180deg, ${tier.color}, ${tier.color}55)`;
  }
}
