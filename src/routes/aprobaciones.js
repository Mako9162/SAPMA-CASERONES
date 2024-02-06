const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole, roles } = require('../lib/rol');
const nodemailer = require('nodemailer');
const hbs = require("handlebars");
const fs = require("fs");
const path = require("path"); 
const ExcelJS = require('exceljs');

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

const aprob = new Array();

function enviar(  req, res, result){
    res.render( 'aprob/aprobadas' , { aprob: result });
}

router.get('/aprobadas', isLoggedIn, authRole(['Cli_C']), async (req, res)=>{
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
});

router.get('/aprobadasp', isLoggedIn,  async (req, res)=>{
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
});

router.get('/aprobadasb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
});

router.get('/aprobadasa', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
});

router.get('/aprobadasd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
});

router.get('/aprobadase', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
});



router.post('/aprobadas', isLoggedIn, authRole(['Cli_C']), async (req, res)=>{
    const {tarea} = req.body;
    const {Id_Cliente} = req.user;
    const {est} = req.body;
    const {date1} = req.body;
    const {date2} = req.body;

    if (tarea > 0){
        await pool.query(
                    "SELECT\n" +
        "        	VD.TAREA AS TAREA,\n" +
        "        	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
        "        	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "        	VD.SERVICIO AS SERVICIO,\n" +
        "        	VD.CODIGO AS CODIGO,\n" +
        "        	VD.GERENCIA AS GERENCIA,\n" +
        "        	VD.AREA AS AREA,\n" +
        "        	VD.SECTOR AS SECTOR,\n" +
        "        	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "        	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "        	VT.Val_obs AS OBS,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		VD.ESTADO_EQUIPO = 'SC',\n" +
        "        		'No aplica',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "        			'Sistema sin revisar.',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "        				'Sistema operativo',\n" +
        "        			IF\n" +
        "        				(\n" +
        "        					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "        					'Sist. operativo con obs.',\n" +
        "        				IF\n" +
        "        					(\n" +
        "        						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "        						'Sist. fuera de serv.',\n" +
        "        					IF\n" +
        "        					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
        "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "        	VD.REPUESTOS AS REPUESTOS \n" +
        "        FROM\n" +
        "        	VIEW_DetalleEquiposDET VD\n" +
        "        	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "        	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "        	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "           INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "        WHERE\n" +
        "        	T.Id_Estado = 4 \n" +
        "           AND U.Descripcion  NOT LIKE '%test' \n" +
        "           AND VD.TAREA = "+tarea+"\n" +
        "        ORDER BY\n" +
        "        	TAREA DESC;",
    (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas' , { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            aprob.push(result);        
            enviar(req, res, result);
        }        
    });
    
    }else{
        await pool.query(
            "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "	VT.Val_obs AS OBS,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
            "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS \n" +
            "FROM\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
            "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado = 4 \n" +
            "   AND U.Descripcion  NOT LIKE '%test' \n" +
            "	AND VD.FECHA BETWEEN \""+date1+"\" AND \""+date2+"\" \n" +
            "ORDER BY\n" +
            "	TAREA DESC;",
             (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas', { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            enviar(req, res, result);
            aprob.push(result);
        }
    });
    }

});

router.post('/aprobadasp', isLoggedIn, async (req, res)=>{
    const {tarea} = req.body;
    const {Id_Cliente} = req.user;
    const {est} = req.body;
    const {date1} = req.body;
    const {date2} = req.body;

    if (tarea > 0){
        await pool.query(
                    "SELECT\n" +
        "        	VD.TAREA AS TAREA,\n" +
        "        	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
        "        	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "        	VD.SERVICIO AS SERVICIO,\n" +
        "        	VD.CODIGO AS CODIGO,\n" +
        "        	VD.GERENCIA AS GERENCIA,\n" +
        "        	VD.AREA AS AREA,\n" +
        "        	VD.SECTOR AS SECTOR,\n" +
        "        	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "        	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "        	VT.Val_obs AS OBS,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		VD.ESTADO_EQUIPO = 'SC',\n" +
        "        		'No aplica',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "        			'Sistema sin revisar.',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "        				'Sistema operativo',\n" +
        "        			IF\n" +
        "        				(\n" +
        "        					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "        					'Sist. operativo con obs.',\n" +
        "        				IF\n" +
        "        					(\n" +
        "        						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "        						'Sist. fuera de serv.',\n" +
        "        					IF\n" +
        "        					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
        "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "        	VD.REPUESTOS AS REPUESTOS \n" +
        "        FROM\n" +
        "        	VIEW_DetalleEquiposDET VD\n" +
        "        	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "        	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "        	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "           INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "        WHERE\n" +
        "        	T.Id_Estado = 4 \n" +
        "           AND U.Descripcion  NOT LIKE '%test' \n" +
        "           AND VD.TAREA = "+tarea+"\n" +
        "        ORDER BY\n" +
        "        	TAREA DESC;",
    (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas' , { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            aprob.push(result);        
            enviar(req, res, result);
        }        
    });
    
    }else{
        await pool.query(
            "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "	VT.Val_obs AS OBS,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
            "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS \n" +
            "FROM\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
            "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado = 4 \n" +
            "   AND U.Descripcion  NOT LIKE '%test' \n" +
            "	AND VD.FECHA BETWEEN \""+date1+"\" AND \""+date2+"\" \n" +
            "ORDER BY\n" +
            "	TAREA DESC;",
             (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas', { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            enviar(req, res, result);
            aprob.push(result);
        }
    });
    }

});

router.post('/aprobadasb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{
    const {tarea} = req.body;
    const {Id_Cliente} = req.user;
    const {est} = req.body;
    const {date1} = req.body;
    const {date2} = req.body;

    if (tarea > 0){
        await pool.query(
                    "SELECT\n" +
        "        	VD.TAREA AS TAREA,\n" +
        "        	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
        "        	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "        	VD.SERVICIO AS SERVICIO,\n" +
        "        	VD.CODIGO AS CODIGO,\n" +
        "        	VD.GERENCIA AS GERENCIA,\n" +
        "        	VD.AREA AS AREA,\n" +
        "        	VD.SECTOR AS SECTOR,\n" +
        "        	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "        	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "        	VT.Val_obs AS OBS,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		VD.ESTADO_EQUIPO = 'SC',\n" +
        "        		'No aplica',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "        			'Sistema sin revisar.',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "        				'Sistema operativo',\n" +
        "        			IF\n" +
        "        				(\n" +
        "        					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "        					'Sist. operativo con obs.',\n" +
        "        				IF\n" +
        "        					(\n" +
        "        						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "        						'Sist. fuera de serv.',\n" +
        "        					IF\n" +
        "        					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
        "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "        	VD.REPUESTOS AS REPUESTOS \n" +
        "        FROM\n" +
        "        	VIEW_DetalleEquiposDET VD\n" +
        "        	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "        	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "        	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "           INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "        WHERE\n" +
        "        	T.Id_Estado = 4 \n" +
        "           AND U.Descripcion  NOT LIKE '%test' \n" +
        "           AND VD.TAREA = "+tarea+"\n" +
        "        ORDER BY\n" +
        "        	TAREA DESC;",
    (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas' , { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            aprob.push(result);        
            enviar(req, res, result);
        }        
    });
    
    }else{
        await pool.query(
            "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "	VT.Val_obs AS OBS,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
            "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS \n" +
            "FROM\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
            "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado = 4 \n" +
            "   AND U.Descripcion  NOT LIKE '%test' \n" +
            "	AND VD.FECHA BETWEEN \""+date1+"\" AND \""+date2+"\" \n" +
            "ORDER BY\n" +
            "	TAREA DESC;",
             (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas', { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            enviar(req, res, result);
            aprob.push(result);
        }
    });
    }

});

