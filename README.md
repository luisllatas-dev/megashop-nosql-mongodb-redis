# 🛒 Caso Megashop — Arquitectura NoSQL Políglota (MongoDB + Redis)

Proyecto de diseño e implementación de una solución basada en **Bases de Datos No Relacionales** para la plataforma de e-commerce y delivery **Megashop**, combinando **MongoDB 7.0** (persistencia documental BSON) y **Redis Stack 7.2** (almacenamiento clave-valor en memoria RAM con expiración automática `TTL`).

---

## 👥 Integrantes del Equipo
- **Luis Llatas Mundaca**
- **Erick Cárdenas Moscoso**
- **Carlos Ocampo Zapata**

---

## 🏗️ Arquitectura y Distribución del Dataset (260 Registros)

La solución reemplaza el uso de hojas de cálculo por una arquitectura híbrida de persistencia políglota con **260 registros de prueba distribuidos**:

| Motor NoSQL | Colección / Patrón de Clave | Tipo | Registros | Descripción Técnica |
| :--- | :--- | :---: | :---: | :--- |
| **MongoDB** | `clientes` | BSON | **40** | Datos maestros (`CLI-0001` a `CLI-0040`) con array embebido `direcciones_entrega[]`. |
| **MongoDB** | `productos` | BSON | **40** | Catálogo (`PROD-0001` a `PROD-0040`) en 5 categorías con subdocumento polimórfico `especificaciones`. |
| **MongoDB** | `repartidores` | BSON | **25** | Flota de delivery (`REP-0001` a `REP-0025`) con subdocumentos `vehiculo` y `metricas`. |
| **MongoDB** | `pedidos` | BSON | **90** | Modelo híbrido (`PED-0001` a `PED-0090`): referencias a `cliente_id`/`repartidor_id` + snapshot embebido de `items[]` e `historial_estados[]`. |
| **MongoDB** | `resenas_incidencias` | BSON | **35** | Calificaciones y reclamos post-venta (`INC-0001` a `INC-0035`) normalizados por `pedido_id`. |
| **Redis** | `pedido:tracking:PED-*` | `HASH` | **15** | Estado en vivo, coordenadas GPS, repartidor y ETA de pedidos activos (`TTL`: 24h / `86400s`). |
| **Redis** | `cliente:critico:CLI-*` | `HASH` | **10** | Caché en memoria RAM de clientes activos para checkout rápido (`TTL`: 1h / `3600s`). |
| **Redis** | `pedido:otp:PED-*` | `STRING` | **5** | Códigos PIN/OTP de 4 dígitos para confirmar entregas en ruta (`TTL`: 30m / `1800s`). |

---

## 📂 Estructura del Repositorio

```text
├── config/
│   ├── mongod.conf                 # Configuración MongoDB (WiredTiger + compresión snappy)
│   └── redis.conf                  # Configuración Redis (maxmemory 256mb + allkeys-lru + listpack)
├── scripts/
│   ├── 01_mongodb_schema.js        # Creación de las 5 colecciones ($jsonSchema) y 14 índices B-Tree
│   ├── 02_mongodb_seed.js          # Inserción de los 230 documentos distribuidos en MongoDB
│   ├── 02_redis_seed.redis         # Carga de los 30 registros clave-valor con TTL en Redis
│   ├── 03_mongodb_queries.js       # 5 consultas obligatorias + 2 consultas bonus (.explain e integración)
│   └── 04_redis_operations.redis   # Operaciones funcionales en Redis (SET/GET, Hashes, EXPIRE/TTL, DEL)
├── 1_iniciar_y_cargar_todo.ps1     # Script 1-Click: levanta Docker y carga los 260 registros con TTL al 100%
├── 2_limpiar_y_apagar.ps1          # Script 1-Click: limpia bases de datos y apaga los contenedores
├── docker-compose.yml              # Orquestación de contenedores (MongoDB 7.0 + Redis Stack)
└── README.md
```

---

## 🚀 Inicio Rápido (Automatizado con PowerShell y Docker)

### Requisitos previos
- Tener **Docker Desktop** instalado y en ejecución.

### 1. Levantar contenedores y cargar los 260 registros limpios
Abre **PowerShell** en la raíz del proyecto y ejecuta:

```powershell
.\1_iniciar_y_cargar_todo.ps1
```
> **Nota sobre la expiración (`TTL`) en Redis:** Puedes ejecutar `.\1_iniciar_y_cargar_todo.ps1` todas las veces que quieras (para practicar o 1 minuto antes de la exposición en vivo). Siempre limpia los datos previos y reinicia el tiempo de expiración (`TTL`) de las 30 claves de Redis al 100%.

