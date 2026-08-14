USE master;
GO

IF DB_ID(N'schoolwaysv') IS NULL
BEGIN
    CREATE DATABASE schoolwaysv;
END;
GO

USE schoolwaysv;
GO

IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RolID INT NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
        NombreRol VARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_NombreRol UNIQUE
    );
END;
GO

IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        UsuarioID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuarios PRIMARY KEY,
        NombreCompleto VARCHAR(150) NOT NULL,
        CorreoElectronico VARCHAR(254) NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        RolID INT NOT NULL,
        Telefono VARCHAR(25) NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Usuarios_Estado DEFAULT (1),
        Eliminado BIT NOT NULL CONSTRAINT DF_Usuarios_Eliminado DEFAULT (0),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Usuarios_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolID) REFERENCES dbo.Roles(RolID),
        CONSTRAINT UQ_Usuarios_CorreoElectronico UNIQUE (CorreoElectronico)
    );
END;
GO

IF OBJECT_ID(N'dbo.HistorialContrasenas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistorialContrasenas (
        HistorialContrasenaID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistorialContrasenas PRIMARY KEY,
        UsuarioID INT NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        FechaCambio DATETIME2(0) NOT NULL CONSTRAINT DF_HistorialContrasenas_FechaCambio DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_HistorialContrasenas_Usuarios FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuarios(UsuarioID)
    );
END;
GO

