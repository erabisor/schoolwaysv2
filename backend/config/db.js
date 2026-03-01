const sql = require('mssql');
require('dotenv').config();

// Configura las credenciales de SQL Server
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false, // En local o Docker va en false
    trustServerCertificate: true
  }
};

// Crea la conexión una sola vez para reutilizarla
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Conectado a SQL Server');
    return pool;
  })
  .catch(err => console.log('❌ Error de BD: ', err));

module.exports = { sql, poolPromise };