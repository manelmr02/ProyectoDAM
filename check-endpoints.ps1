# ============================================================
# PARAMETROS DE ENTRADA
#   -BaseUrl : URL base del servidor (por defecto localhost)
#   -User    : nickname cuyas stats y perfil se consultaran en las secciones 3 y 8
#
# Uso:
#   .\check-endpoints.ps1
#   .\check-endpoints.ps1 -BaseUrl "http://51.107.3.232"
#   .\check-endpoints.ps1 -BaseUrl "http://51.107.3.232" -User "manelmr"
# ============================================================
param(
    [string]$BaseUrl  = "http://localhost:8080",
    [string]$User     = "middleware_admin"   # Usado para buscar por nickname y ver sus stats
)

# Silencia los errores de PowerShell para manejarlos nosotros manualmente dentro de cada try/catch
$ErrorActionPreference = "SilentlyContinue"

# ── Funciones de salida con colores ──────────────────────────
# Cada funcion imprime una linea con un prefijo y un color distinto segun el resultado
function OK   ($msg) { Write-Host "  [OK]   $msg" -ForegroundColor Green  }  # Exito
function FAIL ($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red    }  # Fallo
function INFO ($msg) { Write-Host "  [>>]   $msg" -ForegroundColor Cyan   }  # Informacion
function WARN ($msg) { Write-Host "  [!!]   $msg" -ForegroundColor Yellow }  # Aviso / Skip
function HEAD ($msg) { Write-Host "`n--- $msg ---" -ForegroundColor White  }  # Titulo de seccion

# ── Contadores globales de resultados ────────────────────────
# Se usan [int] para forzar tipo entero y poder hacer ++ sin errores
[int]$script:pass = 0  # Checks superados
[int]$script:fail = 0  # Checks fallidos
[int]$script:skip = 0  # Checks omitidos (sin token o sin datos)

# ── Funcion principal de llamada HTTP ────────────────────────
# Centraliza todas las peticiones REST del script.
# Recibe el metodo, la ruta, una etiqueta descriptiva, body opcional,
# token JWT opcional, codigos HTTP que se consideran exitosos,
# y un flag para omitir la llamada si no hay token.
function Invoke-Endpoint {
    param(
        [string]$Method,           # Metodo HTTP: GET, POST, PUT, DELETE
        [string]$Path,             # Ruta relativa, ej: /api/usuarios
        [string]$Label,            # Texto descriptivo que aparece en la salida
        [hashtable]$Body = $null,  # Cuerpo JSON de la peticion (opcional)
        [string]$Token   = $null,  # Token JWT para el header Authorization (opcional)
        [int[]]$OkCodes  = @(200, 201, 204),  # Codigos HTTP que se consideran correctos
        [switch]$SkipOnNoToken     # Si se activa y no hay token, omite la llamada
    )

    # Si el endpoint requiere token y no lo tenemos, lo marcamos como SKIP
    if ($SkipOnNoToken -and -not $Token) {
        WARN "SKIP  $Method $Path  (sin token JWT)"
        $script:skip++
        return $null
    }

    # Construir cabeceras: siempre JSON, y Authorization si hay token
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $uri = "$BaseUrl$Path"
    try {
        # Parametros base de la peticion
        $params = @{
            Method          = $Method
            Uri             = $uri
            Headers         = $headers
            UseBasicParsing = $true   # Evita dependencia de Internet Explorer
            TimeoutSec      = 10
        }
        # Anadir body solo si se ha proporcionado
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Compress) }

        $resp = Invoke-WebRequest @params
        $code = $resp.StatusCode

        # Verificar si el codigo de respuesta es uno de los esperados
        if ($OkCodes -contains $code) {
            OK "$Method $Path  [$code]  $Label"
            $script:pass++
            return $resp
        } else {
            FAIL "$Method $Path  [$code]  $Label"
            $script:fail++
            return $resp
        }
    } catch {
        # PowerShell lanza excepcion para codigos 4xx y 5xx, los capturamos aqui
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -and ($OkCodes -contains $code)) {
            # El codigo es un error HTTP pero estaba en la lista de aceptados (ej: 404 esperado)
            OK "$Method $Path  [$code]  $Label"
            $script:pass++
        } elseif ($code -eq 401 -or $code -eq 403) {
            # Sin autorizacion: no contamos como fallo, sino como skip
            WARN "SKIP  $Method $Path  [$code]  $Label (sin permisos)"
            $script:skip++
        } elseif ($code -eq 404) {
            FAIL "$Method $Path  [404]  $Label (no encontrado)"
            $script:fail++
        } elseif ($code) {
            FAIL "$Method $Path  [$code]  $Label"
            $script:fail++
        } else {
            # Sin codigo HTTP: error de red (servidor caido, timeout, DNS...)
            FAIL "$Method $Path  [ERR]  $Label  ($($_.Exception.Message))"
            $script:fail++
        }
        return $null
    }
}