router.post('/aprobadasa', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{
    const {tarea} = req.body;
    const {Id_Cliente} = req.user;
    const {est} = req.body;
    const {date1} = req.body;
    const {date2} = req.body;

    if (tarea > 0){
        await pool.query(
                    "SELECT\n" +
        "        	VD.TAREA AS TAREA,\n" +
        "        	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
        "        	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "        	VD.SERVICIO AS SERVICIO,\n" +
        "        	VD.CODIGO AS CODIGO,\n" +
        "        	VD.GERENCIA AS GERENCIA,\n" +
        "        	VD.AREA AS AREA,\n" +
        "        	VD.SECTOR AS SECTOR,\n" +
        "        	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "        	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "        	VT.Val_obs AS OBS,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		VD.ESTADO_EQUIPO = 'SC',\n" +
        "        		'No aplica',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "        			'Sistema sin revisar.',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "        				'Sistema operativo',\n" +
        "        			IF\n" +
        "        				(\n" +
        "        					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "        					'Sist. operativo con obs.',\n" +
        "        				IF\n" +
        "        					(\n" +
        "        						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "        						'Sist. fuera de serv.',\n" +
        "        					IF\n" +
        "        					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
        "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "        	VD.REPUESTOS AS REPUESTOS \n" +
        "        FROM\n" +
        "        	VIEW_DetalleEquiposDET VD\n" +
        "        	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "        	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "        	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "           INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "        WHERE\n" +
        "        	T.Id_Estado = 4 \n" +
        "           AND U.Descripcion  NOT LIKE '%test' \n" +
        "           AND VD.TAREA = "+tarea+"\n" +
        "        ORDER BY\n" +
        "        	TAREA DESC;",
    (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas' , { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            aprob.push(result);        
            enviar(req, res, result);
        }        
    });
    
    }else{
        await pool.query(
            "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "	VT.Val_obs AS OBS,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
            "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS \n" +
            "FROM\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
            "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado = 4 \n" +
            "   AND U.Descripcion  NOT LIKE '%test' \n" +
            "	AND VD.FECHA BETWEEN \""+date1+"\" AND \""+date2+"\" \n" +
            "ORDER BY\n" +
            "	TAREA DESC;",
             (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas', { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            enviar(req, res, result);
            aprob.push(result);
        }
    });
    }

});

router.post('/aprobadasd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    const {tarea} = req.body;
    const {Id_Cliente} = req.user;
    const {est} = req.body;
    const {date1} = req.body;
    const {date2} = req.body;

    if (tarea > 0){
        await pool.query(
                    "SELECT\n" +
        "        	VD.TAREA AS TAREA,\n" +
        "        	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
        "        	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "        	VD.SERVICIO AS SERVICIO,\n" +
        "        	VD.CODIGO AS CODIGO,\n" +
        "        	VD.GERENCIA AS GERENCIA,\n" +
        "        	VD.AREA AS AREA,\n" +
        "        	VD.SECTOR AS SECTOR,\n" +
        "        	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "        	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "        	VT.Val_obs AS OBS,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		VD.ESTADO_EQUIPO = 'SC',\n" +
        "        		'No aplica',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "        			'Sistema sin revisar.',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "        				'Sistema operativo',\n" +
        "        			IF\n" +
        "        				(\n" +
        "        					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "        					'Sist. operativo con obs.',\n" +
        "        				IF\n" +
        "        					(\n" +
        "        						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "        						'Sist. fuera de serv.',\n" +
        "        					IF\n" +
        "        					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
        "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "        	VD.REPUESTOS AS REPUESTOS \n" +
        "        FROM\n" +
        "        	VIEW_DetalleEquiposDET VD\n" +
        "        	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "        	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "        	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "           INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "        WHERE\n" +
        "        	T.Id_Estado = 4 \n" +
        "           AND U.Descripcion  NOT LIKE '%test' \n" +
        "           AND VD.TAREA = "+tarea+"\n" +
        "        ORDER BY\n" +
        "        	TAREA DESC;",
    (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas' , { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            aprob.push(result);        
            enviar(req, res, result);
        }        
    });
    
    }else{
        await pool.query(
            "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "	VT.Val_obs AS OBS,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
            "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS \n" +
            "FROM\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
            "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado = 4 \n" +
            "   AND U.Descripcion  NOT LIKE '%test' \n" +
            "	AND VD.FECHA BETWEEN \""+date1+"\" AND \""+date2+"\" \n" +
            "ORDER BY\n" +
            "	TAREA DESC;",
             (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas', { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            enviar(req, res, result);
            aprob.push(result);
        }
    });
    }

});

router.post('/aprobadase', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    const {tarea} = req.body;
    const {Id_Cliente} = req.user;
    const {est} = req.body;
    const {date1} = req.body;
    const {date2} = req.body;

    if (tarea > 0){
        await pool.query(
                    "SELECT\n" +
        "        	VD.TAREA AS TAREA,\n" +
        "        	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
        "        	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "        	VD.SERVICIO AS SERVICIO,\n" +
        "        	VD.CODIGO AS CODIGO,\n" +
        "        	VD.GERENCIA AS GERENCIA,\n" +
        "        	VD.AREA AS AREA,\n" +
        "        	VD.SECTOR AS SECTOR,\n" +
        "        	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "        	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "        	VT.Val_obs AS OBS,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		VD.ESTADO_EQUIPO = 'SC',\n" +
        "        		'No aplica',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "        			'Sistema sin revisar.',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "        				'Sistema operativo',\n" +
        "        			IF\n" +
        "        				(\n" +
        "        					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "        					'Sist. operativo con obs.',\n" +
        "        				IF\n" +
        "        					(\n" +
        "        						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "        						'Sist. fuera de serv.',\n" +
        "        					IF\n" +
        "        					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
        "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "        	VD.REPUESTOS AS REPUESTOS \n" +
        "        FROM\n" +
        "        	VIEW_DetalleEquiposDET VD\n" +
        "        	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "        	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "        	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "           INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "        WHERE\n" +
        "        	T.Id_Estado = 4 \n" +
        "           AND U.Descripcion  NOT LIKE '%test' \n" +
        "           AND VD.TAREA = "+tarea+"\n" +
        "        ORDER BY\n" +
        "        	TAREA DESC;",
    (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas' , { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            aprob.push(result);        
            enviar(req, res, result);
        }        
    });
    
    }else{
        await pool.query(
            "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format(VD.FECHA, '%d-%m-%Y') AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "	VT.Val_obs AS OBS,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS ESTADO_EQUIPO,\n" +
            "			IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS \n" +
            "FROM\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
            "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado = 4 \n" +
            "   AND U.Descripcion  NOT LIKE '%test' \n" +
            "	AND VD.FECHA BETWEEN \""+date1+"\" AND \""+date2+"\" \n" +
            "ORDER BY\n" +
            "	TAREA DESC;",
             (err, result) => { 
        if (!result.length){
            res.render( 'aprob/aprobadas', { title: "No se encuentran tareas en el rango seleccionado!!!" });
        }else{
            enviar(req, res, result);
            aprob.push(result);
        }
    });
    }

});



