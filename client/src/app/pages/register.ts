import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="auth-container animate-fade-in">
      <div class="glass-panel auth-panel">

        <div class="auth-logo">⚔</div>
        <h2>Registro de Comandante</h2>
        <p class="text-muted">Recluta tu división y únete al conflicto</p>

        <!-- Success banner -->
        <div class="alert alert-success" *ngIf="successMsg()">
          <span>✔</span> {{ successMsg() }}
        </div>

        <!-- Error banner -->
        <div class="alert alert-error" *ngIf="errorMsg()">
          <span>✖</span> {{ errorMsg() }}
        </div>

        <form class="auth-form" (ngSubmit)="onSubmit()" #registerForm="ngForm" novalidate>

          <div class="form-group">
            <label for="reg-username">Nombre de Usuario <span class="required">*</span></label>
            <input
              id="reg-username"
              type="text"
              class="form-control"
              [class.invalid]="usernameInput.invalid && usernameInput.touched"
              placeholder="Tu alias en el campo de batalla"
              name="username"
              [(ngModel)]="form.username"
              #usernameInput="ngModel"
              required
              minlength="3"
              maxlength="20"
              pattern="^[a-zA-Z0-9_]+$">
            <span class="field-error" *ngIf="usernameInput.invalid && usernameInput.touched">
              <ng-container *ngIf="usernameInput.errors?.['required']">El nombre es obligatorio.</ng-container>
              <ng-container *ngIf="usernameInput.errors?.['minlength']">Mínimo 3 caracteres.</ng-container>
              <ng-container *ngIf="usernameInput.errors?.['pattern']">Solo letras, números y _.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="reg-clan">Clan <span class="optional">(Opcional)</span></label>
            <input
              id="reg-clan"
              type="text"
              class="form-control"
              placeholder="Ej: Los Vengadores del Alba"
              name="clan"
              [(ngModel)]="form.clan"
              maxlength="30">
          </div>

          <div class="form-group">
            <label for="reg-email">Email <span class="required">*</span></label>
            <input
              id="reg-email"
              type="email"
              class="form-control"
              [class.invalid]="emailInput.invalid && emailInput.touched"
              placeholder="correo@dominio.com"
              name="email"
              [(ngModel)]="form.email"
              #emailInput="ngModel"
              required
              email>
            <span class="field-error" *ngIf="emailInput.invalid && emailInput.touched">
              <ng-container *ngIf="emailInput.errors?.['required']">El email es obligatorio.</ng-container>
              <ng-container *ngIf="emailInput.errors?.['email']">Introduce un email válido.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="reg-password">Contraseña <span class="required">*</span></label>
            <div class="input-with-toggle">
              <input
                id="reg-password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                [class.invalid]="passwordInput.invalid && passwordInput.touched"
                placeholder="Mínimo 6 caracteres"
                name="password"
                [(ngModel)]="form.password"
                #passwordInput="ngModel"
                required
                minlength="6">
              <button type="button" class="toggle-eye" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? '🙈' : '👁' }}
              </button>
            </div>
            <span class="field-error" *ngIf="passwordInput.invalid && passwordInput.touched">
              <ng-container *ngIf="passwordInput.errors?.['required']">La contraseña es obligatoria.</ng-container>
              <ng-container *ngIf="passwordInput.errors?.['minlength']">Mínimo 6 caracteres.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="reg-confirm">Confirmar Contraseña <span class="required">*</span></label>
            <div class="input-with-toggle">
              <input
                id="reg-confirm"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                [class.invalid]="confirmInput.touched && form.confirm !== form.password"
                placeholder="Repite la contraseña"
                name="confirm"
                [(ngModel)]="form.confirm"
                #confirmInput="ngModel"
                required>
              </div>
            <span class="field-error" *ngIf="confirmInput.touched && form.confirm !== form.password">
              Las contraseñas no coinciden.
            </span>
          </div>

          <!-- Strength bar -->
          <div class="strength-wrap" *ngIf="form.password">
            <div class="strength-bar">
              <div class="strength-fill" [style.width.%]="passwordStrength().pct" [style.background]="passwordStrength().color"></div>
            </div>
            <span class="strength-label" [style.color]="passwordStrength().color">{{ passwordStrength().label }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 submit-btn"
            [disabled]="loading() || registerForm.invalid || form.confirm !== form.password">
            <span *ngIf="loading()" class="spinner"></span>
            <span *ngIf="!loading()">⚔ CREAR CUENTA</span>
          </button>
        </form>

        <p class="auth-footer">
          ¿Ya tienes una división activa? <a routerLink="/login">Inicia Sesión</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: flex-start; padding: 40px 16px; }
    .auth-panel { width: 100%; max-width: 520px; text-align: center; }
    .auth-logo { font-size: 2.5rem; margin-bottom: 8px; }
    .auth-panel h2 { font-size: 1.8rem; margin-bottom: 4px; }

    .auth-form { display: flex; flex-direction: column; gap: 18px; margin-top: 28px; text-align: left; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-family: var(--font-heading); font-size: 0.85rem; color: var(--accent-secondary); letter-spacing: 0.05em; }
    .required { color: var(--accent-danger); }
    .optional { color: var(--text-muted); font-size: 0.8em; font-weight: 400; }

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
      background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px;
      line-height: 1;
    }

    .field-error { font-size: 0.8rem; color: var(--accent-danger); margin-top: 2px; }

    /* Strength bar */
    .strength-wrap { display: flex; align-items: center; gap: 10px; }
    .strength-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease, background 0.4s ease; }
    .strength-label { font-size: 0.78rem; font-weight: 700; min-width: 60px; }

    /* Alerts */
    .alert {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      margin-top: 16px; text-align: left;
    }
    .alert-success { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: var(--accent-success); }
    .alert-error   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.3);  color: var(--accent-danger); }

    .submit-btn { margin-top: 8px; padding: 14px; font-size: 1rem; position: relative; }
    .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .w-100 { width: 100%; }

    /* Spinner */
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
export class Register {
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = { username: '', email: '', clan: '', password: '', confirm: '' };

  loading     = signal(false);
  errorMsg    = signal('');
  successMsg  = signal('');
  showPassword = signal(false);

  passwordStrength(): { pct: number; label: string; color: string } {
    const p = this.form.password;
    if (!p) return { pct: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    const map: Record<number, { pct: number; label: string; color: string }> = {
      0: { pct: 10, label: 'Muy débil', color: '#ef4444' },
      1: { pct: 25, label: 'Débil',     color: '#f97316' },
      2: { pct: 50, label: 'Regular',   color: '#eab308' },
      3: { pct: 70, label: 'Buena',     color: '#84cc16' },
      4: { pct: 85, label: 'Fuerte',    color: '#22c55e' },
      5: { pct: 100,label: 'Excelente', color: '#10b981' },
    };
    return map[score] ?? map[5];
  }

  onSubmit(): void {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.form.password !== this.form.confirm) {
      this.errorMsg.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    // Small simulated delay for UX
    setTimeout(() => {
      const result = this.auth.register(
        this.form.username.trim(),
        this.form.email.trim(),
        this.form.password,
        this.form.clan.trim()
      );
      this.loading.set(false);

      if (result.ok) {
        this.successMsg.set(`¡Bienvenido, ${this.form.username}! Redirigiendo...`);
        setTimeout(() => this.router.navigate(['/']), 1500);
      } else {
        this.errorMsg.set(result.error ?? 'Error desconocido.');
      }
    }, 600);
  }
}
