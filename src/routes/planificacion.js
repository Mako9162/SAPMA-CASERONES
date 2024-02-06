const express = require('express');
const router = express.Router();
const pool = require('../database');
const path = require('path');
const fs = require('fs');
const { isLoggedIn } = require('../lib/auth');
const { authRole } = require('../lib/rol');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const moment = require('moment');
const multer = require('multer');
const upload = multer();
const hbs = require("handlebars");
const nodemailer = require('nodemailer');

const correo = "sapmadand@sercoing.cl";
const pass = "FL918,VoHvwE=za.";

const transporter = nodemailer.createTransport({
    host: "mail.sercoing.cl",
    port: 587,
    secure: false,
    auth: {
        user: correo,
        pass: pass,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

router.get('/ciclos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {
        // const ciclo_table= await pool.query("SELECT ciclo_id AS ID, ciclo_nombre AS NOMBRE, ciclo_tipotarea AS TTAREA, ciclo_tipoperiodo AS TPERIODO, ciclo_periodo AS PERIODO, ciclo_mantencion AS MANTENCION FROM Ciclos");
        const tareas = await pool.query("Select Id, Descripcion, Abreviacion FROM TipoProtocolo;");
        const tequipo = await pool.query("Select Id, Descripcion FROM TipoEquipo;");
        res.render('planificacion/ciclos', {
            tareas: tareas,
            tequipo: tequipo
        });
    } catch (err) {
        console.log(err);
    }

});

router.get('/ciclos_tequipo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {
        const tequipo = await pool.query("Select Id, Descripcion FROM TipoEquipo;");
        res.json(tequipo);
    } catch (err) {
        console.log(err);
    }

});

router.get('/ttareas', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const ttareas = await pool.query("Select Id, Descripcion, Abreviacion FROM TipoProtocolo;");
        res.json(ttareas);  // Envía directamente el array sin anidarlo en un objeto
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error al obtener los datos.' });
    }
});

router.post('/verificarNombre', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { nombre } = req.body;

    try {
        const resultado = await pool.query("SELECT COUNT(*) AS existe FROM Ciclos WHERE ciclo_nombre = ?;", [nombre]);
        res.json({ existe: resultado[0].existe > 0 });
    } catch (err) {
        console.log(err);
        res.json({ existe: false, error: err.message });
    }
});

router.post('/crear', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { base, dato1, dato2 } = req.body;
    const nombre = base.nombre;
    const tipo_equipo = base.tipo_equipo;

    var datofinal = [];

    if (dato2 === undefined) {
        const arrayDato1 = [dato1.tipo_tarea, dato1.periodo, dato1.periodicidad];
        datofinal.push(arrayDato1);
    } else {
        const arrayDato1 = [dato1.tipo_tarea, dato1.periodo, dato1.periodicidad];
        const arrayDato2 = dato2.map((elementoDato2) => {
            return [elementoDato2.tipo_tarea, elementoDato2.periodo, elementoDato2.periodicidad];
        });

        const resultadoarray = [arrayDato1, ...arrayDato2];
        datofinal = [...datofinal, ...resultadoarray]; // Utilizamos spread operator para aplanar el array
    }

    try {
        const insert = await pool.query("INSERT INTO Ciclos (ciclo_nombre, ciclo_tipo_equipo) VALUES (?,?);", [nombre, tipo_equipo], async (err, result) => {
            if (err) {
                console.log(err);
            } else {
                const new_id = result.insertId;
                const resultadoFinalConID = datofinal.map(subarray => [new_id, ...subarray]);

                for (const subarray of resultadoFinalConID) {
                    const [new_id, tipo_tarea, periodicidad, periodo] = subarray;

                    try {
                        const resultadoInsert = await pool.query(
                            "INSERT INTO Ciclos_detalle (c_detalle_id, c_detalle_ttarea, c_detalle_periodicidad, c_detalle_periodo) VALUES (?,?,?,?)",
                            [new_id, tipo_tarea, periodicidad, periodo]
                        );

                    } catch (error) {
                        console.error("Error al insertar en Ciclos_detalle:", error);
                    }
                }

                res.send("ok");
            }
        });

    } catch (err) {
        console.log(err);
    }
});

router.get('/lista_ciclos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {

        const lista = await pool.query(
            "SELECT\n" +
            "	C.ciclo_id AS ID,\n" +
            "	C.ciclo_nombre AS NOMBRE, \n" +
            "	TE.Descripcion AS TIPO\n" +
            "FROM\n" +
            "	Ciclos C\n" +
            "	INNER JOIN TipoEquipo TE ON TE.Id = C.ciclo_tipo_equipo;");

        res.render('planificacion/lista_ciclos', {
            lista: lista
        });

    } catch (error) {

        console.log(error);

    }

});

router.post('/eliminar_ciclo/:Id', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {
        const { Id } = req.params;

        const borrar_detalle = await pool.query("DELETE FROM Ciclos_detalle WHERE c_detalle_id IN (?);", [Id]);
        const borrar_ciclo = await pool.query("DELETE FROM Ciclos WHERE ciclo_id IN (?);", [Id]);

        res.send("ok");
    } catch (error) {
        console.log(error);
    }
});

router.get('/obtenerDetallesCiclo/:Id', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {

        const { Id } = req.params
        const detallesCiclo = await pool.query(
            "SELECT\n" +
            "	C.ciclo_id AS ID,\n" +
            "	C.ciclo_nombre AS NOMBRE,\n" +
            "	TE.Descripcion AS TIPO_EQUIPO,\n" +
            "	TP.ID AS IDTP,\n" +
            "	CONCAT( TP.Descripcion, ' - ', TP.Abreviacion ) AS TIPO_ABREVIADO,\n" +
            "	CD.c_detalle_periodicidad AS PERIODICIDAD,\n" +
            "	CD.c_detalle_periodo AS PERIODO \n" +
            "FROM\n" +
            "	Ciclos_detalle CD\n" +
            "	INNER JOIN Ciclos C ON C.ciclo_id = CD.c_detalle_id\n" +
            "	INNER JOIN TipoProtocolo TP ON TP.Id = CD.c_detalle_ttarea \n" +
            "	INNER JOIN TipoEquipo TE ON TE.Id =  C.ciclo_tipo_equipo\n" +
            "WHERE\n" +
            "	C.ciclo_id = ?;", [Id]
        );
        res.json(detallesCiclo);
    } catch (error) {

        console.log(error);
        res.status(500).send("Error al obtener detalles del ciclo.");
    }
});

router.get('/edit_ciclo/:Id', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {
        const { Id } = req.params;

        const ciclo = await pool.query("SELECT\n" +
            "	C.ciclo_id AS ID,\n" +
            "	C.ciclo_nombre AS NOMBRE,\n" +
            "	TE.Id AS IDTE,\n" +
            "	TE.Descripcion AS TIPO_EQUIPO,\n" +
            "	TP.Id AS IDTP,\n" +
            "	CONCAT(TP.Descripcion,' - ',TP.Abreviacion) AS TTAREA,\n" +
            "	CD.c_detalle_periodicidad AS PERIODO,\n" +
            "	CD.c_detalle_periodo AS CICLO \n" +
            "FROM\n" +
            "	Ciclos C\n" +
            "	INNER JOIN Ciclos_detalle CD ON CD.c_detalle_id = C.ciclo_id\n" +
            "	INNER JOIN TipoEquipo TE ON TE.Id = C.ciclo_tipo_equipo\n" +
            "	INNER JOIN TipoProtocolo TP ON TP.Id = CD.c_detalle_ttarea\n" +
            "WHERE\n" +
            "	C.ciclo_id = ?", [Id]);

        const tequipo = await pool.query("Select Id, Descripcion FROM TipoEquipo;");
        const prot = await pool.query("Select Id AS ID, CONCAT(Descripcion,' - ',Abreviacion) AS TIPO_ABREVIACION FROM TipoProtocolo;");

        res.json({
            ciclo,
            tequipo,
            prot
        });
    } catch (error) {
        console.log(error);
    }

});

