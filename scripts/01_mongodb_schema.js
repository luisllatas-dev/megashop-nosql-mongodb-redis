// ============================================================================
// PROYECTO PARCIAL: CASO MEGASHOP (E-COMMERCE & DELIVERY)
// FASE 1: DEFINICIÓN DE ESQUEMAS BSON (JSON SCHEMA) E ÍNDICES EN MONGODB
// Ejecución en mongosh: load("scripts/01_mongodb_schema.js")
// ============================================================================

const dbName = "megashop_db";
db = db.getSiblingDB(dbName);

print(`\n=== Inicializando Base de Datos: ${dbName} ===`);

// Limpiar colecciones previas si existen para permitir re-ejecución limpia
const colecciones = ["clientes", "productos", "repartidores", "pedidos", "resenas_incidencias"];
colecciones.forEach(col => {
    if (db.getCollectionNames().includes(col)) {
        db.getCollection(col).drop();
        print(`[DROP] Colección previa eliminada: ${col}`);
    }
});

// ============================================================================
// 1. COLECCIÓN: clientes
// Diseño: Datos maestros del cliente + Array embebido de direcciones_entrega
// Justificación: Las direcciones se consultan siempre junto al perfil del cliente
// (relación 1 a pocos), evitando JOINs innecesarios.
// ============================================================================
db.createCollection("clientes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["cliente_id", "nombre", "email", "telefono", "fecha_registro", "activo", "direcciones_entrega"],
            properties: {
                cliente_id: {
                    bsonType: "string",
                    pattern: "^CLI-[0-9]{4}$",
                    description: "Identificador único de negocio formato CLI-XXXX"
                },
                nombre: {
                    bsonType: "string",
                    description: "Nombre completo del cliente"
                },
                email: {
                    bsonType: "string",
                    pattern: "^.+@.+\\..+$",
                    description: "Correo electrónico único del cliente"
                },
                telefono: {
                    bsonType: "string",
                    description: "Teléfono de contacto para el delivery"
                },
                nivel_fidelidad: {
                    bsonType: "string",
                    enum: ["BRONCE", "PLATA", "ORO", "PLATINO"],
                    description: "Categoría de fidelización en Megashop"
                },
                fecha_registro: {
                    bsonType: "date",
                    description: "Fecha de alta en la plataforma (BSON Date)"
                },
                activo: {
                    bsonType: "bool",
                    description: "Estado de la cuenta del cliente"
                },
                direcciones_entrega: {
                    bsonType: "array",
                    minItems: 1,
                    description: "Lista embebida de direcciones frecuentes del cliente",
                    items: {
                        bsonType: "object",
                        required: ["etiqueta", "calle", "distrito", "principal"],
                        properties: {
                            etiqueta: { bsonType: "string", enum: ["CASA", "TRABAJO", "OTRO"] },
                            calle: { bsonType: "string" },
                            distrito: { bsonType: "string" },
                            referencia: { bsonType: "string" },
                            coordenadas: {
                                bsonType: "object",
                                properties: {
                                    lat: { bsonType: ["double", "int"] },
                                    lng: { bsonType: ["double", "int"] }
                                }
                            },
                            principal: { bsonType: "bool" }
                        }
                    }
                }
            }
        }
    }
});
print("[OK] Colección 'clientes' creada con validación BSON.");

// ============================================================================
// 2. COLECCIÓN: productos
// Diseño: Catálogo de ítems con subdocumento polimórfico 'especificaciones'
// Justificación: Permite almacenar productos de distintos rubros (tecnología,
// supermercado, farmacia) sin columnas nulas como ocurriría en una tabla SQL.
// ============================================================================
db.createCollection("productos", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["producto_id", "sku", "nombre", "categoria", "precio_unitario", "stock", "disponible"],
            properties: {
                producto_id: {
                    bsonType: "string",
                    pattern: "^PROD-[0-9]{4}$",
                    description: "Identificador único de producto formato PROD-XXXX"
                },
                sku: {
                    bsonType: "string",
                    description: "Código SKU de inventario"
                },
                nombre: {
                    bsonType: "string",
                    description: "Nombre comercial del ítem"
                },
                categoria: {
                    bsonType: "string",
                    enum: ["SUPERMERCADO", "TECNOLOGIA", "FARMACIA", "RESTAURANTE", "HOGAR"],
                    description: "Categoría principal en Megashop"
                },
                precio_unitario: {
                    bsonType: ["double", "int", "long"],
                    minimum: 0,
                    description: "Precio unitario en soles (PEN)"
                },
                stock: {
                    bsonType: ["int", "double", "long"],
                    minimum: 0,
                    description: "Unidades disponibles para despacho inmediato"
                },
                disponible: {
                    bsonType: "bool"
                },
                especificaciones: {
                    bsonType: "object",
                    description: "Atributos flexibles según categoría (peso, frío, marca, garantía)",
                    properties: {
                        marca: { bsonType: "string" },
                        peso_kg: { bsonType: ["double", "int"] },
                        requiere_cadena_frio: { bsonType: "bool" },
                        fragil: { bsonType: "bool" }
                    }
                }
            }
        }
    }
});
print("[OK] Colección 'productos' creada con validación BSON.");

