import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page animate-fade-in">
      <div class="glass-panel content-container">
        <header class="legal-header">
          <div class="icon-circle">🛡️</div>
          <h1>Política de Privacidad</h1>
          <p class="last-update">Última actualización: 22 de abril de 2026</p>
        </header>

        <div class="legal-body">
          <section>
            <h2>1. Información que Recopilamos</h2>
            <p>Recopilamos información necesaria para el funcionamiento del juego, como tu nombre de usuario, correo electrónico y estadísticas de combate. No recopilamos datos personales sensibles.</p>
          </section>

          <section>
            <h2>2. Uso de la Información</h2>
            <p>Tus datos se utilizan exclusivamente para gestionar tu perfil, permitir la interacción en salas de combate y mantener el sistema de clasificación (ranking).</p>
          </section>

          <section>
            <h2>3. Almacenamiento Local</h2>
            <p>Runeterra Tactics Strategic Strike utiliza el almacenamiento local de tu navegador (localStorage) para mantener tu sesión activa y guardar preferencias locales. No utilizamos cookies de rastreo de terceros.</p>
          </section>

          <section>
            <h2>4. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad para proteger tu información, aunque debes recordar que ningún método de transmisión por internet o almacenamiento electrónico es 100% seguro.</p>
          </section>

          <section>
            <h2>5. Tus Derechos</h2>
            <p>Puedes actualizar tu información de perfil en cualquier momento desde la sección de "Perfil". Para eliminar tu cuenta, contacta con nuestro soporte técnico.</p>
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
      filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.5));
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
export class Privacy {}
