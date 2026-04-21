const express = require('express');
const cors = require('cors');
const sql = require('mssql/msnodesqlv8');
const path = require('path');

const app = express();
const PORT = 5000;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// Evitar dolorosos problemas de caché (Forzar lectura de archivos frescos)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Redirigir tráfico raíz a la nueva Masterpiece App
app.get('/', (req, res) => {
    res.redirect('/tienda.html');
});

// Servir archivos estáticos del frontend desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// === CONFIGURACIÓN BASE DE DATOS SQL SERVER ===
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;'
};

// === CONEXIÓN A DB INITIAL ===
let pool;
sql.connect(dbConfig).then(p => {
    pool = p;
    console.log("✅ Conectado a SQL Server local");
}).catch(err => {
    console.error("❌ Error de conexión a la base de datos:", err);
    console.log("Revisa que tu servidor SQL Server esté encendido y acepta la conexión msnodesqlv8.");
});

// ============================================
// ENDPOINTS LOGIN
// ============================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Datos incompletos" });

    try {
        const result = await pool.request()
            .input('user', sql.VarChar, username)
            .input('pass', sql.VarChar, password)
            .query("SELECT id, usuario, rol FROM usuarios_login WHERE usuario = @user AND password = @pass");

        if (result.recordset.length > 0) {
            return res.json({ success: true, message: "Login exitoso", rol: result.recordset[0].rol });
        } else {
            return res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password, nombre, apellido, telefono } = req.body;
    if (!username || !password || !nombre || !apellido) return res.status(400).json({ error: "Datos incompletos obligatorios" });

    try {
        const check = await pool.request().input('user', sql.VarChar, username).query("SELECT COUNT(1) as count FROM usuarios_login WHERE usuario = @user");
        if (check.recordset[0].count > 0) return res.status(400).json({ success: false, message: "Este usuario ya existe" });

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Guardar perfil CRM de cliente y extraer id_cliente generado
            let idClienteInsertado = null;
            const reqCliente = new sql.Request(transaction);
            const resCliente = await reqCliente
                            .input('nom', sql.VarChar, nombre)
                            .input('ape', sql.VarChar, apellido)
                            .input('tel', sql.VarChar, telefono || null)
                            .query("INSERT INTO clientes (nombre, apellido, telefono) OUTPUT inserted.id_cliente VALUES (@nom, @ape, @tel)");
            
            if (resCliente.recordset.length > 0) {
                idClienteInsertado = resCliente.recordset[0].id_cliente;
            }

            // Guardar cuenta de login asociando el id_cliente
            const reqLogin = new sql.Request(transaction);
            await reqLogin.input('user', sql.VarChar, username)
                          .input('pass', sql.VarChar, password)
                          .input('idC', sql.Int, idClienteInsertado)
                          .query("INSERT INTO usuarios_login (usuario, password, rol, id_cliente) VALUES (@user, @pass, 'cliente', @idC)");
            
            await transaction.commit();
            res.json({ success: true, message: "Registro y Perfil atado de cliente fue exitoso" });
        } catch(e) {
            await transaction.rollback();
            throw e;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// GET: PERFIL DEL CLIENTE
// ============================================
app.get('/api/perfil/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const result = await pool.request()
            .input('u', sql.VarChar, username)
            .query(`
                SELECT c.id_cliente as id, c.nombre, c.apellido, c.telefono, c.direccion 
                FROM usuarios_login u
                INNER JOIN clientes c ON u.id_cliente = c.id_cliente
                WHERE u.usuario = @u
            `);
        
        if (result.recordset.length > 0) res.json(result.recordset[0]);
        else res.status(404).json({ error: "Perfil no encontrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ENDPOINTS DE CLIENTES
// ============================================
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT id_cliente as id, nombre, apellido, telefono FROM clientes");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clientes', async (req, res) => {
    const { nombre, apellido, telefono } = req.body;
    if (!nombre || !apellido) return res.status(400).json({ error: "Nombre y apellido requeridos" });

    try {
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('telefono', sql.VarChar, telefono || null)
            .query("INSERT INTO clientes (nombre, apellido, telefono) VALUES (@nombre, @apellido, @telefono)");
        res.json({ success: true, message: "Cliente creado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM clientes WHERE id_cliente = @id");
        res.json({ success: true, message: "Cliente eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ENDPOINTS DE PRODUCTOS
// ============================================
app.get('/api/productos', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_producto as id, 
                m.descripcion as marca, 
                pr.nombre as proveedor, 
                p.descripcion, 
                p.costo, 
                p.precio_venta as precioVenta,
                p.imagen_url,
                p.categoria,
                p.condicion_uso,
                p.detalles_producto,
                c.nombre as vendedor_nombre,
                c.apellido as vendedor_apellido
            FROM productos p
            LEFT JOIN marca m ON p.id_marca = m.id_marca
            LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
            LEFT JOIN clientes c ON p.id_vendedor = c.id_cliente
            ORDER BY p.id_producto DESC
        `;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// DROPDOWNS: Marcas y Proveedores
// ============================================
app.get('/api/marcas', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT id_marca as id, descripcion as nombre FROM marca");
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT id_proveedor as id, nombre FROM proveedores");
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// GESTIÓN DE PRODUCTOS C2C (CLIENTES)
// ============================================
app.post('/api/mis_productos', async (req, res) => {
    const { idCliente, descripcion, precioVenta, imagen_url, categoria, condicion_uso, detalles_producto } = req.body;
    if (!idCliente || !descripcion || !precioVenta) return res.status(400).json({ error: "Faltan datos obligatorios." });

    try {
        await pool.request()
            .input('idC', sql.Int, idCliente)
            .input('desc', sql.VarChar, descripcion)
            .input('precio', sql.Decimal(18,2), precioVenta)
            .input('img', sql.VarChar, imagen_url || null)
            .input('cat', sql.VarChar, categoria || 'General')
            .input('condicion', sql.VarChar, condicion_uso || 'Semi-Nuevo')
            .input('detalles', sql.VarChar, detalles_producto || null)
            .query("INSERT INTO productos (id_vendedor, descripcion, precio_venta, imagen_url, categoria, condicion_uso, detalles_producto) VALUES (@idC, @desc, @precio, @img, @cat, @condicion, @detalles)");
        
        res.json({ success: true, message: "Publicación creada con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// POST: CREAR PRODUCTO (ADMIN)
// ============================================
app.post('/api/productos', async (req, res) => {
    const { descripcion, precioVenta, costo, nombreMarca, nombreProv, imagen_url, categoria } = req.body;
    if (!descripcion || precioVenta == null) return res.status(400).json({ error: "Descripción y precio requeridos" });

    try {
        let finalIdMarca = null;
        let finalIdProv = null;

        // 1. Dinámicamente buscar/insertar MARCA
        if (nombreMarca) {
            let chkM = await pool.request().input('nm', sql.VarChar, nombreMarca).query("SELECT id_marca FROM marca WHERE descripcion = @nm");
            if (chkM.recordset.length > 0) finalIdMarca = chkM.recordset[0].id_marca;
            else {
                let insM = await pool.request().input('nm', sql.VarChar, nombreMarca).query("INSERT INTO marca (descripcion) OUTPUT inserted.id_marca VALUES (@nm)");
                finalIdMarca = insM.recordset[0].id_marca;
            }
        }

        // 2. Dinámicamente buscar/insertar PROVEEDOR
        if (nombreProv) {
            let chkP = await pool.request().input('np', sql.VarChar, nombreProv).query("SELECT id_proveedor FROM proveedores WHERE nombre = @np");
            if (chkP.recordset.length > 0) finalIdProv = chkP.recordset[0].id_proveedor;
            else {
                let insP = await pool.request().input('np', sql.VarChar, nombreProv).query("INSERT INTO proveedores (nombre) OUTPUT inserted.id_proveedor VALUES (@np)");
                finalIdProv = insP.recordset[0].id_proveedor;
            }
        }

        // 3. Insertar PRODUCTO
        await pool.request()
            .input('desc', sql.VarChar, descripcion)
            .input('precio', sql.Decimal(18, 2), precioVenta)
            .input('costo', sql.Decimal(18, 2), costo || 0)
            .input('idMarca', sql.Int, finalIdMarca)
            .input('idProv', sql.Int, finalIdProv)
            .input('img', sql.VarChar, imagen_url || null)
            .input('cat', sql.VarChar, categoria || 'General')
            .query("INSERT INTO productos (descripcion, precio_venta, costo, id_marca, id_proveedor, imagen_url, categoria) VALUES (@desc, @precio, @costo, @idMarca, @idProv, @img, @cat)");
        
        res.json({ success: true, message: "Producto insertado (resolución dinámica de catálogos)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// PUT: ACTUALIZAR PRODUCTO
// ============================================
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { descripcion, precioVenta, costo, nombreMarca, nombreProv, imagen_url, categoria } = req.body;
    if (!descripcion || precioVenta == null) return res.status(400).json({ error: "Descripción y precio requeridos" });

    try {
        let finalIdMarca = null;
        let finalIdProv = null;

        if (nombreMarca) {
            let chkM = await pool.request().input('nm', sql.VarChar, nombreMarca).query("SELECT id_marca FROM marca WHERE descripcion = @nm");
            if (chkM.recordset.length > 0) finalIdMarca = chkM.recordset[0].id_marca;
            else {
                let insM = await pool.request().input('nm', sql.VarChar, nombreMarca).query("INSERT INTO marca (descripcion) OUTPUT inserted.id_marca VALUES (@nm)");
                finalIdMarca = insM.recordset[0].id_marca;
            }
        }

        if (nombreProv) {
            let chkP = await pool.request().input('np', sql.VarChar, nombreProv).query("SELECT id_proveedor FROM proveedores WHERE nombre = @np");
            if (chkP.recordset.length > 0) finalIdProv = chkP.recordset[0].id_proveedor;
            else {
                let insP = await pool.request().input('np', sql.VarChar, nombreProv).query("INSERT INTO proveedores (nombre) OUTPUT inserted.id_proveedor VALUES (@np)");
                finalIdProv = insP.recordset[0].id_proveedor;
            }
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('desc', sql.VarChar, descripcion)
            .input('precio', sql.Decimal(18, 2), precioVenta)
            .input('costo', sql.Decimal(18, 2), costo || 0)
            .input('idMarca', sql.Int, finalIdMarca)
            .input('idProv', sql.Int, finalIdProv)
            .input('img', sql.VarChar, imagen_url || null)
            .input('cat', sql.VarChar, categoria || 'General')
            .query("UPDATE productos SET descripcion=@desc, precio_venta=@precio, costo=@costo, id_marca=@idMarca, id_proveedor=@idProv, imagen_url=@img, categoria=@cat WHERE id_producto=@id");
        
        res.json({ success: true, message: "Producto actualizado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM productos WHERE id_producto = @id");
        res.json({ success: true, message: "Producto eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// POST: CHECKOUT (CARRITO)
// ============================================
app.post('/api/checkout', async (req, res) => {
    const { items, idCliente } = req.body;
    if (!items || !items.length) return res.status(400).json({error: "Carrito vacío"});

    let total = items.reduce((acc, p) => acc + (p.precioVenta * p.cantidad), 0);
    
    try {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const ordenReq = new sql.Request(transaction);
            ordenReq.input('total', sql.Decimal(18,2), total);
            ordenReq.input('idC', sql.Int, idCliente || null);
            const rOrden = await ordenReq.query("INSERT INTO orden_venta (id_cliente, fecha_orden, status_orden, total_orden) OUTPUT inserted.id_orden VALUES (@idC, GETDATE(), 'Procesando Pago', @total)");
            
            const idOrden = rOrden.recordset[0].id_orden;

            for (let item of items) {
                const detReq = new sql.Request(transaction);
                detReq.input('idOrden', sql.Int, idOrden);
                detReq.input('idProd', sql.Int, item.id);
                detReq.input('cant', sql.Int, item.cantidad);
                detReq.input('precio', sql.Decimal(18,2), item.precioVenta);
                detReq.input('subtotal', sql.Decimal(18,2), item.precioVenta * item.cantidad);
                
                await detReq.query("INSERT INTO detalle_orden (id_orden, id_producto, cantidad, precio_unitario, subtotal) VALUES (@idOrden, @idProd, @cant, @precio, @subtotal)");
            }

            await transaction.commit();
            res.json({success: true, id_orden: idOrden});
        } catch(e) {
            await transaction.rollback();
            throw e;
        }
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

// ============================================
// GET: HISTORIAL DE COMPRAS (MIS ORDENES)
// ============================================
app.get('/api/mis_ordenes/:idCliente', async (req, res) => {
    const { idCliente } = req.params;
    try {
        const query = `
            SELECT o.id_orden, o.fecha_orden, o.total_orden, o.status_orden,
                   d.cantidad, d.precio_unitario, p.descripcion 
            FROM orden_venta o
            INNER JOIN detalle_orden d ON o.id_orden = d.id_orden
            INNER JOIN productos p ON d.id_producto = p.id_producto
            WHERE o.id_cliente = @idC
            ORDER BY o.fecha_orden DESC
        `;
        const result = await pool.request()
            .input('idC', sql.Int, idCliente)
            .query(query);
            
        // Agrupar por orden
        let ordersMap = {};
        result.recordset.forEach(row => {
            if(!ordersMap[row.id_orden]) {
                ordersMap[row.id_orden] = {
                    id_orden: row.id_orden,
                    fecha: row.fecha_orden,
                    total: row.total_orden,
                    status: row.status_orden,
                    items: []
                };
            }
            ordersMap[row.id_orden].items.push({
                desc: row.descripcion,
                qty: row.cantidad,
                price: row.precio_unitario
            });
        });
        
        res.json(Object.values(ordersMap));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ADMIN LOGISTICA (TRACKING DE ÓRDENES)
// ============================================
app.get('/api/admin/ordenes', async (req, res) => {
    try {
        const query = `
            SELECT 
                o.id_orden, o.id_cliente, o.total_orden, o.status_orden, o.fecha_orden,
                c.nombre, c.apellido
            FROM orden_venta o
            LEFT JOIN clientes c ON o.id_cliente = c.id_cliente
            ORDER BY o.fecha_orden DESC
        `;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/orden_status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.VarChar, status)
            .query("UPDATE orden_venta SET status_orden = @status WHERE id_orden = @id");
        res.json({ success: true, message: "Status Actualizado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// === INICIO DEL SERVIDOR ===
app.listen(PORT, () => {
    console.log(`🚀 Servidor Minimalista Node.js corriendo en http://localhost:${PORT}`);
});
