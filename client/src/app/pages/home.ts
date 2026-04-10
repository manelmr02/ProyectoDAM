import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
  <main class="main-content">
    <section class="hero-section glass-panel animate-fade-in" style="animation-delay: 0.2s;">
      <div class="hero-content">
        <span class="badge">Fase de Preparación Activa</span>
        <h1>Estrategia a <span class="highlight-gradient">Ciegas</span></h1>
        <p class="subtitle">Decide el destino de tu facción. Ataca a tus rivales o asegura tus defensas sin saber cuál será el próximo movimiento de tus enemigos en este enfrentamiento todos contra todos.</p>
        
        <div class="action-buttons">
          <button routerLink="/lobby" class="btn btn-primary play-btn">
            <span class="pulse-ring"></span>
            UNIRSE AL LOBBY
          </button>
          <button routerLink="/ranking" class="btn btn-secondary">VER CLASIFICACIÓN</button>
        </div>
      </div>
      
      <div class="featured-champion">
        <div class="champion-card glass-panel">
          <div class="card-image-placeholder">
              <!-- Background loaded via app.css -->
          </div>
          <div class="card-info">
            <h3>Atacar o Defender</h3>
            <span class="rolemage">Anticipa a tus enemigos</span>
          </div>
        </div>
      </div>
    </section>

    <section class="news-section animate-fade-in" style="animation-delay: 0.3s;">
      <h2>Inteligencia de Combate</h2>
      <div class="news-grid">
        <div class="news-card glass-panel hover-scale">
          <div class="news-tag patch">Reporte</div>
          <h4>Facciones al Límite</h4>
          <p>Las últimas defensas están cediendo, las estrategias agresivas dominan el meta.</p>
        </div>
        <div class="news-card glass-panel hover-scale">
          <div class="news-tag event">Recursos</div>
          <h4>Mejora de Defensas</h4>
          <p>Los escudos de facción tendrán una penalización reducida por predicciones erróneas.</p>
        </div>
        <div class="news-card glass-panel hover-scale">
          <div class="news-tag esports">Top Jugadores</div>
          <h4>Los Maestros del Engaño</h4>
          <p>Repasamos el Top 10 de jugadores globales que han anticipado ataques enemigos de forma constante.</p>
        </div>
      </div>
    </section>
  </main>
  `
})
export class Home {}