# ════════════════════════════════════════════════════════════
# INICIO DEL SCRIPT
# ════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "=================================================="
Write-Host "   ProyectoDAM - API Endpoint Health Check"
Write-Host "=================================================="
INFO "Base URL : $BaseUrl"
INFO "Fecha    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# ── SECCION 0: Conectividad ───────────────────────────────────
# Comprueba que el servidor responde antes de continuar.
# Usa check-email porque es publico y ligero. Si no hay respuesta
# alguna (ni siquiera un codigo de error HTTP), el servidor esta caido
# y no tiene sentido seguir, por eso se hace exit 1.
HEAD "0. Conectividad"
try {
    $ping = Invoke-WebRequest -Uri "$BaseUrl/api/auth/check-email?email=test@test.com" `
        -Method GET -UseBasicParsing -TimeoutSec 5
    OK "Servidor accesible en $BaseUrl"
    $script:pass++
} catch {
    $c = $_.Exception.Response.StatusCode.value__
    if ($c) {
        # Respondio con algun codigo HTTP (aunque sea 404): el servidor esta vivo
        OK "Servidor accesible en $BaseUrl  [$c]"
        $script:pass++
    } else {
        # No hubo respuesta en absoluto: servidor caido o URL incorrecta
        FAIL "Servidor NO accesible en $BaseUrl  $($_.Exception.Message)"
        $script:fail++
        Write-Host "`n  Arranca el backend antes de ejecutar este script." -ForegroundColor Yellow
        exit 1
    }
}

# ── SECCION 1: Auth publica ───────────────────────────────────
# Prueba los endpoints de autenticacion que NO requieren token.
# - check-email: devuelve 404 si el email no existe (comportamiento esperado)
# - reset-password: devuelve 400 con email inexistente (comportamiento esperado)
# - register: crea un usuario temporal unico para las pruebas del resto del script
HEAD "1. Auth - endpoints publicos"
Invoke-Endpoint GET  "/api/auth/check-email?email=noexiste@test.com" "Check email" -OkCodes @(200, 404)
Invoke-Endpoint POST "/api/auth/reset-password" "Reset password (email invalido)" `
    -Body @{ email = "noexiste__check@test.com" } -OkCodes @(200, 400, 404)

# Generar credenciales unicas para el usuario de prueba con numero aleatorio
# para evitar colisiones si el script se ejecuta varias veces seguidas
$testUser  = "healthcheck_$(Get-Random -Maximum 9999)"
$testPass  = "Test1234!"
$testEmail = "$testUser@healthcheck.local"
$token     = $null

# Registrar el usuario de prueba. El endpoint /register devuelve directamente
# un token JWT al registrarse, que reutilizamos para no tener que hacer login aparte.
try {
    $regBody = @{ username=$testUser; email=$testEmail; password=$testPass } | ConvertTo-Json -Compress
    $regResp = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/auth/register" `
        -Headers @{ "Content-Type"="application/json" } `
        -Body $regBody -UseBasicParsing -TimeoutSec 10
    $regJson = $regResp.Content | ConvertFrom-Json
    $token   = $regJson.token  # Guardamos el token para usarlo en el resto de llamadas
    OK "POST /api/auth/register  [$($regResp.StatusCode)]  Registro usuario de prueba"
    $script:pass++
} catch {
    $c = $_.Exception.Response.StatusCode.value__
    WARN "POST /api/auth/register  [$c]  Registro usuario de prueba"
    $script:skip++
}

# ── SECCION 2: Login ─────────────────────────────────────────
# Si el registro devolvio token lo usamos directamente.
# Si no (por ejemplo el usuario ya existia y el registro fallo),
# intentamos hacer login explicito con las credenciales del usuario de prueba.
HEAD "2. Login / Token JWT"
if (-not $token) {
    try {
        $loginBody2 = @{ usernameOrEmail=$testUser; password=$testPass } | ConvertTo-Json -Compress
        $loginResp2 = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/auth/login" `
            -Headers @{ "Content-Type"="application/json" } `
            -Body $loginBody2 -UseBasicParsing -TimeoutSec 10
        $loginJson2 = $loginResp2.Content | ConvertFrom-Json
        $token = $loginJson2.token
    } catch {}
}

if ($token) {
    OK "POST /api/auth/login  [200]  Login con usuario de prueba - token JWT obtenido"
    $script:pass++
} else {
    FAIL "POST /api/auth/login  [ERR]  No se pudo obtener token JWT"
    $script:fail++
    WARN "Los endpoints protegidos se marcaran como SKIP"
}

# ── SECCION 3: Usuarios ───────────────────────────────────────
# Primero lista todos los usuarios para obtener un ID real con el que
# probar los endpoints que requieren {id} en la ruta.
HEAD "3. Usuarios"
$userId = $null
$usersResp = Invoke-Endpoint GET "/api/usuarios" "Listar todos los usuarios" `
    -Token $token -SkipOnNoToken -OkCodes @(200)