router.post('/eliminar_fila', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { idDetalle, tareaDetalle, periodicidadDetalle, periodoDetalle } = req.body;

    try {
        const prot = await pool.query(
            "SELECT Id FROM TipoProtocolo WHERE CONCAT(Descripcion, ' - ', Abreviacion) = ?",
            [tareaDetalle]
        );

        const tarea = prot[0].Id;

        const borrar = await pool.query("DELETE \n" +
            "FROM\n" +
            "	Ciclos_detalle \n" +
            "WHERE\n" +
            "	c_detalle_id = ? \n" +
            "	AND c_detalle_ttarea = ?\n" +
            "	AND c_detalle_periodicidad = ? \n" +
            "	AND c_detalle_periodo = ?;", [idDetalle, tarea, periodicidadDetalle, periodoDetalle]);

        res.send("ok");

    } catch (error) {
        console.log(error);
    }
});

router.post('/editar_fila', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id_fila, tareaDetalle_fila, periodicidadDetalle_fila, periodoDetalle_fila, tipo_protocolo, periodicidad, periodo } = req.body;

    try {
        const prot = await pool.query(
            "SELECT Id FROM TipoProtocolo WHERE CONCAT(Descripcion, ' - ', Abreviacion) = ?",
            [tareaDetalle_fila]
        );

        const tarea = prot[0].Id;

        const act = await pool.query(
            "UPDATE Ciclos_detalle SET c_detalle_ttarea = ?, c_detalle_periodicidad = ?, c_detalle_periodo = ? WHERE c_detalle_id = ? AND c_detalle_ttarea = ? AND c_detalle_periodicidad = ? AND c_detalle_periodo = ?",
            [tipo_protocolo, periodicidad, periodo, id_fila, tarea, periodicidadDetalle_fila, periodoDetalle_fila]
        );

        res.send("ok");
    } catch (error) {
        console.log(error);
    }

});

router.post('/actualizar', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id, nombre, tipo_equipo } = req.body;

    try {
        const act = await pool.query("UPDATE Ciclos SET ciclo_nombre = ?, ciclo_tipo_equipo = ?   WHERE ciclo_id = ?;", [nombre, tipo_equipo, id]);
        res.send("ok");
    } catch (error) {
        console.log(error);
    }
});

router.post('/insert_fila', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id, tipo_protocolo, periodicidad, periodo } = req.body;

    try {

        const totalIdsOtraTabla = await pool.query('SELECT COUNT(DISTINCT Id) AS count FROM TipoProtocolo;');
        const totalIdsIngresados = await pool.query('SELECT COUNT(DISTINCT c_detalle_ttarea) AS count FROM Ciclos_detalle WHERE c_detalle_id = ?;', [id]);

        if (totalIdsIngresados[0].count >= totalIdsOtraTabla[0].count) {
            return res.status(400).json({ error: 'Se han ingresado todos los items permitidos para este ciclo.' });
        }

        const existeId = await pool.query('SELECT COUNT(*) AS count FROM Ciclos_detalle WHERE c_detalle_id = ? AND c_detalle_ttarea = ?', [id, tipo_protocolo]);

        if (existeId[0].count > 0) {
            return res.status(400).json({ error: 'Este item ya existe en el ciclo' });
        }

        await pool.query('INSERT INTO Ciclos_detalle (c_detalle_id, c_detalle_ttarea, c_detalle_periodicidad, c_detalle_periodo) VALUES (?, ?, ?, ?)',
            [id, tipo_protocolo, periodicidad, periodo]);

        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

router.post('/duplicar', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { id_duplicar, nombre, tipo_equipo } = req.body;

    try {
        const antiguo = await pool.query("SELECT\n" +
            "c_detalle_ttarea AS IDTP,\n" +
            "c_detalle_periodicidad AS PERIODICIDAD,\n" +
            "c_detalle_periodo AS PERIODO\n" +
            "FROM\n" +
            "Ciclos_detalle CD\n" +
            "WHERE\n" +
            "CD.c_detalle_id = ?;", [id_duplicar]);

        const nuevo = await pool.query("INSERT INTO Ciclos (ciclo_nombre, ciclo_tipo_equipo) VALUES (?,?);", [nombre, tipo_equipo]);

        const new_id = nuevo.insertId;

        const nuevoArray = antiguo.map(fila => [new_id, fila.IDTP, fila.PERIODICIDAD, fila.PERIODO]);

        const nuevo_antiguo = await pool.query(
            "INSERT INTO Ciclos_detalle (c_detalle_id, c_detalle_ttarea, c_detalle_periodicidad, c_detalle_periodo) VALUES ?",
            [nuevoArray]
        );

        res.send("ok");

    } catch (error) {
        console.log(error);
    }
});

router.get('/equipos_plan', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { Id_Cliente } = req.user;

    const gerencias = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = ' + Id_Cliente + ' GROUP BY vcgas_idGerencia ');

    const ciclo = await pool.query("SELECT\n" +
        "ciclo_id AS ID,\n" +
        "ciclo_nombre AS NOMBRE,\n" +
        "ciclo_tipo_equipo AS TTEQUIPO\n" +
        "FROM\n" +
        "Ciclos;");
    res.render('planificacion/asignacion_equipos',

        {
            gerencias: gerencias,
            ciclo: ciclo
        }
    );

});

router.get('/get_datapla', function (request, response, next) {

    const type = request.query.type;

    const search_query = request.query.parent_value;

    if (type == 'load_areass') {
        var query = `
SELECT DISTINCT vcgas_idArea AS Id, vcgas_areaN AS Data FROM VIEW_equiposCteGerAreSec
WHERE vcgas_idGerencia = '${search_query}'
ORDER BY vcgas_areaN ASC
`;
    }

    if (type == 'load_sectoress') {
        var query = `
SELECT DISTINCT vcgas_idSector AS Id, vcgas_sectorN AS Data FROM VIEW_equiposCteGerAreSec
WHERE vcgas_idArea = '${search_query}' 
ORDER BY vcgas_sectorN ASC
`;
    }

    if (type == 'load_equiposs') {
        var query = `
SELECT DISTINCT vce_idEquipo AS Id, vce_codigo AS Data FROM VIEW_equiposCteGerAreSec 
WHERE vcgas_idSector = '${search_query}' 
ORDER BY vce_codigo ASC
`;
    }


    pool.query(query, function (error, data) {

        const data_arr = [];

        data.forEach(function (row) {
            data_arr.push([row.Id, row.Data]);
        });

        response.json(data_arr);

    });

});

