const { poolPromise } = require('../../config/db');
const mssql = require('mssql');

const obtenerAlumnosParaRuta = async (rutaId, fechaHoy, sentido) => {
    try {
        const pool = await poolPromise;
        
        // Lógica de contrato: Si es 'Ida', traemos 'Ambos' y 'Solo Ida'.
        const tipoServicioPermitido = sentido === 'Ida' ? 'Solo Ida' : 'Solo Vuelta';

        const result = await pool.request()
            .input('rutaId', mssql.Int, rutaId)
            .input('fechaHoy', mssql.Date, fechaHoy)
            .input('tipoPermitido', mssql.VarChar, tipoServicioPermitido)
            .input('sentido', mssql.VarChar, sentido)
            .query(`
                SELECT a.AlumnoID, a.Nombre, a.Apellido, a.Direccion,
                       a.CasaLatitud, a.CasaLongitud,
                       a.ColegioLatitud, a.ColegioLongitud,
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
                  AND a.ColegioLatitud IS NOT NULL
                  AND (a.TipoServicio = 'Ambos' OR a.TipoServicio = @tipoPermitido)
                  AND asi.AsistenciaID IS NULL
            `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al consultar alumnos: ' + error.message);
    }
};

module.exports = { obtenerAlumnosParaRuta };