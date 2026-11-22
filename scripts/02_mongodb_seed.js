// ============================================================================
// PROYECTO PARCIAL: CASO MEGASHOP (E-COMMERCE & DELIVERY)
// FASE 2: CARGA DE DATOS DE PRUEBA EN MONGODB (230 DOCUMENTOS DISTRIBUIDOS)
// Distribución:
//   - clientes:             40 documentos (CLI-0001 a CLI-0040)
//   - productos:            40 documentos (PROD-0001 a PROD-0040)
//   - repartidores:         25 documentos (REP-0001 a REP-0025)
//   - pedidos:              90 documentos (PED-0001 a PED-0090)
//   - resenas_incidencias:  35 documentos (INC-0001 a INC-0035)
// TOTAL MONGODB:           230 documentos (+ 30 registros en Redis = 260 total)
// Ejecución en mongosh: load("scripts/02_mongodb_seed.js")
// ============================================================================

const dbName = "megashop_db";
db = db.getSiblingDB(dbName);

print(`\n=== Iniciando Carga del Dataset de Prueba en ${dbName} ===`);

// Limpiar datos previos manteniendo colecciones e índices
db.clientes.deleteMany({});
db.productos.deleteMany({});
db.repartidores.deleteMany({});
db.pedidos.deleteMany({});
db.resenas_incidencias.deleteMany({});

// Helper para formatear códigos con ceros a la izquierda (ej. CLI-0001)
function padId(prefix, num) {
    return `${prefix}-${String(num).padStart(4, "0")}`;
}

// ============================================================================
// 1. GENERACIÓN E INSERCIÓN DE 40 CLIENTES (CLI-0001 a CLI-0040)
// ============================================================================
const nombresBase = [
    "Valeria Mendoza Ríos", "Sebastián Vargas Quispe", "Camila Fernández Rojas", "Mateo Castillo Paredes",
    "Lucía Salazar Huamán", "Diego Morales Espinoza", "Sofía Gutiérrez Chávez", "Alejandro Torres Silva",
    "Valentina Romero Castro", "Gabriel Flores Mendoza", "Mariana Díaz Aguilar", "Nicolás Sánchez Reyes",
    "Isabella Cruz Villanueva", "Joaquín Gómez Pineda", "Antonella Herrera Campos", "Emiliano Ruiz Delgado",
    "Daniela Peña Cárdenas", "Santiago Medina Ramos", "Renata León Velásquez", "Matías Navarro Prado",
    "Andrea Ramos Palacios", "Rodrigo Vega Bustamante", "Ximena Acosta Farfán", "Leonardo Ponce Calderón",
    "Natalia Campos Arévalo", "Adrián Cabrera Montoya", "Fernanda Ríos Zevallos", "Martín Ortega Solís",
    "Paula Guerrero Tapia", "Gonzalo Miranda Becerra", "Alejandra Soto Cáceres", "Bruno Domínguez Vera",
    "Claudia Bravo Olivares", "Aarón Pacheco Linares", "Elena Figueroa Paz", "David Lozano Benítez",
    "Abril Carrillo Cornejo", "Esteban Maldonado Núñez", "Bárbara Valencia Montes", "Hugo Cervantes Alarcón"
];

const distritosLima = [
    { nombre: "Miraflores", lat: -12.1191, lng: -77.0290 },
    { nombre: "San Isidro", lat: -12.0972, lng: -77.0365 },
    { nombre: "Lince", lat: -12.0851, lng: -77.0352 },
    { nombre: "Surco", lat: -12.1354, lng: -76.9935 },
    { nombre: "San Borja", lat: -12.1068, lng: -76.9992 },
    { nombre: "Magdalena", lat: -12.0905, lng: -77.0680 },
    { nombre: "Jesús María", lat: -12.0758, lng: -77.0482 },
    { nombre: "Pueblo Libre", lat: -12.0772, lng: -77.0638 },
    { nombre: "Los Olivos", lat: -11.9765, lng: -77.0721 },
    { nombre: "San Miguel", lat: -12.0776, lng: -77.0886 }
];

