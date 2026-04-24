import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LobbyService } from './services/lobby.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App {
  protected readonly title = signal('PAYLOAD');
  readonly auth         = inject(AuthService);
  readonly lobbyService = inject(LobbyService);
  private  router       = inject(Router);

  isMobileMenuOpen = signal(false);
  showLogoutModal  = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    if (this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  /**
   * The route to the user's own lobby.
   * Returns ['/lobby', id] if the user has a created lobby, null otherwise.
   */
  readonly myLobbyRoute = computed<(string | number)[] | null>(() => {
    const user = this.auth.currentUser();
    if (!user) return null;
    const lobby = this.lobbyService.getUserLobby(user.username);
    return lobby ? ['/lobby', lobby.id] : null;
  });

  readonly isMyLobbyReady = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    const lobby = this.lobbyService.getUserLobby(user.username);
    if (!lobby || lobby.playerList.length < 2) return false;
    return lobby.playerList.every(p => p.status === 'Ready');
  });

  readonly shouldShowReadyPopup = computed(() => {
    return this.isMyLobbyReady() && !this.router.url.includes('/lobby/');
  });

  confirmLogout() {
    this.auth.logout();
    this.showLogoutModal.set(false);
    this.isMobileMenuOpen.set(false);
  }
}
