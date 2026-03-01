const { sql, poolPromise } = require('../../config/db');

// 1. Obtener todos (Incluyendo TipoServicio)
const obtenerTodos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
        a.AlumnoID, 
        (a.Nombre + ' ' + a.Apellido) AS NombreCompleto, 
        a.Grado, a.Direccion, a.PuntoReferencia, a.Estado, a.PadreID, a.RutaID,
        a.TipoServicio, -- <--- NUEVO: Campo para Bachillerato/Contratos
        u.NombreCompleto AS NombrePadre, 
        u.UsuarioID, 
        r.NombreRuta 
    FROM Alumnos a
    LEFT JOIN Padres p ON a.PadreID = p.PadreID
    LEFT JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
    LEFT JOIN Rutas r ON a.RutaID = r.RutaID
    WHERE a.Eliminado = 0
    ORDER BY a.AlumnoID DESC
  `);
  return result.recordset;
};

// 2. Obtener opciones (Sin cambios)
const obtenerOpciones = async () => {
  const pool = await poolPromise;
  
  const padres = await pool.request().query(`
    SELECT UsuarioID, NombreCompleto, Telefono 
    FROM Usuarios WHERE RolID = 3 AND Eliminado = 0
  `);

  const rutas = await pool.request().query(`
    SELECT RutaID, NombreRuta, Turno 
    FROM Rutas WHERE Eliminado = 0 AND Estado = 1
  `);

  return { padres: padres.recordset, rutas: rutas.recordset };
};

// 3. Crear (Incluyendo TipoServicio)
const crear = async (datos) => {
  const pool = await poolPromise;
  
  const nombreCompleto = datos.NombreCompleto.trim();
  const primeraEspacio = nombreCompleto.indexOf(' ');
  const nombre = primeraEspacio !== -1 ? nombreCompleto.substring(0, primeraEspacio) : nombreCompleto;
  const apellido = primeraEspacio !== -1 ? nombreCompleto.substring(primeraEspacio + 1) : '';

  // Asegurar que el Padre exista en la tabla 'Padres'
  const checkPadre = await pool.request()
    .input('uId', sql.Int, datos.UsuarioID)
    .query('SELECT PadreID FROM Padres WHERE UsuarioID = @uId');

  let padreIdFinal;
  if (checkPadre.recordset.length > 0) {
    padreIdFinal = checkPadre.recordset[0].PadreID;
  } else {
    const nuevoPadre = await pool.request()
      .input('uId', sql.Int, datos.UsuarioID)
      .query('INSERT INTO Padres (UsuarioID) OUTPUT INSERTED.PadreID VALUES (@uId)');
    padreIdFinal = nuevoPadre.recordset[0].PadreID;
  }

  const result = await pool.request()
    .input('nom', sql.VarChar, nombre)
    .input('ape', sql.VarChar, apellido)
    .input('grado', sql.VarChar, datos.Grado)
    .input('dir', sql.VarChar, datos.Direccion)
    .input('ref', sql.VarChar, datos.PuntoReferencia)
    .input('padreId', sql.Int, padreIdFinal)
    .input('rutaId', sql.Int, datos.RutaID || null)
    .input('tipo', sql.VarChar, datos.TipoServicio || 'Ambos') // <--- NUEVO
    .query(`
      INSERT INTO Alumnos 
      (Nombre, Apellido, Grado, Direccion, PuntoReferencia, PadreID, RutaID, TipoServicio, Estado, Eliminado, FechaIngreso)
      OUTPUT INSERTED.AlumnoID
      VALUES 
      (@nom, @ape, @grado, @dir, @ref, @padreId, @rutaId, @tipo, 1, 0, GETDATE())
    `);
    
  return result.recordset[0];
};

// 4. Actualizar (Incluyendo TipoServicio)
const actualizar = async (id, datos) => {
  const pool = await poolPromise;
  
  console.log(`--- EDITANDO ALUMNO ID: ${id} ---`);
  console.log(`Datos recibidos:`, datos);

  const nombreCompleto = datos.NombreCompleto ? datos.NombreCompleto.trim() : "";
  const primeraEspacio = nombreCompleto.indexOf(' ');
  const nombre = primeraEspacio !== -1 ? nombreCompleto.substring(0, primeraEspacio) : nombreCompleto;
  const apellido = primeraEspacio !== -1 ? nombreCompleto.substring(primeraEspacio + 1) : '';

  const checkPadre = await pool.request()
    .input('uId', sql.Int, datos.UsuarioID)
    .query('SELECT PadreID FROM Padres WHERE UsuarioID = @uId');

  let padreIdFinal;
  if (checkPadre.recordset.length > 0) {
    padreIdFinal = checkPadre.recordset[0].PadreID;
  } else {
    console.log(`Padre no encontrado en tabla Padres para UsuarioID: ${datos.UsuarioID}. Creando...`);
    const nuevoPadre = await pool.request()
      .input('uId', sql.Int, datos.UsuarioID)
      .query('INSERT INTO Padres (UsuarioID) OUTPUT INSERTED.PadreID VALUES (@uId)');
    padreIdFinal = nuevoPadre.recordset[0].PadreID;
  }

  const query = `
    UPDATE Alumnos 
    SET Nombre = @nom, 
        Apellido = @ape, 
        Grado = @grado, 
        Direccion = @dir, 
        PuntoReferencia = @ref, 
        PadreID = @padreId, 
        RutaID = @rutaId,
        TipoServicio = @tipo -- <--- NUEVO
    WHERE AlumnoID = @id
  `;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('nom', sql.VarChar, nombre)
    .input('ape', sql.VarChar, apellido)
    .input('grado', sql.VarChar, datos.Grado)
    .input('dir', sql.VarChar, datos.Direccion)
    .input('ref', sql.VarChar, datos.PuntoReferencia)
    .input('padreId', sql.Int, padreIdFinal)
    .input('rutaId', sql.Int, datos.RutaID || null)
    .input('tipo', sql.VarChar, datos.TipoServicio) // <--- NUEVO
    .query(query);

  console.log(`Filas afectadas: ${result.rowsAffected}`);
  console.log(`--- FIN EDICIÓN ---`);
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id).input('estado', sql.Bit, estado)
    .query('UPDATE Alumnos SET Estado = @estado WHERE AlumnoID = @id');
};

const eliminar = async (id) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id)
    .query('UPDATE Alumnos SET Eliminado = 1 WHERE AlumnoID = @id');
};

module.exports = { obtenerTodos, obtenerOpciones, crear, actualizar, cambiarEstado, eliminar };