const callesBase = [
    "Av. Arequipa", "Av. Javier Prado Este", "Av. Benavides", "Av. Brasil",
    "Calle Las Begonias", "Av. Angamos Oeste", "Jr. Huiracocha", "Av. La Marina",
    "Av. Salaverry", "Av. Primavera"
];

const nivelesFidelidad = ["BRONCE", "PLATA", "ORO", "PLATINO"];

const clientesDocs = [];
for (let i = 1; i <= 40; i++) {
    const nombre = nombresBase[i - 1];
    const dist1 = distritosLima[(i - 1) % distritosLima.length];
    const dist2 = distritosLima[(i + 2) % distritosLima.length];
    const calle1 = `${callesBase[(i - 1) % callesBase.length]} ${100 + i * 25}, Dpto ${100 + i}`;
    const calle2 = `${callesBase[(i + 3) % callesBase.length]} ${500 + i * 15}, Of. ${200 + i}`;

    const direcciones = [
        {
            etiqueta: "CASA",
            calle: calle1,
            distrito: dist1.nombre,
            referencia: `A 2 cuadras del parque central de ${dist1.nombre}`,
            coordenadas: {
                lat: Number((dist1.lat + (i * 0.0002)).toFixed(4)),
                lng: Number((dist1.lng - (i * 0.0002)).toFixed(4))
            },
            principal: true
        }
    ];

    // A los clientes pares les agregamos una segunda dirección embebida (TRABAJO)
    if (i % 2 === 0) {
        direcciones.push({
            etiqueta: "TRABAJO",
            calle: calle2,
            distrito: dist2.nombre,
            referencia: "Edificio Empresarial Torre Azul",
            coordenadas: {
                lat: Number((dist2.lat - (i * 0.0001)).toFixed(4)),
                lng: Number((dist2.lng + (i * 0.0001)).toFixed(4))
            },
            principal: false
        });
    }

    clientesDocs.push({
        cliente_id: padId("CLI", i),
        nombre: nombre,
        email: `cliente${i}.${nombre.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@megashop.pe`,
        telefono: `+519${String(80000000 + i * 12345).slice(0, 8)}`,
        nivel_fidelidad: nivelesFidelidad[i % nivelesFidelidad.length],
        fecha_registro: new Date(2026, (i % 9), (i % 27) + 1, 10, 15, 0),
        activo: i !== 38, // 39 activos, 1 inactivo
        direcciones_entrega: direcciones
    });
}

db.clientes.insertMany(clientesDocs);
print(`[OK] Insertados ${db.clientes.countDocuments()} documentos en 'clientes'.`);