router.post('/buscar_plan', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { gerencia, area, sector, equipo } = req.body;

    const { Id_Cliente } = req.user;

    try {

        if (gerencia > 0 && !area && !sector && !equipo) {

            const ger_equi = await pool.query("SELECT\n" +
                "	E.Id AS ID,\n" +
                "	E.Codigo AS CODIGO,\n" +
                "	TP.Id AS IDTP,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	G.Descripcion AS GER,\n" +
                "	A.Descripcion AS AREA,\n" +
                "	S.Descripcion AS SECTOR,\n" +
                "	C.ciclo_nombre AS CICLO \n" +
                "FROM\n" +
                "	Equipos E\n" +
                "	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
                "	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
                "	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo\n" +
                "	INNER JOIN Ciclo_equipos CE ON CE.equipo_id = E.Id\n" +
                "	LEFT JOIN Ciclos C ON C.ciclo_id = CE.equipo_ciclo\n" +
                "WHERE\n" +
                "	G.Id = ? AND G.Id_Cliente = 28", [gerencia]);

            if (!ger_equi) {
                res.json({ title: "Sin Información." });
            } else {
                res.json(ger_equi);
            }

        } else if (gerencia > 0 && area > 0 && !sector && !equipo) {

            const area_equi = await pool.query("SELECT\n" +
                "	E.Id AS ID,\n" +
                "	E.Codigo AS CODIGO,\n" +
                "	TP.Id AS IDTP,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	G.Descripcion AS GER,\n" +
                "	A.Descripcion AS AREA,\n" +
                "	S.Descripcion AS SECTOR,\n" +
                "	C.ciclo_nombre AS CICLO \n" +
                "FROM\n" +
                "	Equipos E\n" +
                "	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
                "	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
                "	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo\n" +
                "	INNER JOIN Ciclo_equipos CE ON CE.equipo_id = E.Id\n" +
                "	LEFT JOIN Ciclos C ON C.ciclo_id = CE.equipo_ciclo\n" +
                "WHERE\n" +
                "	A.Id = ? AND G.Id_Cliente = 28", [area]);

            if (!area_equi) {
                res.json({ title: "Sin Información." });
            } else {
                res.json(area_equi);
            }

        } else if (gerencia > 0 && area > 0 && sector > 0 && !equipo) {

            const sec_equi = await pool.query("SELECT\n" +
                "	E.Id AS ID,\n" +
                "	E.Codigo AS CODIGO,\n" +
                "	TP.Id AS IDTP,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	G.Descripcion AS GER,\n" +
                "	A.Descripcion AS AREA,\n" +
                "	S.Descripcion AS SECTOR,\n" +
                "	C.ciclo_nombre AS CICLO \n" +
                "FROM\n" +
                "	Equipos E\n" +
                "	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
                "	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
                "	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo\n" +
                "	INNER JOIN Ciclo_equipos CE ON CE.equipo_id = E.Id\n" +
                "	LEFT JOIN Ciclos C ON C.ciclo_id = CE.equipo_ciclo\n" +
                "WHERE\n" +
                "	E.Id_Sector = ? AND G.Id_Cliente = 28", [sector]);

            if (!sec_equi) {
                res.json({ title: "Sin Información." });
            } else {
                res.json(sec_equi);
            }

        } else if (equipo > 0 && area > 0 && sector > 0 && equipo > 0) {

            const equi_equi = await pool.query("SELECT\n" +
                "	E.Id AS ID,\n" +
                "	E.Codigo AS CODIGO,\n" +
                "	TP.Id AS IDTP,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	G.Descripcion AS GER,\n" +
                "	A.Descripcion AS AREA,\n" +
                "	S.Descripcion AS SECTOR,\n" +
                "	C.ciclo_nombre AS CICLO \n" +
                "FROM\n" +
                "	Equipos E\n" +
                "	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
                "	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
                "	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo\n" +
                "	INNER JOIN Ciclo_equipos CE ON CE.equipo_id = E.Id\n" +
                "	LEFT JOIN Ciclos C ON C.ciclo_id = CE.equipo_ciclo\n" +
                "WHERE\n" +
                "	E.Id = ? AND G.Id_Cliente = 28", [equipo]);

            if (!equi_equi) {
                res.json({ title: "Sin Información." });
            } else {
                res.json(equi_equi);
            }

        } else if (!gerencia && !area && !sector && !equipo) {

            const equi_equi = await pool.query("SELECT\n" +
                "	E.Id AS ID,\n" +
                "	E.Codigo AS CODIGO,\n" +
                "	TP.Id AS IDTP,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	G.Descripcion AS GER,\n" +
                "	A.Descripcion AS AREA,\n" +
                "	S.Descripcion AS SECTOR,\n" +
                "	C.ciclo_nombre AS CICLO \n" +
                "FROM\n" +
                "	Equipos E\n" +
                "	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
                "	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
                "	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo\n" +
                "	INNER JOIN Ciclo_equipos CE ON CE.equipo_id = E.Id\n" +
                "	LEFT JOIN Ciclos C ON C.ciclo_id = CE.equipo_ciclo\n" +
                "WHERE\n" +
                "	G.Id_Cliente = 28");


            if (!equi_equi) {
                res.json({ title: "Sin Información." });
            } else {
                res.json(equi_equi);
            }
        }


    } catch (err) {

        console.log(err);

    }
});

router.post('/detalle_ciclo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const detalle = await pool.query("SELECT ciclo_id AS ID, ciclo_nombre AS DETALLE, ciclo_tipo_equipo AS EQUIPO FROM Ciclos;");

        res.json(detalle);

    } catch (error) {
        console.log(error);
    }
});

router.post('/asigna_ciclo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const info = req.body;

    let idsSeleccionados;
    let idCiclo;

    const transformedInfo = info.map(([idSeleccionado, valorSelect, ciclo]) => ({
        idsSeleccionados: idSeleccionado,
        idCiclo: ciclo
    }));

    try {
        for (const { idsSeleccionados, idCiclo } of transformedInfo) {
            await pool.query("UPDATE Ciclo_equipos SET equipo_ciclo = ? WHERE equipo_id = ?;", [idCiclo, idsSeleccionados]);
        }

        res.send("ok");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error interno del servidor");
    }
});

router.get('/planificacion_equipos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { Id_Cliente } = req.user;

    const maximo = req.app.locals.maximo;

    const gerencias = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = ' + Id_Cliente + ' GROUP BY vcgas_idGerencia ');

    const ciclo = await pool.query("SELECT\n" +
        "ciclo_id AS ID,\n" +
        "ciclo_nombre AS NOMBRE,\n" +
        "ciclo_tipo_equipo AS TTEQUIPO\n" +
        "FROM\n" +
        "Ciclos;");

    const tecnicos = await pool.query("SELECT\n" +
        "	U.Id AS ID,\n" +
        "	U.Login AS LOGIN \n" +
        "FROM\n" +
        "	Usuarios U\n" +
        "	INNER JOIN Perfiles P ON P.Id = U.Id_Perfil\n" +
        "WHERE\n" +
        "	U.Id_Perfil=3 AND U.Id_Cliente = 28 AND NOT Login LIKE '%test%';");

    const tipo_tareas = await pool.query("SELECT\n" +
        "	Descripcion AS DESCRIPCION,\n" +
        "	Indice AS ORDEN \n" +
        "FROM\n" +
        "	TipoProtocolo\n" +
        "ORDER BY Indice ASC;");

    res.render('planificacion/planificacion_equipos',

        {
            gerencias: gerencias,
            ciclo: ciclo,
            maximo: maximo,
            tecnicos: tecnicos,
            tipo_tareas: tipo_tareas
        }
    );

});

router.post('/verificar', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { fecha_inicial, fecha_final, idsSeleccionados } = req.body;

    try {

        const verificacion = await pool.query(
            "SELECT\n" +
            "	T.Id AS ID,\n" +
            "	T.Fecha AS FECHA,\n" +
            "	U.Login AS TECNICO,\n" +
            "	E.Descripcion AS ESTADO,\n" +
            "	EQ.Codigo AS EQUIPO,\n" +
            "	P.Descripcion AS PROTOCOLO\n" +
            "FROM\n" +
            "	Tareas T\n" +
            "	INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
            "	INNER JOIN Estados E ON E.Id = T.Id_Estado\n" +
            "	INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo\n" +
            "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
            "WHERE\n" +
            "	T.Id_Equipo IN (?)\n" +
            "   AND T.Id_Estado IN (1,2)\n" +
            "	AND T.Fecha BETWEEN ? AND ?;", [idsSeleccionados, fecha_inicial, fecha_final]);

        res.json(verificacion);

    } catch (error) {
        console.log(error);
    }

});

router.get('/configuracion_planificacion', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const maximo = req.app.locals.maximo;

    const tipo_tareas = await pool.query("SELECT\n" +
        "	Descripcion AS DESCRIPCION,\n" +
        "	Indice AS ORDEN \n" +
        "FROM\n" +
        "	TipoProtocolo\n" +
        "ORDER BY Indice ASC;");

    res.render('planificacion/configuracion_plan',

        {
            maximo: maximo,
            tipo_tareas: tipo_tareas
        }
    );

});

router.post('/actualizamaximo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const nuevoMaximo = req.body.nuevoMaximo;
    try {
        const dir = path.resolve(__dirname, "../maximo.txt")
        fs.writeFileSync(dir, nuevoMaximo);
        res.send("ok");
    } catch (error) {
        console.log(error);
    }

});

router.post('/act_prioridad', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { nuevoOrdenYDescripcion } = req.body;

    try {
        for (const item of nuevoOrdenYDescripcion) {
            const { orden, descripcion } = item;
            await pool.query(
                "UPDATE TipoProtocolo SET Indice = ? WHERE Descripcion = ?",
                [orden, descripcion]
            );
        }
        res.send("ok");
    } catch (error) {
        console.log(error);
    }
});