router.get('/aprobaciones', isLoggedIn, authRole(['Cli_C']), async (req, res)=>{

    const {Id_Cliente} = req.user;

    await pool.query("SELECT\n" +
    "	VD.TAREA AS TAREA,\n" +
    "	date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,\n" +
    "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
    "	VD.SERVICIO AS SERVICIO,\n" +
    "	VD.CODIGO AS CODIGO,\n" +
    "	VD.GERENCIA AS GERENCIA,\n" +
    "	VD.AREA AS AREA,\n" +
    "	VD.SECTOR AS SECTOR,\n" +
    "	VD.DETALLE_UBICACION AS DETALLE,\n" +
    "	VD.UBICACION_TECNICA AS TECNICA,\n" +
    "IF\n" +
    "	(\n" +
    "		VD.ESTADO_EQUIPO = 'SC',\n" +
    "		'No aplica',\n" +
    "	IF\n" +
    "		(\n" +
    "			VD.ESTADO_EQUIPO = 'SSR',\n" +
    "			'Sistema sin revisar.',\n" +
    "		IF\n" +
    "			(\n" +
    "				VD.ESTADO_EQUIPO = 'SOP',\n" +
    "				'Sistema operativo',\n" +
    "			IF\n" +
    "				(\n" +
    "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
    "					'Sist. operativo con obs.',\n" +
    "				IF\n" +
    "					(\n" +
    "						VD.ESTADO_EQUIPO = 'SFS',\n" +
    "						'Sist. fuera de serv.',\n" +
    "					IF\n" +
    "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',\n" +
    "IF\n" +
    "	(\n" +
    "		VD.OBS_ESTADO_EQUIPO = 'SC',\n" +
    "		'',\n" +
    "		CONVERT (\n" +
    "			CAST(\n" +
    "				CONVERT ( CONCAT( UPPER( LEFT ( VD.OBS_ESTADO_EQUIPO, 1 )), SUBSTRING( VD.OBS_ESTADO_EQUIPO FROM 2 )) USING latin1 ) AS BINARY \n" +
    "			) USING UTF8 \n" +
    "		)) AS OBS_EQUIPO,\n" +
    "	VD.REPUESTOS AS REPUESTOS,\n" +
    "	VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,\n" +
    "	date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,\n" +
    "IF\n" +
    "	(\n" +
    "		VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',\n" +
    "		'No aplica',\n" +
    "	IF\n" +
    "		(\n" +
    "			VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',\n" +
    "			'Sistema sin revisar.',\n" +
    "		IF\n" +
    "			(\n" +
    "				VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',\n" +
    "				'Sistema operativo',\n" +
    "			IF\n" +
    "				(\n" +
    "					VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',\n" +
    "					'Sist. operativo con obs.',\n" +
    "				IF\n" +
    "					(\n" +
    "						VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',\n" +
    "						'Sist. fuera de serv.',\n" +
    "					IF\n" +
    "					( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' \n" +
    "FROM\n" +
    "	VIEW_DetalleEquiposDET VD\n" +
    "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
    "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
    "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA\n" +
    "	INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
    "WHERE\n" +
    "	T.Id_Estado IN (5, 6) \n" +
    "	AND TV.te_Estado_val = 1 \n" +
    "	AND U.Descripcion NOT LIKE '%test' \n" +
    "	AND VT.Val_rechazo = 0 \n" +
    "ORDER BY\n" +
    "	TAREA DESC;",
        (err, result) => { 
        if(!result.length){
            res.render('aprob/aprob', {Mensaje: "Sin Tareas Pendientes"});

        }else{
            res.render('aprob/aprob', { aprob: result });
        } 
    });
});

router.get('/aprobacionesplan', isLoggedIn, async (req, res)=>{

    const {Id_Cliente} = req.user;

    await pool.query("SELECT\n" +
        "	VD.TAREA AS TAREA,\n" +
        "	date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,\n" +
        "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "	VD.SERVICIO AS SERVICIO,\n" +
        "	VD.CODIGO AS CODIGO,\n" +
        "	VD.GERENCIA AS GERENCIA,\n" +
        "	VD.AREA AS AREA,\n" +
        "	VD.SECTOR AS SECTOR,\n" +
        "	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "IF\n" +
        "	(\n" +
        "		VD.ESTADO_EQUIPO = 'SC',\n" +
        "		'No aplica',\n" +
        "	IF\n" +
        "		(\n" +
        "			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "			'Sistema sin revisar.',\n" +
        "		IF\n" +
        "			(\n" +
        "				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "				'Sistema operativo',\n" +
        "			IF\n" +
        "				(\n" +
        "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "					'Sist. operativo con obs.',\n" +
        "				IF\n" +
        "					(\n" +
        "						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "						'Sist. fuera de serv.',\n" +
        "					IF\n" +
        "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',\n" +
        "IF\n" +
        "	(\n" +
        "		VD.OBS_ESTADO_EQUIPO = 'SC',\n" +
        "		'',\n" +
        "		CONVERT (\n" +
        "			CAST(\n" +
        "				CONVERT ( CONCAT( UPPER( LEFT ( VD.OBS_ESTADO_EQUIPO, 1 )), SUBSTRING( VD.OBS_ESTADO_EQUIPO FROM 2 )) USING latin1 ) AS BINARY \n" +
        "			) USING UTF8 \n" +
        "		)) AS OBS_EQUIPO,\n" +
        "	VD.REPUESTOS AS REPUESTOS,\n" +
        "	VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,\n" +
        "	date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,\n" +
        "IF\n" +
        "	(\n" +
        "		VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',\n" +
        "		'No aplica',\n" +
        "	IF\n" +
        "		(\n" +
        "			VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',\n" +
        "			'Sistema sin revisar.',\n" +
        "		IF\n" +
        "			(\n" +
        "				VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',\n" +
        "				'Sistema operativo',\n" +
        "			IF\n" +
        "				(\n" +
        "					VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',\n" +
        "					'Sist. operativo con obs.',\n" +
        "				IF\n" +
        "					(\n" +
        "						VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',\n" +
        "						'Sist. fuera de serv.',\n" +
        "					IF\n" +
        "					( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' \n" +
        "FROM\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA\n" +
        "	INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado IN (5, 6) \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "	AND U.Descripcion NOT LIKE '%test' \n" +
        "	AND VT.Val_rechazo = 0 \n" +
        "ORDER BY\n" +
        "	TAREA DESC;", 
        (err, result) => { 
        if(err){
            console.log(err);

        }else{
            res.render('aprob/aprob', { aprob: result });
        } 
    });
});

router.get('/aprobacionesb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{

    const {Id_Cliente} = req.user;
    const {Id} = req.user;

    await pool.query(
        "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',\n" +
            "IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS,\n" +
            "	VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,\n" +
            "	date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' \n" +
            "FROM\n" +
            "	userger US,\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA\n" +
            "	INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado IN (5, 6) \n" +
            "	AND TV.te_Estado_val = 1 \n" +
            "	AND U.Descripcion NOT LIKE '%test' \n" +
            "	AND VT.Val_rechazo = 0 \n" +
            "   AND VD.GERENCIA_ID = US.id_ger \n" +
            "	AND US.id_user = "+Id+"\n" +
            "ORDER BY\n" +
            "	TAREA DESC;", 
         (err, result) => { 
        if(!result.length){
            res.render('aprob/aprob', {Mensaje: "Sin Tareas Pendientes"});

        }else{
            res.render('aprob/aprob', { aprobb: result });
        } 
    });
});

router.get('/aprobacionesa', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{

    const {Id_Cliente} = req.user;
    const {Id} = req.user;

    await pool.query(
        "SELECT\n" +
            "	VD.TAREA AS TAREA,\n" +
            "	date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,\n" +
            "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
            "	VD.SERVICIO AS SERVICIO,\n" +
            "	VD.CODIGO AS CODIGO,\n" +
            "	VD.GERENCIA AS GERENCIA,\n" +
            "	VD.AREA AS AREA,\n" +
            "	VD.SECTOR AS SECTOR,\n" +
            "	VD.DETALLE_UBICACION AS DETALLE,\n" +
            "	VD.UBICACION_TECNICA AS TECNICA,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.ESTADO_EQUIPO = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.ESTADO_EQUIPO = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.ESTADO_EQUIPO = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.ESTADO_EQUIPO = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',\n" +
            "IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
            "	VD.REPUESTOS AS REPUESTOS,\n" +
            "	VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,\n" +
            "	date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,\n" +
            "IF\n" +
            "	(\n" +
            "		VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',\n" +
            "		'No aplica',\n" +
            "	IF\n" +
            "		(\n" +
            "			VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',\n" +
            "			'Sistema sin revisar.',\n" +
            "		IF\n" +
            "			(\n" +
            "				VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',\n" +
            "				'Sistema operativo',\n" +
            "			IF\n" +
            "				(\n" +
            "					VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',\n" +
            "					'Sist. operativo con obs.',\n" +
            "				IF\n" +
            "					(\n" +
            "						VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',\n" +
            "						'Sist. fuera de serv.',\n" +
            "					IF\n" +
            "					( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' \n" +
            "FROM\n" +
            "	userarea US,\n" +
            "	VIEW_DetalleEquiposDET VD\n" +
            "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
            "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
            "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA\n" +
            "	INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
            "WHERE\n" +
            "	T.Id_Estado IN (5, 6) \n" +
            "	AND TV.te_Estado_val = 1 \n" +
            "	AND U.Descripcion NOT LIKE '%test' \n" +
            "	AND VT.Val_rechazo = 0 \n" +
            "	AND VD.AREA_ID = US.id_area\n" +
            "	AND US.id_user = "+Id+"\n" +
            "ORDER BY\n" +
            "	TAREA DESC;",   
        (err, result) => { 
            if(!result.length){
                res.render('aprob/aprob', {Mensaje: "Sin Tareas Pendientes"});

            }else{
                res.render('aprob/aprob', { aproba: result });
            } 
    });
});

