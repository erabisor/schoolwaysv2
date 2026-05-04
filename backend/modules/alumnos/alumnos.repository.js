const { sql, poolPromise } = require('../../config/db');

const normalizarTexto = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return String(valor).trim();
};

const normalizarEntero = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;

  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
};

const normalizarDecimal = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const separarNombreApellido = (nombreCompleto = '') => {
  const limpio = String(nombreCompleto).trim().replace(/\s+/g, ' ');
  const primerEspacio = limpio.indexOf(' ');

  if (primerEspacio === -1) {
    return {
      nombre: limpio,
      apellido: ''
    };
  }

  return {
    nombre: limpio.substring(0, primerEspacio),
    apellido: limpio.substring(primerEspacio + 1)
  };
};

const validarUsuarioPadreActivo = async (transaction, usuarioId) => {
  const result = await new sql.Request(transaction)
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT UsuarioID
      FROM Usuarios
      WHERE UsuarioID = @usuarioId
        AND RolID = 3
        AND Estado = 1
        AND Eliminado = 0
    `);

  if (result.recordset.length === 0) {
    throw crearError('El responsable seleccionado no existe, no está activo o no tiene rol Padre.', 400);
  }
};

const obtenerPadreIdDesdeUsuario = async (transaction, usuarioId) => {
  await validarUsuarioPadreActivo(transaction, usuarioId);

  const checkPadre = await new sql.Request(transaction)
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT PadreID
      FROM Padres
      WHERE UsuarioID = @usuarioId
    `);

  if (checkPadre.recordset.length > 0) {
    return checkPadre.recordset[0].PadreID;
  }

  const nuevoPadre = await new sql.Request(transaction)
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      INSERT INTO Padres (UsuarioID)
      OUTPUT INSERTED.PadreID
      VALUES (@usuarioId)
    `);

  return nuevoPadre.recordset[0].PadreID;
};

const validarRutaActiva = async (transaction, rutaId) => {
  if (!rutaId) return;

  const result = await new sql.Request(transaction)
    .input('rutaId', sql.Int, rutaId)
    .query(`
      SELECT RutaID
      FROM Rutas
      WHERE RutaID = @rutaId
        AND Estado = 1
        AND Eliminado = 0
    `);

  if (result.recordset.length === 0) {
    throw crearError('La ruta seleccionada no existe, está inactiva o fue eliminada.', 400);
  }
};

const obtenerTodos = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      a.AlumnoID,
      LTRIM(RTRIM(a.Nombre + ' ' + ISNULL(a.Apellido, ''))) AS NombreCompleto,
      a.Nombre,
      a.Apellido,
      a.Grado,
      a.Seccion,
      a.Direccion,
      a.PuntoReferencia,
      a.Estado,
      a.PadreID,
      a.RutaID,
      a.TipoServicio,
      a.CasaLatitud,
      a.CasaLongitud,
      a.ColegioLatitud,
      a.ColegioLongitud,
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

const obtenerOpciones = async () => {
  const pool = await poolPromise;

  const padres = await pool.request().query(`
    SELECT
      UsuarioID,
      NombreCompleto,
      Telefono
    FROM Usuarios
    WHERE RolID = 3
      AND Eliminado = 0
      AND Estado = 1
    ORDER BY NombreCompleto ASC
  `);

  const rutas = await pool.request().query(`
    SELECT
      RutaID,
      NombreRuta,
      Turno
    FROM Rutas
    WHERE Eliminado = 0
      AND Estado = 1
    ORDER BY NombreRuta ASC
  `);

  return {
    padres: padres.recordset,
    rutas: rutas.recordset
  };
};

const crear = async (datos) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const { nombre, apellido } = separarNombreApellido(datos.NombreCompleto || '');
    const rutaId = normalizarEntero(datos.RutaID);

    const padreIdFinal = await obtenerPadreIdDesdeUsuario(transaction, normalizarEntero(datos.UsuarioID));
    await validarRutaActiva(transaction, rutaId);

    const result = await new sql.Request(transaction)
      .input('nom', sql.VarChar, nombre)
      .input('ape', sql.VarChar, apellido)
      .input('grado', sql.VarChar, normalizarTexto(datos.Grado))
      .input('seccion', sql.VarChar, normalizarTexto(datos.Seccion))
      .input('dir', sql.VarChar, normalizarTexto(datos.Direccion))
      .input('ref', sql.VarChar, normalizarTexto(datos.PuntoReferencia))
      .input('padreId', sql.Int, padreIdFinal)
      .input('rutaId', sql.Int, rutaId)
      .input('tipo', sql.VarChar, normalizarTexto(datos.TipoServicio) || 'Ambos')
      .input('casaLat', sql.Decimal(10, 7), normalizarDecimal(datos.CasaLatitud))
      .input('casaLng', sql.Decimal(10, 7), normalizarDecimal(datos.CasaLongitud))
      .input('colegioLat', sql.Decimal(10, 7), normalizarDecimal(datos.ColegioLatitud))
      .input('colegioLng', sql.Decimal(10, 7), normalizarDecimal(datos.ColegioLongitud))
      .query(`
        INSERT INTO Alumnos
        (
          Nombre,
          Apellido,
          Grado,
          Seccion,
          Direccion,
          PuntoReferencia,
          PadreID,
          RutaID,
          TipoServicio,
          CasaLatitud,
          CasaLongitud,
          ColegioLatitud,
          ColegioLongitud,
          Estado,
          Eliminado,
          FechaIngreso
        )
        OUTPUT INSERTED.AlumnoID
        VALUES
        (
          @nom,
          @ape,
          @grado,
          @seccion,
          @dir,
          @ref,
          @padreId,
          @rutaId,
          @tipo,
          @casaLat,
          @casaLng,
          @colegioLat,
          @colegioLng,
          1,
          0,
          GETDATE()
        )
      `);

    await transaction.commit();
    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const actualizar = async (id, datos) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const { nombre, apellido } = separarNombreApellido(datos.NombreCompleto || '');
    const rutaId = normalizarEntero(datos.RutaID);

    const padreIdFinal = await obtenerPadreIdDesdeUsuario(transaction, normalizarEntero(datos.UsuarioID));
    await validarRutaActiva(transaction, rutaId);

    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('nom', sql.VarChar, nombre)
      .input('ape', sql.VarChar, apellido)
      .input('grado', sql.VarChar, normalizarTexto(datos.Grado))
      .input('seccion', sql.VarChar, normalizarTexto(datos.Seccion))
      .input('dir', sql.VarChar, normalizarTexto(datos.Direccion))
      .input('ref', sql.VarChar, normalizarTexto(datos.PuntoReferencia))
      .input('padreId', sql.Int, padreIdFinal)
      .input('rutaId', sql.Int, rutaId)
      .input('tipo', sql.VarChar, normalizarTexto(datos.TipoServicio) || 'Ambos')
      .input('casaLat', sql.Decimal(10, 7), normalizarDecimal(datos.CasaLatitud))
      .input('casaLng', sql.Decimal(10, 7), normalizarDecimal(datos.CasaLongitud))
      .input('colegioLat', sql.Decimal(10, 7), normalizarDecimal(datos.ColegioLatitud))
      .input('colegioLng', sql.Decimal(10, 7), normalizarDecimal(datos.ColegioLongitud))
      .query(`
        UPDATE Alumnos
        SET Nombre = @nom,
            Apellido = @ape,
            Grado = @grado,
            Seccion = @seccion,
            Direccion = @dir,
            PuntoReferencia = @ref,
            PadreID = @padreId,
            RutaID = @rutaId,
            TipoServicio = @tipo,
            CasaLatitud = @casaLat,
            CasaLongitud = @casaLng,
            ColegioLatitud = @colegioLat,
            ColegioLongitud = @colegioLng
        WHERE AlumnoID = @id
          AND Eliminado = 0
      `);

    await transaction.commit();
    return result.rowsAffected[0] > 0;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('estado', sql.Bit, estado)
    .query(`
      UPDATE Alumnos
      SET Estado = @estado
      WHERE AlumnoID = @id
        AND Eliminado = 0
    `);

  return result.rowsAffected[0] > 0;
};

const eliminar = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE Alumnos
      SET Eliminado = 1
      WHERE AlumnoID = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  obtenerTodos,
  obtenerOpciones,
  crear,
  actualizar,
  cambiarEstado,
  eliminar
};