router.post('/verificar_tareas', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {
        const { date1, ano1, date2, ano2, tecnico, valoresColumnas } = req.body;
        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');

        const cuenta = await pool.query("SELECT COUNT(*) as total FROM Tareas WHERE Fecha BETWEEN ? AND ?;",
            [fechaInicial, fechaFinal]);
        const total = cuenta[0].total;

        if (total === 0) {
            res.send("cuenta_negativa")
        } else {
            res.send("cuenta_positiva");
        }

    } catch (error) {
        console.log(error);
    }

});

router.post('/verificar_tareas1', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {
        const { date1, ano1, date2, ano2, tecnico, valoresColumnas } = req.body;
        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');
        const valores = valoresColumnas.map(function (row) {
            return row.ID;
        });

        const ids = [valores];
        const verificacion = await pool.query(`
SELECT
EP.ep_id_equipo AS ID_EQUIPO,
EP.ep_id_tipo_protocolo AS TIPO_PROTOCOLO,
EP.ep_id_protocolo AS PROTOCOLO,
CD.c_detalle_id AS ID_CICLO,
CD.c_detalle_periodicidad AS PERIODICIDAD,
CD.c_detalle_periodo AS PERIODO,
TP.Indice AS INDICE
FROM
EquipoProtocolo EP
JOIN Ciclo_equipos CE ON CE.equipo_id = EP.ep_id_equipo
JOIN Ciclos_detalle CD ON CD.c_detalle_id = CE.equipo_ciclo
AND CD.c_detalle_ttarea = EP.ep_id_tipo_protocolo
JOIN TipoProtocolo TP ON TP.Id = EP.ep_id_tipo_protocolo
WHERE
EP.ep_id_equipo IN ? ORDER BY TP.Indice ASC;`, [ids]);

        const resultadoConTecnico = verificacion.map(item => ({ ...item, tecnico }));

        const gruposPorIndice = resultadoConTecnico.reduce((grupos, item) => {
            const indice = item.INDICE;

            if (!grupos[indice]) {
                grupos[indice] = [];
            }

            grupos[indice].push(item);

            return grupos;
        }, {});

        const arraysDeGrupos = Object.values(gruposPorIndice);
        const arrayverifi = arraysDeGrupos[0];

        const resultadoFinal = arrayverifi.flatMap(item => {
            const fechas = [];
            const fechaActual = moment(fechaInicial);

            while (fechaActual.isSameOrBefore(fechaFinal)) {
                let dayToConsider = Math.min(fechaActual.date(), 28);

                fechas.push({ ...item, fecha: fechaActual.set('date', dayToConsider).format('YYYY-MM-DD') });

                switch (item.PERIODICIDAD) {
                    case 'Diario':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'days');
                        break;
                    case 'Semanal':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'weeks');
                        break;
                    case 'Mensual':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'months');
                        break;
                    case 'Anual':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'years');
                        break;
                    default:
                        break;
                }
            }

            return fechas;
        });

        const final = resultadoFinal.map(item => ({
            ID_EQUIPO: item.ID_EQUIPO,
            fecha: item.fecha
        }));

        let existeTarea = false;

        for (const item of final) {
            try {
                const countQuery = await pool.query("SELECT COUNT(*) as count FROM Tareas WHERE Fecha = ? AND Id_Equipo = ?", [item.fecha, item.ID_EQUIPO]);
                const countResult = countQuery[0].count;

                if (countResult > 0) {
                    existeTarea = true;
                    break;
                }
            } catch (error) {
                console.error(`Error al ejecutar la consulta COUNT para el equipo ${item.ID_EQUIPO} y la fecha ${item.fecha}:`, error);
            }
        }

        if (existeTarea) {
            res.send("positiva");
        } else {
            res.send("negativa");
        }

        function getPeriodoValue(periodo) {
            switch (periodo) {
                case 'TLD':
                    return 1;
                case 'TLS':
                    return 1;
                case 'TLM':
                    return 1;
                case 'TLA':
                    return 1;
                default:
                    return parseInt(periodo) || 1;
            }
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/verificar_tareas2', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {

        const maximo = req.app.locals.maximo;
        const { date1, ano1, date2, ano2, tecnico, valoresColumnas } = req.body;
        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');
        const valores = valoresColumnas.map(function (row) {
            return row.ID;
        });

        const ids = [valores];
        const verificacion = await pool.query(`
SELECT
EP.ep_id_equipo AS ID_EQUIPO,
EP.ep_id_tipo_protocolo AS TIPO_PROTOCOLO,
EP.ep_id_protocolo AS PROTOCOLO,
CD.c_detalle_id AS ID_CICLO,
CD.c_detalle_periodicidad AS PERIODICIDAD,
CD.c_detalle_periodo AS PERIODO,
TP.Indice AS INDICE
FROM
EquipoProtocolo EP
JOIN Ciclo_equipos CE ON CE.equipo_id = EP.ep_id_equipo
JOIN Ciclos_detalle CD ON CD.c_detalle_id = CE.equipo_ciclo
AND CD.c_detalle_ttarea = EP.ep_id_tipo_protocolo
JOIN TipoProtocolo TP ON TP.Id = EP.ep_id_tipo_protocolo
WHERE
EP.ep_id_equipo IN ? ORDER BY TP.Indice ASC;`, [ids]);

        const resultadoConTecnico = verificacion.map(item => ({ ...item, tecnico }));

        const gruposPorIndice = resultadoConTecnico.reduce((grupos, item) => {
            const indice = item.INDICE;

            if (!grupos[indice]) {
                grupos[indice] = [];
            }

            grupos[indice].push(item);

            return grupos;
        }, {});

        const arraysDeGrupos = Object.values(gruposPorIndice);
        const arrayverifi = arraysDeGrupos[0];

        const resultadoFinal = arrayverifi.flatMap(item => {
            const fechas = [];
            const fechaActual = moment(fechaInicial);

            while (fechaActual.isSameOrBefore(fechaFinal)) {
                let dayToConsider = Math.min(fechaActual.date(), 28);

                fechas.push({ ...item, fecha: fechaActual.set('date', dayToConsider).format('YYYY-MM-DD') });

                switch (item.PERIODICIDAD) {
                    case 'Diario':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'days');
                        break;
                    case 'Semanal':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'weeks');
                        break;
                    case 'Mensual':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'months');
                        break;
                    case 'Anual':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'years');
                        break;
                    default:
                        break;
                }
            }

            return fechas;
        });

        const final = resultadoFinal.map(item => ({
            ID_EQUIPO: item.ID_EQUIPO,
            fecha: item.fecha
        }));

        let existeTarea = false;

        for (const item of final) {
            try {
                const countQuery = await pool.query("SELECT COUNT(*) as count FROM Tareas WHERE Fecha = ?", [item.fecha]);
                const countResult = countQuery[0].count;

                if (countResult > maximo) {
                    existeTarea = true;
                    break;
                }
            } catch (error) {
                console.error(`Error al ejecutar la consulta COUNT para el equipo ${item.ID_EQUIPO} y la fecha ${item.fecha}:`, error);
            }
        }

        if (existeTarea) {
            res.send("pasado")
        } else {
            res.send("no pasado")
        }

        function getPeriodoValue(periodo) {
            switch (periodo) {
                case 'TLD':
                    return 1;
                case 'TLS':
                    return 1;
                case 'TLM':
                    return 1;
                case 'TLA':
                    return 1;
                default:
                    return parseInt(periodo) || 1;
            }
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/crear_plan', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    try {

        const { usuario } = req.user;
        const { date1, ano1, date2, ano2, tecnico, valoresColumnas } = req.body;
        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');
        const valores = valoresColumnas.map(function (row) {
            return row.ID;
        });

        const ids = [valores];
        const verificacion = await pool.query(`
SELECT
EP.ep_id_equipo AS ID_EQUIPO,
EP.ep_id_tipo_protocolo AS TIPO_PROTOCOLO,
EP.ep_id_protocolo AS PROTOCOLO,
CD.c_detalle_id AS ID_CICLO,
CD.c_detalle_periodicidad AS PERIODICIDAD,
CD.c_detalle_periodo AS PERIODO,
TP.Indice AS INDICE
FROM
EquipoProtocolo EP
JOIN Ciclo_equipos CE ON CE.equipo_id = EP.ep_id_equipo
JOIN Ciclos_detalle CD ON CD.c_detalle_id = CE.equipo_ciclo
AND CD.c_detalle_ttarea = EP.ep_id_tipo_protocolo
JOIN TipoProtocolo TP ON TP.Id = EP.ep_id_tipo_protocolo
WHERE
EP.ep_id_equipo IN ? ORDER BY TP.Indice ASC;`, [ids]);

        const resultadoConTecnico = verificacion.map(item => ({ ...item, tecnico }));

        const gruposPorIndice = resultadoConTecnico.reduce((grupos, item) => {
            const indice = item.INDICE;

            if (!grupos[indice]) {
                grupos[indice] = [];
            }

            grupos[indice].push(item);

            return grupos;
        }, {});

        const arraysDeGrupos = Object.values(gruposPorIndice);
        const arrayverifi = arraysDeGrupos[0];

        const resultadoFinal = arrayverifi.flatMap(item => {
            const fechas = [];
            const fechaActual = moment(fechaInicial);

            while (fechaActual.isSameOrBefore(fechaFinal)) {
                let dayToConsider = Math.min(fechaActual.date(), 28);

                fechas.push({ ...item, fecha: fechaActual.set('date', dayToConsider).format('YYYY-MM-DD') });

                switch (item.PERIODICIDAD) {
                    case 'Diario':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'days');
                        break;
                    case 'Semanal':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'weeks');
                        break;
                    case 'Mensual':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'months');
                        break;
                    case 'Anual':
                        fechaActual.add(getPeriodoValue(item.PERIODO), 'years');
                        break;
                    default:
                        break;
                }
            }

            return fechas;
        });

        const final = resultadoFinal.map(item => ({
            Fecha: item.fecha,
            Id_Tecnico: item.tecnico,
            Id_Equipo: item.ID_EQUIPO,
            Id_Protocolo: item.PROTOCOLO
        }));

        const insertIds = [];

        for (const item of final) {
            try {
                const result = await pool.query('INSERT INTO Tareas (Fecha, Id_Tecnico, Id_Equipo, Id_Protocolo, Contingente, Prueba) VALUES (?,?,?,?,?,?)', [item.Fecha, item.Id_Tecnico, item.Id_Equipo, item.Id_Protocolo, 0, 0]);
                insertIds.push(result.insertId);
            } catch (error) {
                console.error(`Error al insertar en Tareas: ${error}`);
            }
        }

        try {
            const updateTareas = await pool.query("UPDATE Tareas_Validacion SET Tv_usuario = ?, Tv_metodo = ? WHERE Tv_Id_Tarea IN (?);", [usuario, "C", insertIds]);
        } catch (error) {
            console.error(`Error al actualizar Tareas_Estado: ${error}`);
        }

        const tareas = await pool.query(
            "SELECT\n" +
            "	T.Id AS ID,\n" +
            "	DATE_FORMAT(T.Fecha, '%Y-%m-%d') AS FECHA,\n" +
            "	Id_Equipo AS EQUIPO\n" +
            "FROM\n" +
            "	Tareas T\n" +
            "WHERE\n" +
            "	T.Id IN (?)\n" +
            "ORDER BY T.Fecha ASC;", [insertIds]);

        const arrayverifi1 = arraysDeGrupos[1];

        if (typeof arrayverifi1 === 'undefined') {

            const tareasfinal = await pool.query(
                "SELECT\n" +
                "	T.Id AS ID,\n" +
                "	DATE_FORMAT(T.Fecha, '%Y-%m-%d') AS FECHA,\n" +
                "	U.Descripcion AS TECNICO,\n" +
                "	E.Descripcion AS ESTADO,\n" +
                "	EQ.Codigo AS EQUIPO,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	P.Descripcion AS PROTOCOLO \n" +
                "FROM\n" +
                "	Tareas T\n" +
                "	INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
                "	INNER JOIN Estados E ON E.Id = T.Id_Estado\n" +
                "	INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo\n" +
                "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo \n" +
                "	INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
                "WHERE\n" +
                "	T.Id IN (?)\n" +
                "ORDER BY T.Fecha ASC;", [insertIds]);

            var info = [];

            for (var i = 0; i < tareasfinal.length; i++) {
                info.push({
                    Tarea: tareasfinal[i].ID,
                    Fecha: tareasfinal[i].FECHA,
                    Técnico: tareasfinal[i].TECNICO,
                    Estado: tareasfinal[i].ESTADO,
                    TAG: tareasfinal[i].EQUIPO,
                    Tipo_de_Protocolo: tareasfinal[i].TIPO,
                    Protocolo: tareasfinal[i].PROTOCOLO,
                    Creado_por: usuario
                });
            }

            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.json_to_sheet(info);

            var range = XLSX.utils.decode_range(ws['!ref']);
            var colWidths = [];
            for (var col = range.s.c; col <= range.e.c; col++) {
                var maxWidth = 0;
                for (var row = range.s.r; row <= range.e.r; row++) {
                    var cell_address = { c: col, r: row };
                    var cell_ref = XLSX.utils.encode_cell(cell_address);
                    var cell = ws[cell_ref];
                    if (cell) {
                        var cellValue = cell.v.toString();
                        if (cellValue.length > maxWidth) {
                            maxWidth = cellValue.length;
                        }
                    }
                }
                colWidths.push({ wch: maxWidth });
            }

            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws);

            var buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            const datemail = new Date().toLocaleDateString('en-GB');
            const filePathName1 = path.resolve(__dirname, "../views/email/tareas.hbs");
            const mensaje = fs.readFileSync(filePathName1, "utf8");
            const template = hbs.compile(mensaje);
            const context = {
                datemail,
            };
            const html = template(context);
            const email_plan = await pool.query(
                "SELECT\n" +
                "	U.Id,\n" +
                "	U.Email \n" +
                "FROM\n" +
                "	Usuarios U \n" +
                "WHERE\n" +
                "	U.Id_Perfil = 2 \n" +
                "	AND U.Id_Cliente = 1 \n" +
                "	AND U.Activo = 1;"
            );
            const { Email } = req.user;
            await transporter.sendMail({
                from: "SAPMA <sapmadandd@sercoing.cl>",
                // to: "marancibia@sercoing.cl",
                to: [email_plan, Email],
                bcc: "sapmadand@sercoing.cl",
                subject: "SAPMA - Tareas Creadas",
                html,
                attachments: [
                    {
                        filename: "imagen1.png",
                        path: "./src/public/img/imagen1.png",
                        cid: "imagen1",

                    },
                    {
                        filename: 'tareas_' + datemail + '.xlsx',
                        content: buffer
                    }
                ],
            });
            res.send("ok");

        } else {

            const periodo = parseInt(arrayverifi1[0].PERIODO);
            const toleranciaDias = 10;

            const fechasInicialesExcluidas = fechaInicial;

            const tareasCumplenPeriodo = tareas.filter((tarea, index) => {
                const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM');
                const fechaTarea = moment(tarea.FECHA);
                const diferenciaDias = fechaTarea.diff(fechaInicial, 'days');

                return diferenciaDias >= 0 &&
                    !fechasInicialesExcluidas.includes(tarea.FECHA) &&
                    (diferenciaDias % periodo <= toleranciaDias || (periodo - diferenciaDias % periodo) <= toleranciaDias);
            });

            const tareasCumplenPeriodoConProtocolo = tareasCumplenPeriodo.map(tarea => {
                const equipoInfo = arrayverifi1.find(info => info.ID_EQUIPO === tarea.EQUIPO);

                if (equipoInfo) {
                    return {
                        ID: tarea.ID,
                        PROTOCOLO: equipoInfo.PROTOCOLO,
                    };
                }

                return tarea;
            });

            for (const tarea of tareasCumplenPeriodoConProtocolo) {
                try {
                    await pool.query('UPDATE Tareas SET Id_Protocolo = ? WHERE Id = ?', [tarea.PROTOCOLO, tarea.ID]);
                } catch (error) {
                    console.error(`Error al actualizar la tarea con ID ${tarea.ID}: ${error}`);
                }
            }

            const tareasfinal = await pool.query(
                "SELECT\n" +
                "	T.Id AS ID,\n" +
                "	DATE_FORMAT(T.Fecha, '%Y-%m-%d') AS FECHA,\n" +
                "	U.Descripcion AS TECNICO,\n" +
                "	E.Descripcion AS ESTADO,\n" +
                "	EQ.Codigo AS EQUIPO,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	P.Descripcion AS PROTOCOLO \n" +
                "FROM\n" +
                "	Tareas T\n" +
                "	INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
                "	INNER JOIN Estados E ON E.Id = T.Id_Estado\n" +
                "	INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo\n" +
                "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo \n" +
                "	INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
                "WHERE\n" +
                "	T.Id IN (?)\n" +
                "ORDER BY T.Fecha ASC;", [insertIds]);

            var info = [];

            for (var i = 0; i < tareasfinal.length; i++) {
                info.push({
                    Tarea: tareasfinal[i].ID,
                    Fecha: tareasfinal[i].FECHA,
                    Técnico: tareasfinal[i].TECNICO,
                    Estado: tareasfinal[i].ESTADO,
                    TAG: tareasfinal[i].EQUIPO,
                    Tipo_de_Protocolo: tareasfinal[i].TIPO,
                    Protocolo: tareasfinal[i].PROTOCOLO,
                    Creado_por: usuario
                });
            }

            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.json_to_sheet(info);

            var range = XLSX.utils.decode_range(ws['!ref']);
            var colWidths = [];
            for (var col = range.s.c; col <= range.e.c; col++) {
                var maxWidth = 0;
                for (var row = range.s.r; row <= range.e.r; row++) {
                    var cell_address = { c: col, r: row };
                    var cell_ref = XLSX.utils.encode_cell(cell_address);
                    var cell = ws[cell_ref];
                    if (cell) {
                        var cellValue = cell.v.toString();
                        if (cellValue.length > maxWidth) {
                            maxWidth = cellValue.length;
                        }
                    }
                }
                colWidths.push({ wch: maxWidth });
            }

            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws);

            var buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            const datemail = new Date().toLocaleDateString('en-GB');
            const filePathName1 = path.resolve(__dirname, "../views/email/tareas.hbs");
            const mensaje = fs.readFileSync(filePathName1, "utf8");
            const template = hbs.compile(mensaje);
            const context = {
                datemail,
            };
            const html = template(context);
            const email_plan = await pool.query(
                "SELECT\n" +
                "	U.Id,\n" +
                "	U.Email \n" +
                "FROM\n" +
                "	Usuarios U \n" +
                "WHERE\n" +
                "	U.Id_Perfil = 2 \n" +
                "	AND U.Id_Cliente = 1 \n" +
                "	AND U.Activo = 1;"
            );
            const { Email } = req.user;
            await transporter.sendMail({
                from: "SAPMA <sapmadandd@sercoing.cl>",
                // to: "marancibia@sercoing.cl",
                to: [email_plan, Email],
                bcc: "sapmadand@sercoing.cl",
                subject: "SAPMA - Tareas Creadas",
                html,
                attachments: [
                    {
                        filename: "imagen1.png",
                        path: "./src/public/img/imagen1.png",
                        cid: "imagen1",

                    },
                    {
                        filename: 'tareas_' + datemail + '.xlsx',
                        content: buffer
                    }
                ],
            });
            res.send("ok");
        }

        function getPeriodoValue(periodo) {
            switch (periodo) {
                case 'TLD':
                    return 1;
                case 'TLS':
                    return 1;
                case 'TLM':
                    return 1;
                case 'TLA':
                    return 1;
                default:
                    return parseInt(periodo) || 1;
            }
        }



    } catch (error) {
        console.log(error);
    }

});