router.get('/aprobacionesd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    const {Id_Cliente} = req.user;
    const {Id} = req.user;
    await pool.query(
        "SELECT\n" +
        "	VD.TAREA AS TAREA,\n" +
        "	date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,\n" +
        "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "	VD.SERVICIO AS SERVICIO,\n" +
        "	VD.CODIGO AS CODIGO,\n" +
        "	VD.GERENCIA AS GERENCIA,\n" +
        "	VD.AREA AS AREA,\n" +
        "	VD.SECTOR AS SECTOR,\n" +
        "	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "IF\n" +
        "	(\n" +
        "		VD.ESTADO_EQUIPO = 'SC',\n" +
        "		'No aplica',\n" +
        "	IF\n" +
        "		(\n" +
        "			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "			'Sistema sin revisar.',\n" +
        "		IF\n" +
        "			(\n" +
        "				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "				'Sistema operativo',\n" +
        "			IF\n" +
        "				(\n" +
        "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "					'Sist. operativo con obs.',\n" +
        "				IF\n" +
        "					(\n" +
        "						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "						'Sist. fuera de serv.',\n" +
        "					IF\n" +
        "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',\n" +
        "IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "	VD.REPUESTOS AS REPUESTOS,\n" +
        "	VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,\n" +
        "	date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,\n" +
        "IF\n" +
        "	(\n" +
        "		VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',\n" +
        "		'No aplica',\n" +
        "	IF\n" +
        "		(\n" +
        "			VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',\n" +
        "			'Sistema sin revisar.',\n" +
        "		IF\n" +
        "			(\n" +
        "				VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',\n" +
        "				'Sistema operativo',\n" +
        "			IF\n" +
        "				(\n" +
        "					VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',\n" +
        "					'Sist. operativo con obs.',\n" +
        "				IF\n" +
        "					(\n" +
        "						VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',\n" +
        "						'Sist. fuera de serv.',\n" +
        "					IF\n" +
        "					( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' \n" +
        "FROM\n" +
        "   usersector US,\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA\n" +
        "	INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado IN (5, 6) \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "	AND U.Descripcion NOT LIKE '%test' \n" +
        "	AND VT.Val_rechazo = 0 \n" +
        "	AND VD.SECTOR_ID = US.id_sector\n" +
        "	AND US.id_user = "+Id+"\n" +
        "ORDER BY\n" +
        "	TAREA DESC;", 
        (err, result) => { 
        if(!result.length){
            res.render('aprob/aprob', {Mensaje: "Sin Tareas Pendientes"});

        }else{
            res.render('aprob/aprob', { aprob: result });
        } 
    });
});

router.get('/aprobacionese', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    const {Id} = req.user;

    await pool.query(
        "SELECT\n" +
        "	VD.TAREA AS TAREA,\n" +
        "	date_format( VD.FECHA, '%d-%m-%Y' ) AS FECHA,\n" +
        "	VD.ESTADO_TAREA AS ESTADO_TAREA,\n" +
        "	VD.SERVICIO AS SERVICIO,\n" +
        "	VD.CODIGO AS CODIGO,\n" +
        "	VD.GERENCIA AS GERENCIA,\n" +
        "	VD.AREA AS AREA,\n" +
        "	VD.SECTOR AS SECTOR,\n" +
        "	VD.DETALLE_UBICACION AS DETALLE,\n" +
        "	VD.UBICACION_TECNICA AS TECNICA,\n" +
        "IF\n" +
        "	(\n" +
        "		VD.ESTADO_EQUIPO = 'SC',\n" +
        "		'No aplica',\n" +
        "	IF\n" +
        "		(\n" +
        "			VD.ESTADO_EQUIPO = 'SSR',\n" +
        "			'Sistema sin revisar.',\n" +
        "		IF\n" +
        "			(\n" +
        "				VD.ESTADO_EQUIPO = 'SOP',\n" +
        "				'Sistema operativo',\n" +
        "			IF\n" +
        "				(\n" +
        "					VD.ESTADO_EQUIPO = 'SOCO',\n" +
        "					'Sist. operativo con obs.',\n" +
        "				IF\n" +
        "					(\n" +
        "						VD.ESTADO_EQUIPO = 'SFS',\n" +
        "						'Sist. fuera de serv.',\n" +
        "					IF\n" +
        "					( VD.ESTADO_EQUIPO = 'SNO', 'Sist. no operativo', VD.ESTADO_EQUIPO )))))) AS 'ESTADO_EQUIPO',\n" +
        "IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "	VD.REPUESTOS AS REPUESTOS,\n" +
        "	VD.TAREA_ANTERIOR AS TAREA_ANTERIOR,\n" +
        "	date_format( VD.FECHA_TAREA_ANTERIOR, '%d-%m-%Y' ) AS FECHA_ANTERIOR,\n" +
        "IF\n" +
        "	(\n" +
        "		VD.EST_EQUIPO_TAREA_ANTERIOR = 'SC',\n" +
        "		'No aplica',\n" +
        "	IF\n" +
        "		(\n" +
        "			VD.EST_EQUIPO_TAREA_ANTERIOR = 'SSR',\n" +
        "			'Sistema sin revisar.',\n" +
        "		IF\n" +
        "			(\n" +
        "				VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOP',\n" +
        "				'Sistema operativo',\n" +
        "			IF\n" +
        "				(\n" +
        "					VD.EST_EQUIPO_TAREA_ANTERIOR = 'SOCO',\n" +
        "					'Sist. operativo con obs.',\n" +
        "				IF\n" +
        "					(\n" +
        "						VD.EST_EQUIPO_TAREA_ANTERIOR = 'SFS',\n" +
        "						'Sist. fuera de serv.',\n" +
        "					IF\n" +
        "					( VD.EST_EQUIPO_TAREA_ANTERIOR = 'SNO', 'Sist. no operativo', VD.EST_EQUIPO_TAREA_ANTERIOR )))))) AS 'ESTADO_EQUIPO_ANTERIOR' \n" +
        "FROM\n" +
        "   userequipo US,\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA\n" +
        "	INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado IN (5, 6) \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "	AND U.Descripcion NOT LIKE '%test' \n" +
        "	AND VT.Val_rechazo = 0 \n" +
        "	AND VD.EQUIPO_ID = US.id_equipo\n" +
        "	AND US.id_user = "+Id+"\n" +
        "ORDER BY\n" +
        "	TAREA DESC;", 
        (err, result) => { 
        if(!result.length){
            res.render('aprob/aprob', {Mensaje: "Sin Tareas Pendientes"});
            console.log("chao");

        }else{
            res.render('aprob/aprob', { aprob: result });
            console.log("hola");
        } 
    });
});



