package com.proyectodam.service;

import com.proyectodam.model.game.GameState;
import com.proyectodam.model.mysql.SalaJugador;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final ConcurrentHashMap<String, GameState> activeGames = new ConcurrentHashMap<>();

    private static final int INITIAL_COINS = 1000;
    private static final int ATTACK_COST = 150;
    private static final double ATTACK_SUCCESS_RATE = 0.6;
    private static final int ATTACK_WIN_REWARD = 200;
    private static final int ATTACK_LOSE_REWARD = 50;
    private static final int TURN_INCOME = 100;
    private static final int MAX_LIVES = 5;

    private static final Map<String, String[]> FACTION_DATA = new LinkedHashMap<>();
    private static final Map<String, Integer> FACTION_COST = new HashMap<>();

    static {
        FACTION_DATA.put("Demacia",      new String[]{"🛡️", "#c89b3c"});
        FACTION_DATA.put("Noxus",        new String[]{"🪓", "#c0392b"});
        FACTION_DATA.put("Freljord",     new String[]{"❄️", "#5dade2"});
        FACTION_DATA.put("Ionia",        new String[]{"🌸", "#e91e8c"});
        FACTION_DATA.put("Piltover",     new String[]{"⚙️", "#f39c12"});
        FACTION_DATA.put("Zaun",         new String[]{"🧪", "#27ae60"});
        FACTION_DATA.put("Shurima",      new String[]{"⏳", "#f1c40f"});
        FACTION_DATA.put("Shadow Isles", new String[]{"👻", "#8e44ad"});
        FACTION_DATA.put("Targon",       new String[]{"☀️", "#e8d5a3"});
        FACTION_DATA.put("Bilgewater",   new String[]{"⚓", "#2980b9"});
        FACTION_DATA.put("Ixtal",        new String[]{"🌿", "#1abc9c"});
        FACTION_DATA.put("Void",         new String[]{"👾", "#9b59b6"});

        FACTION_COST.put("Demacia", 200);
        FACTION_COST.put("Noxus", 300);
        FACTION_COST.put("Freljord", 300);
        FACTION_COST.put("Ionia", 300);
        FACTION_COST.put("Piltover", 350);
        FACTION_COST.put("Zaun", 300);
        FACTION_COST.put("Shurima", 300);
        FACTION_COST.put("Shadow Isles", 400);
        FACTION_COST.put("Targon", 400);
        FACTION_COST.put("Bilgewater", 300);
        FACTION_COST.put("Ixtal", 300);
        FACTION_COST.put("Void", 500);
    }

    public GameState initOrGet(String salaId, List<SalaJugador> players) {
        return activeGames.computeIfAbsent(salaId, id -> createGame(id, players));
    }

    public GameState getState(String salaId) {
        return activeGames.get(salaId);
    }

    public void removeGame(String salaId) {
        activeGames.remove(salaId);
    }

    private GameState createGame(String salaId, List<SalaJugador> players) {
        GameState state = new GameState();
        state.setSalaId(salaId);

        List<String> order = players.stream()
                .map(SalaJugador::getNombre)
                .collect(Collectors.toList());
        state.setTurnOrder(new ArrayList<>(order));
        state.setCurrentTurnPlayer(order.get(0));

        for (SalaJugador player : players) {
            String name = player.getNombre();
            state.getCoins().put(name, INITIAL_COINS);

            GameState.RegionNodeState region = new GameState.RegionNodeState();
            region.setOwner(name);
            region.setLives(MAX_LIVES);
            region.setVictorias(0);

            String faction = player.getFaction() != null ? player.getFaction() : "Demacia";
            region.setFaction(faction);
            String[] fd = FACTION_DATA.getOrDefault(faction, new String[]{"🛡️", "#c89b3c"});
            region.setIcon(fd[0]);
            region.setColor(fd[1]);
            region.setCost(FACTION_COST.getOrDefault(faction, 250));

            state.getRegions().put(name, region);
        }

        state.getLog().add("¡La batalla de Runaterra ha comenzado!");
        return state;
    }

    public GameState attack(String salaId, String attackerName, String targetName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(attackerName)) return null;

        if (state.getCoins().getOrDefault(attackerName, 0) < ATTACK_COST) return null;

        GameState.RegionNodeState targetRegion = state.getRegions().get(targetName);
        if (targetRegion == null || targetRegion.getOwner().equals(attackerName)) return null;

        state.getCoins().merge(attackerName, -ATTACK_COST, Integer::sum);

        boolean win = Math.random() < ATTACK_SUCCESS_RATE;
        if (win) {
            state.getCoins().merge(attackerName, ATTACK_WIN_REWARD, Integer::sum);
            String oldOwner = targetRegion.getOwner();
            targetRegion.setOwner(attackerName);
            targetRegion.setVictorias(targetRegion.getVictorias() + 1);
            state.getLog().add(attackerName + " conquistó la región de " + oldOwner + "! +200💰");
        } else {
            state.getCoins().merge(attackerName, ATTACK_LOSE_REWARD, Integer::sum);
            int newLives = Math.max(0, targetRegion.getLives() - 1);
            targetRegion.setLives(newLives);
            state.getLog().add(attackerName + " atacó a " + targetName + " pero falló. " + targetName + " pierde 1 vida. +50💰");
        }

        checkWinCondition(state);
        return state;
    }

    public GameState reinforce(String salaId, String playerName, String targetKey) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(playerName)) return null;

        GameState.RegionNodeState region = state.getRegions().get(targetKey);
        if (region == null || !region.getOwner().equals(playerName)) return null;

        int cost = region.getCost();
        if (state.getCoins().getOrDefault(playerName, 0) < cost) return null;

        state.getCoins().merge(playerName, -cost, Integer::sum);
        region.setLives(MAX_LIVES);
        state.getLog().add(playerName + " reforzó su región al máximo. -" + cost + "💰");

        return state;
    }

    public GameState endTurn(String salaId, String playerName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(playerName)) return null;

        List<String> order = state.getTurnOrder();
        int currentIdx = order.indexOf(playerName);
        int nextIdx = (currentIdx + 1) % order.size();
        String nextPlayer = order.get(nextIdx);

        state.setCurrentTurnPlayer(nextPlayer);
        if (nextIdx == 0) {
            state.setRoundNumber(state.getRoundNumber() + 1);
        }

        state.getCoins().merge(nextPlayer, TURN_INCOME, Integer::sum);
        state.getLog().add(playerName + " finalizó su turno. Turno de " + nextPlayer + ". +" + TURN_INCOME + "💰");

        return state;
    }

    private void checkWinCondition(GameState state) {
        Set<String> activeOwners = state.getRegions().values().stream()
                .filter(r -> r.getLives() > 0)
                .map(GameState.RegionNodeState::getOwner)
                .collect(Collectors.toSet());

        if (activeOwners.size() == 1) {
            String winner = activeOwners.iterator().next();
            state.setStatus("FINISHED");
            state.setWinner(winner);
            state.getLog().add("🏆 ¡" + winner + " ha ganado la batalla de Runaterra!");
        } else if (activeOwners.isEmpty()) {
            state.setStatus("FINISHED");
            state.getLog().add("¡Empate! Todos los jugadores han sido eliminados.");
        }
    }
}
