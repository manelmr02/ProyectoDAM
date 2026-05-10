import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="auth-container animate-fade-in">
      <div class="glass-panel auth-panel">

        <div class="auth-logo">🛡</div>
        <h2>Identificación</h2>
        <p class="text-muted">Ingresa tus credenciales de comandante</p>

        <!-- Error banner -->
        <div class="alert alert-error" *ngIf="errorMsg()">
          <span>✖</span> {{ errorMsg() }}
        </div>

        <form class="auth-form" (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>

          <div class="form-group">
            <label for="login-user">Usuario o Email <span class="required">*</span></label>
            <input
              id="login-user"
              type="text"
              class="form-control"
              [class.invalid]="userInput.invalid && userInput.touched"
              placeholder="alias o correo@dominio.com"
              name="usernameOrEmail"
              [(ngModel)]="form.usernameOrEmail"
              #userInput="ngModel"
              required>
            <span class="field-error" *ngIf="userInput.invalid && userInput.touched">
              Este campo es obligatorio.
            </span>
          </div>

          <div class="form-group">
            <label for="login-pass">Contraseña <span class="required">*</span></label>
            <div class="input-with-toggle">
              <input
                id="login-pass"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                [class.invalid]="passInput.invalid && passInput.touched"
                placeholder="••••••••"
                name="password"
                [(ngModel)]="form.password"
                #passInput="ngModel"
                required>
              <button type="button" class="toggle-eye" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? '🙈' : '👁' }}
              </button>
            </div>
            <span class="field-error" *ngIf="passInput.invalid && passInput.touched">
              La contraseña es obligatoria.
            </span>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 submit-btn"
            [disabled]="loading() || loginForm.invalid">
            <span *ngIf="loading()" class="spinner"></span>
            <span *ngIf="!loading()">🛡 INICIAR SESIÓN</span>
          </button>
        </form>

        <p class="auth-footer">
          ¿No tienes una división aún? <a routerLink="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: flex-start; padding: 60px 16px; }
    .auth-panel { width: 100%; max-width: 460px; text-align: center; }
    .auth-logo { font-size: 2.5rem; margin-bottom: 8px; }
    .auth-panel h2 { font-size: 1.8rem; margin-bottom: 4px; }

    .auth-form { display: flex; flex-direction: column; gap: 18px; margin-top: 28px; text-align: left; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-family: var(--font-heading); font-size: 0.85rem; color: var(--accent-secondary); letter-spacing: 0.05em; }
    .required { color: var(--accent-danger); }

    .form-control {
      background: rgba(0,0,0,0.35);
      border: 1px solid var(--border-light);
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-family: var(--font-body);
      font-size: 0.95rem;
      outline: none;
      transition: all var(--transition-fast);
      width: 100%;
    }
    .form-control:focus { border-color: var(--accent-primary); box-shadow: 0 0 10px rgba(139,92,246,0.3); }
    .form-control.invalid { border-color: var(--accent-danger); box-shadow: 0 0 8px rgba(239,68,68,0.25); }

    .input-with-toggle { position: relative; }
    .input-with-toggle .form-control { padding-right: 44px; }
    .toggle-eye {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; line-height: 1;
    }

    .field-error { font-size: 0.8rem; color: var(--accent-danger); margin-top: 2px; }

    .alert {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      margin-top: 16px; text-align: left;
    }
    .alert-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: var(--accent-danger); }

    .submit-btn { margin-top: 8px; padding: 14px; font-size: 1rem; }
    .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .w-100 { width: 100%; }

    .spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-footer { margin-top: 24px; font-size: 0.9rem; color: var(--text-muted); }
    .auth-footer a { color: var(--accent-secondary); text-decoration: none; font-weight: 600; }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class Login {
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = { usernameOrEmail: '', password: '' };

  loading      = signal(false);
  errorMsg     = signal('');
  showPassword = signal(false);

  onSubmit(): void {
    this.errorMsg.set('');
    this.loading.set(true);

    setTimeout(() => {
      const result = this.auth.login(
        this.form.usernameOrEmail.trim(),
        this.form.password
      );
      this.loading.set(false);

      if (result.ok) {
        this.router.navigate(['/']);
      } else {
        this.errorMsg.set(result.error ?? 'Error desconocido.');
      }
    }, 500);
  }
}