router.post('/aprobaciones', isLoggedIn, async (req, res)=>{
    const idt = (req.body.idt);
    const Login = req.user.usuario;
    var data = [];
    var est_or= "Terminada validada";
    
    // Verificar que el objeto recibido tiene información en la propiedad 'datos'
    if (req.body['datos']) {
      // Recorrer el objeto 'req.body' con un bucle for
      for (var i = 0; i < req.body['datos'].length; i++) {
        // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data'
        var tarea = {
          Tarea: req.body['datos'][i]['idt'],
          Fecha: req.body['datos'][i]['fecha'],
          Estado_de_Tarea: est_or,
          Tipo_de_servicio: req.body['datos'][i]['tipo'],
          Tag: req.body['datos'][i]['tag'],
          Gerencia: req.body['datos'][i]['ger'],
          Area: req.body['datos'][i]['area'],
          Sector: req.body['datos'][i]['sector'],
          Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
          Ubicacion_tecnica: req.body['datos'][i]['tec'],
          Estado_equipo: req.body['datos'][i]['estequi'],
          Observacion_equipo: req.body['datos'][i]['estadoequi'],
          Repuesto: req.body['datos'][i]['repu'],
          Observacion: req.body['datos'][i]['obs'],
          Fecha_aprobacion: req.body['datos'][i]['clientDate'],
          Aprobado_por: Login
        };
        data.push(tarea);
      }
    }
    
        const workbook = new ExcelJS.Workbook();
        
        // Carga la plantilla desde un archivo en disco
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));

        const worksheet = workbook.getWorksheet(1);

        
        let fila = 5; // Empieza en la fila b7
        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.Fecha;
            worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('E' + fila).value = dato.Tag;
            worksheet.getCell('F' + fila).value = dato.Gerencia;
            worksheet.getCell('G' + fila).value = dato.Area;
            worksheet.getCell('H' + fila).value = dato.Sector;
            worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('K' + fila).value = dato.Estado_equipo;
            worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('M' + fila).value = dato.Repuesto;
            worksheet.getCell('N' + fila).value = dato.Observacion;
            worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('P' + fila).value = dato.Aprobado_por;
            fila++; // Avanza a la siguiente fila
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const arreglo1 = idt;
    const arreglo2 = req.body.obsd;
    const obs = "APROBADA | "+arreglo2;
    const arreglo3 = arreglo1.map(Number);
    const date = new Date();
    var arreglo4 = arreglo3.map((item, index) => {
        return [arreglo2[index]];
    });

    await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
        if(err){
            console.log(err);
        }else{                  
            await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    res.json({message: "archivo creado"});
                    let queries = '';

                    arreglo4.forEach(function(item) {
                        queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
                    });
                    pool.query(queries, arreglo3, async (err, result) => {
                        if(err){
                            console.log(err);
                        }else{
                            const emailc = await pool.query(
                                "SELECT\n" +
                                "	USUARIO,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	(\n" +
                                "	SELECT\n" +
                                "		USUARIO \n" +
                                "	FROM\n" +
                                "		(\n" +
                                "		SELECT\n" +
                                "			T.LID,\n" +
                                "			X.* \n" +
                                "		FROM\n" +
                                "			(\n" +
                                "			SELECT\n" +
                                "				L.ID LID,\n" +
                                "				L.UGE LUGE,\n" +
                                "				L.UAR LUAR,\n" +
                                "				L.USEC LUSEC,\n" +
                                "				L.UEQU LUEQU \n" +
                                "			FROM\n" +
                                "				(\n" +
                                "				SELECT\n" +
                                "					V.vce_idEquipo ID,\n" +
                                "					UG.id_user UGE,\n" +
                                "					UA.id_user UAR,\n" +
                                "					US.id_user USEC,\n" +
                                "					UE.id_user UEQU \n" +
                                "				FROM\n" +
                                "					VIEW_equiposCteGerAreSec V\n" +
                                "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
                                "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
                                "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
                                "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
                                "				WHERE\n" +
                                "					V.vce_idEquipo IN (\n" +
                                "					SELECT\n" +
                                "						E.Id \n" +
                                "					FROM\n" +
                                "						Tareas T\n" +
                                "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
                                "					WHERE\n" +
                                "						T.Id IN ( "+arreglo3+" ) \n" +
                                "					GROUP BY\n" +
                                "						E.Id \n" +
                                "					) \n" +
                                "				) AS L \n" +
                                "			) AS T\n" +
                                "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
                                "	WHERE\n" +
                                "		USUARIO IS NOT NULL \n" +
                                "	GROUP BY\n" +
                                "		USUARIO \n" +
                                "	) AS CORREO2\n" +
                                "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
                                "WHERE\n" +
                                "	U.Activo = 1;"
                              );
                    
                              const emailp = await pool.query(
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
    
                            const emailgen = await pool.query(
                                "SELECT\n" +
                                "	U.Id,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	Usuarios U \n" +
                                "WHERE\n" +
                                "	U.Id_Perfil = 6 \n" +
                                "	AND U.Id_Cliente = " +
                                Id_Cliente +
                                " \n" +
                                "	AND U.Activo = 1;"
                            );
                    
                              const arremail = emailc.map(function (email) {
                                return email.Email;
                              });
                    
                              const arremailp = emailp.map(function (email) {
                                return email.Email;
                              });
    
                              const arremailgen = emailgen.map(function (email) {
                                return email.Email;
                              });
                              
                              const datemail = new Date().toLocaleDateString('en-GB');
                    
                              const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
                              const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                    
                              // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                              const template = hbs.compile(mensaje);
                              const context = {
                                datemail, 
                              };
                              const html = template(context);
                    
                              await transporter.sendMail({
                                from: "SAPMA <sapmadand@sercoing.cl>",
                                // to: "marancibia@sercoing.cl",
                                to: arremailp,
                                cc: [arremail, arremailgen],
                                bcc: correo,
                                subject: "SAPMA - Tareas Aprobadas",
                                html,
                                attachments: [
                                  {
                                    filename: "imagen1.png",
                                    path: "./src/public/img/imagen1.png",
                                    cid: "imagen1",
                                  },
                                  {
                                    filename: 'aprobaciones_'+datemail+'.xlsx',
                                    content: buffer
                                  }
                                ],
                              });
                        }
            
                    });
                }

            });  
            
            
        }
    });
    
});

