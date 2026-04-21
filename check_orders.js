const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function checkOrders() {
    try {
        let pool = await sql.connect(dbConfig);
        let r = await pool.request().query("SELECT * FROM orden_venta");
        console.log("Ordenes:", r.recordset);
        let rd = await pool.request().query("SELECT * FROM detalle_orden");
        console.log("Detalles:", rd.recordset);
        process.exit(0);
    } catch(e) {
        console.error("Error SQL:", e.message);
        process.exit(1);
    }
}
checkOrders();