// ============================================================================
// 3. COLECCIÓN: repartidores
// Diseño: Flota de delivery con subdocumento 'vehiculo' y 'metricas'
// Justificación: Entidad independiente referenciada desde los pedidos y desde
// los Hashes de tracking en tiempo real de Redis.
// ============================================================================
db.createCollection("repartidores", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["repartidor_id", "nombre", "telefono", "zona_cobertura", "estado", "vehiculo"],
            properties: {
                repartidor_id: {
                    bsonType: "string",
                    pattern: "^REP-[0-9]{4}$",
                    description: "Identificador único de repartidor formato REP-XXXX"
                },
                nombre: { bsonType: "string" },
                telefono: { bsonType: "string" },
                zona_cobertura: {
                    bsonType: "string",
                    enum: ["LIMA_CENTRO", "LIMA_MODERNA", "LIMA_NORTE", "LIMA_SUR", "LIMA_ESTE", "CALLAO"],
                    description: "Zona geográfica asignada"
                },
                estado: {
                    bsonType: "string",
                    enum: ["DISPONIBLE", "EN_RUTA", "FUERA_DE_SERVICIO"],
                    description: "Disponibilidad operativa del repartidor"
                },
                vehiculo: {
                    bsonType: "object",
                    required: ["tipo", "placa"],
                    properties: {
                        tipo: { bsonType: "string", enum: ["MOTO", "BICICLETA", "AUTO"] },
                        placa: { bsonType: "string" },
                        capacidad_kg: { bsonType: ["double", "int"] }
                    }
                },
                metricas: {
                    bsonType: "object",
                    properties: {
                        calificacion_promedio: { bsonType: ["double", "int", "long"], minimum: 1, maximum: 5 },
                        total_entregas: { bsonType: ["int", "double", "long"], minimum: 0 }
                    }
                }
            }
        }
    }
});
print("[OK] Colección 'repartidores' creada con validación BSON.");

// ============================================================================
// 4. COLECCIÓN: pedidos
// Diseño Híbrido (Normalización + Desnormalización controlada):
// - Referencias normalizadas: cliente_id, repartidor_id (evita duplicar perfiles completos).
// - Datos embebidos (Snapshot): items[] (congela el precio_unitario al momento de la compra),
//   direccion_entrega (congela el destino del pedido) e historial_estados[] (trazabilidad).
// ============================================================================
db.createCollection("pedidos", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pedido_id", "cliente_id", "fecha_pedido", "estado_actual", "items", "total_pedido", "metodo_pago"],
            properties: {
                pedido_id: {
                    bsonType: "string",
                    pattern: "^PED-[0-9]{4}$",
                    description: "Identificador único de pedido formato PED-XXXX"
                },
                cliente_id: {
                    bsonType: "string",
                    description: "Referencia normalizada a clientes.cliente_id"
                },
                repartidor_id: {
                    bsonType: ["string", "null"],
                    description: "Referencia normalizada a repartidores.repartidor_id"
                },
                fecha_pedido: {
                    bsonType: "date",
                    description: "Fecha y hora de creación del pedido"
                },
                estado_actual: {
                    bsonType: "string",
                    enum: ["PENDIENTE", "EN_PREPARACION", "EN_CAMINO", "ENTREGADO", "CANCELADO"],
                    description: "Estado actual consolidado del pedido"
                },
                metodo_pago: {
                    bsonType: "string",
                    enum: ["TARJETA", "YAPE", "PLIN", "EFECTIVO"]
                },
                direccion_entrega: {
                    bsonType: "object",
                    required: ["calle", "distrito"],
                    properties: {
                        calle: { bsonType: "string" },
                        distrito: { bsonType: "string" },
                        referencia: { bsonType: "string" }
                    }
                },
                items: {
                    bsonType: "array",
                    minItems: 1,
                    description: "Detalle embebido de productos comprados",
                    items: {
                        bsonType: "object",
                        required: ["producto_id", "nombre", "cantidad", "precio_unitario", "subtotal"],
                        properties: {
                            producto_id: { bsonType: "string" },
                            nombre: { bsonType: "string" },
                            cantidad: { bsonType: ["int", "double", "long"], minimum: 1 },
                            precio_unitario: { bsonType: ["double", "int", "long"], minimum: 0 },
                            subtotal: { bsonType: ["double", "int", "long"], minimum: 0 }
                        }
                    }
                },
                costo_envio: { bsonType: ["double", "int", "long"], minimum: 0 },
                total_pedido: { bsonType: ["double", "int", "long"], minimum: 0 },
                historial_estados: {
                    bsonType: "array",
                    description: "Auditoría embebida de cambios de estado con timestamp",
                    items: {
                        bsonType: "object",
                        required: ["estado", "fecha"],
                        properties: {
                            estado: { bsonType: "string" },
                            fecha: { bsonType: "date" },
                            comentario: { bsonType: "string" }
                        }
                    }
                }
            }
        }
    }
});
print("[OK] Colección 'pedidos' creada con validación BSON.");

