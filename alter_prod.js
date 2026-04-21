const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function alter() {
    let pool = await sql.connect(dbConfig);
    try {
        await pool.request().query("ALTER TABLE productos ADD imagen_url VARCHAR(1000) NULL");
        console.log("Columna agregada");
    } catch(e) {
        console.log(e.message);
    }
    process.exit(0);
}
alter();
