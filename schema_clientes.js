const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function checkSchema() {
    try {
        let pool = await sql.connect(dbConfig);
        let r1 = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='clientes'");
        console.log("Clientes:", r1.recordset);
        process.exit(0);
    } catch(e) { console.error(e.message); process.exit(1); }
}
checkSchema();