// ============================================================================
// 5. COLECCIÓN: resenas_incidencias
// Diseño: Normalizada respecto a pedidos (relación 1 a N opcional/post-venta).
// Justificación: Se genera horas o días después de la entrega. Separarla evita
// reescribir y bloquear el documento transaccional de 'pedidos'.
// ============================================================================
db.createCollection("resenas_incidencias", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["incidencia_id", "pedido_id", "cliente_id", "tipo", "calificacion_pedido", "fecha_registro", "estado_resolucion"],
            properties: {
                incidencia_id: {
                    bsonType: "string",
                    pattern: "^INC-[0-9]{4}$",
                    description: "Identificador único formato INC-XXXX"
                },
                pedido_id: { bsonType: "string", description: "Referencia a pedidos.pedido_id" },
                cliente_id: { bsonType: "string", description: "Referencia a clientes.cliente_id" },
                repartidor_id: { bsonType: ["string", "null"], description: "Referencia a repartidores.repartidor_id" },
                tipo: {
                    bsonType: "string",
                    enum: ["RESENA", "RECLAMO"],
                    description: "Indica si es reseña de satisfacción o reclamo operativo"
                },
                calificacion_pedido: { bsonType: ["int", "double", "long"], minimum: 1, maximum: 5 },
                calificacion_delivery: { bsonType: ["int", "double", "long"], minimum: 1, maximum: 5 },
                motivo_incidencia: {
                    bsonType: "string",
                    enum: ["NINGUNO", "RETRASO_ENTREGA", "PRODUCTO_DANADO", "PEDIDO_INCOMPLETO", "COBRO_INDEBIDO"]
                },
                comentario: { bsonType: "string" },
                estado_resolucion: {
                    bsonType: "string",
                    enum: ["CERRADO", "EN_REVISION", "COMPENSADO"]
                },
                fecha_registro: { bsonType: "date" }
            }
        }
    }
});
print("[OK] Colección 'resenas_incidencias' creada con validación BSON.");

// ============================================================================
// ESTRATEGIA DE INDEXACIÓN (NIVEL SOBRESALIENTE DE LA RÚBRICA)
// ============================================================================
print("\n=== Creando Índices Estratégicos en MongoDB ===");

// Índices en clientes
db.clientes.createIndex({ cliente_id: 1 }, { unique: true, name: "idx_clientes_id_unique" });
db.clientes.createIndex({ email: 1 }, { unique: true, name: "idx_clientes_email_unique" });

// Índices en productos
db.productos.createIndex({ producto_id: 1 }, { unique: true, name: "idx_productos_id_unique" });
db.productos.createIndex({ sku: 1 }, { unique: true, name: "idx_productos_sku_unique" });
db.productos.createIndex({ categoria: 1, disponible: 1 }, { name: "idx_productos_cat_disp" });

// Índices en repartidores
db.repartidores.createIndex({ repartidor_id: 1 }, { unique: true, name: "idx_repartidores_id_unique" });
db.repartidores.createIndex({ zona_cobertura: 1, estado: 1 }, { name: "idx_repartidores_zona_estado" });

// Índices en pedidos (Optimiza las Consultas 1, 2 y 3 requeridas por la rúbrica)
db.pedidos.createIndex({ pedido_id: 1 }, { unique: true, name: "idx_pedidos_id_unique" });
db.pedidos.createIndex({ cliente_id: 1, fecha_pedido: -1 }, { name: "idx_pedidos_cliente_fecha" });
db.pedidos.createIndex({ estado_actual: 1, fecha_pedido: -1 }, { name: "idx_pedidos_estado_fecha" });
db.pedidos.createIndex({ repartidor_id: 1 }, { name: "idx_pedidos_repartidor" });

// Índices en resenas_incidencias
db.resenas_incidencias.createIndex({ incidencia_id: 1 }, { unique: true, name: "idx_incidencias_id_unique" });
db.resenas_incidencias.createIndex({ pedido_id: 1 }, { name: "idx_incidencias_pedido" });
db.resenas_incidencias.createIndex({ tipo: 1, estado_resolucion: 1 }, { name: "idx_incidencias_tipo_estado" });

print("[OK] Todos los índices fueron creados exitosamente.\n");
