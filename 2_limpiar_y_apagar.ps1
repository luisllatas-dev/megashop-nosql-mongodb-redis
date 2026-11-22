# ============================================================================
# SCRIPT 2: BORRAR DATOS DE PRACTICA Y APAGAR CONTENEDORES
# Úsalo después de practicar para dejar tu PC limpia sin procesos corriendo
# Ejecución en PowerShell: .\2_limpiar_y_apagar.ps1
# ============================================================================

Write-Host "`n================================================================" -ForegroundColor Red
Write-Host "  LIMPIANDO BASES DE DATOS (MONGODB + REDIS) Y APAGANDO DOCKER  " -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red

docker exec megashop_mongodb mongosh --quiet megashop_db --eval "db.dropDatabase()" 2>$null
docker exec megashop_redis redis-cli FLUSHALL 2>$null
docker compose down -v

Write-Host "`n[OK] Todos los datos de práctica fueron borrados y los contenedores están apagados." -ForegroundColor Green
Write-Host "Cuando quieras volver a practicar o antes de tu presentación en vivo, solo ejecuta:" -ForegroundColor Cyan
Write-Host "  .\1_iniciar_y_cargar_todo.ps1`n"
