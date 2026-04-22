import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page animate-fade-in">
      <div class="glass-panel content-container">
        <header class="legal-header">
          <div class="icon-circle">🛠️</div>
          <h1>Soporte Técnico</h1>
          <p>¿Tienes problemas en el frente? Estamos aquí para ayudarte.</p>
        </header>

        <div class="support-grid">
          <div class="support-card glass-panel">
            <h3>📧 Contacto Directo</h3>
            <p>Envíanos un correo con los detalles de tu problema, capturas de pantalla y tu nombre de usuario.</p>
            <a href="mailto:soporte@payload-strike.com" class="support-link">soporte&#64;payload-strike.com</a>
          </div>

          <div class="support-card glass-panel">
            <h3>💬 Comunidad</h3>
            <p>Únete a nuestro servidor de Discord para obtener ayuda rápida de otros comandantes y moderadores.</p>
            <a href="#" class="support-link">Unirse al Discord</a>
          </div>
        </div>

        <div class="faq-section">
          <h2>Preguntas Frecuentes</h2>
          <div class="faq-item">
            <h4>¿Cómo recupero mi contraseña?</h4>
            <p>Actualmente, al ser una versión de desarrollo, las contraseñas se gestionan localmente. Si pierdes el acceso, contacta con nosotros indicando tu correo de registro.</p>
          </div>
          <div class="faq-item">
            <h4>El juego se queda congelado</h4>
            <p>Asegúrate de tener una conexión estable y de utilizar un navegador moderno (Chrome, Firefox o Edge). Limpiar la caché del navegador suele solucionar la mayoría de problemas visuales.</p>
          </div>
        </div>

        <footer class="legal-footer">
          <a routerLink="/" class="btn btn-secondary">← Volver al Inicio</a>
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
      max-width: 800px;
      width: 100%;
      padding: 48px;
    }
    .legal-header {
      text-align: center;
      margin-bottom: 40px;
    }
    .icon-circle {
      font-size: 3rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 0 10px var(--accent-primary));
    }
    .support-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    .support-card {
      padding: 24px;
      text-align: center;
      background: rgba(0, 0, 0, 0.2);
    }
    .support-card h3 {
      margin-bottom: 12px;
      color: white;
    }
    .support-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .support-link {
      color: var(--accent-secondary);
      font-weight: 700;
      text-decoration: none;
      transition: color 0.2s;
    }
    .support-link:hover {
      color: white;
      text-decoration: underline;
    }
    .faq-section {
      margin-top: 40px;
    }
    .faq-section h2 {
      margin-bottom: 24px;
      border-left: 4px solid var(--accent-primary);
      padding-left: 16px;
    }
    .faq-item {
      margin-bottom: 24px;
    }
    .faq-item h4 {
      color: var(--accent-gold);
      margin-bottom: 8px;
    }
    .faq-item p {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .legal-footer {
      margin-top: 48px;
      text-align: center;
    }
    @media (max-width: 600px) {
      .support-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class Support {}
