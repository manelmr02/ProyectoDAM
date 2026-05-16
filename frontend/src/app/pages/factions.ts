import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FactionInfo {
  name: string;
  icon: string;
  color: string;
  lore: string;
  maxLives: number;
  startCoins: number;
  income: number;
  attackBonus: number;
  reinforceCost: number;
  playstyle: string;
  strengths: string[];
  weaknesses: string[];
}

const FACTIONS: FactionInfo[] = [
  {
    name: 'Demacia',
    icon: '🛡️',
    color: '#c89b3c',
    lore: 'Una nación gobernada por el honor y la justicia, donde la magia está estrictamente prohibida. Sus ejércitos son legendarios por su disciplina y resistencia en el campo de batalla.',
    maxLives: 12,
    startCoins: 1000,
    income: 100,
    attackBonus: 0,
    reinforceCost: 200,
    playstyle: 'Defensor Equilibrado',
    strengths: ['Vidas altas (12)', 'Refuerzo barato (200💰)', 'Monedas iniciales sólidas'],
    weaknesses: ['Sin bonificación de ataque', 'Ingresos estándar']
  },
  {
    name: 'Noxus',
    icon: '🪓',
    color: '#c0392b',
    lore: 'Imperio forjado en la conquista y el poder. Solo los más fuertes prosperan en Noxus, donde la fuerza bruta y la ambición dictan el destino de las naciones.',
    maxLives: 8,
    startCoins: 800,
    income: 100,
    attackBonus: 25,
    reinforceCost: 300,
    playstyle: 'Agresor Puro',
    strengths: ['+25% tasa de éxito en ataque', 'Ideal para presión constante'],
    weaknesses: ['Pocas vidas (8)', 'Poco dinero inicial', 'Refuerzo costoso']
  },
  {
    name: 'Freljord',
    icon: '❄️',
    color: '#5dade2',
    lore: 'Tierras heladas del norte donde solo los más duros sobreviven. Los guerreros del Freljord son resistentes como el hielo eterno, capaces de aguantar asedios interminables.',
    maxLives: 15,
    startCoins: 700,
    income: 80,
    attackBonus: -10,
    reinforceCost: 180,
    playstyle: 'Fortaleza Inexpugnable',
    strengths: ['Máximas vidas del juego (15)', 'Refuerzo muy barato (180💰)', 'Extremadamente difícil de eliminar'],
    weaknesses: ['-10% tasa de ataque', 'Ingresos lentos (80💰/turno)', 'Poco dinero inicial']
  },
  {
    name: 'Ionia',
    icon: '🌸',
    color: '#e91e8c',
    lore: 'La nación más espiritual de Runeterra, en perfecta armonía con las corrientes de magia. Los ionianos usan su conexión mística para potenciar su economía y resistencia.',
    maxLives: 10,
    startCoins: 1000,
    income: 160,
    attackBonus: 0,
    reinforceCost: 280,
    playstyle: 'Economista Espiritual',
    strengths: ['Ingresos muy altos (160💰/turno)', 'Vidas equilibradas', 'Buen dinero inicial'],
    weaknesses: ['Sin bonificación de ataque', 'Refuerzo moderado']
  },
  {
    name: 'Piltover',
    icon: '⚙️',
    color: '#f39c12',
    lore: 'La ciudad del progreso donde la tecnología hextech lo domina todo. Piltover convierte el conocimiento en oro — sus científicos son los más ricos del continente, aunque no los más bravos.',
    maxLives: 9,
    startCoins: 1500,
    income: 160,
    attackBonus: -15,
    reinforceCost: 350,
    playstyle: 'Magnate Científico',
    strengths: ['Más monedas iniciales (1500💰)', 'Ingresos altos (160💰/turno)', 'Puede reforzar muchas veces'],
    weaknesses: ['-15% tasa de ataque (el más bajo)', 'Pocas vidas (9)', 'Refuerzo caro']
  },
  {
    name: 'Zaun',
    icon: '🧪',
    color: '#27ae60',
    lore: 'Ciudad subterránea de smog y experimentos peligrosos. Los ciudadanos de Zaun sobreviven con ingenio y veneno, desarrollando técnicas de combate únicas basadas en la química.',
    maxLives: 10,
    startCoins: 900,
    income: 130,
    attackBonus: 10,
    reinforceCost: 240,
    playstyle: 'Guerrero Versátil',
    strengths: ['+10% tasa de ataque', 'Buen equilibrio entre todo', 'Refuerzo asequible'],
    weaknesses: ['Sin especialización extrema', 'Monedas iniciales bajas']
  },
  {
    name: 'Shurima',
    icon: '⏳',
    color: '#f1c40f',
    lore: 'Antiguo imperio que despertó de entre las arenas del tiempo. Los guerreros de Shurima invocan el poder solar de los Dioses Ascendidos para amplificar su fuerza ofensiva.',
    maxLives: 10,
    startCoins: 1000,
    income: 100,
    attackBonus: 15,
    reinforceCost: 280,
    playstyle: 'Conquistador Sólido',
    strengths: ['+15% tasa de ataque', 'Estadísticas equilibradas', 'Fácil de aprender'],
    weaknesses: ['Ingresos bajos', 'Sin ventaja defensiva']
  },
  {
    name: 'Shadow Isles',
    icon: '👻',
    color: '#8e44ad',
    lore: 'Reino de los no muertos donde la Bruma Negra consume toda vida. Sus campeones libran batallas con poder sobrenatural, destruyendo al enemigo con golpes devastadores pero a gran coste.',
    maxLives: 8,
    startCoins: 700,
    income: 80,
    attackBonus: 30,
    reinforceCost: 400,
    playstyle: 'Todo o Nada',
    strengths: ['+30% tasa de ataque (segundo más alto)', 'Letales en ataque'],
    weaknesses: ['Pocas vidas (8)', 'Menos ingresos', 'Refuerzo muy caro (400💰)', 'Poco dinero inicial']
  },
  {
    name: 'Targon',
    icon: '☀️',
    color: '#e8d5a3',
    lore: 'La cima de la montaña donde los mortales se convierten en semidioses. Los Aspectos de Targon canalizan el poder estelar en defensas casi impenetrables.',
    maxLives: 13,
    startCoins: 800,
    income: 90,
    attackBonus: 0,
    reinforceCost: 280,
    playstyle: 'Defensor Celestial',
    strengths: ['Muchas vidas (13)', 'Muy difícil de eliminar', 'Resistencia natural'],
    weaknesses: ['Sin bonificación de ataque', 'Ingresos bajos', 'Pocas monedas iniciales']
  },
  {
    name: 'Bilgewater',
    icon: '⚓',
    color: '#2980b9',
    lore: 'Puerto de piratas y cazarrecompensas donde el dinero habla más que las espadas. Los bucaneros de Bilgewater combinan riqueza y combate para dominar los mares y tierra firme.',
    maxLives: 10,
    startCoins: 1200,
    income: 140,
    attackBonus: 10,
    reinforceCost: 250,
    playstyle: 'Pirata Oportunista',
    strengths: ['Buen dinero inicial (1200💰)', 'Ingresos altos (140💰/turno)', '+10% ataque', 'Muy versátil'],
    weaknesses: ['Sin ventaja extrema en nada']
  },
  {
    name: 'Ixtal',
    icon: '🌿',
    color: '#1abc9c',
    lore: 'Nación oculta en la jungla profunda, maestra de los elementos naturales. Los ixtalanos usan sus técnicas elementales para generar riqueza constante y aprovecharla en la batalla.',
    maxLives: 10,
    startCoins: 1000,
    income: 150,
    attackBonus: 5,
    reinforceCost: 240,
    playstyle: 'Máquina de Ingresos',
    strengths: ['Ingresos muy altos (150💰/turno)', 'Refuerzo barato (240💰)', '+5% ataque', 'Excelente para partidas largas'],
    weaknesses: ['Sin ventaja inicial destacada']
  },
  {
    name: 'Void',
    icon: '👾',
    color: '#9b59b6',
    lore: 'Dimensión de destrucción pura que consume la realidad. Las criaturas del Vacío no conocen el miedo ni el dolor — solo el aniquilamiento total. La facción más peligrosa y frágil del juego.',
    maxLives: 6,
    startCoins: 1500,
    income: 170,
    attackBonus: 35,
    reinforceCost: 500,
    playstyle: 'Destrucción Absoluta',
    strengths: ['+35% tasa de ataque (el más alto)', 'Más ingresos por turno (170💰)', 'Monedas iniciales altas (1500💰)'],
    weaknesses: ['Vidas mínimas (6 — muere muy rápido)', 'Refuerzo prohibitivo (500💰)', 'Necesita matar antes de ser atacado']
  }
];

