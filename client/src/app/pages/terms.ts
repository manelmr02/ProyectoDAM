import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page animate-fade-in">
      <div class="glass-panel content-container">
        <header class="legal-header">
          <div class="icon-circle">📜</div>
          <h1>Términos y Condiciones</h1>
          <p class="last-update">Última actualización: 22 de abril de 2026</p>
        </header>

        <div class="legal-body">
          <section>
            <h2>1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar Payload Strategic Strike, aceptas cumplir y estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestra plataforma.</p>
          </section>

          <section>
            <h2>2. Registro de Usuario</h2>
            <p>Para participar en los combates y utilizar las funciones sociales (clanes, chat), es necesario crear una cuenta. Te comprometes a proporcionar información veraz y a mantener la seguridad de tu contraseña.</p>
          </section>

          <section>
            <h2>3. Código de Conducta</h2>
            <p>Los usuarios deben comportarse de manera respetuosa. No se permite el uso de lenguaje ofensivo, trampas (cheats), o cualquier acción que degrade la experiencia de otros jugadores.</p>
          </section>

          <section>
            <h2>4. Propiedad Intelectual</h2>
            <p>Todo el contenido de Payload Strategic Strike, incluyendo gráficos, código y diseño, es propiedad del proyecto DAM o de sus respectivos licenciantes.</p>
          </section>

          <section>
            <h2>5. Limitación de Responsabilidad</h2>
            <p>La plataforma se proporciona "tal cual". No nos hacemos responsables de pérdidas de datos o interrupciones en el servicio que puedan ocurrir durante el desarrollo o mantenimiento.</p>
          </section>
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
      min-height: calc(100vh - 200px);
    }
    .content-container {
      max-width: 800px;
      width: 100%;
      padding: 48px;
    }
    .legal-header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 30px;
    }
    .icon-circle {
      font-size: 3rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
    }
    .last-update {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 8px;
    }
    .legal-body {
      display: flex;
      flex-direction: column;
      gap: 32px;
      line-height: 1.6;
      color: var(--text-main);
    }
    h2 {
      color: var(--accent-secondary);
      font-size: 1.4rem;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    p {
      color: rgba(255, 255, 255, 0.8);
    }
    .legal-footer {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid var(--border-light);
      text-align: center;
    }
  `]
})
export class Terms {}
