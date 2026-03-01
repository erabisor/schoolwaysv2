const { sql, poolPromise } = require('./config/db');
const bcrypt = require('bcryptjs');

async function arreglarContrasena() {
  try {
    const pool = await poolPromise;
    // Hasheamos la contraseña real
    const nuevoHash = await bcrypt.hash('password123', 10);
    
    // Actualizamos al admin
    await pool.request()
      .input('hash', sql.VarChar, nuevoHash)
      .query("UPDATE Usuarios SET PasswordHash = @hash WHERE CorreoElectronico = 'admin@schoolwaysv.com'");
      
    console.log('✅ Contraseña de admin actualizada correctamente a: password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

arreglarContrasena();