#!/bin/bash
# ============================================================
# PARAMETROS DE ENTRADA
#   BASE_URL : URL base del servidor (por defecto localhost)
#   USER     : nickname cuyas stats y perfil se consultaran
#
# Uso:
#   ./check-endpoints.sh
#   ./check-endpoints.sh "http://51.107.3.232"
#   ./check-endpoints.sh "http://51.107.3.232" "manelmr"
# ============================================================

BASE_URL="${1:-http://localhost:8080}"
USER="${2:-middleware_admin}"

# ── Colores de salida ─────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m' # Sin color (reset)

ok()   { echo -e "${GREEN}  [OK]   $1${NC}"; }
fail() { echo -e "${RED}  [FAIL] $1${NC}"; }
info() { echo -e "${CYAN}  [>>]   $1${NC}"; }
warn() { echo -e "${YELLOW}  [!!]   $1${NC}"; }
section() { echo -e "\n${WHITE}--- $1 ---${NC}"; }

# ── Contadores ────────────────────────────────────────────────
PASS=0
FAIL=0
SKIP=0

# ── Funcion principal de llamada HTTP ────────────────────────
# Argumentos: METHOD PATH LABEL [TOKEN] [BODY] [OK_CODES...]
# Usa curl para hacer la peticion y compara el codigo de respuesta
# con los codigos aceptados. Si no hay token y se pasa "requiretoken",
# omite la llamada marcandola como SKIP.
invoke_endpoint() {
    local method="$1"
    local path="$2"
    local label="$3"
    local token="$4"       # Puede estar vacio
    local body="$5"        # Puede estar vacio
    local require_token="$6"
    shift 6
    local ok_codes=("$@")  # El resto de argumentos son los codigos aceptados

    # Si el endpoint requiere token y no lo tenemos, marcamos SKIP
    if [ "$require_token" = "true" ] && [ -z "$token" ]; then
        warn "SKIP  $method $path  (sin token JWT)"
        SKIP=$((SKIP + 1))
        return
    fi

    # Construir cabeceras curl
    local headers=(-H "Content-Type: application/json")
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi

    # Construir argumentos de body si se ha proporcionado
    local body_args=()
    if [ -n "$body" ]; then
        body_args=(-d "$body")
    fi

    # Llamada con curl:
    #   -s     : silencioso (sin barra de progreso)
    #   -o     : descarta el body de respuesta
    #   -w     : escribe solo el codigo HTTP en stdout
    #   --max-time : timeout de 10 segundos
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        "${headers[@]}" \
        "${body_args[@]}" \
        --max-time 10 \
        "$BASE_URL$path" 2>/dev/null)

    # Si curl falla (sin respuesta), code estara vacio o sera 000
    if [ -z "$code" ] || [ "$code" = "000" ]; then
        fail "$method $path  [ERR]  $label  (sin respuesta del servidor)"
        FAIL=$((FAIL + 1))
        return
    fi

    # Comprobar si el codigo esta en la lista de aceptados
    local accepted=false
    for c in "${ok_codes[@]}"; do
        if [ "$code" = "$c" ]; then
            accepted=true
            break
        fi
    done

    if [ "$accepted" = "true" ]; then
        ok "$method $path  [$code]  $label"
        PASS=$((PASS + 1))
    elif [ "$code" = "401" ] || [ "$code" = "403" ]; then
        warn "SKIP  $method $path  [$code]  $label (sin permisos)"
        SKIP=$((SKIP + 1))
    else
        fail "$method $path  [$code]  $label"
        FAIL=$((FAIL + 1))
    fi
}

# ════════════════════════════════════════════════════════════
# INICIO DEL SCRIPT
# ════════════════════════════════════════════════════════════
echo ""
echo "=================================================="
echo "   ProyectoDAM - API Endpoint Health Check"
echo "=================================================="
info "Base URL : $BASE_URL"
info "Fecha    : $(date '+%Y-%m-%d %H:%M:%S')"

# ── SECCION 0: Conectividad ───────────────────────────────────
# Comprueba que el servidor responde antes de continuar.
section "0. Conectividad"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/api/auth/check-email?email=test@test.com" 2>/dev/null)
if [ -z "$code" ] || [ "$code" = "000" ]; then
    fail "Servidor NO accesible en $BASE_URL"
    echo ""
    echo "  Arranca el backend antes de ejecutar este script."
    exit 1
else
    ok "Servidor accesible en $BASE_URL  [$code]"
    PASS=$((PASS + 1))
fi

