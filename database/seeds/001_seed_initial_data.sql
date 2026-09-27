SET NOCOUNT ON;
SET XACT_ABORT ON;
GO
USE schoolwaysv;
GO
BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @PasswordHash VARCHAR(255) = '$2b$12$sJ6XegEHm4Oej0PWgiB0/eZgUrjS.pJLDsUkixDlDSKYzqP3Uj65O';
    DECLARE @ConductorUsuarioID INT, @PadreUsuarioID INT;
    DECLARE @ConductorID INT, @PadreID INT, @VehiculoID INT, @RutaID INT;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE CorreoElectronico = 'admin@schoolwaysv.local')
        INSERT INTO dbo.Usuarios (NombreCompleto, CorreoElectronico, PasswordHash, RolID, Telefono)
        VALUES ('Administrador Local', 'admin@schoolwaysv.local', @PasswordHash, 1, '70000001');

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE CorreoElectronico = 'conductor@schoolwaysv.local')
        INSERT INTO dbo.Usuarios (NombreCompleto, CorreoElectronico, PasswordHash, RolID, Telefono)
        VALUES ('Conductor Demostracion', 'conductor@schoolwaysv.local', @PasswordHash, 2, '70000002');

    SELECT @ConductorUsuarioID = UsuarioID FROM dbo.Usuarios
    WHERE CorreoElectronico = 'conductor@schoolwaysv.local';

    IF NOT EXISTS (SELECT 1 FROM dbo.Conductores WHERE UsuarioID = @ConductorUsuarioID)
        INSERT INTO dbo.Conductores (UsuarioID, NumeroLicencia, VencimientoLicencia)
        VALUES (@ConductorUsuarioID, 'LIC-DEMO-001', '2030-12-31');

    SELECT @ConductorID = ConductorID FROM dbo.Conductores
    WHERE UsuarioID = @ConductorUsuarioID;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE CorreoElectronico = 'padre@schoolwaysv.local')
        INSERT INTO dbo.Usuarios (NombreCompleto, CorreoElectronico, PasswordHash, RolID, Telefono)
        VALUES ('Responsable Demostracion', 'padre@schoolwaysv.local', @PasswordHash, 3, '70000003');

    SELECT @PadreUsuarioID = UsuarioID FROM dbo.Usuarios
    WHERE CorreoElectronico = 'padre@schoolwaysv.local';

    IF NOT EXISTS (SELECT 1 FROM dbo.Padres WHERE UsuarioID = @PadreUsuarioID)
        INSERT INTO dbo.Padres (UsuarioID) VALUES (@PadreUsuarioID);

    SELECT @PadreID = PadreID FROM dbo.Padres WHERE UsuarioID = @PadreUsuarioID;

    IF NOT EXISTS (SELECT 1 FROM dbo.Vehiculos WHERE Placa = 'DEM-001')
        INSERT INTO dbo.Vehiculos (Placa, Marca, Modelo, Anio, Capacidad, Color)
        VALUES ('DEM-001', 'Toyota', 'Coaster', 2022, 30, 'Blanco');

    SELECT @VehiculoID = VehiculoID FROM dbo.Vehiculos WHERE Placa = 'DEM-001';

    IF NOT EXISTS (SELECT 1 FROM dbo.Rutas WHERE NombreRuta = 'Ruta Demostracion Centro' AND Eliminado = 0)
        INSERT INTO dbo.Rutas
            (NombreRuta, Descripcion, CapacidadMaxima, ConductorID, VehiculoID, Turno)
        VALUES
            ('Ruta Demostracion Centro', 'Ruta local con datos sinteticos para desarrollo.',
             25, @ConductorID, @VehiculoID, 'Mañana');

    SELECT TOP 1 @RutaID = RutaID FROM dbo.Rutas
    WHERE NombreRuta = 'Ruta Demostracion Centro' AND Eliminado = 0 ORDER BY RutaID;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.Alumnos
        WHERE Nombre = 'Alumno' AND Apellido = 'Demostracion'
          AND PadreID = @PadreID AND Eliminado = 0
    )
        INSERT INTO dbo.Alumnos
            (Nombre, Apellido, Grado, Seccion, Direccion, PuntoReferencia,
             PadreID, RutaID, TipoServicio,
             CasaLatitud, CasaLongitud, ColegioLatitud, ColegioLongitud)
        VALUES
            ('Alumno', 'Demostracion', '5', 'A',
             'Direccion sintetica para pruebas', 'Punto de referencia sintetico',
             @PadreID, @RutaID, 'Ambos',
             13.4800000, -88.1800000, 13.4750000, -88.1750000);

    COMMIT TRANSACTION;

    SELECT UsuarioID, NombreCompleto, CorreoElectronico, RolID
    FROM dbo.Usuarios
    WHERE CorreoElectronico IN (
        'admin@schoolwaysv.local',
        'conductor@schoolwaysv.local',
        'padre@schoolwaysv.local'
    )
    ORDER BY RolID;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