router.post('/aprobacionesb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{
    const idt = (req.body.idt);
    const Login = req.user.usuario;
    var data = [];
    var est_or= "Terminada validada";
    
    // Verificar que el objeto recibido tiene información en la propiedad 'datos'
    if (req.body['datos']) {
      // Recorrer el objeto 'req.body' con un bucle for
      for (var i = 0; i < req.body['datos'].length; i++) {
        // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data'
        var tarea = {
          Tarea: req.body['datos'][i]['idt'],
          Fecha: req.body['datos'][i]['fecha'],
          Estado_de_Tarea: est_or,
          Tipo_de_servicio: req.body['datos'][i]['tipo'],
          Tag: req.body['datos'][i]['tag'],
          Gerencia: req.body['datos'][i]['ger'],
          Area: req.body['datos'][i]['area'],
          Sector: req.body['datos'][i]['sector'],
          Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
          Ubicacion_tecnica: req.body['datos'][i]['tec'],
          Estado_equipo: req.body['datos'][i]['estequi'],
          Observacion_equipo: req.body['datos'][i]['estadoequi'],
          Repuesto: req.body['datos'][i]['repu'],
          Observacion: req.body['datos'][i]['obs'],
          Fecha_aprobacion: req.body['datos'][i]['clientDate'],
          Aprobado_por: Login
        };
        data.push(tarea);
      }
    }
    
        const workbook = new ExcelJS.Workbook();
        
        // Carga la plantilla desde un archivo en disco
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));

        const worksheet = workbook.getWorksheet(1);

        
        let fila = 5; // Empieza en la fila b7
        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.Fecha;
            worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('E' + fila).value = dato.Tag;
            worksheet.getCell('F' + fila).value = dato.Gerencia;
            worksheet.getCell('G' + fila).value = dato.Area;
            worksheet.getCell('H' + fila).value = dato.Sector;
            worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('K' + fila).value = dato.Estado_equipo;
            worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('M' + fila).value = dato.Repuesto;
            worksheet.getCell('N' + fila).value = dato.Observacion;
            worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('P' + fila).value = dato.Aprobado_por;
            fila++; // Avanza a la siguiente fila
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const arreglo1 = idt;
    const arreglo2 = req.body.obsd;
    const obs = "APROBADA | "+arreglo2;
    const arreglo3 = arreglo1.map(Number);
    const date = new Date();
    var arreglo4 = arreglo3.map((item, index) => {
        return [arreglo2[index]];
    });

    await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
        if(err){
            console.log(err);
        }else{                  
            await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    res.json({message: "archivo creado"});
                    let queries = '';

                    arreglo4.forEach(function(item) {
                        queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
                    });
                    pool.query(queries, arreglo3, async (err, result) => {
                        if(err){
                            console.log(err);
                        }else{
                            const emailc = await pool.query(
                                "SELECT\n" +
                                "	USUARIO,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	(\n" +
                                "	SELECT\n" +
                                "		USUARIO \n" +
                                "	FROM\n" +
                                "		(\n" +
                                "		SELECT\n" +
                                "			T.LID,\n" +
                                "			X.* \n" +
                                "		FROM\n" +
                                "			(\n" +
                                "			SELECT\n" +
                                "				L.ID LID,\n" +
                                "				L.UGE LUGE,\n" +
                                "				L.UAR LUAR,\n" +
                                "				L.USEC LUSEC,\n" +
                                "				L.UEQU LUEQU \n" +
                                "			FROM\n" +
                                "				(\n" +
                                "				SELECT\n" +
                                "					V.vce_idEquipo ID,\n" +
                                "					UG.id_user UGE,\n" +
                                "					UA.id_user UAR,\n" +
                                "					US.id_user USEC,\n" +
                                "					UE.id_user UEQU \n" +
                                "				FROM\n" +
                                "					VIEW_equiposCteGerAreSec V\n" +
                                "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
                                "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
                                "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
                                "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
                                "				WHERE\n" +
                                "					V.vce_idEquipo IN (\n" +
                                "					SELECT\n" +
                                "						E.Id \n" +
                                "					FROM\n" +
                                "						Tareas T\n" +
                                "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
                                "					WHERE\n" +
                                "						T.Id IN ( "+arreglo3+" ) \n" +
                                "					GROUP BY\n" +
                                "						E.Id \n" +
                                "					) \n" +
                                "				) AS L \n" +
                                "			) AS T\n" +
                                "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
                                "	WHERE\n" +
                                "		USUARIO IS NOT NULL \n" +
                                "	GROUP BY\n" +
                                "		USUARIO \n" +
                                "	) AS CORREO2\n" +
                                "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
                                "WHERE\n" +
                                "	U.Activo = 1;"
                              );
                    
                              const emailp = await pool.query(
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
    
                            const emailgen = await pool.query(
                                "SELECT\n" +
                                "	U.Id,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	Usuarios U \n" +
                                "WHERE\n" +
                                "	U.Id_Perfil = 6 \n" +
                                "	AND U.Id_Cliente = " +
                                Id_Cliente +
                                " \n" +
                                "	AND U.Activo = 1;"
                            );
                    
                              const arremail = emailc.map(function (email) {
                                return email.Email;
                              });
                    
                              const arremailp = emailp.map(function (email) {
                                return email.Email;
                              });
    
                              const arremailgen = emailgen.map(function (email) {
                                return email.Email;
                              });
                              
                              const datemail = new Date().toLocaleDateString('en-GB');
                    
                              const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
                              const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                    
                              // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                              const template = hbs.compile(mensaje);
                              const context = {
                                datemail, 
                              };
                              const html = template(context);
                    
                              await transporter.sendMail({
                                from: "SAPMA <sapmadand@sercoing.cl>",
                                // to: "marancibia@sercoing.cl",
                                to: arremailp,
                                cc: [arremail, arremailgen],
                                bcc: correo,
                                subject: "SAPMA - Tareas Aprobadas",
                                html,
                                attachments: [
                                  {
                                    filename: "imagen1.png",
                                    path: "./src/public/img/imagen1.png",
                                    cid: "imagen1",
                                  },
                                  {
                                    filename: 'aprobaciones_'+datemail+'.xlsx',
                                    content: buffer
                                  }
                                ],
                              });

                            
                        }
            
                    });
                }

            });  
            
            
        }
    });
    
});

router.post('/aprobacionesa', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{
    const idt = (req.body.idt);
    const Login = req.user.usuario;
    var data = [];
    var est_or= "Terminada validada";
    
    // Verificar que el objeto recibido tiene información en la propiedad 'datos'
    if (req.body['datos']) {
      // Recorrer el objeto 'req.body' con un bucle for
      for (var i = 0; i < req.body['datos'].length; i++) {
        // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data'
        var tarea = {
          Tarea: req.body['datos'][i]['idt'],
          Fecha: req.body['datos'][i]['fecha'],
          Estado_de_Tarea: est_or,
          Tipo_de_servicio: req.body['datos'][i]['tipo'],
          Tag: req.body['datos'][i]['tag'],
          Gerencia: req.body['datos'][i]['ger'],
          Area: req.body['datos'][i]['area'],
          Sector: req.body['datos'][i]['sector'],
          Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
          Ubicacion_tecnica: req.body['datos'][i]['tec'],
          Estado_equipo: req.body['datos'][i]['estequi'],
          Observacion_equipo: req.body['datos'][i]['estadoequi'],
          Repuesto: req.body['datos'][i]['repu'],
          Observacion: req.body['datos'][i]['obs'],
          Fecha_aprobacion: req.body['datos'][i]['clientDate'],
          Aprobado_por: Login
        };
        data.push(tarea);
      }
    }
    
        const workbook = new ExcelJS.Workbook();
        
        // Carga la plantilla desde un archivo en disco
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));

        const worksheet = workbook.getWorksheet(1);

        
        let fila = 5; // Empieza en la fila b7
        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.Fecha;
            worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('E' + fila).value = dato.Tag;
            worksheet.getCell('F' + fila).value = dato.Gerencia;
            worksheet.getCell('G' + fila).value = dato.Area;
            worksheet.getCell('H' + fila).value = dato.Sector;
            worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('K' + fila).value = dato.Estado_equipo;
            worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('M' + fila).value = dato.Repuesto;
            worksheet.getCell('N' + fila).value = dato.Observacion;
            worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('P' + fila).value = dato.Aprobado_por;
            fila++; // Avanza a la siguiente fila
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const arreglo1 = idt;
    const arreglo2 = req.body.obsd;
    const obs = "APROBADA | "+arreglo2;
    const arreglo3 = arreglo1.map(Number);
    const date = new Date();
    var arreglo4 = arreglo3.map((item, index) => {
        return [arreglo2[index]];
    });

    await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
        if(err){
            console.log(err);
        }else{                  
            await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    res.json({message: "archivo creado"});
                    let queries = '';

                    arreglo4.forEach(function(item) {
                        queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
                    });
                    pool.query(queries, arreglo3, async (err, result) => {
                        if(err){
                            console.log(err);
                        }else{
                            const emailc = await pool.query(
                                "SELECT\n" +
                                "	USUARIO,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	(\n" +
                                "	SELECT\n" +
                                "		USUARIO \n" +
                                "	FROM\n" +
                                "		(\n" +
                                "		SELECT\n" +
                                "			T.LID,\n" +
                                "			X.* \n" +
                                "		FROM\n" +
                                "			(\n" +
                                "			SELECT\n" +
                                "				L.ID LID,\n" +
                                "				L.UGE LUGE,\n" +
                                "				L.UAR LUAR,\n" +
                                "				L.USEC LUSEC,\n" +
                                "				L.UEQU LUEQU \n" +
                                "			FROM\n" +
                                "				(\n" +
                                "				SELECT\n" +
                                "					V.vce_idEquipo ID,\n" +
                                "					UG.id_user UGE,\n" +
                                "					UA.id_user UAR,\n" +
                                "					US.id_user USEC,\n" +
                                "					UE.id_user UEQU \n" +
                                "				FROM\n" +
                                "					VIEW_equiposCteGerAreSec V\n" +
                                "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
                                "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
                                "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
                                "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
                                "				WHERE\n" +
                                "					V.vce_idEquipo IN (\n" +
                                "					SELECT\n" +
                                "						E.Id \n" +
                                "					FROM\n" +
                                "						Tareas T\n" +
                                "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
                                "					WHERE\n" +
                                "						T.Id IN ( "+arreglo3+" ) \n" +
                                "					GROUP BY\n" +
                                "						E.Id \n" +
                                "					) \n" +
                                "				) AS L \n" +
                                "			) AS T\n" +
                                "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
                                "	WHERE\n" +
                                "		USUARIO IS NOT NULL \n" +
                                "	GROUP BY\n" +
                                "		USUARIO \n" +
                                "	) AS CORREO2\n" +
                                "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
                                "WHERE\n" +
                                "	U.Activo = 1;"
                              );
                    
                              const emailp = await pool.query(
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
    
                            const emailgen = await pool.query(
                                "SELECT\n" +
                                "	U.Id,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	Usuarios U \n" +
                                "WHERE\n" +
                                "	U.Id_Perfil = 6 \n" +
                                "	AND U.Id_Cliente = " +
                                Id_Cliente +
                                " \n" +
                                "	AND U.Activo = 1;"
                            );
                    
                              const arremail = emailc.map(function (email) {
                                return email.Email;
                              });
                    
                              const arremailp = emailp.map(function (email) {
                                return email.Email;
                              });
    
                              const arremailgen = emailgen.map(function (email) {
                                return email.Email;
                              });
                              
                              const datemail = new Date().toLocaleDateString('en-GB');
                    
                              const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
                              const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                    
                              // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                              const template = hbs.compile(mensaje);
                              const context = {
                                datemail, 
                              };
                              const html = template(context);
                    
                              await transporter.sendMail({
                                from: "SAPMA <sapmadand@sercoing.cl>",
                                // to: "marancibia@sercoing.cl",
                                to: arremailp,
                                cc: [arremail, arremailgen],
                                bcc: correo,
                                subject: "SAPMA - Tareas Aprobadas",
                                html,
                                attachments: [
                                  {
                                    filename: "imagen1.png",
                                    path: "./src/public/img/imagen1.png",
                                    cid: "imagen1",
                                  },
                                  {
                                    filename: 'aprobaciones_'+datemail+'.xlsx',
                                    content: buffer
                                  }
                                ],
                              });

                            
                        }
            
                    });
                }

            });  
            
            
        }
    });
    
});

