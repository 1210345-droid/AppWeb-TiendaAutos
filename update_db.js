const sql = require('mssql/msnodesqlv8');
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;'
};
async function update() {
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request().query("ALTER TABLE usuarios_login ADD rol VARCHAR(50) DEFAULT 'cliente'");
        await pool.request().query("UPDATE usuarios_login SET rol = 'admin' WHERE usuario = 'admin'");
        console.log("DB Updated!");
    } catch(e) { console.error(e); }
    process.exit(0);
}
update();
