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
        <p class="text-muted">Ingresa tus credenciales de invocador</p>

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

        <div class="forgot-link-row">
          <button type="button" class="forgot-link" (click)="openForgot()">¿Olvidaste tu contraseña?</button>
        </div>

        <p class="auth-footer">
          ¿No tienes una cuenta aún? <a routerLink="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>

    <!-- FORGOT PASSWORD MODAL -->
    @if (forgotOpen()) {
      <div class="modal-backdrop" (click)="closeForgot()">
        <div class="modal-box glass-panel animate-modal" (click)="$event.stopPropagation()">

          <div class="modal-head">
            <span class="modal-icon-big">🔑</span>
            <div>
              <h3>Recuperar contraseña</h3>
              <p class="text-muted" style="font-size:0.85rem;">
                @if (forgotStep() === 1) { Introduce tu email para verificar tu cuenta. }
                @else { Introduce tu nueva contraseña. }
              </p>
            </div>
            <button class="close-btn" (click)="closeForgot()">✕</button>
          </div>

          <!-- STEP 1: email -->
          @if (forgotStep() === 1) {
            <div class="modal-body">
              <div class="form-group">
                <label>Email de la cuenta</label>
                <input type="email" class="form-control" placeholder="correo@dominio.com"
                  [(ngModel)]="forgotEmail" name="forgotEmail" (keyup.enter)="verifyEmail()">
              </div>
              @if (forgotError()) {
                <div class="alert alert-error" style="margin-top:10px;">✖ {{ forgotError() }}</div>
              }
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="closeForgot()">Cancelar</button>
                <button class="btn btn-primary" [disabled]="forgotLoading() || !forgotEmail.trim()" (click)="verifyEmail()">
                  @if (forgotLoading()) { <span class="spinner"></span> } @else { Verificar →  }
                </button>
              </div>
            </div>
          }

          <!-- STEP 2: new password -->
          @if (forgotStep() === 2) {
            <div class="modal-body">
              <div class="form-group">
                <label>Nueva contraseña <span class="required">*</span></label>
                <div class="input-with-toggle">
                  <input [type]="showNewPass() ? 'text' : 'password'" class="form-control"
                    placeholder="Mínimo 6 caracteres" [(ngModel)]="newPassword" name="newPassword">
                  <button type="button" class="toggle-eye" (click)="showNewPass.set(!showNewPass())">
                    {{ showNewPass() ? '🙈' : '👁' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Confirmar contraseña <span class="required">*</span></label>
                <div class="input-with-toggle">
                  <input [type]="showNewPass() ? 'text' : 'password'" class="form-control"
                    [class.invalid]="newPassword && confirmPassword && newPassword !== confirmPassword"
                    placeholder="Repite la contraseña" [(ngModel)]="confirmPassword" name="confirmPassword">
                </div>
                @if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                  <span class="field-error">Las contraseñas no coinciden.</span>
                }
              </div>
              @if (forgotError()) {
                <div class="alert alert-error" style="margin-top:10px;">✖ {{ forgotError() }}</div>
              }
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="forgotStep.set(1)">← Atrás</button>
                <button class="btn btn-primary"
                  [disabled]="forgotLoading() || newPassword.length < 6 || newPassword !== confirmPassword"
                  (click)="submitNewPassword()">
                  @if (forgotLoading()) { <span class="spinner"></span> } @else { Guardar contraseña }
                </button>
              </div>
            </div>
          }

          <!-- STEP 3: success -->
          @if (forgotStep() === 3) {
            <div class="modal-body success-body">
              <div class="success-icon">✅</div>
              <p>Contraseña actualizada correctamente.</p>
              <p class="text-muted" style="font-size:0.85rem;">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button class="btn btn-primary" style="margin-top:16px;" (click)="closeForgot()">Entendido</button>
            </div>
          }

        </div>
      </div>
    }
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

    .forgot-link-row { margin-top: 12px; text-align: center; }
    .forgot-link {
      background: none; border: none; cursor: pointer;
      color: var(--accent-secondary); font-size: 0.85rem; font-family: var(--font-body);
      text-decoration: underline; padding: 0;
    }
    .forgot-link:hover { color: var(--accent-primary); }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: center; padding: 16px;
    }
    .modal-box {
      width: 100%; max-width: 440px;
      padding: 28px 28px 24px;
      border-radius: 16px;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.92) translateY(12px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    .animate-modal { animation: modalIn 0.22s ease both; }

    .modal-head {
      display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px;
    }
    .modal-head h3 { margin: 0 0 2px; font-size: 1.15rem; }
    .modal-icon-big { font-size: 2rem; flex-shrink: 0; line-height: 1; }
    .close-btn {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: var(--text-muted); font-size: 1.1rem; padding: 4px 6px;
      border-radius: 6px; transition: background 0.15s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.08); color: white; }

    .modal-body { display: flex; flex-direction: column; gap: 14px; }

    .modal-actions {
      display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;
    }

    .success-body {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; text-align: center; padding: 8px 0;
    }
    .success-icon { font-size: 2.8rem; line-height: 1; }
  `]
})
export class Login {
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = { usernameOrEmail: '', password: '' };

  loading      = signal(false);
  errorMsg     = signal('');
  showPassword = signal(false);

  // ── Forgot password ────────────────────────────────────────────
  forgotOpen    = signal(false);
  forgotStep    = signal<1 | 2 | 3>(1);
  forgotLoading = signal(false);
  forgotError   = signal('');
  forgotEmail   = '';
  newPassword   = '';
  confirmPassword = '';
  showNewPass   = signal(false);

  openForgot() {
    this.forgotEmail = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.forgotError.set('');
    this.forgotStep.set(1);
    this.forgotOpen.set(true);
  }

  closeForgot() {
    this.forgotOpen.set(false);
  }

  async verifyEmail() {
    const email = this.forgotEmail.trim();
    if (!email) return;
    this.forgotLoading.set(true);
    this.forgotError.set('');
    const exists = await this.auth.checkEmail(email);
    this.forgotLoading.set(false);
    if (exists) {
      this.forgotStep.set(2);
    } else {
      this.forgotError.set('No existe ninguna cuenta con ese email.');
    }
  }

  async submitNewPassword() {
    if (this.newPassword !== this.confirmPassword || this.newPassword.length < 6) return;
    this.forgotLoading.set(true);
    this.forgotError.set('');
    const result = await this.auth.resetPassword(this.forgotEmail.trim(), this.newPassword);
    this.forgotLoading.set(false);
    if (result.ok) {
      this.forgotStep.set(3);
    } else {
      this.forgotError.set(result.error ?? 'Error al actualizar la contraseña.');
      this.forgotStep.set(1);
    }
  }

  // ── Login ──────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    this.errorMsg.set('');
    this.loading.set(true);

    const result = await this.auth.login(
      this.form.usernameOrEmail.trim(),
      this.form.password
    );
    this.loading.set(false);

    if (result.ok) {
      this.router.navigate(['/']);
    } else {
      this.errorMsg.set(result.error ?? 'Error desconocido.');
    }
  }
}
