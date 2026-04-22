import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page animate-fade-in">
      <div class="glass-panel content-container">
        <header class="legal-header">
          <div class="icon-circle">⚔️</div>
          <h1>Reglas de Combate</h1>
          <p class="last-update">Manual del Comandante v1.0</p>
        </header>

        <div class="legal-body">
          <div class="rules-grid">
            <div class="rule-card">
              <span class="rule-num">01</span>
              <h3>Preparación</h3>
              <p>Antes de comenzar, todos los jugadores en la sala deben marcarse como "Listos". Una vez todos estén preparados, comenzará una cuenta atrás de 10 segundos para el despliegue.</p>
            </div>

            <div class="rule-card">
              <span class="rule-num">02</span>
              <h3>El Campo de Batalla</h3>
              <p>Los combates se desarrollan por turnos. Cada comandante tiene un tiempo limitado para realizar sus movimientos y ataques estratégicos.</p>
            </div>

            <div class="rule-card">
              <span class="rule-num">03</span>
              <h3>Objetivos</h3>
              <p>El objetivo principal es neutralizar las fuerzas enemigas utilizando tácticas de posición y gestión de recursos. El último comandante en pie reclama la victoria.</p>
            </div>

            <div class="rule-card">
              <span class="rule-num">04</span>
              <h3>Sistema de Rango</h3>
              <p>Tu rango (Combat Title) evoluciona automáticamente con tus victorias. A más victorias, mayor será tu prestigio en la comunidad de Payload.</p>
            </div>
          </div>

          <section class="fair-play">
            <h2>Juego Limpio (Fair Play)</h2>
            <p>Payload Strategic Strike es una competición de habilidad. El uso de software externo para obtener ventaja resultará en la suspensión inmediata de la cuenta y la pérdida de todos los rangos obtenidos.</p>
          </section>
        </div>

        <footer class="legal-footer">
          <a routerLink="/" class="btn btn-primary">¡ENTENDIDO, A LA BATALLA!</a>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .content-container {
      max-width: 900px;
      width: 100%;
      padding: 48px;
    }
    .legal-header {
      text-align: center;
      margin-bottom: 40px;
    }
    .icon-circle {
      font-size: 3.5rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 0 15px var(--accent-danger));
    }
    .rules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    .rule-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-light);
      padding: 24px;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }
    .rule-num {
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 4rem;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.05);
      font-family: var(--font-heading);
    }
    .rule-card h3 {
      color: var(--accent-gold);
      margin-bottom: 12px;
      font-size: 1.2rem;
    }
    .rule-card p {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .fair-play {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 24px;
      border-radius: 12px;
    }
    .fair-play h2 {
      color: var(--accent-danger);
      margin-bottom: 10px;
    }
    .legal-footer {
      margin-top: 48px;
      text-align: center;
    }
    @media (max-width: 600px) {
      .rules-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class Rules {}
