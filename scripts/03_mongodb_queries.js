// ============================================================================
// PROYECTO PARCIAL: CASO MEGASHOP (E-COMMERCE & DELIVERY)
// FASE 3: EJECUCIÓN DE CONSULTAS NATIVAS Y AVANZADAS EN MONGODB
// Cumple Paso 5.a y Nivel Sobresaliente (Múltiples operadores, filtros,
// proyecciones, agregaciones, manipulación de arrays y explain con índices).
// Ejecución en mongosh: load("scripts/03_mongodb_queries.js")
// ============================================================================

const dbName = "megashop_db";
db = db.getSiblingDB(dbName);

print("\n============================================================================");
print("   FASE 3: EJECUCIÓN DE CONSULTAS NOSQL EN MONGODB (megashop_db)");
print("============================================================================\n");

// ============================================================================
// CONSULTA 1: BÚSQUEDA POR CLIENTE (find + projection + sort)
// ============================================================================
print("--- [CONSULTA 1] Búsqueda de pedidos del cliente CLI-0001 (find + projection + sort) ---");

const consulta1 = db.pedidos.find(
    { cliente_id: "CLI-0001" },
    {
        _id: 0,
        pedido_id: 1,
        cliente_id: 1,
        fecha_pedido: 1,
        estado_actual: 1,
        metodo_pago: 1,
        total_pedido: 1,
        "direccion_entrega.distrito": 1,
        "items.nombre": 1,
        "items.cantidad": 1
    }
).sort({ fecha_pedido: -1 }).toArray();

printjson(consulta1);

// ============================================================================
// CONSULTA 2: RANGO DE FECHAS DE PEDIDOS CON MÚLTIPLES OPERADORES
// ============================================================================
print("\n--- [CONSULTA 2] Pedidos en rango de fechas (Noviembre 2026) con filtros múltiples ---");

const consulta2 = db.pedidos.find(
    {
        fecha_pedido: {
            $gte: ISODate("2026-11-01T00:00:00Z"),
            $lte: ISODate("2026-11-30T23:59:59Z")
        },
        estado_actual: { $in: ["EN_CAMINO", "EN_PREPARACION", "ENTREGADO"] },
        total_pedido: { $gt: 100.00 }
    },
    {
        _id: 0,
        pedido_id: 1,
        cliente_id: 1,
        repartidor_id: 1,
        fecha_pedido: 1,
        estado_actual: 1,
        total_pedido: 1
    }
).sort({ total_pedido: -1 }).limit(8).toArray();

printjson(consulta2);

// ============================================================================
// CONSULTA 3: AGREGACIÓN (PIPELINE CON $match, $group, $project y $sort)
// ============================================================================
print("\n--- [CONSULTA 3A] Agregación: Resumen financiero por Estado de Pedido ---");

const consulta3A = db.pedidos.aggregate([
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
]).toArray();

printjson(consulta3A);

print("\n--- [CONSULTA 3B] Agregación Avanzada ($unwind + $lookup): Top 5 Productos Más Vendidos ---");

const consulta3B = db.pedidos.aggregate([
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
        $lookup: {
            from: "productos",
            localField: "_id",
            foreignField: "producto_id",
            as: "info_catalogo"
        }
    },
    {
        $project: {
            _id: 0,
            producto_id: "$_id",
            nombre_producto: 1,
            categoria: { $arrayElemAt: ["$info_catalogo.categoria", 0] },
            unidades_vendidas: 1,
            recaudacion_total: { $round: ["$recaudacion_total", 2] }
        }
    },
    { $sort: { unidades_vendidas: -1, recaudacion_total: -1 } },
    { $limit: 5 }
]).toArray();

printjson(consulta3B);

// ============================================================================
// CONSULTA 4: ACTUALIZACIÓN AVANZADA ($set + $push en array embebido)
// ============================================================================
print("\n--- [CONSULTA 4] Actualización de estado y trazabilidad embebida del pedido PED-0006 ---");

const resultadoUpdatePedido = db.pedidos.updateOne(
    { pedido_id: "PED-0006" },
    {
        $set: {
            estado_actual: "EN_CAMINO"
        },
        $push: {
            historial_estados: {
                estado: "EN_CAMINO",
                fecha: new Date("2026-11-20T18:30:00Z"),
                comentario: "Pedido recogido de almacén por repartidor REP-0006 (Sincronizado con Redis)"
            }
        }
    }
);

