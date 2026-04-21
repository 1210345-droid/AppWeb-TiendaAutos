const sql = require('mssql/msnodesqlv8');
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=sistema_tienda_autos;Trusted_Connection=yes;'
};
async function run() {
    try {
        await sql.connect(dbConfig);
        console.log('Usuarios_login columns:');
        let r1 = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuarios_login'");
        console.log(r1.recordset);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
