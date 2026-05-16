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
    private static final double REINFORCE_FAIL_STEP = 0.20; // +20% per attempt
    private static final double REINFORCE_FAIL_CAP  = 0.80;

    @AllArgsConstructor @Getter
    private static class FactionStats {
        int    maxLives;
        int    startCoins;
        int    incomePerTurn;
        double attackBonus;
        int    reinforceCost;
    }

    @AllArgsConstructor @Getter
    private static class ItemTemplate {
        String id, name, effect, type;
        int    iconId, value;

        GameState.ItemCard toCard() {
            GameState.ItemCard c = new GameState.ItemCard();
            c.setId(id); c.setName(name); c.setEffect(effect);
            c.setIconId(iconId); c.setType(type); c.setValue(value);
            return c;
        }
    }

    private static final List<ItemTemplate> ITEM_CATALOG = List.of(
        new ItemTemplate("Eclipse",          "Eclipse",               "+8 vida",                  "lives",         6692,  8),
        new ItemTemplate("FiloInfinito",     "Filo Infinito",          "+1500 oro",                "coins",         3031,  1500),
        new ItemTemplate("SedDeSangre",      "Sed de Sangre",          "+150 ingreso/turno",       "income",        3072,  150),
        new ItemTemplate("EgidaLegion",      "Égida de la Legión",     "+7 vida",                  "lives",         3105,  7),
        new ItemTemplate("CorazonHielo",     "Corazón de Hielo",       "-75 oro al reforzar",      "reinforce",     3110, -75),
        new ItemTemplate("VeloBanshee",      "Velo de la Banshee",     "Resetea fallo de refuerzo","resetReinforce",3102,  0),
        new ItemTemplate("DanzarinMuerte",   "Danzarín de la Muerte",  "+100 ingreso/turno",       "income",        6333,  100),
        new ItemTemplate("TridentePosei",    "Tridente de Poseidón",   "+1000 oro",                "coins",         3078,  1000),
        new ItemTemplate("MareaNoche",       "Marea de la Noche",      "+6 vida",                  "lives",         6630,  6),
        new ItemTemplate("GarraDragon",      "Garra del Dragón",       "+9 vida",                  "lives",         3065,  9),
        new ItemTemplate("LichBane",         "Lich Bane",              "+200 ingreso/turno",       "income",        3100,  200),
        new ItemTemplate("HarvesterSorrow",  "Harvester of Sorrow",    "+500 oro",                 "coins",         4628,  500),
        new ItemTemplate("TempestadVolteo",  "Tempestad de Volteo",    "+1200 oro",                "coins",         6696,  1200),
        new ItemTemplate("Incendio",         "Incendio",               "-100 oro al reforzar",     "reinforce",     3165, -100),
        new ItemTemplate("JoyaGuardian",     "Joya del Guardián",      "+5 vida",                  "lives",         3026,  5),
        new ItemTemplate("EspirituBosque",   "Espíritu del Bosque",    "+8 vida",                  "lives",         3085,  8),
        new ItemTemplate("KrakenAsesino",    "Kraken Asesino",         "+1500 oro",                "coins",         6672,  1500),
        new ItemTemplate("EspadaSombria",    "Espada Sombría",         "-50 oro al reforzar",      "reinforce",     4636, -50),
        new ItemTemplate("MortalReminder",   "Mortal Reminder",        "+100 ingreso/turno",       "income",        3033,  100),
        new ItemTemplate("FuerzaNatura",     "Fuerza de la Naturaleza","Resetea fallo de refuerzo","resetReinforce",4401,  0),
        new ItemTemplate("SunfireAegis",     "Sunfire Aegis",          "+10 vida",                 "lives",         3068,  10),
        new ItemTemplate("GuanteleteGlac",   "Guantelete Glacial",     "-75 oro al reforzar",      "reinforce",     6662, -75),
        new ItemTemplate("SombreroRabadon",  "Sombrero de Rabadon",    "+1000 oro",                "coins",         3089,  1000),
        new ItemTemplate("VarillaVoid",      "Varilla de Void",        "+150 ingreso/turno",       "income",        3135,  150),
        new ItemTemplate("LudensTempest",    "Luden's Tempest",         "+1500 oro",                "coins",         6655,  1500),
        new ItemTemplate("ZhonyasHourglass", "Zhonya's Hourglass",     "Resetea fallo de refuerzo","resetReinforce",3157,  0),
        new ItemTemplate("Thornmail",        "Thornmail",              "+7 vida",                  "lives",         3076,  7),
        new ItemTemplate("WitsEnd",          "Wit's End",               "+100 ingreso/turno",       "income",        3091,  100),
        new ItemTemplate("SteraksGage",      "Sterak's Gage",           "+9 vida",                  "lives",         3053,  9),
        new ItemTemplate("ImmortalShield",   "Immortal Shieldbow",     "Resetea fallo de refuerzo","resetReinforce",6673,  0)
    );

    private static final Map<String, String[]>      FACTION_VISUAL = new LinkedHashMap<>();
    private static final Map<String, FactionStats>  FACTION_STATS  = new LinkedHashMap<>();
    private static final FactionStats DEFAULT_STATS = new FactionStats(10, 1000, 100, 0.0, 280);

    static {
        FACTION_VISUAL.put("Demacia",          new String[]{"🛡️", "#c89b3c"});
        FACTION_VISUAL.put("Noxus",            new String[]{"🪓", "#c0392b"});
        FACTION_VISUAL.put("Freljord",         new String[]{"❄️", "#5dade2"});
        FACTION_VISUAL.put("Ionia",            new String[]{"🌸", "#e91e8c"});
        FACTION_VISUAL.put("Piltover",         new String[]{"⚙️", "#f39c12"});
        FACTION_VISUAL.put("Zaun",             new String[]{"🧪", "#27ae60"});
        FACTION_VISUAL.put("Shurima",          new String[]{"⏳", "#f1c40f"});
        FACTION_VISUAL.put("Shadow Isles",     new String[]{"👻", "#8e44ad"});
        FACTION_VISUAL.put("Targon",           new String[]{"☀️", "#e8d5a3"});
        FACTION_VISUAL.put("Bilgewater",       new String[]{"⚓", "#2980b9"});
        FACTION_VISUAL.put("Ixtal",            new String[]{"🌿", "#1abc9c"});
        FACTION_VISUAL.put("Void",             new String[]{"👾", "#9b59b6"});
        FACTION_VISUAL.put("Tierras Perdidas", new String[]{"❓", "#3d0f5e"});

        FACTION_STATS.put("Demacia",          new FactionStats(12, 1000, 100,  0.00, 200));
        FACTION_STATS.put("Noxus",            new FactionStats( 8,  800, 100,  0.25, 300));
        FACTION_STATS.put("Freljord",         new FactionStats(15,  700,  80, -0.10, 180));
        FACTION_STATS.put("Ionia",            new FactionStats(10, 1000, 160,  0.00, 280));
        FACTION_STATS.put("Piltover",         new FactionStats( 9, 1500, 160, -0.15, 350));
        FACTION_STATS.put("Zaun",             new FactionStats(10,  900, 130,  0.10, 240));
        FACTION_STATS.put("Shurima",          new FactionStats(10, 1000, 100,  0.15, 280));
        FACTION_STATS.put("Shadow Isles",     new FactionStats( 8,  700,  80,  0.30, 400));
        FACTION_STATS.put("Targon",           new FactionStats(13,  800,  90,  0.00, 280));
        FACTION_STATS.put("Bilgewater",       new FactionStats(10, 1200, 140,  0.10, 250));
        FACTION_STATS.put("Ixtal",            new FactionStats(10, 1000, 150,  0.05, 240));
        FACTION_STATS.put("Void",             new FactionStats( 6, 1500, 170,  0.35, 500));
        FACTION_STATS.put("Tierras Perdidas", new FactionStats(10, 1000, 100,  0.00, 280));
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

        // Give first player of Tierras Perdidas their first item choices
        String first = order.get(0);
        GameState.RegionNodeState firstRegion = state.getRegions().get(first);
        if (firstRegion != null && "Tierras Perdidas".equals(firstRegion.getFaction())) {
            giveItemsToPlayer(state, first);
        }

        state.getLog().add("¡La batalla de Runaterra ha comenzado! Turno de " + order.get(0) + ".");
        return state;
    }

    // ── Actions ──────────────────────────────────────────────────────────────────

    public GameState attack(String salaId, String attackerName, String targetName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(attackerName)) return null;
        if (state.isHasActedThisTurn()) return null;

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
        if (state.isHasActedThisTurn()) return null;

        GameState.RegionNodeState region = state.getRegions().get(targetKey);
        if (region == null || !region.getOwner().equals(playerName)) return null;
        if (region.getLives() <= 0) return null;
        if (region.getLives() >= region.getMaxLives()) return null;

        int cost = region.getReinforceCost();
        if (state.getCoins().getOrDefault(playerName, 0) < cost) return null;

        int attempts    = state.getReinforceCount().getOrDefault(playerName, 0);
        double failPct  = Math.min(REINFORCE_FAIL_CAP, attempts * REINFORCE_FAIL_STEP);

        state.getCoins().merge(playerName, -cost, Integer::sum);
        state.setHasActedThisTurn(true);
        state.getReinforceCount().merge(playerName, 1, Integer::sum);

        if (Math.random() < failPct) {
            state.getLog().add("💥 " + playerName + " intentó reforzar pero ¡FALLÓ! ("
                    + (int)(failPct * 100) + "% prob. fallo). -" + cost + "💰");
        } else {
            region.setLives(region.getMaxLives());
            state.getLog().add("🔧 " + playerName + " reforzó su región al máximo ("
                    + region.getMaxLives() + " vidas). -" + cost + "💰");
        }

        return state;
    }

    public GameState endTurn(String salaId, String playerName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;
        if (!state.getCurrentTurnPlayer().equals(playerName)) return null;

        List<String> order = state.getTurnOrder();
        int currentIdx = order.indexOf(playerName);

        int nextIdx = (currentIdx + 1) % order.size();
        for (int tries = 0; tries < order.size(); tries++) {
            String candidate = order.get(nextIdx);
            GameState.RegionNodeState r = state.getRegions().get(candidate);
            if (r != null && r.getLives() > 0) break;
            nextIdx = (nextIdx + 1) % order.size();
        }

        String nextPlayer = order.get(nextIdx);

        if (nextIdx <= currentIdx) {
            int completedRound = state.getRoundNumber();
            state.setRoundNumber(completedRound + 1);
            addRoundSummary(state, completedRound);

            // Every 2 rounds, distribute items to all alive players
            if (state.getRoundNumber() % 2 == 0) {
                distributeItemsToAll(state);
            }
        }

        state.setCurrentTurnPlayer(nextPlayer);
        state.setHasActedThisTurn(false);
        state.setTurnStartTime(System.currentTimeMillis());

        GameState.RegionNodeState nextRegion = state.getRegions().get(nextPlayer);
        String nextFaction = nextRegion != null ? nextRegion.getFaction() : "Demacia";
        FactionStats nextStats = FACTION_STATS.getOrDefault(nextFaction, DEFAULT_STATS);
        int income = nextStats.getIncomePerTurn() + state.getIncomeBonus().getOrDefault(nextPlayer, 0);
        state.getCoins().merge(nextPlayer, income, Integer::sum);

        state.getLog().add("🔄 Turno de " + nextPlayer + ". +" + income + "💰");

        // Tierras Perdidas always gets item choices at start of their turn
        if ("Tierras Perdidas".equals(nextFaction)) {
            giveItemsToPlayer(state, nextPlayer);
            state.getLog().add("✨ Las Tierras Perdidas invocan objetos místicos para " + nextPlayer + "...");
        }

        return state;
    }

    public GameState selectItem(String salaId, String playerName, String itemId) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;

        List<GameState.ItemCard> pending = state.getPendingItemChoices().get(playerName);
        if (pending == null || pending.isEmpty()) return null;

        GameState.ItemCard chosen = pending.stream()
                .filter(c -> c.getId().equals(itemId))
                .findFirst().orElse(null);
        if (chosen == null) return null;

        applyItemEffect(state, playerName, chosen);
        state.getPendingItemChoices().remove(playerName);
        state.getPlayerItems().computeIfAbsent(playerName, k -> new ArrayList<>()).add(chosen.getName());

        state.getLog().add("🎁 " + playerName + " adquirió " + chosen.getName() + " · " + chosen.getEffect());
        return state;
    }

    public GameState surrender(String salaId, String playerName) {
        GameState state = activeGames.get(salaId);
        if (state == null || !"PLAYING".equals(state.getStatus())) return null;

        GameState.RegionNodeState region = state.getRegions().get(playerName);
        if (region != null) region.setLives(0);

        state.getLog().add("🏳️ " + playerName + " ha abandonado la partida. Su región fue eliminada.");
        checkWinCondition(state);

        if (!"FINISHED".equals(state.getStatus()) && playerName.equals(state.getCurrentTurnPlayer())) {
            return endTurn(salaId, playerName);
        }
        return state;
    }

    // ── Item helpers ─────────────────────────────────────────────────────────────

    private void giveItemsToPlayer(GameState state, String playerName) {
        List<ItemTemplate> shuffled = new ArrayList<>(ITEM_CATALOG);
        Collections.shuffle(shuffled);
        List<GameState.ItemCard> offered = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            offered.add(shuffled.get(i).toCard());
        }
        state.getPendingItemChoices().put(playerName, offered);
    }

    private void distributeItemsToAll(GameState state) {
        state.getRegions().forEach((playerName, region) -> {
            if (region.getLives() > 0) {
                giveItemsToPlayer(state, playerName);
            }
        });
        state.getLog().add("🎴 ¡Han aparecido nuevos objetos! Cada jugador debe elegir uno.");
    }

    private void applyItemEffect(GameState state, String playerName, GameState.ItemCard item) {
        GameState.RegionNodeState region = state.getRegions().get(playerName);
        switch (item.getType()) {
            case "lives" -> {
                if (region != null) {
                    region.setMaxLives(region.getMaxLives() + item.getValue());
                    region.setLives(Math.min(region.getLives() + item.getValue(), region.getMaxLives()));
                }
            }
            case "coins"         -> state.getCoins().merge(playerName, item.getValue(), Integer::sum);
            case "income"        -> state.getIncomeBonus().merge(playerName, item.getValue(), Integer::sum);
            case "reinforce"     -> {
                if (region != null) {
                    region.setReinforceCost(Math.max(50, region.getReinforceCost() + item.getValue()));
                }
            }
            case "resetReinforce" -> state.getReinforceCount().remove(playerName);
        }
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