// ============================================================================
// 2. GENERACIÓN E INSERCIÓN DE 40 PRODUCTOS (PROD-0001 a PROD-0040)
// ============================================================================
const catalogoBase = [
    // TECNOLOGIA (1-8)
    { sku: "TEC-AUD-001", nombre: "Audífonos Bluetooth Cancelación de Ruido", cat: "TECNOLOGIA", precio: 189.90, marca: "SoundMax", peso: 0.35, frio: false, fragil: true },
    { sku: "TEC-MOU-002", nombre: "Mouse Inalámbrico Ergonómico 1600 DPI", cat: "TECNOLOGIA", precio: 65.00, marca: "LogiTech", peso: 0.15, frio: false, fragil: true },
    { sku: "TEC-TEC-003", nombre: "Teclado Mecánico RGB Compacto", cat: "TECNOLOGIA", precio: 210.00, marca: "KeyChron", peso: 0.85, frio: false, fragil: true },
    { sku: "TEC-CAR-004", nombre: "Cargador Rápido USB-C 65W GaN", cat: "TECNOLOGIA", precio: 95.50, marca: "AnkerPro", peso: 0.20, frio: false, fragil: false },
    { sku: "TEC-POW-005", nombre: "Powerbank 20000mAh Carga Rápida", cat: "TECNOLOGIA", precio: 145.00, marca: "EnergyPlus", peso: 0.45, frio: false, fragil: true },
    { sku: "TEC-WEB-006", nombre: "Webcam Full HD 1080p con Micrófono", cat: "TECNOLOGIA", precio: 129.00, marca: "VisionCam", peso: 0.25, frio: false, fragil: true },
    { sku: "TEC-CAB-007", nombre: "Cable Trenzado USB-C a USB-C 2m", cat: "TECNOLOGIA", precio: 35.00, marca: "AnkerPro", peso: 0.08, frio: false, fragil: false },
    { sku: "TEC-PAR-008", nombre: "Parlante Portátil Resistente al Agua", cat: "TECNOLOGIA", precio: 160.00, marca: "SoundMax", peso: 0.60, frio: false, fragil: false },
    // SUPERMERCADO (9-16)
    { sku: "SUP-LEC-009", nombre: "Six Pack Leche Deslactosada 1L", cat: "SUPERMERCADO", precio: 32.40, marca: "Gloria", peso: 6.20, frio: false, fragil: false },
    { sku: "SUP-YOG-010", nombre: "Yogurt Griego Natural 1kg", cat: "SUPERMERCADO", precio: 18.90, marca: "DanLac", peso: 1.05, frio: true, fragil: true },
    { sku: "SUP-CAF-011", nombre: "Café Orgánico Tostado Molido 500g", cat: "SUPERMERCADO", precio: 42.00, marca: "VillaRica", peso: 0.52, frio: false, fragil: false },
    { sku: "SUP-ACE-012", nombre: "Aceite de Oliva Extra Virgen 750ml", cat: "SUPERMERCADO", precio: 38.50, marca: "OlivosSur", peso: 0.90, frio: false, fragil: true },
    { sku: "SUP-QUE-013", nombre: "Queso Edam Laminado 500g", cat: "SUPERMERCADO", precio: 24.00, marca: "Bonle", peso: 0.50, frio: true, fragil: false },
    { sku: "SUP-ARR-014", nombre: "Arroz Extra Añejo Bolsa 5kg", cat: "SUPERMERCADO", precio: 26.90, marca: "Costeño", peso: 5.05, frio: false, fragil: false },
    { sku: "SUP-HEL-015", nombre: "Helado Artesanal Lúcuma y Chocolate 1L", cat: "SUPERMERCADO", precio: 29.90, marca: "Artika", peso: 0.80, frio: true, fragil: false },
    { sku: "SUP-AGU-016", nombre: "Pack Agua Mineral sin Gas 6x2.5L", cat: "SUPERMERCADO", precio: 19.50, marca: "SanMateo", peso: 15.20, frio: false, fragil: false },
    // FARMACIA (17-24)
    { sku: "FAR-VIT-017", nombre: "Vitamina C + Zinc Efervescente x30", cat: "FARMACIA", precio: 34.00, marca: "Redoxon", peso: 0.18, frio: false, fragil: false },
    { sku: "FAR-PRO-018", nombre: "Bloqueador Solar Facial FPS 50+ 50ml", cat: "FARMACIA", precio: 89.00, marca: "Isdin", peso: 0.12, frio: false, fragil: false },
    { sku: "FAR-ALC-019", nombre: "Alcohol en Gel Antibacterial 1L", cat: "FARMACIA", precio: 16.50, marca: "Aval", peso: 1.02, frio: false, fragil: false },
    { sku: "FAR-TER-020", nombre: "Termómetro Digital Infrarrojo", cat: "FARMACIA", precio: 75.00, marca: "MedCare", peso: 0.22, frio: false, fragil: true },
    { sku: "FAR-COL-021", nombre: "Colágeno Hidrolizado en Polvo 500g", cat: "FARMACIA", precio: 68.00, marca: "VitalColl", peso: 0.55, frio: false, fragil: false },
    { sku: "FAR-BOT-022", nombre: "Botiquín Primeros Auxilios Portátil", cat: "FARMACIA", precio: 54.00, marca: "SafeHome", peso: 0.75, frio: false, fragil: false },
    { sku: "FAR-INS-023", nombre: "Solución Isotónica Nasal Spray 100ml", cat: "FARMACIA", precio: 28.00, marca: "Marimer", peso: 0.15, frio: false, fragil: false },
    { sku: "FAR-PRO-024", nombre: "Probióticos Refrigerados 10 Billones", cat: "FARMACIA", precio: 92.00, marca: "BioFlora", peso: 0.14, frio: true, fragil: true },
    // RESTAURANTE (25-32)
    { sku: "RES-BUR-025", nombre: "Combo Hamburguesa Angus Doble + Papas", cat: "RESTAURANTE", precio: 36.90, marca: "BurgerCraft", peso: 0.65, frio: false, fragil: true },
    { sku: "RES-PIZ-026", nombre: "Pizza Familiar Artesanal Pepperoni", cat: "RESTAURANTE", precio: 52.00, marca: "NapoliPizza", peso: 1.10, frio: false, fragil: true },
    { sku: "RES-SUS-027", nombre: "Tabla Sushi 30 Cortes Acevichado y Furai", cat: "RESTAURANTE", precio: 64.90, marca: "SakuraRoll", peso: 0.90, frio: true, fragil: true },
    { sku: "RES-POL-028", nombre: "Pollo a la Brasa Entero + Papas + Ensalada", cat: "RESTAURANTE", precio: 72.00, marca: "BrasaReal", peso: 2.30, frio: false, fragil: false },
    { sku: "RES-BOW-029", nombre: "Poke Bowl Salmón Fresco y Palta", cat: "RESTAURANTE", precio: 38.00, marca: "AlohaPoke", peso: 0.55, frio: true, fragil: true },
    { sku: "RES-CEV-030", nombre: "Dúo Marino Ceviche Clásico + Chicharrón", cat: "RESTAURANTE", precio: 49.00, marca: "PuntoMar", peso: 0.80, frio: true, fragil: true },
    { sku: "RES-PAS-031", nombre: "Lasaña Boloñesa Artesanal Gratinada", cat: "RESTAURANTE", precio: 34.50, marca: "NonnoPasta", peso: 0.60, frio: false, fragil: true },
    { sku: "RES-POS-032", nombre: "Cheesecake de Frutos Rojos Porción Doble", cat: "RESTAURANTE", precio: 24.00, marca: "DulceArte", peso: 0.40, frio: true, fragil: true },
    // HOGAR (33-40)
    { sku: "HOG-LIC-033", nombre: "Licuadora Vaso de Vidrio 800W", cat: "HOGAR", precio: 179.00, marca: "Oster", peso: 3.40, frio: false, fragil: true },
    { sku: "HOG-CAF-034", nombre: "Cafetera Espresso Italiana 6 Tazas", cat: "HOGAR", precio: 69.00, marca: "Bialetti", peso: 0.70, frio: false, fragil: false },
    { sku: "HOG-FRE-035", nombre: "Freidora de Aire Digital 4.5 Litros", cat: "HOGAR", precio: 249.00, marca: "Imaco", peso: 4.20, frio: false, fragil: true },
    { sku: "HOG-HER-036", nombre: "Hervidor Eléctrico Acero Inoxidable 1.8L", cat: "HOGAR", precio: 59.90, marca: "Thomas", peso: 0.95, frio: false, fragil: false },
    { sku: "HOG-LAM-037", nombre: "Lámpara Escritorio LED Recargable Touch", cat: "HOGAR", precio: 48.00, marca: "LumiDesk", peso: 0.45, frio: false, fragil: true },
    { sku: "HOG-ORG-038", nombre: "Set Organizadores Acrílicos Cocina x6", cat: "HOGAR", precio: 55.00, marca: "HomeBox", peso: 1.20, frio: false, fragil: true },
    { sku: "HOG-TER-039", nombre: "Termo Acero Inoxidable 1L Térmico 24h", cat: "HOGAR", precio: 74.00, marca: "Stanley", peso: 0.65, frio: false, fragil: false },
    { sku: "HOG-ASP-040", nombre: "Aspiradora de Mano Inalámbrica Portátil", cat: "HOGAR", precio: 119.00, marca: "CleanMax", peso: 1.10, frio: false, fragil: true }
];