### 2. Ejecutar todas las consultas de demostración en lote
```powershell
# Ejecutar las consultas en MongoDB
docker exec megashop_mongodb mongosh --quiet /scripts/03_mongodb_queries.js

# Ejecutar las operaciones en memoria en Redis
Get-Content scripts/04_redis_operations.redis | docker exec -i megashop_redis redis-cli
```

### 3. Limpiar todo y apagar contenedores al terminar de practicar
```powershell
.\2_limpiar_y_apagar.ps1
```

---

## 💻 Guía Paso a Paso para Practicar Consulta por Consulta desde el CLI

### Parte A: Consola Interactiva de MongoDB (`mongosh`)

1. **Entrar al CLI de MongoDB:**
   ```powershell
   docker exec -it megashop_mongodb mongosh megashop_db
   ```

2. **Verificar las 5 colecciones, conteos (230 docs) e índices:**
   ```javascript
   show collections

   print({
     clientes: db.clientes.countDocuments(),
     productos: db.productos.countDocuments(),
     repartidores: db.repartidores.countDocuments(),
     pedidos: db.pedidos.countDocuments(),
     resenas_incidencias: db.resenas_incidencias.countDocuments()
   })

   db.pedidos.getIndexes()
   ```

3. **Consulta 1 — Búsqueda por cliente (`find` + `projection` + `sort`):**
   ```javascript
   db.pedidos.find(
     { cliente_id: "CLI-0001" },
     {
       _id: 0, pedido_id: 1, cliente_id: 1, fecha_pedido: 1,
       estado_actual: 1, metodo_pago: 1, total_pedido: 1,
       "direccion_entrega.distrito": 1, "items.nombre": 1, "items.cantidad": 1
     }
   ).sort({ fecha_pedido: -1 })
   ```

4. **Consulta 2 — Rango de fechas con múltiples operadores (`$gte`, `$lte`, `$in`, `$gt`):**
   ```javascript
   db.pedidos.find(
     {
       fecha_pedido: {
         $gte: ISODate("2026-11-01T00:00:00Z"),
         $lte: ISODate("2026-11-30T23:59:59Z")
       },
       estado_actual: { $in: ["EN_CAMINO", "EN_PREPARACION", "ENTREGADO"] },
       total_pedido: { $gt: 100.00 }
     },
     { _id: 0, pedido_id: 1, cliente_id: 1, repartidor_id: 1, fecha_pedido: 1, estado_actual: 1, total_pedido: 1 }
   ).sort({ total_pedido: -1 }).limit(8)
   ```

5. **Consulta 3A — Agregación financiera por estado de pedido (`$group`, `$project`, `$sort`):**
   ```javascript
   db.pedidos.aggregate([
     {
       $group: {
         _id: "$estado_actual",
         cantidad_pedidos: { $sum: 1 },
         ingresos_totales_pen: { $sum: "$total_pedido" },
         ticket_promedio_pen: { $avg: "$total_pedido" },
         pedido_maximo_pen: { $max: "$total_pedido" }
       }
     },
     {
       $project: {
         _id: 0,
         estado: "$_id",
         cantidad_pedidos: 1,
         ingresos_totales_pen: { $round: ["$ingresos_totales_pen", 2] },
         ticket_promedio_pen: { $round: ["$ticket_promedio_pen", 2] },
         pedido_maximo_pen: 1
       }
     },
     { $sort: { ingresos_totales_pen: -1 } }
   ])
   ```

6. **Consulta 3B — Agregación avanzada: Top 5 productos más vendidos (`$unwind` + `$lookup`):**
   ```javascript
   db.pedidos.aggregate([
     { $match: { estado_actual: { $ne: "CANCELADO" } } },
     { $unwind: "$items" },
     {
       $group: {
         _id: "$items.producto_id",
         nombre_producto: { $first: "$items.nombre" },
         unidades_vendidas: { $sum: "$items.cantidad" },
         recaudacion_total: { $sum: "$items.subtotal" }
       }
     },
     {
       $lookup: { from: "productos", localField: "_id", foreignField: "producto_id", as: "info_catalogo" }
     },
     {
       $project: {
         _id: 0, producto_id: "$_id", nombre_producto: 1,
         categoria: { $arrayElemAt: ["$info_catalogo.categoria", 0] },
         unidades_vendidas: 1, recaudacion_total: { $round: ["$recaudacion_total", 2] }
       }
     },
     { $sort: { unidades_vendidas: -1, recaudacion_total: -1 } },
     { $limit: 5 }
   ])
   ```