router.get('/planificacion_archivo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { Id_Cliente } = req.user;

    const gerencias = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = ' + Id_Cliente + ' GROUP BY vcgas_idGerencia ');

    res.render('planificacion/planificacion_archivo', {
        gerencias: gerencias
    });
});

router.post('/genera_plan', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const { gerencia, area, sector, equipo } = req.body;

    try {

        let equipos = [];

        if (gerencia > 0 && !area && !sector && !equipo) {

            const consulta = await pool.query("SELECT\n" +
                "	VP.vce_codigo,\n" +
                "	VP.vce_idEquipo,\n" +
                "	VP.vce_tipo,\n" +
                "	VP.vcgas_gerenciaN,\n" +
                "	VP.vcgas_areaN,\n" +
                "	VP.vcgas_sectorN\n" +
                "FROM\n" +
                "	VIEW_planificacion VP\n" +
                "WHERE \n" +
                "	VP.ep_id_tipo_equipo <> ''\n" +
                "	AND VP.vcgas_idGerencia = ?\n" +
                "GROUP BY VP.vce_idEquipo	", [gerencia]);

            if (!consulta) {
                res.json({ title: "Sin Información." });
            } else {
                equipos.push(...consulta)
            }

        } else if (gerencia > 0 && area > 0 && !sector && !equipo) {

            const consulta = await pool.query("SELECT\n" +
                "	VP.vce_codigo,\n" +
                "	VP.vce_idEquipo,\n" +
                "	VP.vce_tipo,\n" +
                "	VP.vcgas_gerenciaN,\n" +
                "	VP.vcgas_areaN,\n" +
                "	VP.vcgas_sectorN\n" +
                "FROM\n" +
                "	VIEW_planificacion VP\n" +
                "WHERE \n" +
                "	VP.ep_id_tipo_equipo <> ''\n" +
                "	AND VP.vcgas_idArea = ?\n" +
                "GROUP BY VP.vce_idEquipo	", [area]);

            if (!consulta) {
                res.json({ title: "Sin Información." });
            } else {
                equipos.push(...consulta)
            }

        } else if (gerencia > 0 && area > 0 && sector > 0 && !equipo) {

            const consulta = await pool.query("SELECT\n" +
                "	VP.vce_codigo,\n" +
                "	VP.vce_idEquipo,\n" +
                "	VP.vce_tipo,\n" +
                "	VP.vcgas_gerenciaN,\n" +
                "	VP.vcgas_areaN,\n" +
                "	VP.vcgas_sectorN\n" +
                "FROM\n" +
                "	VIEW_planificacion VP\n" +
                "WHERE \n" +
                "	VP.ep_id_tipo_equipo <> ''\n" +
                "	AND VP.vcgas_idSector = ?\n" +
                "GROUP BY VP.vce_idEquipo", [sector]);

            if (!consulta) {
                res.json({ title: "Sin Información." });
            } else {
                equipos.push(...consulta)
            }

        } else if (equipo > 0 && area > 0 && sector > 0 && equipo > 0) {

            const consulta = await pool.query("SELECT\n" +
                "	VP.vce_codigo,\n" +
                "	VP.vce_idEquipo,\n" +
                "	VP.vce_tipo,\n" +
                "	VP.vcgas_gerenciaN,\n" +
                "	VP.vcgas_areaN,\n" +
                "	VP.vcgas_sectorN\n" +
                "FROM\n" +
                "	VIEW_planificacion VP\n" +
                "WHERE \n" +
                "	VP.ep_id_tipo_equipo <> ''\n" +
                "	AND VP.vce_idEquipo = ?\n" +
                "GROUP BY VP.vce_idEquipo", [equipo]);

            if (!consulta) {
                res.json({ title: "Sin Información." });
            } else {
                equipos.push(...consulta)
            }

        } else if (!gerencia && !area && !sector && !equipo) {

            const consulta = await pool.query("SELECT\n" +
                "	VP.vce_codigo,\n" +
                "	VP.vce_idEquipo,\n" +
                "	VP.vce_tipo,\n" +
                "	VP.vcgas_gerenciaN,\n" +
                "	VP.vcgas_areaN,\n" +
                "	VP.vcgas_sectorN\n" +
                "FROM\n" +
                "	VIEW_planificacion VP\n" +
                "WHERE \n" +
                "	VP.ep_id_tipo_equipo <> ''\n" +
                "GROUP BY VP.vce_idEquipo");

            if (!consulta) {
                res.json({ title: "Sin Información." });
            } else {
                equipos.push(...consulta)
            }
        }

        const usuarios = await pool.query("SELECT Id AS ID, Login AS USUARIO FROM Usuarios WHERE Id_Cliente = 28 AND Id_Perfil = 3 AND NOT Login LIKE '%test%';");

        const tipo_protocolo = await pool.query("SELECT Id AS ID, Descripcion AS DESCRIPCION FROM TipoProtocolo;");

        const protocolo = await pool.query("SELECT\n" +
            "	EP.ep_id_equipo,\n" +
            "	EP.ep_id_tipo_protocolo,\n" +
            "	CONCAT(EP.ep_id_equipo,T.Descripcion),\n" +
            "	EP.ep_id_protocolo\n" +
            "FROM\n" +
            "	EquipoProtocolo  EP\n" +
            "	INNER JOIN TipoProtocolo T ON T.Id = EP.ep_id_tipo_protocolo\n" +
            "ORDER BY\n" +
            "	EP.ep_id_equipo;");

        console.log(equipos);

        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/planificación.xlsx"));
        const worksheetEquipos = workbook.getWorksheet('EQUIPOS');
        const worksheetUsuarios = workbook.getWorksheet('USUARIOS');
        const worksheetTProtocolos = workbook.getWorksheet('TIPO_PROTOCOLO');
        const worksheetProtocolos = workbook.getWorksheet('PROTOCOLOS');
        const planSheet = workbook.getWorksheet('EQUIPOS');

        equipos.forEach((equipo, index) => {
            const fila = Object.values(equipo);
            worksheetEquipos.addRow(fila, index + 2);
        });

        usuarios.forEach((usuario, index) => {
            const fila = Object.values(usuario);
            worksheetUsuarios.addRow(fila, index + 2);
        });

        tipo_protocolo.forEach((tipo_protocolo, index) => {
            const fila = Object.values(tipo_protocolo);
            worksheetTProtocolos.addRow(fila, index + 2);
        });

        protocolo.forEach((protocolo, index) => {
            const fila = Object.values(protocolo);
            worksheetProtocolos.addRow(fila, index + 2);
        });

        planSheet.dataValidations.add('I2:I22001', {
            type: 'list',
            allowBlank: true,
            formulae: ['=TIPO_PROTOCOLO!$B$2:$B$201'],
            showErrorMessage: true,
            errorStyle: 'error',
            error: 'Elija o escriba un valor de la lista',
        });

        planSheet.dataValidations.add('H2:H22001', {
            type: 'list',
            allowBlank: true,
            formulae: ['=USUARIOS!$B$2:$B$201'],
            showErrorMessage: true,
            errorStyle: 'error',
            error: 'Elija o escriba un valor de la lista',
        });

        planSheet.dataValidations.add('G2:G12001', {
            type: 'whole',
            operator: 'between',
            formula1: 1,
            formula2: 28,
            showErrorMessage: true,
            errorTitle: 'Entrada inválida',
            error: 'Debes ingresar un número entero.',
        });

        await workbook.xlsx.writeFile('planificación.xlsx');

        const workbookReloaded = new ExcelJS.Workbook();

        await workbookReloaded.xlsx.readFile('planificación.xlsx');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=planificación.xlsx');
        res.status(200).send("ok");

    } catch (error) {
        res.status(500).json({ error: "No se pudo generar la plantilla" });
    }
});