const productosDocs = catalogoBase.map((item, idx) => ({
    producto_id: padId("PROD", idx + 1),
    sku: item.sku,
    nombre: item.nombre,
    categoria: item.cat,
    precio_unitario: Number(item.precio),
    stock: 20 + ((idx * 7) % 80),
    disponible: idx !== 39, // 39 disponibles, 1 agotado/no disponible
    especificaciones: {
        marca: item.marca,
        peso_kg: Number(item.peso),
        requiere_cadena_frio: item.frio,
        fragil: item.fragil
    }
}));

db.productos.insertMany(productosDocs);
print(`[OK] Insertados ${db.productos.countDocuments()} documentos en 'productos'.`);

// ============================================================================
// 3. GENERACIÓN E INSERCIÓN DE 25 REPARTIDORES (REP-0001 a REP-0025)
// ============================================================================
const nombresRepartidores = [
    "Carlos Alberto Huamán", "Luis Miguel Quispe", "Jorge Antonio Mamani", "Pedro Pablo Condori",
    "Miguel Ángel Rojas", "José Luis Aquino", "Juan Carlos Choque", "Fernando José Silva",
    "Ricardo Daniel Flores", "César Augusto Ramos", "Héctor Manuel Mendoza", "Víctor Hugo Vargas",
    "Raúl Eduardo Castro", "Julio César Romero", "Óscar Arturo Paredes", "Roberto Carlos Díaz",
    "Mario Alberto Medina", "Eduardo Javier León", "Sergio Andrés Vega", "Christian Paul Soto",
    "Daniel Alejandro Cruz", "Marco Antonio Reyes", "Iván Alexander Herrera", "Edgar Wilmer Peña",
    "Wilfredo Ronald Tapia"
];

