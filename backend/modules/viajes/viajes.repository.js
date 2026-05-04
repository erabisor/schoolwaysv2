const { poolPromise } = require('../../config/db');
const mssql = require('mssql');

const obtenerAlumnosParaRuta = async (rutaId, fechaHoy, sentido) => {
  const pool = await poolPromise;
  const tipoServicioPermitido = sentido === 'Ida' ? 'Solo Ida' : 'Solo Vuelta';

  const result = await pool.request()
    .input('rutaId', mssql.Int, rutaId)
    .input('fechaHoy', mssql.Date, fechaHoy)
    .input('tipoPermitido', mssql.VarChar, tipoServicioPermitido)
    .input('sentido', mssql.VarChar, sentido)
    .query(`
      SELECT
        a.AlumnoID,
        a.Nombre,
        a.Apellido,
        a.Direccion,
        a.CasaLatitud,
        a.CasaLongitud,
        a.ColegioLatitud,
        a.ColegioLongitud,
        a.TipoServicio
      FROM Alumnos a
      LEFT JOIN Asistencias asi ON a.AlumnoID = asi.AlumnoID
        AND CAST(asi.FechaHora AS DATE) = @fechaHoy
        AND asi.TipoEvento = 'AvisóAusencia'
        AND asi.Estado = 1
        AND asi.Sentido = @sentido
      WHERE a.RutaID = @rutaId
        AND a.Eliminado = 0
        AND a.Estado = 1
        AND a.CasaLatitud IS NOT NULL
        AND a.CasaLongitud IS NOT NULL
        AND a.ColegioLatitud IS NOT NULL
        AND a.ColegioLongitud IS NOT NULL
        AND (a.TipoServicio = 'Ambos' OR a.TipoServicio = @tipoPermitido)
        AND asi.AsistenciaID IS NULL
    `);

  return result.recordset;
};

const obtenerConductorIdPorUsuario = async (usuarioId) => {
  if (!usuarioId) return null;

  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', mssql.Int, usuarioId)
    .query(`
      SELECT ConductorID
      FROM Conductores
      WHERE UsuarioID = @usuarioId
        AND Eliminado = 0
    `);

  return result.recordset[0]?.ConductorID || null;
};

const rutaPerteneceAConductor = async (rutaId, conductorId) => {
  if (!rutaId || !conductorId) return false;

  const pool = await poolPromise;

  const result = await pool.request()
    .input('rutaId', mssql.Int, rutaId)
    .input('conductorId', mssql.Int, conductorId)
    .query(`
      SELECT RutaID
      FROM Rutas
      WHERE RutaID = @rutaId
        AND ConductorID = @conductorId
        AND Estado = 1
        AND Eliminado = 0
    `);

  return result.recordset.length > 0;
};

module.exports = {
  obtenerAlumnosParaRuta,
  obtenerConductorIdPorUsuario,
  rutaPerteneceAConductor
};