router.get('/excel_download', isLoggedIn, async (req, res) => {
    res.download('planificación.xlsx', (err) => {
        if (err) {
            console.error("Error al descargar el archivo:", err);
            res.status(500).json({ error: "Error al descargar el archivo." });
        } else {
            console.log("Archivo descargado con éxito.");
        }
    });
})

router.post('/verificacion_tareas', isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli']), async (req, res) => {
    const { date1, ano1, date2, ano2 } = req.body;

    try {
        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');

        const workbook = XLSX.read(req.file.buffer);
        const cargaSheet = workbook.Sheets['CARGA'];

        if (!cargaSheet) {
            throw new Error('La hoja "CARGA" no está presente en el archivo.');
        }

        const columnsToExtract = [0, 2, 4];

        const data = [];

        let rowIndex = 1;
        while (cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]) {
            const rowData = {};

            const rowHasData = columnsToExtract.every((colIndex) => {
                const cell = cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];
                rowData[`columna${colIndex}`] = cell ? cell.v : null;
                return cell !== undefined && cell.v !== undefined && cell.v !== null && cell.v !== '';
            });

            if (rowHasData) {
                data.push(rowData);
            }

            rowIndex++;
        }

        const resultadosCiclo = [];

        console.log(data);

        const diasEnRango = moment(fechaFinal).diff(fechaInicial, 'days') + 1;

        for (let i = 0; i < diasEnRango; i++) {

            const fechaActual = moment(fechaInicial).add(i, 'days').format('YYYY-MM-DD');

            for (const fila of data) {

                const { columna0, columna2, columna5 } = fila;

                if (moment(fechaActual).date() === columna0) {

                    const resultado = {
                        FECHA: fechaActual,
                        ID: columna2,
                        PROTOCOLO: columna5,
                    };

                    resultadosCiclo.push(resultado);
                }
            }
        }

        const valoresColumna2 = data.map((fila) => Object.values(fila)[1]);

        const verificacion = await pool.query("SELECT\n" +
            "	date_format( T.Fecha, '%Y-%m-%d' ) AS FECHA,\n" +
            "	T.Id_Equipo AS ID,\n" +
            "	P.Id AS PROTOCOLO\n" +
            "FROM\n" +
            "	Tareas T\n" +
            "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
            "WHERE\n" +
            "	T.Id_Equipo IN (?)\n" +
            "   AND T.Id_Estado IN (1,2)\n" +
            "	AND T.Fecha BETWEEN ? AND ?;", [valoresColumna2, fechaInicial, fechaFinal]);



        const verificacionLimpiada = verificacion.map(row => ({ ...row }));

        let coincidenciasEncontradas = 0;

        for (const resultadoCiclo of resultadosCiclo) {
            let existeCoincidencia = false;

            for (const filaVerificacion of verificacionLimpiada) {
                if (
                    resultadoCiclo.FECHA === filaVerificacion.FECHA &&
                    resultadoCiclo.ID === filaVerificacion.ID &&
                    resultadoCiclo.PROTOCOLO === filaVerificacion.PROTOCOLO
                ) {
                    existeCoincidencia = true;
                    break;
                }
            }

            if (existeCoincidencia) {
                coincidenciasEncontradas++;
            }
        }


        if (coincidenciasEncontradas > 0) {
            res.send("repetidos");
        } else {
            res.send("ok");
        }



    } catch (error) {
        console.error(error);
    }
});