const zonasCobertura = ["LIMA_MODERNA", "LIMA_CENTRO", "LIMA_NORTE", "LIMA_SUR", "LIMA_ESTE", "CALLAO"];
const estadosRepartidor = ["DISPONIBLE", "EN_RUTA", "FUERA_DE_SERVICIO"];
const tiposVehiculo = [
    { tipo: "MOTO", capacidad: 25.0 },
    { tipo: "BICICLETA", capacidad: 10.0 },
    { tipo: "AUTO", capacidad: 80.0 }
];

const repartidoresDocs = [];
for (let i = 1; i <= 25; i++) {
    const veh = tiposVehiculo[i % 5 === 0 ? 2 : (i % 4 === 0 ? 1 : 0)];
    repartidoresDocs.push({
        repartidor_id: padId("REP", i),
        nombre: nombresRepartidores[i - 1],
        telefono: `+519${String(10000000 + i * 54321).slice(0, 8)}`,
        zona_cobertura: zonasCobertura[(i - 1) % zonasCobertura.length],
        estado: estadosRepartidor[i % 8 === 0 ? 2 : (i % 2 === 0 ? 0 : 1)],
        vehiculo: {
            tipo: veh.tipo,
            placa: veh.tipo === "BICICLETA" ? `BICI-${100 + i}` : `${7000 + i * 17}-${i}A`,
            capacidad_kg: Number(veh.capacidad)
        },
        metricas: {
            calificacion_promedio: Number((4.2 + ((i % 8) * 0.1)).toFixed(2)),
            total_entregas: 50 + (i * 18)
        }
    });
}

db.repartidores.insertMany(repartidoresDocs);
print(`[OK] Insertados ${db.repartidores.countDocuments()} documentos en 'repartidores'.`);

// ============================================================================
// 4. GENERACIÓN E INSERCIÓN DE 90 PEDIDOS (PED-0001 a PED-0090)
// Incluye pedidos en los 5 estados y distribuidos entre Octubre y Noviembre 2026
// ============================================================================
const metodosPago = ["YAPE", "PLIN", "TARJETA", "EFECTIVO"];
const pedidosDocs = [];