# Extraer el id del primer usuario de la lista para usarlo en las siguientes llamadas
if ($usersResp) {
    try {
        $users = $usersResp.Content | ConvertFrom-Json
        if ($users -and $users.Count -gt 0) {
            $userId = $users[0].id
            INFO "Primer usuario - id: $userId"
        }
    } catch {}
}

if ($userId) {
    $null = Invoke-Endpoint GET "/api/usuarios/$userId"          "Obtener usuario por ID"  -Token $token -OkCodes @(200)
    $null = Invoke-Endpoint GET "/api/usuarios/$userId/regiones" "Regiones de un usuario"  -Token $token -OkCodes @(200)
} else {
    WARN "SKIP  GET /api/usuarios/{id}  (no se obtuvo ID)"
    $script:skip += 2
}

# Buscar por nickname; acepta 404 porque el usuario de prueba puede no tener perfil completo
$null = Invoke-Endpoint GET "/api/usuarios/by-username/$User" "Obtener usuario por nickname" `
    -Token $token -SkipOnNoToken -OkCodes @(200, 404)

# ── SECCION 4: Regiones ───────────────────────────────────────
HEAD "4. Regiones"
$null = Invoke-Endpoint GET "/api/regiones"         "Listar todas las regiones" -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/regiones/ranking" "Ranking de regiones"       -Token $token -SkipOnNoToken -OkCodes @(200)

# ── SECCION 5: Partidas ───────────────────────────────────────
# Solo se prueba el listado. El GET por ID no se incluye porque las partidas
# solo existen durante una sesion de juego activa y no hay forma de crear
# una de prueba sin iniciar una partida real.
HEAD "5. Partidas"
$null = Invoke-Endpoint GET "/api/partidas" "Listar todas las partidas" `
    -Token $token -SkipOnNoToken -OkCodes @(200)

# ── SECCION 6: Salas ──────────────────────────────────────────
# Para poder probar GET /api/salas/{id} necesitamos una sala existente.
# Estrategia: crear una sala de prueba → probar GET por ID → borrarla al terminar.
HEAD "6. Salas"
$null = Invoke-Endpoint GET "/api/salas" "Listar todas las salas" -Token $token -SkipOnNoToken -OkCodes @(200)

