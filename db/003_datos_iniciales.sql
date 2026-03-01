USE schoolwaysv2;
GO

INSERT INTO Roles (NombreRol, Descripcion) VALUES 
('Admin', 'Administrador total'), ('Conductor', 'Piloto de unidad'), 
('Padre', 'Responsable de alumno'), ('Estudiante', 'Usuario de bus');

-- La contraseña para todos es 'password123' encriptada con bcrypt
DECLARE @pass VARCHAR(255) = '$2a$10$xWJk1a9n3H7f.k6X0E1X.OqI7V/J5rVzXl8zXz4g6P.1aQ6.';

INSERT INTO Usuarios (NombreCompleto, CorreoElectronico, PasswordHash, RolID, Telefono) VALUES
('Admin Principal', 'admin@schoolwaysv.com', @pass, 1, '7000-0001'),
('Carlos Motorista', 'carlos@schoolwaysv.com', @pass, 2, '7000-0002'),
('Luis Motorista', 'luis@schoolwaysv.com', @pass, 2, '7000-0003'),
('Maria Madre', 'maria@gmail.com', @pass, 3, '7000-0004'),
('Jose Padre', 'jose@gmail.com', @pass, 3, '7000-0005');

INSERT INTO Vehiculos (Placa, Marca, Modelo, Capacidad) VALUES ('P123456', 'Toyota', 'Coaster', 25);
INSERT INTO Conductores (UsuarioID, NumeroLicencia) VALUES (2, 'LIC-001'), (3, 'LIC-002');
INSERT INTO Rutas (NombreRuta, Turno, ConductorID, VehiculoID) VALUES ('Ruta Mañana - Escalón', 'Mañana', 1, 1), ('Ruta Tarde - Santa Elena', 'Tarde', 2, 1);
INSERT INTO Padres (UsuarioID, DUI, TelefonoPrincipal) VALUES (4, '12345678-9', '7000-0004'), (5, '98765432-1', '7000-0005');
INSERT INTO Alumnos (Nombre, Apellido, PadreID, RutaID) VALUES ('Juan', 'Perez', 1, 1), ('Ana', 'Perez', 1, 2), ('Luis', 'Gomez', 2, 1), ('Marta', 'Gomez', 2, 2);