router.post('/aprobacionesd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    const idt = (req.body.idt);
    const Login = req.user.usuario;
    var data = [];
    var est_or= "Terminada validada";
    
    // Verificar que el objeto recibido tiene información en la propiedad 'datos'
    if (req.body['datos']) {
      // Recorrer el objeto 'req.body' con un bucle for
      for (var i = 0; i < req.body['datos'].length; i++) {
        // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data'
        var tarea = {
          Tarea: req.body['datos'][i]['idt'],
          Fecha: req.body['datos'][i]['fecha'],
          Estado_de_Tarea: est_or,
          Tipo_de_servicio: req.body['datos'][i]['tipo'],
          Tag: req.body['datos'][i]['tag'],
          Gerencia: req.body['datos'][i]['ger'],
          Area: req.body['datos'][i]['area'],
          Sector: req.body['datos'][i]['sector'],
          Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
          Ubicacion_tecnica: req.body['datos'][i]['tec'],
          Estado_equipo: req.body['datos'][i]['estequi'],
          Observacion_equipo: req.body['datos'][i]['estadoequi'],
          Repuesto: req.body['datos'][i]['repu'],
          Observacion: req.body['datos'][i]['obs'],
          Fecha_aprobacion: req.body['datos'][i]['clientDate'],
          Aprobado_por: Login
        };
        data.push(tarea);
      }
    }
    
        const workbook = new ExcelJS.Workbook();
        
        // Carga la plantilla desde un archivo en disco
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));

        const worksheet = workbook.getWorksheet(1);

        
        let fila = 5; // Empieza en la fila b7
        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.Fecha;
            worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('E' + fila).value = dato.Tag;
            worksheet.getCell('F' + fila).value = dato.Gerencia;
            worksheet.getCell('G' + fila).value = dato.Area;
            worksheet.getCell('H' + fila).value = dato.Sector;
            worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('K' + fila).value = dato.Estado_equipo;
            worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('M' + fila).value = dato.Repuesto;
            worksheet.getCell('N' + fila).value = dato.Observacion;
            worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('P' + fila).value = dato.Aprobado_por;
            fila++; // Avanza a la siguiente fila
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const arreglo1 = idt;
    const arreglo2 = req.body.obsd;
    const obs = "APROBADA | "+arreglo2;
    const arreglo3 = arreglo1.map(Number);
    const date = new Date();
    var arreglo4 = arreglo3.map((item, index) => {
        return [arreglo2[index]];
    });

    await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
        if(err){
            console.log(err);
        }else{                  
            await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    res.json({message: "archivo creado"});
                    let queries = '';

                    arreglo4.forEach(function(item) {
                        queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
                    });
                    pool.query(queries, arreglo3, async (err, result) => {
                        if(err){
                            console.log(err);
                        }else{
                            const emailc = await pool.query(
                                "SELECT\n" +
                                "	USUARIO,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	(\n" +
                                "	SELECT\n" +
                                "		USUARIO \n" +
                                "	FROM\n" +
                                "		(\n" +
                                "		SELECT\n" +
                                "			T.LID,\n" +
                                "			X.* \n" +
                                "		FROM\n" +
                                "			(\n" +
                                "			SELECT\n" +
                                "				L.ID LID,\n" +
                                "				L.UGE LUGE,\n" +
                                "				L.UAR LUAR,\n" +
                                "				L.USEC LUSEC,\n" +
                                "				L.UEQU LUEQU \n" +
                                "			FROM\n" +
                                "				(\n" +
                                "				SELECT\n" +
                                "					V.vce_idEquipo ID,\n" +
                                "					UG.id_user UGE,\n" +
                                "					UA.id_user UAR,\n" +
                                "					US.id_user USEC,\n" +
                                "					UE.id_user UEQU \n" +
                                "				FROM\n" +
                                "					VIEW_equiposCteGerAreSec V\n" +
                                "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
                                "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
                                "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
                                "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
                                "				WHERE\n" +
                                "					V.vce_idEquipo IN (\n" +
                                "					SELECT\n" +
                                "						E.Id \n" +
                                "					FROM\n" +
                                "						Tareas T\n" +
                                "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
                                "					WHERE\n" +
                                "						T.Id IN ( "+arreglo3+" ) \n" +
                                "					GROUP BY\n" +
                                "						E.Id \n" +
                                "					) \n" +
                                "				) AS L \n" +
                                "			) AS T\n" +
                                "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
                                "	WHERE\n" +
                                "		USUARIO IS NOT NULL \n" +
                                "	GROUP BY\n" +
                                "		USUARIO \n" +
                                "	) AS CORREO2\n" +
                                "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
                                "WHERE\n" +
                                "	U.Activo = 1;"
                              );
                    
                              const emailp = await pool.query(
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
    
                            const emailgen = await pool.query(
                                "SELECT\n" +
                                "	U.Id,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	Usuarios U \n" +
                                "WHERE\n" +
                                "	U.Id_Perfil = 6 \n" +
                                "	AND U.Id_Cliente = " +
                                Id_Cliente +
                                " \n" +
                                "	AND U.Activo = 1;"
                            );
                    
                              const arremail = emailc.map(function (email) {
                                return email.Email;
                              });
                    
                              const arremailp = emailp.map(function (email) {
                                return email.Email;
                              });
    
                              const arremailgen = emailgen.map(function (email) {
                                return email.Email;
                              });
                              
                              const datemail = new Date().toLocaleDateString('en-GB');
                    
                              const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
                              const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                    
                              // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                              const template = hbs.compile(mensaje);
                              const context = {
                                datemail, 
                              };
                              const html = template(context);
                    
                              await transporter.sendMail({
                                from: "SAPMA <sapmadand@sercoing.cl>",
                                // to: "marancibia@sercoing.cl",
                                to: arremailp,
                                cc: [arremail, arremailgen],
                                bcc: correo,
                                subject: "SAPMA - Tareas Aprobadas",
                                html,
                                attachments: [
                                  {
                                    filename: "imagen1.png",
                                    path: "./src/public/img/imagen1.png",
                                    cid: "imagen1",
                                  },
                                  {
                                    filename: 'aprobaciones_'+datemail+'.xlsx',
                                    content: buffer
                                  }
                                ],
                              });

                            
                        }
            
                    });
                }

            });  
            
            
        }
    });
    
});