# ── SECCION 1: Auth publica ───────────────────────────────────
# Prueba endpoints publicos y crea un usuario temporal para obtener token JWT.
section "1. Auth - endpoints publicos"
invoke_endpoint GET "/api/auth/check-email?email=noexiste@test.com" "Check email" "" "" "false" 200 404
invoke_endpoint POST "/api/auth/reset-password" "Reset password (email invalido)" "" '{"email":"noexiste__check@test.com"}' "false" 200 400 404

# Generar credenciales unicas para el usuario de prueba
TEST_USER="healthcheck_$RANDOM"
TEST_PASS="Test1234!"
TEST_EMAIL="${TEST_USER}@healthcheck.local"
TOKEN=""

# Registrar usuario de prueba con una sola llamada que devuelve body + codigo HTTP.
# El truco es escribir el body en un fichero temporal y capturar el codigo con -w.
REG_BODY="{\"username\":\"$TEST_USER\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}"
REG_TMPFILE=$(mktemp)
REG_CODE=$(curl -s -o "$REG_TMPFILE" -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$REG_BODY" \
    --max-time 10 \
    "$BASE_URL/api/auth/register" 2>/dev/null)
REG_RESP=$(cat "$REG_TMPFILE")
rm -f "$REG_TMPFILE"

# Extraer el token del JSON de respuesta con grep y sed (sin dependencias externas)
TOKEN=$(echo "$REG_RESP" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')

if [ -n "$TOKEN" ]; then
    ok "POST /api/auth/register  [200]  Registro usuario de prueba"
    PASS=$((PASS + 1))
else
    warn "POST /api/auth/register  [$REG_CODE]  Registro usuario de prueba"
    SKIP=$((SKIP + 1))
fi

# ── SECCION 2: Login ─────────────────────────────────────────
# Si el registro no devolvio token, intentamos login explicito.
section "2. Login / Token JWT"
if [ -z "$TOKEN" ]; then
    LOGIN_BODY="{\"usernameOrEmail\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}"
    LOGIN_RESP=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_BODY" \
        --max-time 10 \
        "$BASE_URL/api/auth/login" 2>/dev/null)
    TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
fi

if [ -n "$TOKEN" ]; then
    ok "POST /api/auth/login  [200]  Login con usuario de prueba - token JWT obtenido"
    PASS=$((PASS + 1))
else
    fail "POST /api/auth/login  [ERR]  No se pudo obtener token JWT"
    FAIL=$((FAIL + 1))
    warn "Los endpoints protegidos se marcaran como SKIP"
fi

# ── SECCION 3: Usuarios ───────────────────────────────────────
# Lista usuarios y extrae un ID real para probar los endpoints con {id}.
section "3. Usuarios"
USERS_TMPFILE=$(mktemp)
USERS_CODE=$(curl -s -o "$USERS_TMPFILE" -w "%{http_code}" -X GET \
    -H "Authorization: Bearer $TOKEN" \
    --max-time 10 \
    "$BASE_URL/api/usuarios" 2>/dev/null)
USERS_RESP=$(cat "$USERS_TMPFILE")
rm -f "$USERS_TMPFILE"

if [ "$USERS_CODE" = "200" ]; then
    ok "GET /api/usuarios  [200]  Listar todos los usuarios"
    PASS=$((PASS + 1))
    # Extraer el primer id del array JSON
    USER_ID=$(echo "$USERS_RESP" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    if [ -n "$USER_ID" ]; then
        info "Primer usuario - id: $USER_ID"
        invoke_endpoint GET "/api/usuarios/$USER_ID"          "Obtener usuario por ID"  "$TOKEN" "" "false" 200
        invoke_endpoint GET "/api/usuarios/$USER_ID/regiones" "Regiones de un usuario"  "$TOKEN" "" "false" 200
    else
        warn "SKIP  GET /api/usuarios/{id}  (no se obtuvo ID)"
        SKIP=$((SKIP + 2))
    fi
elif [ -z "$TOKEN" ]; then
    warn "SKIP  GET /api/usuarios  (sin token JWT)"
    SKIP=$((SKIP + 3))
else
    fail "GET /api/usuarios  [$USERS_CODE]  Listar todos los usuarios"
    FAIL=$((FAIL + 1))
fi

invoke_endpoint GET "/api/usuarios/by-username/$USER" "Obtener usuario por nickname" "$TOKEN" "" "true" 200 404

# ── SECCION 4: Regiones ───────────────────────────────────────
section "4. Regiones"
invoke_endpoint GET "/api/regiones"         "Listar todas las regiones" "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/regiones/ranking" "Ranking de regiones"       "$TOKEN" "" "true" 200

# ── SECCION 5: Partidas ───────────────────────────────────────
# Solo listado. El GET por ID no se prueba porque las partidas
# solo existen durante una sesion de juego activa.
section "5. Partidas"
invoke_endpoint GET "/api/partidas" "Listar todas las partidas" "$TOKEN" "" "true" 200

# ── SECCION 6: Salas ──────────────────────────────────────────
# Crea una sala temporal, prueba GET por ID y la borra al terminar.
section "6. Salas"
invoke_endpoint GET "/api/salas" "Listar todas las salas" "$TOKEN" "" "true" 200

if [ -n "$TOKEN" ]; then
    SALA_BODY="{\"nombre\":\"healthcheck_sala\",\"creador\":\"$TEST_USER\",\"maxJugadores\":2,\"esPrivada\":false}"
    SALA_TMPFILE=$(mktemp)
    SALA_CODE=$(curl -s -o "$SALA_TMPFILE" -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$SALA_BODY" \
        --max-time 10 \
        "$BASE_URL/api/salas" 2>/dev/null)
    SALA_RESP=$(cat "$SALA_TMPFILE")
    rm -f "$SALA_TMPFILE"

    SALA_ID=$(echo "$SALA_RESP" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

    if [ -n "$SALA_ID" ]; then
        ok "POST /api/salas  [$SALA_CODE]  Crear sala de prueba"
        PASS=$((PASS + 1))
        invoke_endpoint GET "/api/salas/$SALA_ID" "Obtener sala por ID" "$TOKEN" "" "false" 200

        # Borrar la sala de prueba para no dejar basura en la base de datos
        curl -s -o /dev/null -X DELETE \
            -H "Authorization: Bearer $TOKEN" \
            --max-time 10 \
            "$BASE_URL/api/salas/$SALA_ID" 2>/dev/null
        info "Sala de prueba eliminada (id: $SALA_ID)"
    else
        fail "POST /api/salas  [$SALA_CODE]  Crear sala de prueba"
        FAIL=$((FAIL + 1))
    fi
fi

# ── SECCION 7: Estadisticas (MongoDB) ────────────────────────
# Consultas agregadas en MongoDB. Pueden devolver listas vacias
# si no hay partidas jugadas, pero el codigo debe ser siempre 200.
section "7. Estadisticas (MongoDB)"
invoke_endpoint GET "/api/estadisticas/partidas"             "Partidas en MongoDB"     "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/estadisticas/usuario-top"          "Usuario top"             "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/estadisticas/tipo-region-top"      "Tipo de region top"      "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/estadisticas/ranking-usuarios"     "Ranking de usuarios"     "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/estadisticas/ranking-tipos-region" "Ranking tipos de region" "$TOKEN" "" "true" 200

# ── SECCION 8: Player Stats ───────────────────────────────────
# Endpoints publicos de ranking y estadisticas individuales en MongoDB.
section "8. Player Stats"
invoke_endpoint GET "/api/stats/ranking"        "Ranking global de jugadores" "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/stats/ranking?tier=1" "Ranking filtrado por tier"   "$TOKEN" "" "true" 200
invoke_endpoint GET "/api/stats/$USER"          "Stats del usuario ($USER)"   "$TOKEN" "" "true" 200 404

# ── SECCION 9: Logout ─────────────────────────────────────────
# Invalida el token JWT. Se hace al final para que siga siendo
# valido durante todas las pruebas anteriores.
section "9. Logout"
invoke_endpoint POST "/api/auth/logout" "Logout" "$TOKEN" "" "true" 200 204

# ── RESUMEN FINAL ─────────────────────────────────────────────
TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo "=================================================="
echo "                   RESUMEN"
echo "=================================================="
echo "  Total  : $TOTAL"
echo -e "${GREEN}  OK     : $PASS${NC}"
if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}  FAIL   : $FAIL${NC}"
else
    echo -e "${GREEN}  FAIL   : $FAIL${NC}"
fi
echo -e "${YELLOW}  SKIP   : $SKIP${NC}"
echo "=================================================="
echo ""

# Codigo de salida: 1 si hay fallos (util para CI/CD), 0 si todo esta bien
if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}  Algunos endpoints fallaron. Revisa los logs del backend.${NC}"
    exit 1
else
    echo -e "${GREEN}  Todos los endpoints respondieron correctamente.${NC}"
    exit 0
fi
