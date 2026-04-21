const sql = require('mssql/msnodesqlv8');
const dbConfig = { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;' };
async function alterPhase3() {
    let pool = await sql.connect(dbConfig);
    try {
        await pool.request().query("ALTER TABLE productos ADD categoria VARCHAR(100) NULL");
        console.log("Columna categoria agregada a productos");
    } catch(e) { console.log("Ignorado:", e.message); }

    try {
        await pool.request().query("ALTER TABLE usuarios_login ADD id_cliente INT NULL");
        console.log("Columna id_cliente agregada a usuarios_login");
    } catch(e) { console.log("Ignorado:", e.message); }
    process.exit(0);
}
alterPhase3();