7. **Consulta 4 — Actualización de estado e historial embebido (`$set` + `$push`):**
   ```javascript
   db.pedidos.updateOne(
     { pedido_id: "PED-0006" },
     {
       $set: { estado_actual: "EN_CAMINO" },
       $push: {
         historial_estados: {
           estado: "EN_CAMINO",
           fecha: new Date("2026-11-20T18:30:00Z"),
           comentario: "Pedido recogido de almacén por repartidor REP-0006 (Sincronizado con Redis)"
         }
       }
     }
   )

   db.pedidos.findOne({ pedido_id: "PED-0006" }, { _id: 0, pedido_id: 1, estado_actual: 1, historial_estados: 1 })
   ```

8. **Consulta 5 — Eliminación controlada (`deleteOne`):**
   ```javascript
   db.pedidos.insertOne({
     pedido_id: "PED-9999", cliente_id: "CLI-0001", repartidor_id: null,
     fecha_pedido: new Date(), estado_actual: "CANCELADO", metodo_pago: "TARJETA",
     direccion_entrega: { calle: "Av. Arequipa 125", distrito: "Miraflores", referencia: "Prueba" },
     items: [{ producto_id: "PROD-0001", nombre: "Audífonos Bluetooth", cantidad: 1, precio_unitario: 189.90, subtotal: 189.90 }],
     costo_envio: 6.50, total_pedido: 196.40,
     historial_estados: [{ estado: "CANCELADO", fecha: new Date(), comentario: "Prueba eliminación" }]
   })

   db.pedidos.deleteOne({ pedido_id: "PED-9999", estado_actual: "CANCELADO" })
   ```

9. **Demostración de optimización por índice (`IXSCAN` en `0 ms`):**
   ```javascript
   const exp = db.pedidos.find({ cliente_id: "CLI-0001" }).sort({ fecha_pedido: -1 }).explain("executionStats");
   print({
     estrategia: exp.queryPlanner.winningPlan.inputStage.stage,
     indice_usado: exp.queryPlanner.winningPlan.inputStage.indexName,
     docs_examinados: exp.executionStats.totalDocsExamined,
     tiempo_ms: exp.executionStats.executionTimeMillis
   })

   exit
   ```

---

### Parte B: Consola Interactiva de Redis (`redis-cli`)

1. **Entrar al CLI de Redis:**
   ```powershell
   docker exec -it megashop_redis redis-cli
   ```

2. **Ejecutar operaciones funcionales en memoria RAM (`SET/GET`, `EXPIRE/TTL`, `Hashes`, `DEL`):**
   ```redis
   # Verificar las 30 claves cargadas
   DBSIZE
   KEYS *

   # 1. Strings y Expiración (Generar código OTP de entrega para PED-0006 por 30 min)
   SET pedido:otp:PED-0006 "8452" EX 1800
   GET pedido:otp:PED-0006
   TTL pedido:otp:PED-0006

   # 2. Lectura en tiempo real de Hashes (Tracking de pedido y Caché de cliente)
   HGETALL pedido:tracking:PED-0001
   HMGET pedido:tracking:PED-0001 estado ubicacion_actual eta_minutos repartidor_id
   HGETALL cliente:critico:CLI-0001
   HGET cliente:critico:CLI-0001 direccion_principal

   # 3. Actualización en memoria de Hash, renovación de TTL y descuento de ETA
   HSET pedido:tracking:PED-0006 estado "EN_CAMINO" ubicacion_actual "-12.0892,-77.0654" eta_minutos "14" ultima_actualizacion "2026-11-20T18:30:00Z"
   EXPIRE pedido:tracking:PED-0006 43200
   HGETALL pedido:tracking:PED-0006
   TTL pedido:tracking:PED-0006
   HINCRBY pedido:tracking:PED-0001 eta_minutos -3
   HGET pedido:tracking:PED-0001 eta_minutos

   # 4. Eliminación y liberación de memoria RAM tras entrega
   DEL pedido:otp:PED-0006
   EXISTS pedido:otp:PED-0006
   exit
   ```

---

## 🖥️ Conexión desde Interfaces Gráficas (Opcional)
Cuando los contenedores están encendidos:
- **MongoDB Compass / DBeaver:** `mongodb://localhost:27017` (Base de datos: `megashop_db`).
- **RedisInsight (Web UI):** `http://localhost:8001`.