router.post('/verificacion_tareas1', isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli']), async (req, res) => {
    const { date1, ano1, date2, ano2 } = req.body;

    try {
        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');

        const workbook = XLSX.read(req.file.buffer);
        const cargaSheet = workbook.Sheets['CARGA'];

        if (!cargaSheet) {
            throw new Error('La hoja "CARGA" no está presente en el archivo.');
        }

        const columnsToExtract = [2];

        const data = [];

        let rowIndex = 1;
        while (cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]) {
            const rowData = {};

            const rowHasData = columnsToExtract.every((colIndex) => {
                const cell = cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];
                rowData[`columna${colIndex}`] = cell ? cell.v : null;
                return cell !== undefined && cell.v !== undefined && cell.v !== null && cell.v !== '';
            });

            if (rowHasData) {
                data.push(rowData);
            }

            rowIndex++;
        }

        console.log(data);

        const valoresColumna2 = data.map((fila) => Object.values(fila)[0]);

        const verificacion = await pool.query("SELECT\n" +
            "	T.Id_Equipo AS ID\n" +
            "FROM\n" +
            "	Tareas T\n" +
            "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
            "WHERE\n" +
            "	T.Id_Equipo IN (?)\n" +
            "   AND T.Id_Estado IN (1,2)\n" +
            "	AND T.Fecha BETWEEN ? AND ?;", [valoresColumna2, fechaInicial, fechaFinal]);

        if (verificacion.length > 0) {
            res.send('tareas');
        } else {
            res.send('notareas');
        }

    } catch (error) {
        console.error(error);
    }
});