@Component({
  selector: 'app-factions',
  imports: [RouterLink],
  template: `
    <div class="factions-page animate-fade-in">
      <div class="tech-grid"></div>

      <div class="page-header glass-panel">
        <div class="header-content">
          <h1>CONOCE LAS <span class="highlight">REGIONES</span></h1>
          <p class="header-sub">Cada facción de Runeterra tiene fortalezas y debilidades únicas. Elige sabiamente, Invocador.</p>
        </div>
        <a routerLink="/" class="btn btn-secondary back-btn">← Volver al inicio</a>
      </div>

      <div class="stats-legend glass-panel">
        <span class="legend-title">Leyenda de stats:</span>
        <span class="legend-item">🛡️ Vidas máx</span>
        <span class="legend-item">💰 Monedas iniciales</span>
        <span class="legend-item">📈 Ingresos/turno</span>
        <span class="legend-item">⚔️ Bonus ataque</span>
        <span class="legend-item">🔧 Coste refuerzo</span>
      </div>

      <div class="factions-grid">
        @for (f of factions; track f.name) {
          <div class="faction-card glass-panel" [style.--faction-color]="f.color">
            <div class="card-banner" [style.background]="'linear-gradient(135deg, ' + f.color + '22, ' + f.color + '08)'">
              <div class="card-icon">{{ f.icon }}</div>
              <div class="card-title-group">
                <h2 [style.color]="f.color">{{ f.name }}</h2>
                <span class="playstyle-badge" [style.border-color]="f.color" [style.color]="f.color">{{ f.playstyle }}</span>
              </div>
            </div>

            <p class="lore-text">{{ f.lore }}</p>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">🛡️ Vidas</span>
                <div class="stat-bar-wrap">
                  <div class="stat-bar" [style.width.%]="f.maxLives / 15 * 100" [style.background]="f.color"></div>
                </div>
                <span class="stat-val">{{ f.maxLives }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">💰 Inicio</span>
                <div class="stat-bar-wrap">
                  <div class="stat-bar" [style.width.%]="f.startCoins / 1500 * 100" [style.background]="f.color"></div>
                </div>
                <span class="stat-val">{{ f.startCoins }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">📈 Ingreso</span>
                <div class="stat-bar-wrap">
                  <div class="stat-bar" [style.width.%]="f.income / 170 * 100" [style.background]="f.color"></div>
                </div>
                <span class="stat-val">{{ f.income }}/turno</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">⚔️ Ataque</span>
                <div class="stat-bar-wrap">
                  <div class="stat-bar atk"
                    [style.width.%]="getAtkBarWidth(f.attackBonus)"
                    [style.background]="f.attackBonus >= 0 ? f.color : '#ef4444'"></div>
                </div>
                <span class="stat-val" [class.positive]="f.attackBonus > 0" [class.negative]="f.attackBonus < 0">
                  {{ f.attackBonus > 0 ? '+' : '' }}{{ f.attackBonus }}%
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">🔧 Refuerzo</span>
                <div class="stat-bar-wrap">
                  <div class="stat-bar refuerzo"
                    [style.width.%]="(1 - (f.reinforceCost - 180) / 320) * 100"
                    [style.background]="f.color"></div>
                </div>
                <span class="stat-val">{{ f.reinforceCost }}💰</span>
              </div>
            </div>

            <div class="pros-cons">
              <div class="pros">
                <span class="pros-title">✅ Ventajas</span>
                @for (s of f.strengths; track s) {
                  <span class="pro-item">{{ s }}</span>
                }
              </div>
              <div class="cons">
                <span class="cons-title">❌ Desventajas</span>
                @for (w of f.weaknesses; track w) {
                  <span class="con-item">{{ w }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ── TIERRAS PERDIDAS — Mysterious full-width card ── -->
      <div class="mystery-card glass-panel">
        <div class="mystery-fog"></div>
        <div class="mystery-content">
          <div class="mystery-left">
            <div class="mystery-icon-wrap">
              <div class="mystery-icon-glow"></div>
              <span class="mystery-icon">❓</span>
            </div>
            <div class="mystery-title-group">
              <h2 class="mystery-name">TIERRAS PERDIDAS</h2>
              <span class="mystery-badge">??? · Origen Desconocido</span>
            </div>
          </div>

          <p class="mystery-lore">
            En los confines más remotos de Runeterra existen lugares que ningún cartógrafo ha logrado registrar.
            Las Tierras Perdidas son un territorio del que los exploradores nunca regresan y las leyendas guardan
            silencio. Sus habitantes, si es que los hay, permanecen ajenos al mundo conocido — o quizás observan
            desde las sombras, esperando el momento para revelarse. Solo se sabe una cosa: <em>algo</em> poderoso
            aguarda allí, más allá del horizonte del mapa.
          </p>

          <div class="mystery-stats">
            <div class="mystery-stat">
              <span class="mystery-stat-label">🛡️ Vidas</span>
              <div class="mystery-bar-wrap">
                <div class="mystery-bar mystery-bar-anim"></div>
              </div>
              <span class="mystery-val">???</span>
            </div>
            <div class="mystery-stat">
              <span class="mystery-stat-label">💰 Inicio</span>
              <div class="mystery-bar-wrap">
                <div class="mystery-bar mystery-bar-anim" style="animation-delay:.2s"></div>
              </div>
              <span class="mystery-val">???</span>
            </div>
            <div class="mystery-stat">
              <span class="mystery-stat-label">📈 Ingreso</span>
              <div class="mystery-bar-wrap">
                <div class="mystery-bar mystery-bar-anim" style="animation-delay:.4s"></div>
              </div>
              <span class="mystery-val">???</span>
            </div>
            <div class="mystery-stat">
              <span class="mystery-stat-label">⚔️ Ataque</span>
              <div class="mystery-bar-wrap">
                <div class="mystery-bar mystery-bar-anim" style="animation-delay:.6s"></div>
              </div>
              <span class="mystery-val">???</span>
            </div>
            <div class="mystery-stat">
              <span class="mystery-stat-label">🔧 Refuerzo</span>
              <div class="mystery-bar-wrap">
                <div class="mystery-bar mystery-bar-anim" style="animation-delay:.8s"></div>
              </div>
              <span class="mystery-val">???</span>
            </div>
          </div>

          <div class="mystery-pros-cons">
            <div class="mystery-pro">
              <span class="mystery-pros-title">✅ Ventajas</span>
              <span class="mystery-qmark">???</span>
            </div>
            <div class="mystery-con">
              <span class="mystery-cons-title">❌ Desventajas</span>
              <span class="mystery-qmark">???</span>
            </div>
          </div>

          <div class="mystery-hint">
            <span class="mystery-hint-icon">🔮</span>
            <span>Sus secretos solo se revelan en el campo de batalla...</span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .factions-page { display: flex; flex-direction: column; gap: 24px; padding: 20px 0; position: relative; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 28px 36px; flex-wrap: wrap; gap: 16px;
    }
    .page-header h1 { font-size: 2rem; margin-bottom: 8px; }
    .header-sub { color: var(--text-muted); font-size: 0.95rem; }
    .back-btn { flex-shrink: 0; }

    .stats-legend {
      display: flex; align-items: center; gap: 20px; padding: 12px 24px;
      flex-wrap: wrap; font-size: 0.82rem; color: var(--text-muted);
    }
    .legend-title { font-weight: 700; color: var(--accent-gold); }
    .legend-item { opacity: 0.75; }

    .factions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .faction-card {
      display: flex; flex-direction: column; gap: 16px;
      padding: 0; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .faction-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px color-mix(in srgb, var(--faction-color) 20%, transparent);
    }

    .card-banner {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .card-icon { font-size: 2.8rem; flex-shrink: 0; }
    .card-title-group { display: flex; flex-direction: column; gap: 6px; }
    .card-title-group h2 { font-size: 1.4rem; margin: 0; }
    .playstyle-badge {
      font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em;
      padding: 2px 10px; border-radius: 20px; border: 1px solid;
      background: rgba(0,0,0,0.3); text-transform: uppercase; width: fit-content;
    }

    .lore-text {
      padding: 0 24px;
      font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;
    }

    .stats-grid { padding: 0 24px; display: flex; flex-direction: column; gap: 8px; }
    .stat-item { display: grid; grid-template-columns: 90px 1fr 80px; align-items: center; gap: 8px; }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .stat-bar-wrap { height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
    .stat-bar { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .stat-val { font-size: 0.78rem; font-weight: 700; text-align: right; }
    .stat-val.positive { color: #10b981; }
    .stat-val.negative { color: #ef4444; }

    .pros-cons {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; padding: 16px 24px 20px;
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .pros, .cons { display: flex; flex-direction: column; gap: 4px; }
    .pros-title, .cons-title { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; margin-bottom: 4px; text-transform: uppercase; }
    .pros-title { color: #10b981; }
    .cons-title { color: #ef4444; }
    .pro-item, .con-item { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; }
    .pro-item::before { content: '• '; color: #10b981; }
    .con-item::before { content: '• '; color: #ef4444; }

    /* ── Tierras Perdidas mysterious card ── */
    .mystery-card {
      position: relative; overflow: hidden;
      border: 1px solid rgba(100,30,180,0.35);
      background: linear-gradient(135deg, rgba(30,5,60,0.92) 0%, rgba(15,0,30,0.96) 100%);
      box-shadow: 0 0 40px rgba(100,30,180,0.18), inset 0 0 60px rgba(60,15,120,0.1);
      padding: 0;
    }
    .mystery-card:hover {
      box-shadow: 0 0 60px rgba(120,40,220,0.28), inset 0 0 60px rgba(60,15,120,0.15);
      border-color: rgba(140,60,220,0.5);
    }

    /* floating fog particles */
    .mystery-fog {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 60% 40% at 20% 50%, rgba(80,20,160,0.12) 0%, transparent 70%),
                  radial-gradient(ellipse 40% 60% at 80% 30%, rgba(60,10,120,0.10) 0%, transparent 70%),
                  radial-gradient(ellipse 30% 50% at 60% 80%, rgba(100,30,180,0.08) 0%, transparent 70%);
      animation: fogDrift 8s ease-in-out infinite alternate;
    }
    @keyframes fogDrift {
      0%   { opacity: 0.6; transform: scale(1) translateX(0); }
      100% { opacity: 1;   transform: scale(1.04) translateX(8px); }
    }

    .mystery-content {
      position: relative; z-index: 1;
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto auto;
      gap: 20px 32px;
      padding: 32px 36px;
      align-items: start;
    }

    .mystery-left {
      grid-column: 1; grid-row: 1;
      display: flex; align-items: center; gap: 20px;
    }
    .mystery-lore {
      grid-column: 2; grid-row: 1;
      font-size: 0.9rem; color: rgba(200,180,240,0.7); line-height: 1.7;
      font-style: italic; align-self: center;
    }
    .mystery-lore em { color: rgba(220,200,255,0.9); font-style: normal; font-weight: 700; }

    .mystery-stats {
      grid-column: 3; grid-row: 1;
      display: flex; flex-direction: column; gap: 10px; min-width: 200px;
    }
    .mystery-pros-cons {
      grid-column: 1 / 4; grid-row: 2;
      display: flex; gap: 24px;
      border-top: 1px solid rgba(100,30,180,0.2);
      padding-top: 16px;
    }
    .mystery-hint {
      grid-column: 1 / 4; grid-row: 3;
      display: flex; align-items: center; gap: 10px;
      font-size: 0.8rem; color: rgba(160,100,255,0.6);
      font-style: italic; border-top: 1px solid rgba(100,30,180,0.15);
      padding-top: 12px;
    }
    .mystery-hint-icon { font-size: 1rem; opacity: 0.7; }

    .mystery-icon-wrap {
      position: relative; width: 72px; height: 72px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .mystery-icon-glow {
      position: absolute; inset: -6px; border-radius: 50%;
      background: radial-gradient(circle, rgba(120,40,220,0.35) 0%, transparent 70%);
      animation: iconPulse 2.5s ease-in-out infinite;
    }
    @keyframes iconPulse {
      0%,100% { opacity: 0.5; transform: scale(0.9); }
      50%      { opacity: 1;   transform: scale(1.1); }
    }
    .mystery-icon {
      font-size: 3.2rem; position: relative; z-index: 1;
      filter: drop-shadow(0 0 12px rgba(160,80,255,0.6));
    }

    .mystery-title-group { display: flex; flex-direction: column; gap: 8px; }
    .mystery-name {
      font-size: 1.6rem; margin: 0; letter-spacing: 0.06em;
      background: linear-gradient(90deg, #c084fc, #e879f9, #a855f7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .mystery-badge {
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 2px 12px; border-radius: 20px;
      background: rgba(100,30,180,0.2); border: 1px solid rgba(140,60,220,0.35);
      color: rgba(180,120,255,0.9); width: fit-content;
    }

    .mystery-stat { display: grid; grid-template-columns: 90px 1fr 40px; align-items: center; gap: 8px; }
    .mystery-stat-label { font-size: 0.73rem; color: rgba(180,140,240,0.6); font-weight: 600; }
    .mystery-bar-wrap { height: 6px; background: rgba(100,30,180,0.15); border-radius: 3px; overflow: hidden; }
    .mystery-bar {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, rgba(120,40,220,0.5), rgba(180,80,255,0.4));
      animation: barPulse 2s ease-in-out infinite;
    }
    @keyframes barPulse {
      0%,100% { width: 45%; opacity: 0.5; }
      50%      { width: 55%; opacity: 0.9; }
    }
    .mystery-val { font-size: 0.78rem; font-weight: 800; color: rgba(180,120,255,0.8); text-align: right; letter-spacing: 0.05em; }

    .mystery-pro, .mystery-con { display: flex; align-items: center; gap: 12px; }
    .mystery-pros-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: rgba(100,220,150,0.5); white-space: nowrap; }
    .mystery-cons-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: rgba(240,100,100,0.5); white-space: nowrap; }
    .mystery-qmark {
      font-size: 0.82rem; font-weight: 800; letter-spacing: 0.1em;
      color: rgba(160,100,255,0.5); font-style: italic;
      animation: qmarkFlicker 3s ease-in-out infinite;
    }
    @keyframes qmarkFlicker {
      0%,100% { opacity: 0.5; } 50% { opacity: 0.9; }
    }

    @media (max-width: 900px) {
      .mystery-content {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
      }
      .mystery-left { grid-column: 1; grid-row: 1; }
      .mystery-lore { grid-column: 1; grid-row: 2; }
      .mystery-stats { grid-column: 1; grid-row: 3; min-width: unset; }
      .mystery-pros-cons { grid-column: 1; grid-row: 4; }
      .mystery-hint { grid-column: 1; grid-row: 5; }
    }

    @media (max-width: 768px) {
      .factions-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
      .pros-cons { grid-template-columns: 1fr; }
    }
  `]
})
export class Factions {
  readonly factions = FACTIONS;

  getAtkBarWidth(bonus: number): number {
    return Math.max(10, Math.min(100, ((bonus + 15) / 50) * 100));
  }
}
