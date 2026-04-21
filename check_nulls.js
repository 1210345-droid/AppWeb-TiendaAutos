const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function checkNulls() {
    let pool = await sql.connect(dbConfig);
    let r = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='orden_venta'");
    console.log(r.recordset);
    process.exit(0);
}
checkNulls();