router.post('/planificacion_archivo', isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli']), async (req, res) => {

    const { date1, ano1, date2, ano2 } = req.body;
    console.log("plan");
    try {

        const fechaInicial = moment(`${ano1}-${date1}`, 'YYYY-MMM').startOf('month').format('YYYY-MM-DD');
        const fechaFinal = moment(`${ano2}-${date2}`, 'YYYY-MMM').endOf('month').format('YYYY-MM-DD');

        const workbook = XLSX.read(req.file.buffer);

        const cargaSheet = workbook.Sheets['CARGA'];

        if (!cargaSheet) {
            throw new Error('La hoja "CARGA" no está presente en el archivo.');
        }

        const columnsToExtract = [0, 1, 2, 5];

        const data = [];

        let rowIndex = 1;
        while (cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]) {
            const rowData = {};

            const rowHasData = columnsToExtract.every((colIndex) => {
                const cell = cargaSheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];
                rowData[`columna${colIndex}`] = cell ? cell.v : null;
                return cell !== undefined && cell.v !== undefined && cell.v !== null && cell.v !== '';
            });

            if (rowHasData) {
                data.push(rowData);
            }

            rowIndex++;
        }

        const resultadosCiclo = [];

        const diasEnRango = moment(fechaFinal).diff(fechaInicial, 'days') + 1;

        for (let i = 0; i < diasEnRango; i++) {

            const fechaActual = moment(fechaInicial).add(i, 'days').format('YYYY-MM-DD');

            for (const fila of data) {

                const { columna0, columna1, columna2, columna5 } = fila;

                if (moment(fechaActual).date() === columna0) {

                    const resultado = {
                        Fecha: fechaActual,
                        Id_Tecnico: columna1,
                        Id_Equipo: columna2,
                        Id_Protocolo: columna5,
                        Contingente: 0,
                        Prueba: 0
                    };

                    resultadosCiclo.push(resultado);
                }
            }
        }

        const insertIds = await Promise.all(resultadosCiclo.map(insertTarea));

        const tareas = await pool.query(
            "SELECT\n" +
            "	T.Id AS ID,\n" +
            "	DATE_FORMAT(T.Fecha, '%Y-%m-%d') AS FECHA,\n" +
            "	U.Descripcion AS TECNICO,\n" +
            "	E.Descripcion AS ESTADO,\n" +
            "	EQ.Codigo AS EQUIPO,\n" +
            "	TP.Descripcion AS TIPO,\n" +
            "	P.Descripcion AS PROTOCOLO \n" +
            "FROM\n" +
            "	Tareas T\n" +
            "	INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
            "	INNER JOIN Estados E ON E.Id = T.Id_Estado\n" +
            "	INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo\n" +
            "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo \n" +
            "	INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
            "WHERE\n" +
            "	T.Id IN (?)\n" +
            "ORDER BY T.Fecha ASC;", [insertIds]);

        const { usuario } = req.user;
        const { Id_Cliente } = req.user;

        var info = [];

        for (var i = 0; i < tareas.length; i++) {
            info.push({
                Tarea: tareas[i].ID,
                Fecha: tareas[i].FECHA,
                Técnico: tareas[i].TECNICO,
                Estado: tareas[i].ESTADO,
                TAG: tareas[i].EQUIPO,
                Tipo_de_Protocolo: tareas[i].TIPO,
                Protocolo: tareas[i].PROTOCOLO,
                Creado_por: usuario
            });
        }

        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.json_to_sheet(info);

        var range = XLSX.utils.decode_range(ws['!ref']);
        var colWidths = [];
        for (var col = range.s.c; col <= range.e.c; col++) {
            var maxWidth = 0;
            for (var row = range.s.r; row <= range.e.r; row++) {
                var cell_address = { c: col, r: row };
                var cell_ref = XLSX.utils.encode_cell(cell_address);
                var cell = ws[cell_ref];
                if (cell) {
                    var cellValue = cell.v.toString();
                    if (cellValue.length > maxWidth) {
                        maxWidth = cellValue.length;
                    }
                }
            }
            colWidths.push({ wch: maxWidth });
        }

        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws);

        var buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const datemail = new Date().toLocaleDateString('en-GB');
        const filePathName1 = path.resolve(__dirname, "../views/email/tareas.hbs");
        const mensaje = fs.readFileSync(filePathName1, "utf8");
        const template = hbs.compile(mensaje);
        const context = {
            datemail,
        };
        const html = template(context);
        const email_plan = await pool.query(
            "SELECT\n" +
            "	U.Id,\n" +
            "	U.Email \n" +
            "FROM\n" +
            "	Usuarios U \n" +
            "WHERE\n" +
            "	U.Id_Perfil = 2 \n" +
            "	AND U.Id_Cliente = " +
            Id_Cliente +
            " \n" +
            "	AND U.Activo = 1;"
        );
        const { Email } = req.user;
        await transporter.sendMail({
            from: "SAPMA <sapmadand@sercoing.cl>",
            // to: "marancibia@sercoing.cl",
            to: [email_plan, Email],
            bcc: "sapmadand@sercoing.cl",
            subject: "SAPMA - Tareas Creadas",
            html,
            attachments: [
                {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",

                },
                {
                    filename: 'tareas_' + datemail + '.xlsx',
                    content: buffer
                }
            ],
        });

        const updatePromises = insertIds.map((taskId) => {
            return new Promise((resolve, reject) => {
                const updateQuery = 'UPDATE Tareas_Validacion SET Tv_usuario = ?, Tv_metodo = ? WHERE Tv_Id_Tarea = ?';

                pool.query(updateQuery, [usuario, 'M', taskId], (updateError, updateResults, updateFields) => {
                    if (updateError) {
                        console.error('Error al ejecutar la consulta de actualización en Tareas_Estado', updateError);
                        reject(updateError);
                    } else {
                        resolve();
                    }
                });
            });
        });

        await Promise.all(updatePromises);

        res.send("ok");

    } catch (error) {
        console.error('Error al procesar el archivo Excel', error);
        res.status(500).send("Error al procesar el archivo Excel");
    }

});

function insertTarea(resultado) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO Tareas (Fecha, Id_Tecnico, Id_Equipo, Id_Protocolo, Contingente, Prueba) VALUES (?, ?, ?, ?, 0, 0)`;

        pool.query(query, [
            resultado.Fecha,
            resultado.Id_Tecnico,
            resultado.Id_Equipo,
            resultado.Id_Protocolo
        ], (error, results, fields) => {
            if (error) {
                console.error('Error al ejecutar la consulta de inserción', error);
                reject(error);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

router.post('/obtener_detalles_tareas', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
        const { id } = req.body;

        const consulta = await pool.query("SELECT\n" +
            "    T.Id AS ID,\n" +
            "    DATE_FORMAT( T.Fecha, '%Y-%m-%d' ) AS FECHA,\n" +
            "    U.Descripcion AS TECNICO,\n" +
            "    E.Descripcion AS ESTADO,\n" +
            "    EQ.Codigo AS EQUIPO,\n" +
            "    TP.Descripcion AS TIPO,\n" +
            "    P.Descripcion AS PROTOCOLO \n" +
            "FROM\n" +
            "    Tareas T\n" +
            "    INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
            "    INNER JOIN Estados E ON E.Id = T.Id_Estado\n" +
            "    INNER JOIN Equipos EQ ON EQ.Id = T.Id_Equipo\n" +
            "    INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
            "    INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo \n" +
            "WHERE\n" +
            "    T.Id_Equipo = ? \n" +
            "ORDER BY\n" +
            "    T.Fecha ASC;", [id]);

        res.json({ success: true, detalles: consulta });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;