for (let i = 1; i <= 90; i++) {
    const clienteObj = clientesDocs[(i - 1) % clientesDocs.length];
    const dirEntrega = clienteObj.direcciones_entrega[0];

    // Determinar estado del pedido:
    // PED-0001 a PED-0015: Activos para sincronizar con Redis (PENDIENTE, EN_PREPARACION, EN_CAMINO)
    // PED-0016 a PED-0080: ENTREGADO
    // PED-0081 a PED-0090: CANCELADO
    let estadoActual;
    if (i <= 5) {
        estadoActual = "EN_CAMINO";
    } else if (i <= 10) {
        estadoActual = "EN_PREPARACION";
    } else if (i <= 15) {
        estadoActual = "PENDIENTE";
    } else if (i <= 80) {
        estadoActual = "ENTREGADO";
    } else {
        estadoActual = "CANCELADO";
    }

    const repAsignado = estadoActual === "PENDIENTE"
        ? null
        : repartidoresDocs[(i - 1) % repartidoresDocs.length].repartidor_id;

    // Seleccionar entre 1 y 3 productos para el array embebido items[]
    const numItems = (i % 3) + 1;
    const itemsPedido = [];
    let sumaSubtotales = 0;

    for (let k = 0; k < numItems; k++) {
        const prod = productosDocs[((i * 3) + k) % productosDocs.length];
        const cant = ((i + k) % 2) + 1;
        const subtotal = Number((prod.precio_unitario * cant).toFixed(2));
        sumaSubtotales += subtotal;

        itemsPedido.push({
            producto_id: prod.producto_id,
            nombre: prod.nombre,
            cantidad: cant,
            precio_unitario: Number(prod.precio_unitario),
            subtotal: subtotal
        });
    }

    const costoEnvio = i % 3 === 0 ? 9.90 : 6.50;
    const totalPedido = Number((sumaSubtotales + costoEnvio).toFixed(2));

    // Fecha de pedido entre el 01 de Octubre 2026 y el 20 de Noviembre 2026
    const mes = i <= 45 ? 10 : 9; // 9 = Octubre, 10 = Noviembre (0-indexed en JS Date)
    const dia = ((i - 1) % 20) + 1;
    const hora = 9 + (i % 11);
    const fechaBase = new Date(Date.UTC(2026, mes, dia, hora, 15, 0));

    // Construir historial_estados coherente con estadoActual
    const historial = [
        { estado: "PENDIENTE", fecha: fechaBase, comentario: "Pedido registrado en Megashop" }
    ];

    if (["EN_PREPARACION", "EN_CAMINO", "ENTREGADO"].includes(estadoActual)) {
        historial.push({
            estado: "EN_PREPARACION",
            fecha: new Date(fechaBase.getTime() + 8 * 60000),
            comentario: "Pedido validado y en empaque"
        });
    }
    if (["EN_CAMINO", "ENTREGADO"].includes(estadoActual)) {
        historial.push({
            estado: "EN_CAMINO",
            fecha: new Date(fechaBase.getTime() + 22 * 60000),
            comentario: `Despachado con repartidor ${repAsignado}`
        });
    }
    if (estadoActual === "ENTREGADO") {
        historial.push({
            estado: "ENTREGADO",
            fecha: new Date(fechaBase.getTime() + 45 * 60000),
            comentario: "Entregado conforme con validación OTP"
        });
    }
    if (estadoActual === "CANCELADO") {
        historial.push({
            estado: "CANCELADO",
            fecha: new Date(fechaBase.getTime() + 10 * 60000),
            comentario: "Cancelado a solicitud del cliente"
        });
    }

    pedidosDocs.push({
        pedido_id: padId("PED", i),
        cliente_id: clienteObj.cliente_id,
        repartidor_id: repAsignado,
        fecha_pedido: fechaBase,
        estado_actual: estadoActual,
        metodo_pago: metodosPago[i % metodosPago.length],
        direccion_entrega: {
            calle: dirEntrega.calle,
            distrito: dirEntrega.distrito,
            referencia: dirEntrega.referencia
        },
        items: itemsPedido,
        costo_envio: Number(costoEnvio),
        total_pedido: totalPedido,
        historial_estados: historial
    });
}

db.pedidos.insertMany(pedidosDocs);
print(`[OK] Insertados ${db.pedidos.countDocuments()} documentos en 'pedidos'.`);

