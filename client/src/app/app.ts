import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
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
}
