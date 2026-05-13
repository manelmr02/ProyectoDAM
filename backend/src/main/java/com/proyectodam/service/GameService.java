package com.proyectodam.service;

import com.proyectodam.model.Game;
import com.proyectodam.model.Game.*;
import com.proyectodam.model.GameStat;
import com.proyectodam.model.Lobby;
import com.proyectodam.model.User;
import com.proyectodam.repository.GameRepository;
import com.proyectodam.repository.GameStatRepository;
import com.proyectodam.repository.LobbyRepository;
import com.proyectodam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameStatRepository gameStatRepository;
    private final LobbyRepository lobbyRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // gameId → { username → acción }  (solo en memoria, no persiste hasta resolver)
    private final Map<String, Map<String, PlayerAction>> pendingActions = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> readyPlayers = new ConcurrentHashMap<>();

    public Game startGame(String lobbyId) {
        Lobby lobby = lobbyRepository.findById(lobbyId).orElseThrow();

        Game game = new Game();
        game.setLobbyId(lobbyId);
        game.setMode(lobby.getMode());

        for (Lobby.LobbyPlayer lp : lobby.getPlayerList()) {
            GamePlayer gp = new GamePlayer();
            gp.setUsername(lp.getUsername());
            gp.setAvatarColor(lp.getAvatarColor());
            gp.setClan(lp.getClan());
            game.getPlayers().add(gp);
        }

        gameRepository.save(game);
        lobby.setStatus(Lobby.LobbyStatus.IN_PROGRESS);
        lobbyRepository.save(lobby);

        messagingTemplate.convertAndSend("/topic/lobby/" + lobbyId,
            Map.of("type", "GAME_STARTED", "gameId", game.getId()));

        log.info("Partida {} iniciada con {} jugadores", game.getId(), game.getPlayers().size());
        return game;
    }

    public void playerReadyForGame(String gameId, String username) {
        readyPlayers.computeIfAbsent(gameId, k -> ConcurrentHashMap.newKeySet()).add(username);
        Game game = gameRepository.findById(gameId).orElse(null);
        if (game == null) return;
        long alive = game.getPlayers().stream().filter(GamePlayer::isAlive).count();
        if (readyPlayers.get(gameId).size() >= alive) {
            readyPlayers.remove(gameId);
            broadcastGameState(game);
        }
    }

    public synchronized void registerAction(String gameId, String username, PlayerAction action) {
        Game game = gameRepository.findById(gameId).orElse(null);
        if (game == null || game.getStatus() == GameStatus.FINISHED) return;

        // Anti-trampas: validar que el jugador existe y está vivo
        boolean valid = game.getPlayers().stream()
            .anyMatch(p -> p.getUsername().equals(username) && p.isAlive());
        if (!valid || action.getAction() == null) return;

        pendingActions.computeIfAbsent(gameId, k -> new ConcurrentHashMap<>()).put(username, action);

        long aliveCount = game.getPlayers().stream().filter(GamePlayer::isAlive).count();
        if (pendingActions.get(gameId).size() >= aliveCount) {
            resolveRound(game);
        }
    }

    private void resolveRound(Game game) {
        Map<String, PlayerAction> actions = pendingActions.remove(game.getId());
        RoundResult roundResult = new RoundResult();
        roundResult.setRound(game.getCurrentRound());

        // Quiénes están defendiendo este turno
        Map<String, Boolean> defending = new HashMap<>();
        actions.forEach((u, a) ->
            defending.put(u, a.getAction() == PlayerAction.ActionType.DEFEND));

        // Resolver cada acción
        for (Map.Entry<String, PlayerAction> entry : actions.entrySet()) {
            String attackerName = entry.getKey();
            PlayerAction action = entry.getValue();
            GamePlayer attacker = findPlayer(game, attackerName);
            if (attacker == null || !attacker.isAlive()) continue;

            if (action.getAction() == PlayerAction.ActionType.ATTACK ||
                action.getAction() == PlayerAction.ActionType.SKILL) {

                GamePlayer target = findPlayer(game, action.getTargetUsername());
                // Si el objetivo es inválido, atacar a un vivo aleatorio
                if (target == null || !target.isAlive()) {
                    target = game.getPlayers().stream()
                        .filter(p -> p.isAlive() && !p.getUsername().equals(attackerName))
                        .findFirst().orElse(null);
                }
                if (target == null) continue;

                boolean targetDefending = defending.getOrDefault(target.getUsername(), false);
                int damage = calculateDamage(action.getAction(), targetDefending);
                boolean critical = Math.random() < 0.15;
                if (critical) damage = (int)(damage * 1.5);

                target.setCurrentHp(Math.max(0, target.getCurrentHp() - damage));

                RoundResult.ActionResult result = new RoundResult.ActionResult();
                result.setActor(attackerName);
                result.setTarget(target.getUsername());
                result.setActionType(action.getAction().name());
                result.setDamage(damage);
                result.setCritical(critical);
                result.setDescription(buildDescription(attackerName, target.getUsername(),
                                                        damage, critical, targetDefending));
                roundResult.getActions().add(result);

            } else if (action.getAction() == PlayerAction.ActionType.ITEM) {
                int heal = 20 + (int)(Math.random() * 11);
                attacker.setCurrentHp(Math.min(attacker.getMaxHp(), attacker.getCurrentHp() + heal));

                RoundResult.ActionResult result = new RoundResult.ActionResult();
                result.setActor(attackerName);
                result.setActionType("ITEM");
                result.setHealing(heal);
                result.setDescription(attackerName + " usó un ítem y recuperó " + heal + " HP.");
                roundResult.getActions().add(result);
            }
        }

        // Eliminar jugadores sin HP
        game.getPlayers().forEach(p -> { if (p.getCurrentHp() <= 0) p.setEliminated(true); });
        game.getRoundHistory().add(roundResult);
        game.setCurrentRound(game.getCurrentRound() + 1);

        long aliveCount = game.getPlayers().stream().filter(GamePlayer::isAlive).count();
        if (aliveCount <= 1) {
            finishGame(game);
            return;
        }

        gameRepository.save(game);
        messagingTemplate.convertAndSend("/topic/game/" + game.getId(), Map.of(
            "type", "ROUND_RESULT",
            "round", roundResult.getRound(),
            "actions", roundResult.getActions(),
            "playerStates", buildPlayerStates(game)
        ));
    }

    private void finishGame(Game game) {
        game.setStatus(GameStatus.FINISHED);
        game.setFinishedAt(Instant.now());

        String winnerName = game.getPlayers().stream()
            .filter(GamePlayer::isAlive)
            .map(GamePlayer::getUsername)
            .findFirst().orElse("Empate");

        gameRepository.save(game);

        for (GamePlayer gp : game.getPlayers()) {
            String result = gp.getUsername().equals(winnerName) ? "WIN" : "LOSS";
            updateUserStats(gp.getUsername(), result);
            saveGameStat(game, gp, result);
        }

        messagingTemplate.convertAndSend("/topic/game/" + game.getId(), Map.of(
            "type", "GAME_OVER",
            "winner", winnerName,
            "totalRounds", game.getCurrentRound() - 1,
            "playerStates", buildPlayerStates(game)
        ));
        log.info("Partida {} finalizada. Ganador: {}", game.getId(), winnerName);
    }

    // ── Cálculo de daño — TODO en el servidor ────────────────────────────────
    private int calculateDamage(PlayerAction.ActionType action, boolean targetDefending) {
        int base = switch (action) {
            case ATTACK -> 15 + (int)(Math.random() * 11);  // 15-25
            case SKILL  -> 25 + (int)(Math.random() * 16);  // 25-40
            default     -> 0;
        };
        return targetDefending ? (int)(base * 0.4) : base;
    }

    private String buildDescription(String atk, String def, int dmg, boolean crit, boolean defended) {
        return String.format("%s atacó a %s causando %d de daño%s%s.",
            atk, def, dmg, crit ? " ¡CRÍTICO!" : "", defended ? " (bloqueado)" : "");
    }

    private GamePlayer findPlayer(Game game, String username) {
        if (username == null) return null;
        return game.getPlayers().stream()
            .filter(p -> p.getUsername().equals(username)).findFirst().orElse(null);
    }

    private List<Map<String, Object>> buildPlayerStates(Game game) {
        return game.getPlayers().stream().map(p -> (Map<String, Object>) Map.of(
            "username", p.getUsername(),
            "currentHp", p.getCurrentHp(),
            "maxHp", p.getMaxHp(),
            "alive", p.isAlive()
        )).toList();
    }

    private void broadcastGameState(Game game) {
        messagingTemplate.convertAndSend("/topic/game/" + game.getId(),
            Map.of("type", "GAME_STATE", "playerStates", buildPlayerStates(game)));
    }

    private void updateUserStats(String username, String result) {
        userRepository.findByUsername(username).ifPresent(user -> {
            User.UserStats s = user.getStats();
            s.setGamesPlayed(s.getGamesPlayed() + 1);
            if ("WIN".equals(result)) {
                s.setWins(s.getWins() + 1);
                s.setWinStreak(s.getWinStreak() + 1);
                s.setBestWinStreak(Math.max(s.getBestWinStreak(), s.getWinStreak()));
                s.setTotalPoints(s.getTotalPoints() + 100);
            } else {
                s.setLosses(s.getLosses() + 1);
                s.setWinStreak(0);
            }
            userRepository.save(user);
        });
    }

    private void saveGameStat(Game game, GamePlayer gp, String result) {
        int damage = game.getRoundHistory().stream()
            .flatMap(r -> r.getActions().stream())
            .filter(a -> gp.getUsername().equals(a.getActor()))
            .mapToInt(RoundResult.ActionResult::getDamage).sum();

        gameStatRepository.save(new GameStat(
            game.getId(), gp.getUsername(), result,
            game.getCurrentRound() - 1, damage,
            gp.getMaxHp() - gp.getCurrentHp(), 0, game.getMode()
        ));
    }
}