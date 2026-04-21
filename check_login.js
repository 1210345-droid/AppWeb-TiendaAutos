const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function checkLoginTable() {
    let pool = await sql.connect(dbConfig);
    let r = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='usuarios_login'");
    console.log("usuarios_login:", r.recordset);
    process.exit(0);
}
checkLoginTable();