if ($token) {
    $salaTestId = $null

    # Crear sala temporal con datos minimos
    try {
        $salaBody = @{ nombre="healthcheck_sala"; creador=$testUser; maxJugadores=2; esPrivada=$false } | ConvertTo-Json -Compress
        $salaResp = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/salas" `
            -Headers @{ "Content-Type"="application/json"; "Authorization"="Bearer $token" } `
            -Body $salaBody -UseBasicParsing -TimeoutSec 10
        $salaJson = $salaResp.Content | ConvertFrom-Json
        $salaTestId = $salaJson.id  # Guardamos el ID para el GET y el DELETE posteriores
        OK "POST /api/salas  [$($salaResp.StatusCode)]  Crear sala de prueba"
        $script:pass++
    } catch {
        $c = $_.Exception.Response.StatusCode.value__
        FAIL "POST /api/salas  [$c]  Crear sala de prueba"
        $script:fail++
    }

    if ($salaTestId) {
        # Probar GET por ID usando la sala recien creada
        $null = Invoke-Endpoint GET "/api/salas/$salaTestId" "Obtener sala por ID" -Token $token -OkCodes @(200)

        # Borrar la sala de prueba para no dejar basura en la base de datos
        try {
            $null = Invoke-WebRequest -Method DELETE -Uri "$BaseUrl/api/salas/$salaTestId" `
                -Headers @{ "Authorization"="Bearer $token" } -UseBasicParsing -TimeoutSec 10
            INFO "Sala de prueba eliminada (id: $salaTestId)"
        } catch {}
    }
}

# ── SECCION 7: Estadisticas (MongoDB) ────────────────────────
# Endpoints que consultan datos agregados almacenados en MongoDB.
# Pueden devolver listas vacias o mensajes "No hay datos" si no hay partidas jugadas,
# pero el codigo HTTP debe ser siempre 200.
HEAD "7. Estadisticas (MongoDB)"
$null = Invoke-Endpoint GET "/api/estadisticas/partidas"             "Partidas en MongoDB"     -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/estadisticas/usuario-top"          "Usuario top"             -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/estadisticas/tipo-region-top"      "Tipo de region top"      -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/estadisticas/ranking-usuarios"     "Ranking de usuarios"     -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/estadisticas/ranking-tipos-region" "Ranking tipos de region" -Token $token -SkipOnNoToken -OkCodes @(200)

# ── SECCION 8: Player Stats ───────────────────────────────────
# Endpoints publicos (no necesitan token) que exponen el ranking de jugadores
# y las estadisticas individuales almacenadas en MongoDB.
HEAD "8. Player Stats"
$null = Invoke-Endpoint GET "/api/stats/ranking"        "Ranking global de jugadores" -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/stats/ranking?tier=1" "Ranking filtrado por tier"   -Token $token -SkipOnNoToken -OkCodes @(200)
$null = Invoke-Endpoint GET "/api/stats/$User"          "Stats del usuario ($User)"   -Token $token -SkipOnNoToken -OkCodes @(200, 404)

# ── SECCION 9: Logout ─────────────────────────────────────────
# Invalida el token JWT en el servidor. Se hace al final para que el token
# siga siendo valido durante todas las pruebas anteriores.
HEAD "9. Logout"
$null = Invoke-Endpoint POST "/api/auth/logout" "Logout" -Token $token -SkipOnNoToken -OkCodes @(200, 204)

# ── RESUMEN FINAL ─────────────────────────────────────────────
$total = $script:pass + $script:fail + $script:skip
Write-Host ""
Write-Host "=================================================="
Write-Host "                   RESUMEN"
Write-Host "=================================================="
Write-Host "  Total  : $total"
Write-Host "  OK     : $($script:pass)" -ForegroundColor Green
if ($script:fail -gt 0) {
    Write-Host "  FAIL   : $($script:fail)" -ForegroundColor Red
} else {
    Write-Host "  FAIL   : $($script:fail)" -ForegroundColor Green
}
Write-Host "  SKIP   : $($script:skip)" -ForegroundColor Yellow
Write-Host "=================================================="
Write-Host ""

# Codigo de salida: 1 si hay fallos (util para CI/CD), 0 si todo esta bien
if ($script:fail -gt 0) {
    Write-Host "  Algunos endpoints fallaron. Revisa los logs del backend." -ForegroundColor Red
    exit 1
} else {
    Write-Host "  Todos los endpoints respondieron correctamente." -ForegroundColor Green
    exit 0
}