IF OBJECT_ID(N'dbo.Padres', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Padres (
        PadreID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Padres PRIMARY KEY,
        UsuarioID INT NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Padres_Estado DEFAULT (1),
        Eliminado BIT NOT NULL CONSTRAINT DF_Padres_Eliminado DEFAULT (0),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Padres_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_Padres_Usuarios FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuarios(UsuarioID),
        CONSTRAINT UQ_Padres_UsuarioID UNIQUE (UsuarioID)
    );
END;
GO

IF OBJECT_ID(N'dbo.Vehiculos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Vehiculos (
        VehiculoID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Vehiculos PRIMARY KEY,
        Placa VARCHAR(20) NOT NULL,
        Marca VARCHAR(60) NOT NULL,
        Modelo VARCHAR(60) NOT NULL,
        Anio SMALLINT NOT NULL,
        Capacidad TINYINT NOT NULL,
        Color VARCHAR(40) NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Vehiculos_Estado DEFAULT (1),
        Eliminado BIT NOT NULL CONSTRAINT DF_Vehiculos_Eliminado DEFAULT (0),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Vehiculos_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT UQ_Vehiculos_Placa UNIQUE (Placa),
        CONSTRAINT CK_Vehiculos_Anio CHECK (Anio BETWEEN 1980 AND 2100),
        CONSTRAINT CK_Vehiculos_Capacidad CHECK (Capacidad > 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.Conductores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Conductores (
        ConductorID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Conductores PRIMARY KEY,
        UsuarioID INT NOT NULL,
        NumeroLicencia VARCHAR(50) NOT NULL,
        VencimientoLicencia DATE NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Conductores_Estado DEFAULT (1),
        Eliminado BIT NOT NULL CONSTRAINT DF_Conductores_Eliminado DEFAULT (0),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Conductores_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_Conductores_Usuarios FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuarios(UsuarioID),
        CONSTRAINT UQ_Conductores_UsuarioID UNIQUE (UsuarioID),
        CONSTRAINT UQ_Conductores_NumeroLicencia UNIQUE (NumeroLicencia)
    );
END;
GO

IF OBJECT_ID(N'dbo.Rutas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rutas (
        RutaID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Rutas PRIMARY KEY,
        NombreRuta VARCHAR(120) NOT NULL,
        Descripcion VARCHAR(500) NULL,
        CapacidadMaxima INT NOT NULL,
        ConductorID INT NULL,
        VehiculoID INT NULL,
        Turno VARCHAR(20) NOT NULL CONSTRAINT DF_Rutas_Turno DEFAULT ('Mañana'),
        Estado BIT NOT NULL CONSTRAINT DF_Rutas_Estado DEFAULT (1),
        Eliminado BIT NOT NULL CONSTRAINT DF_Rutas_Eliminado DEFAULT (0),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Rutas_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_Rutas_Conductores FOREIGN KEY (ConductorID) REFERENCES dbo.Conductores(ConductorID),
        CONSTRAINT FK_Rutas_Vehiculos FOREIGN KEY (VehiculoID) REFERENCES dbo.Vehiculos(VehiculoID),
        CONSTRAINT CK_Rutas_CapacidadMaxima CHECK (CapacidadMaxima > 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.Alumnos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Alumnos (
        AlumnoID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Alumnos PRIMARY KEY,
        Nombre VARCHAR(100) NOT NULL,
        Apellido VARCHAR(150) NULL,
        Grado VARCHAR(30) NULL,
        Seccion VARCHAR(20) NULL,
        Direccion VARCHAR(300) NULL,
        PuntoReferencia VARCHAR(300) NULL,
        PadreID INT NOT NULL,
        RutaID INT NULL,
        TipoServicio VARCHAR(20) NOT NULL CONSTRAINT DF_Alumnos_TipoServicio DEFAULT ('Ambos'),
        CasaLatitud DECIMAL(10,7) NULL,
        CasaLongitud DECIMAL(10,7) NULL,
        ColegioLatitud DECIMAL(10,7) NULL,
        ColegioLongitud DECIMAL(10,7) NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Alumnos_Estado DEFAULT (1),
        Eliminado BIT NOT NULL CONSTRAINT DF_Alumnos_Eliminado DEFAULT (0),
        FechaIngreso DATETIME2(0) NOT NULL CONSTRAINT DF_Alumnos_FechaIngreso DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_Alumnos_Padres FOREIGN KEY (PadreID) REFERENCES dbo.Padres(PadreID),
        CONSTRAINT FK_Alumnos_Rutas FOREIGN KEY (RutaID) REFERENCES dbo.Rutas(RutaID),
        CONSTRAINT CK_Alumnos_TipoServicio CHECK (TipoServicio IN ('Ambos', 'Solo Ida', 'Solo Vuelta')),
        CONSTRAINT CK_Alumnos_CasaLatitud CHECK (CasaLatitud IS NULL OR CasaLatitud BETWEEN -90 AND 90),
        CONSTRAINT CK_Alumnos_CasaLongitud CHECK (CasaLongitud IS NULL OR CasaLongitud BETWEEN -180 AND 180),
        CONSTRAINT CK_Alumnos_ColegioLatitud CHECK (ColegioLatitud IS NULL OR ColegioLatitud BETWEEN -90 AND 90),
        CONSTRAINT CK_Alumnos_ColegioLongitud CHECK (ColegioLongitud IS NULL OR ColegioLongitud BETWEEN -180 AND 180)
    );
END;
GO

IF OBJECT_ID(N'dbo.MantenimientosVehiculos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MantenimientosVehiculos (
        MantenimientoID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MantenimientosVehiculos PRIMARY KEY,
        VehiculoID INT NOT NULL,
        TipoMantenimiento VARCHAR(60) NOT NULL,
        EstadoMantenimiento VARCHAR(30) NOT NULL,
        Prioridad VARCHAR(20) NOT NULL,
        Descripcion VARCHAR(500) NULL,
        Taller VARCHAR(150) NULL,
        Responsable VARCHAR(150) NULL,
        FechaProgramada DATE NULL,
        FechaInicio DATE NULL,
        FechaFinalizacion DATE NULL,
        ProximoMantenimiento DATE NULL,
        Kilometraje INT NULL,
        Costo DECIMAL(10,2) NULL,
        Observaciones VARCHAR(1000) NULL,
        UsuarioRegistroID INT NULL,
        Eliminado BIT NOT NULL CONSTRAINT DF_MantenimientosVehiculos_Eliminado DEFAULT (0),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_MantenimientosVehiculos_FechaRegistro DEFAULT (SYSDATETIME()),
        FechaActualizacion DATETIME2(0) NULL,
        CONSTRAINT FK_MantenimientosVehiculos_Vehiculos FOREIGN KEY (VehiculoID) REFERENCES dbo.Vehiculos(VehiculoID),
        CONSTRAINT FK_MantenimientosVehiculos_Usuarios FOREIGN KEY (UsuarioRegistroID) REFERENCES dbo.Usuarios(UsuarioID),
        CONSTRAINT CK_MantenimientosVehiculos_Estado CHECK (EstadoMantenimiento IN ('Programado', 'En Proceso', 'Completado', 'Cancelado')),
        CONSTRAINT CK_MantenimientosVehiculos_Prioridad CHECK (Prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
        CONSTRAINT CK_MantenimientosVehiculos_Kilometraje CHECK (Kilometraje IS NULL OR Kilometraje >= 0),
        CONSTRAINT CK_MantenimientosVehiculos_Costo CHECK (Costo IS NULL OR Costo >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.TurnosConductores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TurnosConductores (
        TurnoConductorID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TurnosConductores PRIMARY KEY,
        ConductorID INT NOT NULL,
        RutaID INT NOT NULL,
        Fecha DATE NOT NULL CONSTRAINT DF_TurnosConductores_Fecha DEFAULT (CONVERT(DATE, GETDATE())),
        EstadoTurno VARCHAR(20) NOT NULL CONSTRAINT DF_TurnosConductores_EstadoTurno DEFAULT ('Abierto'),
        HoraApertura DATETIME2(0) NOT NULL CONSTRAINT DF_TurnosConductores_HoraApertura DEFAULT (SYSDATETIME()),
        HoraCierre DATETIME2(0) NULL,
        CONSTRAINT FK_TurnosConductores_Conductores FOREIGN KEY (ConductorID) REFERENCES dbo.Conductores(ConductorID),
        CONSTRAINT FK_TurnosConductores_Rutas FOREIGN KEY (RutaID) REFERENCES dbo.Rutas(RutaID),
        CONSTRAINT CK_TurnosConductores_EstadoTurno CHECK (EstadoTurno IN ('Abierto', 'Cerrado')),
        CONSTRAINT CK_TurnosConductores_Horas CHECK (HoraCierre IS NULL OR HoraCierre >= HoraApertura)
    );
END;
GO

IF OBJECT_ID(N'dbo.Viajes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Viajes (
        ViajeID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Viajes PRIMARY KEY,
        TurnoConductorID INT NOT NULL,
        RutaID INT NOT NULL,
        Sentido VARCHAR(10) NOT NULL,
        Fecha DATE NOT NULL CONSTRAINT DF_Viajes_Fecha DEFAULT (CONVERT(DATE, GETDATE())),
        EstadoViaje VARCHAR(20) NOT NULL CONSTRAINT DF_Viajes_EstadoViaje DEFAULT ('En Curso'),
        HoraInicio DATETIME2(0) NOT NULL CONSTRAINT DF_Viajes_HoraInicio DEFAULT (SYSDATETIME()),
        HoraFin DATETIME2(0) NULL,
        CONSTRAINT FK_Viajes_TurnosConductores FOREIGN KEY (TurnoConductorID) REFERENCES dbo.TurnosConductores(TurnoConductorID),
        CONSTRAINT FK_Viajes_Rutas FOREIGN KEY (RutaID) REFERENCES dbo.Rutas(RutaID),
        CONSTRAINT CK_Viajes_Sentido CHECK (Sentido IN ('Ida', 'Vuelta')),
        CONSTRAINT CK_Viajes_EstadoViaje CHECK (EstadoViaje IN ('En Curso', 'Finalizado')),
        CONSTRAINT CK_Viajes_Horas CHECK (HoraFin IS NULL OR HoraFin >= HoraInicio)
    );
END;
GO

IF OBJECT_ID(N'dbo.Asistencias', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Asistencias (
        AsistenciaID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Asistencias PRIMARY KEY,
        AlumnoID INT NOT NULL,
        ConductorID INT NOT NULL,
        RutaID INT NOT NULL,
        Sentido VARCHAR(10) NOT NULL,
        FechaHora DATETIME2(0) NOT NULL CONSTRAINT DF_Asistencias_FechaHora DEFAULT (SYSDATETIME()),
        TipoEvento VARCHAR(30) NOT NULL,
        Turno VARCHAR(20) NULL,
        Observaciones VARCHAR(500) NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Asistencias_Estado DEFAULT (1),
        CONSTRAINT FK_Asistencias_Alumnos FOREIGN KEY (AlumnoID) REFERENCES dbo.Alumnos(AlumnoID),
        CONSTRAINT FK_Asistencias_Conductores FOREIGN KEY (ConductorID) REFERENCES dbo.Conductores(ConductorID),
        CONSTRAINT FK_Asistencias_Rutas FOREIGN KEY (RutaID) REFERENCES dbo.Rutas(RutaID),
        CONSTRAINT CK_Asistencias_Sentido CHECK (Sentido IN ('Ida', 'Vuelta')),
        CONSTRAINT CK_Asistencias_TipoEvento CHECK (TipoEvento IN ('Abordó', 'Bajó', 'Ausente', 'AvisóAusencia'))
    );
END;
GO

IF OBJECT_ID(N'dbo.UbicacionBus', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UbicacionBus (
        UbicacionBusID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UbicacionBus PRIMARY KEY,
        ViajeID INT NOT NULL,
        Latitud DECIMAL(10,7) NOT NULL,
        Longitud DECIMAL(10,7) NOT NULL,
        FechaHora DATETIME2(0) NOT NULL CONSTRAINT DF_UbicacionBus_FechaHora DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_UbicacionBus_Viajes FOREIGN KEY (ViajeID) REFERENCES dbo.Viajes(ViajeID),
        CONSTRAINT CK_UbicacionBus_Latitud CHECK (Latitud BETWEEN -90 AND 90),
        CONSTRAINT CK_UbicacionBus_Longitud CHECK (Longitud BETWEEN -180 AND 180)
    );
END;
GO

IF OBJECT_ID(N'dbo.Notificaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notificaciones (
        NotificacionID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notificaciones PRIMARY KEY,
        UsuarioID INT NOT NULL,
        Titulo VARCHAR(150) NOT NULL,
        Mensaje VARCHAR(1000) NOT NULL,
        Tipo VARCHAR(50) NOT NULL,
        Leida BIT NOT NULL CONSTRAINT DF_Notificaciones_Leida DEFAULT (0),
        Estado BIT NOT NULL CONSTRAINT DF_Notificaciones_Estado DEFAULT (1),
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_Notificaciones_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_Notificaciones_Usuarios FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuarios(UsuarioID)
    );
END;
GO

IF OBJECT_ID(N'dbo.PushSubscriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PushSubscriptions (
        PushSubscriptionID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PushSubscriptions PRIMARY KEY,
        UsuarioID INT NOT NULL,
        Endpoint VARCHAR(2048) NOT NULL,
        KeyP256dh VARCHAR(512) NOT NULL,
        KeyAuth VARCHAR(512) NOT NULL,
        FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_PushSubscriptions_FechaRegistro DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_PushSubscriptions_Usuarios FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuarios(UsuarioID),
        CONSTRAINT UQ_PushSubscriptions_Endpoint UNIQUE (Endpoint)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RolID = 1)
    INSERT INTO dbo.Roles (RolID, NombreRol) VALUES (1, 'Administrador');
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RolID = 2)
    INSERT INTO dbo.Roles (RolID, NombreRol) VALUES (2, 'Conductor');
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RolID = 3)
    INSERT INTO dbo.Roles (RolID, NombreRol) VALUES (3, 'Padre');
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RolID = 4)
    INSERT INTO dbo.Roles (RolID, NombreRol) VALUES (4, 'Estudiante');
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_HistorialContrasenas_Usuario_Fecha' AND object_id = OBJECT_ID(N'dbo.HistorialContrasenas'))
    CREATE INDEX IX_HistorialContrasenas_Usuario_Fecha ON dbo.HistorialContrasenas (UsuarioID, FechaCambio DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Alumnos_Ruta' AND object_id = OBJECT_ID(N'dbo.Alumnos'))
    CREATE INDEX IX_Alumnos_Ruta ON dbo.Alumnos (RutaID, Estado, Eliminado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Alumnos_Padre' AND object_id = OBJECT_ID(N'dbo.Alumnos'))
    CREATE INDEX IX_Alumnos_Padre ON dbo.Alumnos (PadreID, Estado, Eliminado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MantenimientosVehiculos_Vehiculo' AND object_id = OBJECT_ID(N'dbo.MantenimientosVehiculos'))
    CREATE INDEX IX_MantenimientosVehiculos_Vehiculo ON dbo.MantenimientosVehiculos (VehiculoID, Eliminado, EstadoMantenimiento, Prioridad);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TurnosConductores_Conductor_Estado' AND object_id = OBJECT_ID(N'dbo.TurnosConductores'))
    CREATE INDEX IX_TurnosConductores_Conductor_Estado ON dbo.TurnosConductores (ConductorID, EstadoTurno, Fecha);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Viajes_Ruta_Fecha_Estado' AND object_id = OBJECT_ID(N'dbo.Viajes'))
    CREATE INDEX IX_Viajes_Ruta_Fecha_Estado ON dbo.Viajes (RutaID, Fecha, EstadoViaje, Sentido);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Asistencias_Alumno_Fecha' AND object_id = OBJECT_ID(N'dbo.Asistencias'))
    CREATE INDEX IX_Asistencias_Alumno_Fecha ON dbo.Asistencias (AlumnoID, FechaHora DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Asistencias_Ruta_Fecha' AND object_id = OBJECT_ID(N'dbo.Asistencias'))
    CREATE INDEX IX_Asistencias_Ruta_Fecha ON dbo.Asistencias (RutaID, FechaHora DESC, Sentido, TipoEvento);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_UbicacionBus_Viaje_Fecha' AND object_id = OBJECT_ID(N'dbo.UbicacionBus'))
    CREATE INDEX IX_UbicacionBus_Viaje_Fecha ON dbo.UbicacionBus (ViajeID, FechaHora DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notificaciones_Usuario_Estado_Leida' AND object_id = OBJECT_ID(N'dbo.Notificaciones'))
    CREATE INDEX IX_Notificaciones_Usuario_Estado_Leida ON dbo.Notificaciones (UsuarioID, Estado, Leida, FechaRegistro DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PushSubscriptions_Usuario' AND object_id = OBJECT_ID(N'dbo.PushSubscriptions'))
    CREATE INDEX IX_PushSubscriptions_Usuario ON dbo.PushSubscriptions (UsuarioID);
GO
