# ============================================================================
# SCRIPT 1: INICIAR MOTORES Y CARGAR DATASET LIMPIO (260 REGISTROS + TTL NUEVO)
# Úsalo para practicar o 1 minuto antes de tu presentación en vivo de 15 min
# Ejecución en PowerShell: .\1_iniciar_y_cargar_todo.ps1
# ============================================================================

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  1. LEVANTANDO CONTENEDORES DOCKER (MONGODB 7.0 + REDIS STACK) " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
docker compose up -d
Start-Sleep -Seconds 2

Write-Host "`n================================================================" -ForegroundColor Yellow
Write-Host "  2. CREANDO ESQUEMAS BSON (5 COLECCIONES) Y 14 INDICES MONGODB " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
docker exec megashop_mongodb mongosh --quiet /scripts/01_mongodb_schema.js

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  3. INSERTANDO 230 DOCUMENTOS EN MONGODB (megashop_db)         " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
docker exec megashop_mongodb mongosh --quiet /scripts/02_mongodb_seed.js

Write-Host "`n================================================================" -ForegroundColor Magenta
Write-Host "  4. CARGANDO 30 REGISTROS EN REDIS CON TTL REINICIADO AL 100%  " -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Get-Content scripts/02_redis_seed.redis | docker exec -i megashop_redis redis-cli

Write-Host "`n[LISTO] Los 260 registros (230 MongoDB + 30 Redis) están cargados y con el tiempo de expiración (TTL) recién iniciado." -ForegroundColor Green
Write-Host "Comandos individuales para tu exposición en vivo de 15 minutos:" -ForegroundColor Cyan
Write-Host "  -> Ejecutar consultas MongoDB : docker exec megashop_mongodb mongosh --quiet /scripts/03_mongodb_queries.js"
Write-Host "  -> Ejecutar operaciones Redis : Get-Content scripts/04_redis_operations.redis | docker exec -i megashop_redis redis-cli"
Write-Host "  -> Entrar a consola MongoDB   : docker exec -it megashop_mongodb mongosh megashop_db"
Write-Host "  -> Entrar a consola Redis     : docker exec -it megashop_redis redis-cli`n"