// ============================================================================
// 5. GENERACIÓN E INSERCIÓN DE 35 RESEÑAS E INCIDENCIAS (INC-0001 a INC-0035)
// Vinculadas a los pedidos ENTREGADOS (PED-0016 a PED-0050)
// ============================================================================
const comentariosPositivos = [
    "Excelente servicio, llegó súper rápido y bien empacado.",
    "El repartidor fue muy amable y los productos llegaron en perfecto estado.",
    "Todo fresco y dentro del tiempo estimado en la app.",
    "Muy buena atención, la cadena de frío se respetó al 100%."
];

const reclamosBase = [
    { motivo: "RETRASO_ENTREGA", comentario: "El pedido demoró 25 minutos más de lo indicado en el tracking.", estado: "COMPENSADO" },
    { motivo: "PRODUCTO_DANADO", comentario: "El empaque exterior llegó abollado por el transporte.", estado: "EN_REVISION" },
    { motivo: "PEDIDO_INCOMPLETO", comentario: "Faltó uno de los accesorios secundarios del combo.", estado: "COMPENSADO" },
    { motivo: "COBRO_INDEBIDO", comentario: "Se duplicó el cargo de envío en la pasarela.", estado: "CERRADO" }
];

const incidenciasDocs = [];
for (let i = 1; i <= 35; i++) {
    // Asociamos a pedidos entregados a partir de PED-0016
    const pedidoRef = pedidosDocs[14 + i];
    const esReclamo = i % 5 === 0; // 28 RESENAS y 7 RECLAMOS

    if (!esReclamo) {
        incidenciasDocs.push({
            incidencia_id: padId("INC", i),
            pedido_id: pedidoRef.pedido_id,
            cliente_id: pedidoRef.cliente_id,
            repartidor_id: pedidoRef.repartidor_id,
            tipo: "RESENA",
            calificacion_pedido: (i % 2 === 0) ? 5 : 4,
            calificacion_delivery: 5,
            motivo_incidencia: "NINGUNO",
            comentario: comentariosPositivos[i % comentariosPositivos.length],
            estado_resolucion: "CERRADO",
            fecha_registro: new Date(pedidoRef.fecha_pedido.getTime() + 120 * 60000)
        });
    } else {
        const rec = reclamosBase[(i / 5) % reclamosBase.length];
        incidenciasDocs.push({
            incidencia_id: padId("INC", i),
            pedido_id: pedidoRef.pedido_id,
            cliente_id: pedidoRef.cliente_id,
            repartidor_id: pedidoRef.repartidor_id,
            tipo: "RECLAMO",
            calificacion_pedido: 2,
            calificacion_delivery: 3,
            motivo_incidencia: rec.motivo,
            comentario: rec.comentario,
            estado_resolucion: rec.estado,
            fecha_registro: new Date(pedidoRef.fecha_pedido.getTime() + 90 * 60000)
        });
    }
}

db.resenas_incidencias.insertMany(incidenciasDocs);
print(`[OK] Insertados ${db.resenas_incidencias.countDocuments()} documentos en 'resenas_incidencias'.`);

// ============================================================================
// RESUMEN FINAL DE VERIFICACIÓN DEL DATASET EN MONGODB
// ============================================================================
const totalClientes = db.clientes.countDocuments();
const totalProductos = db.productos.countDocuments();
const totalRepartidores = db.repartidores.countDocuments();
const totalPedidos = db.pedidos.countDocuments();
const totalIncidencias = db.resenas_incidencias.countDocuments();
const granTotalMongo = totalClientes + totalProductos + totalRepartidores + totalPedidos + totalIncidencias;

print("\n============================================================");
print("   RESUMEN DE REGISTROS INSERTADOS EN MONGODB (megashop_db) ");
print("============================================================");
print(` 1. clientes             : ${totalClientes} documentos`);
print(` 2. productos            : ${totalProductos} documentos`);
print(` 3. repartidores         : ${totalRepartidores} documentos`);
print(` 4. pedidos              : ${totalPedidos} documentos`);
print(` 5. resenas_incidencias  : ${totalIncidencias} documentos`);
print("------------------------------------------------------------");
print(` TOTAL MONGODB           : ${granTotalMongo} documentos (Cumple >= 200)`);
print("============================================================\n");
