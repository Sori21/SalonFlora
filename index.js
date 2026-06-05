const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Permite recibir formatos JSON (esencial para el Login)

// Configuración de la conexión a tu SQL Server
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,

    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
console.log("Servidor:", process.env.DB_SERVER);
console.log("Base:", process.env.DB_NAME);
// Conectar a SQL Server
sql.connect(dbConfig)
    .then(pool => {
        console.log('¡Conexión exitosa a la base de datos SQL Server (SalonFlora)!');
    })
    .catch(err => {
    console.error(err);
});

// Ruta de prueba inicial
app.get('/api/prueba', (req, res) => {
    res.json({ mensaje: "¡El backend del Salón Flora está vivo!" });
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

// ENDPOINT DE LOGIN
app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        const request = new sql.Request();

        request.input('correoParam', sql.VarChar, correo);
        request.input('passwordParam', sql.VarChar, password);

        const result = await request.query(
            `SELECT IdUsuario, Nombre, Rol 
             FROM Usuarios 
             WHERE Correo = @correoParam AND Password = @passwordParam`
        );

        if (result.recordset.length > 0) {

            const usuario = result.recordset[0];

            // 🔐 GENERAR TOKEN
            const token = jwt.sign(
                {
                    idUsuario: usuario.IdUsuario,
                    rol: usuario.Rol
                },
                "SECRET_KEY",
                { expiresIn: "2h" }
            );

            // RESPUESTA
            res.json({
                exitoso: true,
                mensaje: "Inicio de sesión correcto",
                token: token,
                usuario: {
                    idUsuario: usuario.IdUsuario,
                    nombre: usuario.Nombre,
                    rol: usuario.Rol
                }
            });

        } else {
            res.status(401).json({
                exitoso: false,
                mensaje: "Correo o contraseña incorrectos"
            });
        }

    } catch (err) {
        console.error("Error en el login:", err.message);
        res.status(500).json({
            exitoso: false,
            mensaje: "Error interno del servidor"
        });
    }
});
//CRUD SERVICIOS
app.get('/api/servicios', async (req, res) => {
    try {
        const request = new sql.Request();
        // Traemos los servicios activos (puedes filtrar por Estado si manejas bajas lógicas)
        const result = await request.query('SELECT IdServicio, Nombre, Descripcion, DuracionMinutos , Precio, Estado FROM Servicios');
        res.json(result.recordset);
    } catch (err) {
        console.error("Error al obtener servicios:", err.message);
        res.status(500).json({ mensaje: "Error al obtener los servicios" });
    }
});
app.post('/api/servicios', async (req, res) => {
    const { nombre, descripcion, duracionMinutos, precio, estado } = req.body;
    try {
        const request = new sql.Request();
        request.input('nombre', sql.VarChar, nombre);
        request.input('descripcion', sql.VarChar, descripcion);
        request.input('duracion', sql.Int, duracionMinutos);
        request.input('precio', sql.Decimal(10, 2), precio);
        request.input('estado', sql.VarChar, estado || 'Activo');

        await request.query(`
            INSERT INTO Servicios (Nombre, Descripcion, DuracionMinutos, Precio, Estado)
            VALUES (@nombre, @descripcion, @duracion, @precio, @estado)
        `);

        res.json({ exitoso: true, mensaje: "Servicio creado correctamente" });
    } catch (err) {
        console.error("Error al crear servicio:", err.message);
        res.status(500).json({ mensaje: "Error al crear el servicio" });
    }
});
app.put('/api/servicios/:id', async (req, res) => {
    const { id } = req.params; // Captura el ID desde la URL (ej: /api/servicios/2)
    const { nombre, descripcion, duracionMinutos, precio, estado } = req.body;
    try {
        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('nombre', sql.VarChar, nombre);
        request.input('descripcion', sql.VarChar, descripcion);
        request.input('duracion', sql.Int, duracionMinutos);
        request.input('precio', sql.Decimal(10, 2), precio);
        request.input('estado', sql.VarChar, estado);

        await request.query(`
            UPDATE Servicios 
            SET Nombre = @nombre, Descripcion = @descripcion, DuracionMinutos = @duracion, Precio = @precio, Estado = @estado
            WHERE IdServicio = @id
        `);

        res.json({ exitoso: true, mensaje: "Servicio actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar servicio:", err.message);
        res.status(500).json({ mensaje: "Error al actualizar el servicio" });
    }
});
app.delete('/api/servicios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const request = new sql.Request();
        request.input('id', sql.Int, id);

        await request.query('DELETE FROM Servicios WHERE IdServicio = @id');

        res.json({ exitoso: true, mensaje: "Servicio eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar servicio:", err.message);
        res.status(500).json({ mensaje: "Error al eliminar el servicio" });
    }
});
//registro- salon flora
app.post('/api/registro', async (req, res) => {

    const {
        nombre,
        correo,
        telefono,
        password
    } = req.body;

    try {

        const verificar = new sql.Request();

        verificar.input(
            'correo',
            sql.VarChar,
            correo
        );

        const existe = await verificar.query(`
            SELECT *
            FROM Usuarios
            WHERE Correo = @correo
        `);

        if (existe.recordset.length > 0) {

            return res.json({
                exitoso: false,
                mensaje: "El correo ya está registrado"
            });

        }

        const request = new sql.Request();

        request.input(
            'nombre',
            sql.VarChar,
            nombre
        );

        request.input(
            'correo',
            sql.VarChar,
            correo
        );

        request.input(
            'telefono',
            sql.VarChar,
            telefono
        );

        request.input(
            'password',
            sql.VarChar,
            password
        );

        request.input(
            'rol',
            sql.VarChar,
            'Cliente'
        );

        await request.query(`
            INSERT INTO Usuarios
            (
                Nombre,
                Correo,
                Telefono,
                Password,
                Rol
            )
            VALUES
            (
                @nombre,
                @correo,
                @telefono,
                @password,
                @rol
            )
        `);

        res.json({
            exitoso: true,
            mensaje: "Usuario registrado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al registrar usuario"
        });

    }

});
//CRUD Empleados
app.get('/api/empleados', async (req, res) => {

    try {

        const result = await new sql.Request().query(`
            SELECT
                IdEmpleado,
                Nombre,
                Especialidad,
                Telefono,
                Estado
            FROM Empleados
            WHERE Estado = 'Activo'
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error obteniendo empleados"
        });

    }

});
//crear empleados
app.post('/api/empleados', async (req,res)=>{

    const { nombre, especialidad, telefono } = req.body;

    try {

        await new sql.Request()

        .input("Nombre", sql.VarChar, nombre)
        .input("Especialidad", sql.VarChar, especialidad)
        .input("Telefono", sql.VarChar, telefono)

        .query(`
            INSERT INTO Empleados
            (Nombre, Especialidad, Telefono, Estado)
            VALUES
            (@Nombre, @Especialidad, @Telefono, 'Activo')
        `);

        res.json({ mensaje: "Empleado creado" });

    } catch (error) {

        res.status(500).json({ mensaje: "Error creando empleado" });

    }

});
//editar empleado
app.put('/api/empleados/:id', async (req,res)=>{

    const { id } = req.params;
    const { nombre, especialidad, telefono } = req.body;

    try {

        await new sql.Request()

        .input("IdEmpleado", sql.Int, id)
        .input("Nombre", sql.VarChar, nombre)
        .input("Especialidad", sql.VarChar, especialidad)
        .input("Telefono", sql.VarChar, telefono)

        .query(`
            UPDATE Empleados
            SET
                Nombre=@Nombre,
                Especialidad=@Especialidad,
                Telefono=@Telefono
            WHERE IdEmpleado=@IdEmpleado
        `);

        res.json({ mensaje: "Empleado actualizado" });

    } catch (error) {

        res.status(500).json({ mensaje: "Error actualizando" });

    }

});
//eliminar empleado
app.delete('/api/empleados/:id', async (req,res)=>{

    const { id } = req.params;

    try {

        await new sql.Request()

        .input("IdEmpleado", sql.Int, id)

        .query(`
            UPDATE Empleados
            SET Estado='Inactivo'
            WHERE IdEmpleado=@IdEmpleado
        `);

        res.json({ mensaje: "Empleado desactivado" });

    } catch (error) {

        res.status(500).json({ mensaje: "Error eliminando" });

    }

});

//CRUD CITAS
//admin
app.get('/api/citas', async (req, res) => {
    try {

        const result = await new sql.Request().query(`
            SELECT
                c.IdCita,
                u.Nombre AS Cliente,
                s.Nombre AS Servicio,
                e.Nombre AS Empleado,
                c.Fecha,
                c.Hora,
                c.Estado
            FROM Citas c
            INNER JOIN Usuarios u ON c.IdUsuario = u.IdUsuario
            INNER JOIN Servicios s ON c.IdServicio = s.IdServicio
            INNER JOIN Empleados e ON c.IdEmpleado = e.IdEmpleado
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener citas" });
    }
});
app.get('/api/servicios-cliente', async (req, res) => {
    try {

        const result = await new sql.Request().query(`
            SELECT
                IdServicio,
                Nombre
            FROM Servicios
            WHERE Estado = 'Activo'
            ORDER BY Nombre
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener servicios"
        });

    }
});
//CITAS
app.post('/api/citas', async (req, res) => {

    console.log("BODY RECIBIDO:");
    console.log(req.body);

    try {

        const {
            idUsuario,
            idServicio,
            idEmpleado,
            fecha,
            hora
        } = req.body;

        console.log("Hora:", hora);

        const request = new sql.Request();

        await request
            .input("idUsuario", sql.Int, idUsuario)
            .input("idServicio", sql.Int, idServicio)
            .input("idEmpleado", sql.Int, idEmpleado)
            .input("fecha", sql.Date, fecha)
            .input("hora", sql.VarChar, hora)
            .input("estado", sql.VarChar, "Pendiente")
            .query(`
                INSERT INTO Citas
                (
                    IdUsuario,
                    IdServicio,
                    IdEmpleado,
                    Fecha,
                    Hora,
                    Estado
                )
                VALUES
                (
                    @idUsuario,
                    @idServicio,
                    @idEmpleado,
                    @fecha,
                    CAST(@hora AS TIME),
                    @estado
                )
            `);

        res.json({
            mensaje: "Cita creada correctamente"
        });

    } catch(error){

        console.error(error);

        res.status(500).json({
            mensaje: "Error al crear cita"
        });

    }

});
app.get('/api/citas/mis-citas/:idUsuario', async (req, res) => {

    const { idUsuario } = req.params;

    const result = await new sql.Request()

    .input("IdUsuario", sql.Int, idUsuario)

    .query(`
        SELECT
            c.IdCita,
            s.Nombre AS servicio,
            c.Fecha AS fecha,
            c.Hora AS hora,
            c.Estado AS estado
        FROM Citas c
        INNER JOIN Servicios s
            ON c.IdServicio = s.IdServicio
        WHERE c.IdUsuario = @IdUsuario
    `);

    res.json(result.recordset);

});
app.get('/api/citas', async (req, res) => {

    try {

        const result = await new sql.Request().query(`
            SELECT
                c.IdCita,
                u.Nombre AS Cliente,
                s.Nombre AS Servicio,
                e.Nombre AS Empleado,
                c.Fecha,
                c.Hora,
                c.Estado
            FROM Citas c
            INNER JOIN Usuarios u
                ON c.IdUsuario = u.IdUsuario
            INNER JOIN Servicios s
                ON c.IdServicio = s.IdServicio
            INNER JOIN Empleados e
                ON c.IdEmpleado = e.IdEmpleado
        `);

        console.log(result.recordset);

        res.json(result.recordset);

    } catch (error) {

        console.error("ERROR CITAS:", error);

        res.status(500).json({
            mensaje: "Error al obtener citas"
        });

    }

});
//cancelar cita
app.put('/api/citas/cancelar/:id', async (req, res) => {

    try {

        const id = req.params.id;

        await new sql.Request()

        .input("IdCita", sql.Int, id)

        .query(`
            UPDATE Citas
            SET Estado = 'Cancelada'
            WHERE IdCita = @IdCita
        `);

        res.json({
            message: "Cita cancelada correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al cancelar cita"
        });

    }

});
//editar cita
app.put('/api/citas/:id', async (req,res)=>{

    try{

        const { id } = req.params;

        const {
            idServicio,
            idEmpleado,
            fecha,
            hora
        } = req.body;

        await new sql.Request()

        .input("IdCita", sql.Int, id)
        .input("IdServicio", sql.Int, idServicio)
        .input("IdEmpleado", sql.Int, idEmpleado)
        .input("Fecha", sql.Date, fecha)
        .input("Hora", sql.VarChar, hora)

        .query(`
            UPDATE Citas
            SET
                IdServicio=@IdServicio,
                IdEmpleado=@IdEmpleado,
                Fecha=@Fecha,
                Hora=CAST(@Hora AS TIME)
            WHERE IdCita=@IdCita
        `);

        res.json({
            message:"Cita actualizada correctamente"
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:"Error al actualizar cita"
        });
    }
});
app.put('/api/citas/confirmar/:id', async (req, res) => {

    try {

        const id = req.params.id;

        await new sql.Request()

        .input("IdCita", sql.Int, id)

        .query(`
            UPDATE Citas
            SET Estado = 'Confirmada'
            WHERE IdCita = @IdCita
        `);

        res.json({
            message: "Cita confirmada correctamente"
        });

    } catch(error){

        console.error(error);

        res.status(500).json({
            message: "Error al confirmar cita"
        });

    }

});
app.put('/api/citas/completar/:id', async (req,res)=>{

    try{

        const id = req.params.id;

        await new sql.Request()

        .input("IdCita", sql.Int, id)

        .query(`
            UPDATE Citas
            SET Estado='Completada'
            WHERE IdCita=@IdCita
        `);

        res.json({
            message:"Cita completada"
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:"Error"
        });
    }
});
//perfil
app.get('/api/usuarios/:id', async (req,res)=>{

    try{

        const id = req.params.id;

        const result =
        await new sql.Request()

        .input("IdUsuario", sql.Int, id)

        .query(`
            SELECT
                Nombre,
                Correo,
                Telefono
            FROM Usuarios
            WHERE IdUsuario = @IdUsuario
        `);

        res.json(
            result.recordset[0]
        );

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:"Error"
        });
    }
});
//perfil actualizar
app.put('/api/usuarios/:id', async (req,res)=>{

    try{

        const id = req.params.id;

        const {
            nombre,
            correo,
            telefono,
            password
        } = req.body;

        if(!password){

    await new sql.Request()

    .input("IdUsuario", sql.Int, id)
    .input("Nombre", sql.VarChar, nombre)
    .input("Correo", sql.VarChar, correo)
    .input("Telefono", sql.VarChar, telefono)

    .query(`
        UPDATE Usuarios
        SET
            Nombre = @Nombre,
            Correo = @Correo,
            Telefono = @Telefono
        WHERE IdUsuario = @IdUsuario
    `);
}else{

    await new sql.Request()

    .input("IdUsuario", sql.Int, id)
    .input("Nombre", sql.VarChar, nombre)
    .input("Correo", sql.VarChar, correo)
    .input("Telefono", sql.VarChar, telefono)
    .input("Password", sql.VarChar, password)

    .query(`
        UPDATE Usuarios
        SET
            Nombre = @Nombre,
            Correo = @Correo,
            Telefono = @Telefono,
            Password = @Password
        WHERE IdUsuario = @IdUsuario
    `);
}res.json({
    message:
    "Perfil actualizado correctamente"
});

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:
            "Error al actualizar perfil"
        });
    }
});
app.get('/api/admin/dashboard', async (req, res) => {

    try {

        const citasHoy = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM Citas
            WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
        `);

        const clientes = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM Usuarios
        `);

        const servicios = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM Servicios
        `);

        const completadas = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM Citas
            WHERE Estado = 'Completada'
        `);

        res.json({
            citasHoy: citasHoy.recordset[0].total,
            clientes: clientes.recordset[0].total,
            servicios: servicios.recordset[0].total,
            ingresos: completadas.recordset[0].total
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error dashboard"
        });
    }
});
//admin clientes
app.get('/api/clientes', async (req, res) => {

    try {

        const result = await new sql.Request().query(`
            SELECT

                u.IdUsuario,
                u.Nombre,

                MAX(c.Fecha) AS UltimaCita

            FROM Usuarios u

            LEFT JOIN Citas c
                ON u.IdUsuario = c.IdUsuario
                 WHERE u.Rol <> 'administrador'

            GROUP BY

                u.IdUsuario,
                u.Nombre

            ORDER BY
                u.Nombre
        `);

        res.json(result.recordset);

    } catch(error){

        console.error(error);

        res.status(500).json({
            mensaje:"Error al obtener clientes"
        });

    }

});
//clientes admin modal
app.get('/api/clientes/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const result = await new sql.Request()

        .input("IdUsuario", sql.Int, id)

        .query(`
            SELECT

                u.Nombre,
                u.Correo,
                u.Telefono,

                COUNT(c.IdCita)
                AS TotalCitas

            FROM Usuarios u

            LEFT JOIN Citas c
                ON u.IdUsuario = c.IdUsuario

            WHERE u.IdUsuario = @IdUsuario

            GROUP BY

                u.Nombre,
                u.Correo,
                u.Telefono
        `);

        res.json(result.recordset[0]);

    } catch(error){

        console.error(error);

        res.status(500).json({
            mensaje:"Error"
        });
    }
});
//reportes admin
app.get('/api/reportes/resumen', async (req, res) => {

    try {

        const citasDia = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM Citas
            WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
        `);

        const clientes = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM dbo.Usuarios
        `);

        const servicios = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM Servicios
            WHERE Estado = 'Activo'
        `);

        const ingresos = await new sql.Request().query(`
            SELECT SUM(s.Precio) AS total
            FROM Citas c
            INNER JOIN Servicios s ON c.IdServicio = s.IdServicio
            WHERE c.Estado = 'Completada'
        `);

        res.json({
            citasDia: citasDia.recordset[0].total,
            clientes: clientes.recordset[0].total,
            servicios: servicios.recordset[0].total,
            ingresos: ingresos.recordset[0].total
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error en resumen reportes"
        });
    }
});
app.get('/api/reportes/servicios', async (req, res) => {

    try {

        const result = await new sql.Request().query(`
           SELECT 
    s.Nombre AS Servicio,
    COUNT(c.IdCita) AS Citas,
    SUM(s.Precio) AS Ingresos
FROM Servicios s
LEFT JOIN Citas c ON c.IdServicio = s.IdServicio
GROUP BY s.Nombre
ORDER BY Citas DESC
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error en servicios reportes"
        });
    }
});