import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  template: `
    <div class="auth-container animate-fade-in">
      <div class="glass-panel auth-panel">
        <h2>Registro de Comandante</h2>
        <p class="text-muted">Recluta tu división y únete al conflicto</p>
        
        <form class="auth-form" (submit)="$event.preventDefault()">
          <div class="form-group">
            <label>Nombre de Usuario</label>
            <input type="text" class="form-control" placeholder="Tu alias en el campo de batalla">
          </div>
          <div class="form-group">
            <label>Clan (Opcional)</label>
            <input type="text" class="form-control" placeholder="Ej: Los Vengadores del Alba">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" placeholder="correo@dominio.com">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" class="form-control" placeholder="••••••••">
          </div>
          
          <button class="btn btn-primary w-100" style="margin-top: 16px;">
            CREAR CUENTA
          </button>
        </form>
        
        <p class="auth-footer">
          ¿Ya tienes una división activa? <a routerLink="/login">Inicia Sesión</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; padding: 40px 0; }
    .auth-panel { width: 100%; max-width: 500px; text-align: center; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; text-align: left; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-family: var(--font-heading); font-size: 0.9rem; color: var(--accent-secondary); }
    .form-control { background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); padding: 12px 16px; border-radius: 8px; color: white; font-family: var(--font-body); outline: none; transition: all var(--transition-fast); }
    .form-control:focus { border-color: var(--accent-primary); box-shadow: 0 0 10px rgba(139,92,246,0.3); }
    .w-100 { width: 100%; }
    .auth-footer { margin-top: 24px; font-size: 0.9rem; color: var(--text-muted); }
    .auth-footer a { color: var(--accent-secondary); text-decoration: none; font-weight: 600; }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class Register {}