printjson(resultadoUpdatePedido);

print("Documento PED-0006 tras la actualización:");
printjson(
    db.pedidos.findOne(
        { pedido_id: "PED-0006" },
        { _id: 0, pedido_id: 1, estado_actual: 1, repartidor_id: 1, historial_estados: 1 }
    )
);

// ============================================================================
// CONSULTA 5: ELIMINACIÓN CONTROLADA (deleteOne / deleteMany con criterios)
// ============================================================================
print("\n--- [CONSULTA 5] Eliminación controlada de registros (deleteOne / deleteMany) ---");

db.pedidos.insertOne({
    pedido_id: "PED-9999",
    cliente_id: "CLI-0001",
    repartidor_id: null,
    fecha_pedido: new Date("2026-11-20T19:00:00Z"),
    estado_actual: "CANCELADO",
    metodo_pago: "TARJETA",
    direccion_entrega: {
        calle: "Av. Arequipa 125",
        distrito: "Miraflores",
        referencia: "Registro de prueba para eliminación"
    },
    items: [
        {
            producto_id: "PROD-0001",
            nombre: "Audífonos Bluetooth Cancelación de Ruido",
            cantidad: 1,
            precio_unitario: 189.90,
            subtotal: 189.90
        }
    ],
    costo_envio: 6.50,
    total_pedido: 196.40,
    historial_estados: [
        { estado: "CANCELADO", fecha: new Date("2026-11-20T19:01:00Z"), comentario: "Transacción duplicada de prueba" }
    ]
});
print("Pedido temporal PED-9999 insertado. Total pedidos antes de eliminar: " + db.pedidos.countDocuments());

const resultadoDelete = db.pedidos.deleteOne({
    pedido_id: "PED-9999",
    estado_actual: "CANCELADO"
});

print("Resultado de deleteOne:");
printjson(resultadoDelete);
print("Total pedidos después de eliminar PED-9999: " + db.pedidos.countDocuments());

// ============================================================================
// CONSULTA 6 (BONUS SOBRESALIENTE): INTEGRACIÓN DE LAS 5 COLECCIONES
// ============================================================================
print("\n--- [CONSULTA 6 - BONUS] Cruce de Reclamos con Clientes y Repartidores ($lookup) ---");

const consultaReclamos = db.resenas_incidencias.aggregate([
    { $match: { tipo: "RECLAMO" } },
    {
        $lookup: {
            from: "clientes",
            localField: "cliente_id",
            foreignField: "cliente_id",
            as: "cliente_info"
        }
    },
    {
        $lookup: {
            from: "repartidores",
            localField: "repartidor_id",
            foreignField: "repartidor_id",
            as: "repartidor_info"
        }
    },
    {
        $project: {
            _id: 0,
            incidencia_id: 1,
            pedido_id: 1,
            motivo_incidencia: 1,
            estado_resolucion: 1,
            nombre_cliente: { $arrayElemAt: ["$cliente_info.nombre", 0] },
            nombre_repartidor: { $arrayElemAt: ["$repartidor_info.nombre", 0] },
            zona_repartidor: { $arrayElemAt: ["$repartidor_info.zona_cobertura", 0] }
        }
    },
    { $limit: 5 }
]).toArray();

printjson(consultaReclamos);

// ============================================================================
// CONSULTA 7 (BONUS SOBRESALIENTE): DEMOSTRACIÓN DE USO DE ÍNDICES (.explain)
// ============================================================================
print("\n--- [CONSULTA 7 - BONUS] Plan de Ejecución e Indexación (.explain('executionStats')) ---");

const explainStats = db.pedidos.find({ cliente_id: "CLI-0001" })
    .sort({ fecha_pedido: -1 })
    .explain("executionStats");

printjson({
    estrategia_ganadora: explainStats.queryPlanner.winningPlan.inputStage.stage,
    indice_utilizado: explainStats.queryPlanner.winningPlan.inputStage.indexName,
    documentos_examinados: explainStats.executionStats.totalDocsExamined,
    claves_indice_examinadas: explainStats.executionStats.totalKeysExamined,
    tiempo_ejecucion_ms: explainStats.executionStats.executionTimeMillis
});

print("\n=== Fin de la Ejecución de Consultas en MongoDB ===\n");
