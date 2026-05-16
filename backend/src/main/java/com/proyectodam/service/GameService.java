package com.proyectodam.service;

import com.proyectodam.model.game.GameState;
import com.proyectodam.model.mysql.SalaJugador;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final ConcurrentHashMap<String, GameState> activeGames = new ConcurrentHashMap<>();

    private static final int    ATTACK_COST       = 150;
    private static final double BASE_SUCCESS_RATE = 0.50;
    private static final int    WIN_REWARD        = 200;
    private static final int    LOSE_REWARD       = 50;
    private static final int    WIN_DAMAGE        = 2;
    private static final int    LOSE_DAMAGE       = 1;
    @AllArgsConstructor @Getter
    private static class FactionStats {
        int    maxLives;
        int    startCoins;
        int    incomePerTurn;
        double attackBonus;
        int    reinforceCost;
    }

    private static final Map<String, String[]> FACTION_VISUAL = new LinkedHashMap<>();
    private static final Map<String, FactionStats> FACTION_STATS = new LinkedHashMap<>();
    private static final FactionStats DEFAULT_STATS = new FactionStats(10, 1000, 100, 0.0, 280);

    static {
        FACTION_VISUAL.put("Demacia",      new String[]{"🛡️", "#c89b3c"});
        FACTION_VISUAL.put("Noxus",        new String[]{"🪓", "#c0392b"});
        FACTION_VISUAL.put("Freljord",     new String[]{"❄️", "#5dade2"});
        FACTION_VISUAL.put("Ionia",        new String[]{"🌸", "#e91e8c"});
        FACTION_VISUAL.put("Piltover",     new String[]{"⚙️", "#f39c12"});
        FACTION_VISUAL.put("Zaun",         new String[]{"🧪", "#27ae60"});
        FACTION_VISUAL.put("Shurima",      new String[]{"⏳", "#f1c40f"});
        FACTION_VISUAL.put("Shadow Isles", new String[]{"👻", "#8e44ad"});
        FACTION_VISUAL.put("Targon",       new String[]{"☀️", "#e8d5a3"});
        FACTION_VISUAL.put("Bilgewater",   new String[]{"⚓", "#2980b9"});
        FACTION_VISUAL.put("Ixtal",        new String[]{"🌿", "#1abc9c"});
        FACTION_VISUAL.put("Void",         new String[]{"👾", "#9b59b6"});

        FACTION_STATS.put("Demacia",      new FactionStats(12, 1000, 100,  0.00, 200));
        FACTION_STATS.put("Noxus",        new FactionStats( 8,  800, 100,  0.25, 300));
        FACTION_STATS.put("Freljord",     new FactionStats(15,  700,  80, -0.10, 180));
        FACTION_STATS.put("Ionia",        new FactionStats(10, 1000, 160,  0.00, 280));
        FACTION_STATS.put("Piltover",     new FactionStats( 9, 1500, 160, -0.15, 350));
        FACTION_STATS.put("Zaun",         new FactionStats(10,  900, 130,  0.10, 240));
        FACTION_STATS.put("Shurima",      new FactionStats(10, 1000, 100,  0.15, 280));
        FACTION_STATS.put("Shadow Isles", new FactionStats( 8,  700,  80,  0.30, 400));
        FACTION_STATS.put("Targon",       new FactionStats(13,  800,  90,  0.00, 280));
        FACTION_STATS.put("Bilgewater",   new FactionStats(10, 1200, 140,  0.10, 250));
        FACTION_STATS.put("Ixtal",        new FactionStats(10, 1000, 150,  0.05, 240));
        FACTION_STATS.put("Void",         new FactionStats( 6, 1500, 170,  0.35, 500));
    }

    // ── Public API ───────────────────────────────────────────────────────────────

    public GameState initOrGet(String salaId, List<SalaJugador> players) {
        if (players == null || players.isEmpty()) return null;
        return activeGames.computeIfAbsent(salaId, id -> createGame(id, players));
    }

    public GameState getState(String salaId) {
        return activeGames.get(salaId);
    }

    public void removeGame(String salaId) {
        activeGames.remove(salaId);
    }

    // ── Game creation ────────────────────────────────────────────────────────────

    private GameState createGame(String salaId, List<SalaJugador> players) {
        GameState state = new GameState();
        state.setSalaId(salaId);

        List<String> order = players.stream()
                .map(SalaJugador::getNombre)
                .filter(n -> n != null && !n.isBlank())
                .collect(Collectors.toList());

        if (order.isEmpty()) return state;

        state.setTurnOrder(new ArrayList<>(order));
        state.setCurrentTurnPlayer(order.get(0));
        state.setTurnStartTime(System.currentTimeMillis());

        for (SalaJugador player : players) {
            String name = player.getNombre();
            if (name == null || name.isBlank()) continue;

            String faction = player.getFaction() != null ? player.getFaction() : "Demacia";
            FactionStats stats = FACTION_STATS.getOrDefault(faction, DEFAULT_STATS);

            state.getCoins().put(name, stats.getStartCoins());

            GameState.RegionNodeState region = new GameState.RegionNodeState();
            region.setOwner(name);
            region.setMaxLives(stats.getMaxLives());
            region.setLives(stats.getMaxLives());
            region.setVictorias(0);
            region.setFaction(faction);
            region.setReinforceCost(stats.getReinforceCost());

            String[] vis = FACTION_VISUAL.getOrDefault(faction, new String[]{"🛡️", "#c89b3c"});
            region.setIcon(vis[0]);
            region.setColor(vis[1]);

            state.getRegions().put(name, region);
        }

        state.getLog().add("¡La batalla de Runaterra ha comenzado! Turno de " + order.get(0) + ".");
        return state;
    }

    // ── Actions ──────────────────────────────────────────────────────────────────

    public GameState attack(String salaId, String attackerName, String targetName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(attackerName)) return null;
        if (state.isHasActedThisTurn()) return null; // one action per turn

        if (state.getCoins().getOrDefault(attackerName, 0) < ATTACK_COST) return null;

        GameState.RegionNodeState targetRegion = state.getRegions().get(targetName);
        if (targetRegion == null || targetName.equals(attackerName)) return null;
        if (targetRegion.getLives() <= 0) return null;

        GameState.RegionNodeState attackerRegion = state.getRegions().get(attackerName);
        String attackerFaction = attackerRegion != null ? attackerRegion.getFaction() : "Demacia";
        FactionStats attackerStats = FACTION_STATS.getOrDefault(attackerFaction, DEFAULT_STATS);
        double successRate = Math.min(0.9, Math.max(0.1, BASE_SUCCESS_RATE + attackerStats.getAttackBonus()));

        state.getCoins().merge(attackerName, -ATTACK_COST, Integer::sum);
        state.setHasActedThisTurn(true);

        boolean win = Math.random() < successRate;
        int damage = win ? WIN_DAMAGE : LOSE_DAMAGE;
        int reward = win ? WIN_REWARD : LOSE_REWARD;

        state.getCoins().merge(attackerName, reward, Integer::sum);
        int newLives = Math.max(0, targetRegion.getLives() - damage);
        targetRegion.setLives(newLives);

        if (win) {
            state.getLog().add("⚔️ " + attackerName + " atacó a " + targetName
                    + " ¡IMPACTO! (-" + damage + " vidas). +200💰");
        } else {
            state.getLog().add("🛡️ " + attackerName + " atacó a " + targetName
                    + " pero fue repelido (-" + damage + " vida). +50💰");
        }

        if (newLives == 0) {
            if (attackerRegion != null) {
                attackerRegion.setVictorias(attackerRegion.getVictorias() + 1);
            }
            state.getLog().add("☠️ ¡La región de " + targetName + " ha sido destruida! "
                    + attackerName + " gana 1 victoria.");
            checkWinCondition(state);
        }

        return state;
    }

    public GameState reinforce(String salaId, String playerName, String targetKey) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(playerName)) return null;
        if (state.isHasActedThisTurn()) return null; // one action per turn

        GameState.RegionNodeState region = state.getRegions().get(targetKey);
        if (region == null || !region.getOwner().equals(playerName)) return null;
        if (region.getLives() <= 0) return null;
        if (region.getLives() >= region.getMaxLives()) return null;

        int cost = region.getReinforceCost();
        if (state.getCoins().getOrDefault(playerName, 0) < cost) return null;

        state.getCoins().merge(playerName, -cost, Integer::sum);
        state.setHasActedThisTurn(true);
        region.setLives(region.getMaxLives());
        state.getLog().add("🔧 " + playerName + " reforzó su región al máximo ("
                + region.getMaxLives() + " vidas). -" + cost + "💰");

        return state;
    }

    public GameState endTurn(String salaId, String playerName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(playerName)) return null;

        List<String> order = state.getTurnOrder();
        int currentIdx = order.indexOf(playerName);

        // Find next alive player, skipping dead ones
        int nextIdx = (currentIdx + 1) % order.size();
        for (int tries = 0; tries < order.size(); tries++) {
            String candidate = order.get(nextIdx);
            GameState.RegionNodeState r = state.getRegions().get(candidate);
            if (r != null && r.getLives() > 0) break;
            nextIdx = (nextIdx + 1) % order.size();
        }

        String nextPlayer = order.get(nextIdx);

        // Detect full round completion (wrapped around)
        if (nextIdx <= currentIdx) {
            int completedRound = state.getRoundNumber();
            state.setRoundNumber(completedRound + 1);
            addRoundSummary(state, completedRound);
        }

        state.setCurrentTurnPlayer(nextPlayer);
        state.setHasActedThisTurn(false);
        state.setTurnStartTime(System.currentTimeMillis());

        // Income for the next player
        GameState.RegionNodeState nextRegion = state.getRegions().get(nextPlayer);
        String nextFaction = nextRegion != null ? nextRegion.getFaction() : "Demacia";
        FactionStats nextStats = FACTION_STATS.getOrDefault(nextFaction, DEFAULT_STATS);
        int income = nextStats.getIncomePerTurn();
        state.getCoins().merge(nextPlayer, income, Integer::sum);

        state.getLog().add("🔄 Turno de " + nextPlayer + ". +" + income + "💰");

        return state;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private void addRoundSummary(GameState state, int completedRound) {
        state.getLog().add("══════ RESUMEN RONDA " + completedRound + " ══════");
        for (Map.Entry<String, GameState.RegionNodeState> entry : state.getRegions().entrySet()) {
            String pName = entry.getKey();
            GameState.RegionNodeState r = entry.getValue();
            int pCoins = state.getCoins().getOrDefault(pName, 0);
            if (r.getLives() > 0) {
                state.getLog().add("  " + pName + ": " + r.getLives() + "/" + r.getMaxLives()
                        + " vidas · 🏆" + r.getVictorias() + " victorias · 💰" + pCoins);
            } else {
                state.getLog().add("  " + pName + ": ☠️ ELIMINADO");
            }
        }
        state.getLog().add("══════════════════════════");
    }

    private void checkWinCondition(GameState state) {
        long activePlayers = state.getRegions().values().stream()
                .filter(r -> r.getLives() > 0)
                .count();

        if (activePlayers == 1) {
            String winner = state.getRegions().values().stream()
                    .filter(r -> r.getLives() > 0)
                    .map(GameState.RegionNodeState::getOwner)
                    .findFirst().orElse(null);
            state.setStatus("FINISHED");
            state.setWinner(winner);
            if (winner != null) {
                state.getLog().add("🏆 ¡" + winner + " ha conquistado Runaterra!");
            }
        } else if (activePlayers == 0) {
            state.setStatus("FINISHED");
            state.getLog().add("¡Empate! Todos los jugadores han sido eliminados.");
        }
    }
}
