const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function check() {
    try {
        let pool = await sql.connect(dbConfig);
        let r = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('orden_venta', 'detalle_orden', 'inventario', 'empleados', 'tiendas', 'almacenes')
            ORDER BY TABLE_NAME
        `);
        console.log(JSON.stringify(r.recordset, null, 2));
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
check();