router.post('/aprobacionese', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    const idt = (req.body.idt);
    const Login = req.user.usuario;
    var data = [];
    var est_or= "Terminada validada";
    
    // Verificar que el objeto recibido tiene información en la propiedad 'datos'
    if (req.body['datos']) {
      // Recorrer el objeto 'req.body' con un bucle for
      for (var i = 0; i < req.body['datos'].length; i++) {
        // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data'
        var tarea = {
          Tarea: req.body['datos'][i]['idt'],
          Fecha: req.body['datos'][i]['fecha'],
          Estado_de_Tarea: est_or,
          Tipo_de_servicio: req.body['datos'][i]['tipo'],
          Tag: req.body['datos'][i]['tag'],
          Gerencia: req.body['datos'][i]['ger'],
          Area: req.body['datos'][i]['area'],
          Sector: req.body['datos'][i]['sector'],
          Detalle_de_ubicacion: req.body['datos'][i]['ubi'],
          Ubicacion_tecnica: req.body['datos'][i]['tec'],
          Estado_equipo: req.body['datos'][i]['estequi'],
          Observacion_equipo: req.body['datos'][i]['estadoequi'],
          Repuesto: req.body['datos'][i]['repu'],
          Observacion: req.body['datos'][i]['obs'],
          Fecha_aprobacion: req.body['datos'][i]['clientDate'],
          Aprobado_por: Login
        };
        data.push(tarea);
      }
    }

        const workbook = new ExcelJS.Workbook();
        
        // Carga la plantilla desde un archivo en disco
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));

        const worksheet = workbook.getWorksheet(1);

        
        let fila = 5; // Empieza en la fila b7
        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.Fecha;
            worksheet.getCell('C' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('D' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('E' + fila).value = dato.Tag;
            worksheet.getCell('F' + fila).value = dato.Gerencia;
            worksheet.getCell('G' + fila).value = dato.Area;
            worksheet.getCell('H' + fila).value = dato.Sector;
            worksheet.getCell('I' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('J' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('K' + fila).value = dato.Estado_equipo;
            worksheet.getCell('L' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('M' + fila).value = dato.Repuesto;
            worksheet.getCell('N' + fila).value = dato.Observacion;
            worksheet.getCell('O' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('P' + fila).value = dato.Aprobado_por;
            fila++; // Avanza a la siguiente fila
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const arreglo1 = idt;
    const arreglo2 = req.body.obsd;
    const obs = "APROBADA | "+arreglo2;
    const arreglo3 = arreglo1.map(Number);
    const date = new Date();
    var arreglo4 = arreglo3.map((item, index) => {
        return [arreglo2[index]];
    });

    await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
        if(err){
            console.log(err);
        }else{                  
            await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    res.json({message: "archivo creado"});
                    let queries = '';

                    arreglo4.forEach(function(item) {
                        queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
                    });
                    pool.query(queries, arreglo3, async (err, result) => {
                        if(err){
                            console.log(err);
                        }else{
                            const emailc = await pool.query(
                                "SELECT\n" +
                                "	USUARIO,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	(\n" +
                                "	SELECT\n" +
                                "		USUARIO \n" +
                                "	FROM\n" +
                                "		(\n" +
                                "		SELECT\n" +
                                "			T.LID,\n" +
                                "			X.* \n" +
                                "		FROM\n" +
                                "			(\n" +
                                "			SELECT\n" +
                                "				L.ID LID,\n" +
                                "				L.UGE LUGE,\n" +
                                "				L.UAR LUAR,\n" +
                                "				L.USEC LUSEC,\n" +
                                "				L.UEQU LUEQU \n" +
                                "			FROM\n" +
                                "				(\n" +
                                "				SELECT\n" +
                                "					V.vce_idEquipo ID,\n" +
                                "					UG.id_user UGE,\n" +
                                "					UA.id_user UAR,\n" +
                                "					US.id_user USEC,\n" +
                                "					UE.id_user UEQU \n" +
                                "				FROM\n" +
                                "					VIEW_equiposCteGerAreSec V\n" +
                                "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
                                "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
                                "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
                                "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
                                "				WHERE\n" +
                                "					V.vce_idEquipo IN (\n" +
                                "					SELECT\n" +
                                "						E.Id \n" +
                                "					FROM\n" +
                                "						Tareas T\n" +
                                "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
                                "					WHERE\n" +
                                "						T.Id IN ( "+arreglo3+" ) \n" +
                                "					GROUP BY\n" +
                                "						E.Id \n" +
                                "					) \n" +
                                "				) AS L \n" +
                                "			) AS T\n" +
                                "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
                                "	WHERE\n" +
                                "		USUARIO IS NOT NULL \n" +
                                "	GROUP BY\n" +
                                "		USUARIO \n" +
                                "	) AS CORREO2\n" +
                                "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
                                "WHERE\n" +
                                "	U.Activo = 1;"
                              );
                    
                              const emailp = await pool.query(
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
    
                            const emailgen = await pool.query(
                                "SELECT\n" +
                                "	U.Id,\n" +
                                "	U.Email \n" +
                                "FROM\n" +
                                "	Usuarios U \n" +
                                "WHERE\n" +
                                "	U.Id_Perfil = 6 \n" +
                                "	AND U.Id_Cliente = " +
                                Id_Cliente +
                                " \n" +
                                "	AND U.Activo = 1;"
                            );
                    
                              const arremail = emailc.map(function (email) {
                                return email.Email;
                              });
                    
                              const arremailp = emailp.map(function (email) {
                                return email.Email;
                              });
    
                              const arremailgen = emailgen.map(function (email) {
                                return email.Email;
                              });
                              
                              const datemail = new Date().toLocaleDateString('en-GB');
                    
                              const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
                              const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                    
                              // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                              const template = hbs.compile(mensaje);
                              const context = {
                                datemail, 
                              };
                              const html = template(context);
                    
                              await transporter.sendMail({
                                from: "SAPMA <sapmadand@sercoing.cl>",
                                // to: "marancibia@sercoing.cl",
                                to: arremailp,
                                cc: [arremail, arremailgen],
                                bcc: correo,
                                subject: "SAPMA - Tareas Aprobadas",
                                html,
                                attachments: [
                                  {
                                    filename: "imagen1.png",
                                    path: "./src/public/img/imagen1.png",
                                    cid: "imagen1",
                                  },
                                  {
                                    filename: 'aprobaciones_'+datemail+'.xlsx',
                                    content: buffer
                                  }
                                ],
                              });

                            
                        }
            
                    });
                }

            });  
            
            
        }
    });
    
});



module.exports = router;