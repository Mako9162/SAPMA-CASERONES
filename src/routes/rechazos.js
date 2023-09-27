const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole, roles } = require('../lib/rol');
const MySQLStore = require('express-mysql-session');
const { query } = require('express');
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path"); 
const request = require('request');
const hbs = require("handlebars");

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

router.get('/rechazadas', isLoggedIn, authRole(['Cli_C']), async (req, res)=>{
    const {Id_Cliente} = req.user;

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
        "	IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "	VD.REPUESTOS AS REPUESTOS, \n" +
        "	VT.Val_obs AS OBS \n" +
        "FROM\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado = 5 \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "   AND U.Descripcion  NOT LIKE '%test' \n" +
        "	AND VT.Val_rechazo = 1 \n" +
        "ORDER BY\n" +
        "	TAREA DESC;",
         (err, result) => {
        if(!result.length){
            res.render('rechazos/rechazos', {Mensaje: "No se encuentran tareas en el rango seleccionado!!!"});

        }else{
            res.render('rechazos/rechazos', {listas: result});
        } 
    });
});

router.get('/rechazadasb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{
    const {Id_Cliente} = req.user;
    const {Id} = req.user;

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
        "	IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +
        "	VD.REPUESTOS AS REPUESTOS, \n" +
        "	VT.Val_obs AS OBS \n" +
        "FROM\n" +
        "	userger US,\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado = 5 \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "   AND U.Descripcion  NOT LIKE '%test'\n" +
        "	AND VT.Val_rechazo = 1 \n" +
        "   AND VD.GERENCIA_ID = US.id_ger \n" +
        "	AND US.id_user = "+Id+"\n" +
        "ORDER BY\n" +
        "	TAREA DESC;",        
             (err, result) => {
        if(!result.length){
            res.render('rechazos/rechazos', {Mensaje: "No se encuentran tareas en el rango seleccionado!!!"});

        }else{
            res.render('rechazos/rechazos', {listasb: result});
        } 
    });
});

router.get('/rechazadasa', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{
    const {Id_Cliente} = req.user;
    const {Id} = req.user;
    const {Login} = req.user;

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
        "	IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +        
        "	VD.REPUESTOS AS REPUESTOS, \n" +
        "	VT.Val_obs AS OBS \n" +
        "FROM\n" +
        "	userarea US,\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "   INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado = 5 \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "	AND VT.Val_rechazo = 1 \n" +
        "   AND U.Descripcion  NOT LIKE '%test'\n" +
        "   AND VD.AREA_ID = US.id_area \n" +
        "	AND US.id_user = "+Id+"\n" +
        "ORDER BY\n" +
        "	TAREA DESC;",   
         (err, result) => {
        if(!result.length){
            res.render('rechazos/rechazos', {Mensaje: "No se encuentran tareas en el rango seleccionado!!!"});

        }else{
            res.render('rechazos/rechazos', {listasa: result});
        } 
    });
});

router.get('/rechazadasd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    const {Id_Cliente} = req.user;
    const {Id} = req.user;
    const {Login} = req.user;

       await pool.query(        "SELECT\n" +
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
       "	IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +       
       "	VD.REPUESTOS AS REPUESTOS, \n" +
       "	VT.Val_obs AS OBS \n" +
       "FROM\n" +
       "	usersector US,\n" +
       "	VIEW_DetalleEquiposDET VD\n" +
       "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
       "	INNER JOIN Tareas_Estado TV ON TV.Te_Id_Tarea = VD.TAREA\n" +
       "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
       "    INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
       "WHERE\n" +
       "	T.Id_Estado = 5 \n" +
       "	AND TV.te_Estado_val = 1 \n" +
       "    AND U.Descripcion  NOT LIKE '%test'\n" +
       "	AND VT.Val_rechazo = 1 \n" +
       "    AND VD.SECTOR_ID = US.id_sector \n" +
       "	AND US.id_user = "+Id+"\n" +
       "ORDER BY\n" +
       "	TAREA DESC;", 
       (err, result) => {
        if(!result.length){
            res.render('rechazos/rechazos', {Mensaje: "No se encuentran tareas en el rango seleccionado!!!"});

        }else{
            res.render('rechazos/rechazos', {listasa: result});
        } 
    });
});

router.get('/rechazadasp', isLoggedIn, async (req, res)=>{
    const {Id_Cliente} = req.user;

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
        "	IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +        
        "	VD.REPUESTOS AS REPUESTOS, \n" +
        "	VT.Val_obs AS OBS \n" +
        "FROM\n" +
        "	VIEW_DetalleEquiposDET VD\n" +
        "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
        "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
        "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
        "    INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
        "WHERE\n" +
        "	T.Id_Estado = 5 \n" +
        "	AND TV.te_Estado_val = 1 \n" +
        "    AND U.Descripcion  NOT LIKE '%test'\n" +
        "	AND VT.Val_rechazo = 1 \n" +
        "ORDER BY\n" +
        "	TAREA DESC;",
        (err, result) => {
        if(!result.length){
            res.render('rechazos/rechazos', {Mensaje: "No se encuentran tareas en el rango seleccionado!!!"});

        }else{
            res.render('rechazos/rechazos', {listas: result});
        } 
    });
});

router.get('/rechazadase', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    const {Id_Cliente} = req.user;
    const {Id} = req.user;
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
       "	IF (VD.OBS_ESTADO_EQUIPO = 'SC', '', CONVERT(CAST(CONVERT(CONCAT(UPPER(LEFT(VD.OBS_ESTADO_EQUIPO,1)), SUBSTRING(VD.OBS_ESTADO_EQUIPO FROM 2))USING latin1) AS BINARY) USING UTF8))	AS OBS_EQUIPO,\n" +       
       "	VD.REPUESTOS AS REPUESTOS, \n" +
       "	VT.Val_obs AS OBS \n" +
       "FROM\n" +
       "	userequipo US,\n" +
       "	VIEW_DetalleEquiposDET VD\n" +
       "	INNER JOIN Tareas T ON T.Id = VD.TAREA\n" +
       "	INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = VD.TAREA\n" +
       "	INNER JOIN Validacion_Tareas VT ON VT.Val_tarea_id = VD.TAREA \n" +
       "    INNER JOIN Usuarios U ON T.Id_Tecnico = U.Id \n" +
       "WHERE\n" +
       "	T.Id_Estado = 5 \n" +
       "	AND TV.te_Estado_val = 1 \n" +
       "	AND VT.Val_rechazo = 1 \n" +
       "    AND U.Descripcion  NOT LIKE '%test'\n" +
       "   AND VD.EQUIPO_ID = US.id_equipo \n" +
       "	AND US.id_user = "+Id+"\n" +
       "ORDER BY\n" +
       "	TAREA DESC;", 
       (err, result) => {
        if(!result.length){
            res.render('rechazos/rechazos', {Mensaje: "No se encuentran tareas en el rango seleccionado!!!"});

        }else{
            res.render('rechazos/rechazos', {listase: result});
        } 
    });
});




router.post('/aprorech', isLoggedIn, authRole(['Cli_C']), async (req, res)=>{
    const datas = Object.values(req.body);    
    const arreglo1 = datas[0];
    const arreglo2 = datas[2];
    const arreglo3 = datas[1];
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs ="  "+arreglo2+date1+" APROBADA OBS: "+arreglo3;
    const Login = req.user.usuario;
    const {Id_Cliente} = req.user;
    
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
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
                                "						T.Id IN ( "+arreglo1+" ) \n" +
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
                            ],
                          });
                    }                
                });
            }
        });

    }else{
        const arreglo4 = arreglo1.map(Number);
        var arreglo5 = arreglo4.map((item, index) => {
            return [arreglo2[index] +' '+date1 +' APROBADA OBS: ' +arreglo3[index]];
        });
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo4], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE  Val_tarea_id IN (?)", [arreglo4] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo5.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+item+"' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo4, async (err, result) => {
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
                                    "						T.Id IN ( "+arreglo4+" ) \n" +
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
                                    ],
                                  });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/aprorechb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{
    const datas = Object.values(req.body);   
    const arreglo1 = datas[0];
    const arreglo2 = datas[2];
    const arreglo3 = datas[1];
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs ="  "+arreglo2+date1+" APROBADA OBS: "+arreglo3;
    const Login = req.user.usuario;
    const {Id_Cliente} = req.user;
    
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
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
                            "						T.Id IN ( "+arreglo1+" ) \n" +
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
                            ],
                          });
                    }
                
                });
            }
        });

    }else{
        const arreglo4 = arreglo1.map(Number);
        var arreglo5 = arreglo4.map((item, index) => {
            return [arreglo2[index] +' '+date1 +' APROBADA OBS: ' +arreglo3[index]];
        });
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo4], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE  Val_tarea_id IN (?)", [arreglo4] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo5.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+item+"' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo4, async (err, result) => {
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
                                    "						T.Id IN ( "+arreglo4+" ) \n" +
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
                                    ],
                                  });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/aprorecha', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{
    const datas = Object.values(req.body);   
    const arreglo1 = datas[0];
    const arreglo2 = datas[2];
    const arreglo3 = datas[1];
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs ="  "+arreglo2+date1+" APROBADA OBS: "+arreglo3;
    const Login = req.user.usuario;
    const {Id_Cliente} = req.user;
    
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
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
                            "						T.Id IN ( "+arreglo1+" ) \n" +
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
                            ],
                          });
                    }
                
                });
            }
        });

    }else{
        const arreglo4 = arreglo1.map(Number);
        var arreglo5 = arreglo4.map((item, index) => {
            return [arreglo2[index] +' '+date1 +' APROBADA OBS: ' +arreglo3[index]];
        });
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo4], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE  Val_tarea_id IN (?)", [arreglo4] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo5.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+item+"' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo4, async (err, result) => {
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
                                    "						T.Id IN ( "+arreglo4+" ) \n" +
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
                                    ],
                                  });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/aprorechd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    const datas = Object.values(req.body);   
    const arreglo1 = datas[0];
    const arreglo2 = datas[2];
    const arreglo3 = datas[1];
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs ="  "+arreglo2+date1+" APROBADA OBS: "+arreglo3;
    const Login = req.user.usuario;
    const {Id_Cliente} = req.user;
    
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
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
                            "						T.Id IN ( "+arreglo1+" ) \n" +
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
                            ],
                          });
                    }
                
                });
            }
        });

    }else{
        const arreglo4 = arreglo1.map(Number);
        var arreglo5 = arreglo4.map((item, index) => {
            return [arreglo2[index] +' '+date1 +' APROBADA OBS: ' +arreglo3[index]];
        });
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo4], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE  Val_tarea_id IN (?)", [arreglo4] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo5.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+item+"' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo4, async (err, result) => {
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
                                    "						T.Id IN ( "+arreglo4+" ) \n" +
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
                                    ],
                                  });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/aproreche', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    const datas = Object.values(req.body);    
    const arreglo1 = datas[0];
    const arreglo2 = datas[2];
    const arreglo3 = datas[1];
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs ="  "+arreglo2+date1+" APROBADA OBS: "+arreglo3;
    const Login = req.user.usuario;
    const {Id_Cliente} = req.user;
    
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
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
                            "						T.Id IN ( "+arreglo1+" ) \n" +
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
                            ],
                          });
                    }
                
                });
            }
        });

    }else{
        const arreglo4 = arreglo1.map(Number);
        var arreglo5 = arreglo4.map((item, index) => {
            return [arreglo2[index] +' '+date1 +' APROBADA OBS: ' +arreglo3[index]];
        });
        await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo4], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW(), Val_rechazo = 0 WHERE  Val_tarea_id IN (?)", [arreglo4] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo5.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+item+"' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo4, async (err, result) => {
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
                                    "						T.Id IN ( "+arreglo4+" ) \n" +
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
                                    ],
                                  });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});




router.post('/rechazos', isLoggedIn, async (req, res)=>{
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const arreglo1 = data1;
    const arreglo2 = datas[1];
    const Login = req.user.usuario; 
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const {Id_Cliente} = req.user;
    const {Email} = req.user;
    const obs = date1 +" RECHAZADA POR: "+Login+" OBS: "+arreglo2+" | ";
    if(typeof arreglo1 === 'string'){
        
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW() WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
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

                        const arremailp = emailp.map(function (email) {
                            return email.Email;
                        });

                        const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                        const mensaje = fs.readFileSync(filePathName1, "utf8");
                        const datemail = new Date().toLocaleDateString('en-GB');

                        // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                        const template = hbs.compile(mensaje);
                        const context = {
                            datemail, 
                        };
                        const html = template(context);

                        await transporter.sendMail({
                            from: "SAPMA <sapmadand@sercoing.cl>",
                            to: arremailp,
                            cc: Email,
                            bcc: correo,
                            subject: "SAPMA - Tareas Rechazadas",
                            html,
                            attachments: [
                            {
                                filename: "imagen1.png",
                                path: "./src/public/img/imagen1.png",
                                cid: "imagen1",
                            },
                            ],
                        });

                    }
                
                });
            }
        });

    }else{
        const arreglo3 = arreglo1.map(Number);
        const date1 = new Date().toLocaleDateString('en-GB');
        const date2 = date1.replace(/\//g, "-");;
        var arreglo4 = arreglo3.map((item, index) => {
            return [arreglo2[index]];
        });
        
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id IN (?)", [arreglo3], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo4.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+date2+""+' RECHAZADA POR: '+Login+' OBS: '+item+" |' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo3, async (err, result) => {
                            if(err){
                                console.log(err);
                            }else{
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
        
                                const arremailp = emailp.map(function (email) {
                                    return email.Email;
                                });
        
                                const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                                const mensaje = fs.readFileSync(filePathName1, "utf8");
                                const datemail = new Date().toLocaleDateString('en-GB');
        
                                // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                                const template = hbs.compile(mensaje);
                                const context = {
                                    datemail, 
                                };
                                const html = template(context);
        
                                await transporter.sendMail({
                                    from: "SAPMA <sapmadand@sercoing.cl>",
                                    to: arremailp,
                                    cc: Email,
                                    bcc: correo,
                                    subject: "SAPMA - Tareas Rechazadas",
                                    html,
                                    attachments: [
                                    {
                                        filename: "imagen1.png",
                                        path: "./src/public/img/imagen1.png",
                                        cid: "imagen1",
                                    },
                                    ],
                                });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/rechazosb', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res)=>{
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const {Email} = req.user;
    const arreglo1 = data1;
    const arreglo2 = datas[1];
    const Login = req.user.usuario; 
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs = date1 +" RECHAZADA POR: "+Login+" OBS: "+arreglo2+" | ";

    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW() WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
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

                        const arremailp = emailp.map(function (email) {
                            return email.Email;
                        });

                        const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                        const mensaje = fs.readFileSync(filePathName1, "utf8");
                        const datemail = new Date().toLocaleDateString('en-GB');

                        // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                        const template = hbs.compile(mensaje);
                        const context = {
                            datemail, 
                        };
                        const html = template(context);

                        await transporter.sendMail({
                            from: "SAPMA <sapmadand@sercoing.cl>",
                            to: arremailp,
                            cc: Email,
                            bcc: correo,
                            subject: "SAPMA - Tareas Rechazadas",
                            html,
                            attachments: [
                            {
                                filename: "imagen1.png",
                                path: "./src/public/img/imagen1.png",
                                cid: "imagen1",
                            },
                            ],
                        });
                    }
                
                });
            }
        });

    }else{
        const arreglo3 = arreglo1.map(Number);
        const date1 = new Date().toLocaleDateString('en-GB');
        const date2 = date1.replace(/\//g, "-");;
        var arreglo4 = arreglo3.map((item, index) => {
            return [arreglo2[index]];
        });
        
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id IN (?)", [arreglo3], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo4.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+date2+""+' RECHAZADA POR: '+Login+' OBS: '+item+" |' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo3, async (err, result) => {
                            if(err){
                                console.log(err);
                            }else{
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
        
                                const arremailp = emailp.map(function (email) {
                                    return email.Email;
                                });
        
                                const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                                const mensaje = fs.readFileSync(filePathName1, "utf8");
                                const datemail = new Date().toLocaleDateString('en-GB');
        
                                // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                                const template = hbs.compile(mensaje);
                                const context = {
                                    datemail, 
                                };
                                const html = template(context);
        
                                await transporter.sendMail({
                                    from: "SAPMA <sapmadand@sercoing.cl>",
                                    to: arremailp,
                                    cc: Email,
                                    bcc: correo,
                                    subject: "SAPMA - Tareas Rechazadas",
                                    html,
                                    attachments: [
                                    {
                                        filename: "imagen1.png",
                                        path: "./src/public/img/imagen1.png",
                                        cid: "imagen1",
                                    },
                                    ],
                                });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/rechazosa', isLoggedIn, authRole(['Cli_A']), async (req, res)=>{
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const { Id_Cliente} = req.user;
    const {Email} = req.user;
    const arreglo1 = data1;
    const arreglo2 = datas[1];
    const Login = req.user.usuario; 
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs = date1 +" RECHAZADA POR: "+Login+" OBS: "+arreglo2+" | ";
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW() WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
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

                        const arremailp = emailp.map(function (email) {
                            return email.Email;
                        });

                        const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                        const mensaje = fs.readFileSync(filePathName1, "utf8");
                        const datemail = new Date().toLocaleDateString('en-GB');

                        // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                        const template = hbs.compile(mensaje);
                        const context = {
                            datemail, 
                        };
                        const html = template(context);

                        await transporter.sendMail({
                            from: "SAPMA <sapmadand@sercoing.cl>",
                            to: arremailp,
                            cc: Email,
                            bcc: correo,
                            subject: "SAPMA - Tareas Rechazadas",
                            html,
                            attachments: [
                            {
                                filename: "imagen1.png",
                                path: "./src/public/img/imagen1.png",
                                cid: "imagen1",
                            },
                            ],
                        });
                    }
                
                });
            }
        });

    }else{
        const arreglo3 = arreglo1.map(Number);
        const date1 = new Date().toLocaleDateString('en-GB');
        const date2 = date1.replace(/\//g, "-");;
        var arreglo4 = arreglo3.map((item, index) => {
            return [arreglo2[index]];
        });
        
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id IN (?)", [arreglo3], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo4.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+date2+""+' RECHAZADA POR: '+Login+' OBS: '+item+" |' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo3, async (err, result) => {
                            if(err){
                                console.log(err);
                            }else{
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
        
                                const arremailp = emailp.map(function (email) {
                                    return email.Email;
                                });
        
                                const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                                const mensaje = fs.readFileSync(filePathName1, "utf8");
                                const datemail = new Date().toLocaleDateString('en-GB');
        
                                // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                                const template = hbs.compile(mensaje);
                                const context = {
                                    datemail, 
                                };
                                const html = template(context);
        
                                await transporter.sendMail({
                                    from: "SAPMA <sapmadand@sercoing.cl>",
                                    to: arremailp,
                                    cc: Email,
                                    bcc: correo,
                                    subject: "SAPMA - Tareas Rechazadas",
                                    html,
                                    attachments: [
                                    {
                                        filename: "imagen1.png",
                                        path: "./src/public/img/imagen1.png",
                                        cid: "imagen1",
                                    },
                                    ],
                                });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/rechazosd', isLoggedIn, authRole(['Cli_D']), async (req, res)=>{
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const {Email} = req.user;
    const arreglo1 = data1;
    const arreglo2 = datas[1];
    const Login = req.user.usuario; 
    console.log(Login);
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs = date1 +" RECHAZADA POR: "+Login+" OBS: "+arreglo2+" | ";
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW() WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
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

                        const arremailp = emailp.map(function (email) {
                            return email.Email;
                        });

                        const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                        const mensaje = fs.readFileSync(filePathName1, "utf8");
                        const datemail = new Date().toLocaleDateString('en-GB');

                        // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                        const template = hbs.compile(mensaje);
                        const context = {
                            datemail, 
                        };
                        const html = template(context);

                        await transporter.sendMail({
                            from: "SAPMA <sapmadand@sercoing.cl>",
                            to: arremailp,
                            cc: Email,
                            bcc: correo,
                            subject: "SAPMA - Tareas Rechazadas",
                            html,
                            attachments: [
                            {
                                filename: "imagen1.png",
                                path: "./src/public/img/imagen1.png",
                                cid: "imagen1",
                            },
                            ],
                        });
                    }
                
                });
            }
        });

    }else{
        const arreglo3 = arreglo1.map(Number);
        const date1 = new Date().toLocaleDateString('en-GB');
        const date2 = date1.replace(/\//g, "-");;
        var arreglo4 = arreglo3.map((item, index) => {
            return [arreglo2[index]];
        });
        
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id IN (?)", [arreglo3], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo4.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+date2+""+' RECHAZADA POR: '+Login+' OBS: '+item+" |' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo3, async (err, result) => {
                            if(err){
                                console.log(err);
                            }else{
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
        
                                const arremailp = emailp.map(function (email) {
                                    return email.Email;
                                });
        
                                const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                                const mensaje = fs.readFileSync(filePathName1, "utf8");
                                const datemail = new Date().toLocaleDateString('en-GB');
        
                                // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                                const template = hbs.compile(mensaje);
                                const context = {
                                    datemail, 
                                };
                                const html = template(context);
        
                                await transporter.sendMail({
                                    from: "SAPMA <sapmadand@sercoing.cl>",
                                    to: arremailp,
                                    cc: Email,
                                    bcc: correo,
                                    subject: "SAPMA - Tareas Rechazadas",
                                    html,
                                    attachments: [
                                    {
                                        filename: "imagen1.png",
                                        path: "./src/public/img/imagen1.png",
                                        cid: "imagen1",
                                    },
                                    ],
                                });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});

router.post('/rechazose', isLoggedIn, authRole(['Cli_E']), async (req, res)=>{
    const datas = Object.values(req.body);
    const data1 = datas[0];
    const {Id_Cliente} = req.user;
    const {Email} = req.user;
    const arreglo1 = data1;
    const arreglo2 = datas[1];
    const Login = req.user.usuario; 
    console.log(Login);
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs = date1 +" RECHAZADA POR: "+Login+" OBS: "+arreglo2+" | ";
    if(typeof arreglo1 === 'string'){
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                await pool.query("UPDATE Validacion_Tareas SET Val_obs = '"+obs+"',  Val_respnombre = '"+Login+ "', Val_fechaval_cte = NOW() WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
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

                        const arremailp = emailp.map(function (email) {
                            return email.Email;
                        });

                        const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                        const mensaje = fs.readFileSync(filePathName1, "utf8");
                        const datemail = new Date().toLocaleDateString('en-GB');

                        // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                        const template = hbs.compile(mensaje);
                        const context = {
                            datemail, 
                        };
                        const html = template(context);

                        await transporter.sendMail({
                            from: "SAPMA <sapmadand@sercoing.cl>",
                            to: arremailp,
                            cc: Email,
                            bcc: correo,
                            subject: "SAPMA - Tareas Rechazadas",
                            html,
                            attachments: [
                            {
                                filename: "imagen1.png",
                                path: "./src/public/img/imagen1.png",
                                cid: "imagen1",
                            },
                            ],
                        });
                    }
                
                });
            }
        });

    }else{
        const arreglo3 = arreglo1.map(Number);
        const date1 = new Date().toLocaleDateString('en-GB');
        const date2 = date1.replace(/\//g, "-");;
        var arreglo4 = arreglo3.map((item, index) => {
            return [arreglo2[index]];
        });
        
        await pool.query("UPDATE Validacion_Tareas SET Val_rechazo = 1 WHERE Val_tarea_id IN (?)", [arreglo3], async (err, result) => {
            if(err){
                console.log(err);
            }else{
                                
                await pool.query("UPDATE Validacion_Tareas SET Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
                    if(err){
                        console.log(err);
                    }else{
                        let queries = '';

                        arreglo4.forEach(function(item) {
                            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+date2+""+' RECHAZADA POR: '+Login+' OBS: '+item+" |' WHERE Val_tarea_id = ?; "; 

                        });
                        pool.query(queries, arreglo3, async (err, result) => {
                            if(err){
                                console.log(err);
                            }else{
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
        
                                const arremailp = emailp.map(function (email) {
                                    return email.Email;
                                });
        
                                const filePathName1 = path.resolve(__dirname, "../views/email/emailrech.hbs"); 
                                const mensaje = fs.readFileSync(filePathName1, "utf8");
                                const datemail = new Date().toLocaleDateString('en-GB');
        
                                // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                                const template = hbs.compile(mensaje);
                                const context = {
                                    datemail, 
                                };
                                const html = template(context);
        
                                await transporter.sendMail({
                                    from: "SAPMA <sapmadand@sercoing.cl>",
                                    to: arremailp,
                                    cc: Email,
                                    bcc: correo,
                                    subject: "SAPMA - Tareas Rechazadas",
                                    html,
                                    attachments: [
                                    {
                                        filename: "imagen1.png",
                                        path: "./src/public/img/imagen1.png",
                                        cid: "imagen1",
                                    },
                                    ],
                                });
                            }
                
                        });
                    }
                
                });

                        
            }
        });
    }

});




router.post('/mensajerech', isLoggedIn, async (req, res)=>{
    const datas = Object.values(req.body);
    const {Id_Cliente} = req.user;
    const arreglo1 = datas[0];
    const arreglo2 = datas[2];
    const arreglo3 = datas[1];
    const date = new Date().toLocaleDateString('en-GB');
    const date1 = date.replace(/\//g, "-");
    const obs =arreglo2 +' '+ date1 + ' OBS: '+arreglo3+' | ';

        if(typeof arreglo1 === 'string'){
            await pool.query("UPDATE Validacion_Tareas SET Val_obs = '"+obs+"' WHERE Val_tarea_id = ?", [arreglo1], async (err, result) => {
                if(err){
                    console.log(err);
                }else{
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

                    const Email = await pool.query(
                        "SELECT\n" +
                        "Email\n" +
                        "FROM\n" +
                        "	Usuarios U\n" +
                        "	INNER JOIN Validacion_Tareas VT ON VT.Val_respnombre = U.Descripcion\n" +
                        "WHERE\n" +
                        " VT.Val_tarea_id IN ("+arreglo1+")"
                    );                     

                    const arremailp = emailp.map(function (email) {
                        return email.Email;
                    });

                    const arreEmail = Email.map(function (email) {
                        return email.Email;
                    });

                    const filePathName1 = path.resolve(__dirname, "../views/email/emailmesj.hbs"); 
                    const mensaje = fs.readFileSync(filePathName1, "utf8");
                    const datemail = new Date().toLocaleDateString('en-GB');

                    // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                    const template = hbs.compile(mensaje);
                    const context = {
                        datemail, 
                    };
                    const html = template(context);

                    await transporter.sendMail({
                        from: "SAPMA <sapmadand@sercoing.cl>",
                        to: arreEmail,
                        cc: arremailp,
                        bcc: correo,
                        subject: "SAPMA - Notificación de Comentarios en Tareas Rechazadas",
                        html,
                        attachments: [
                        {
                            filename: "imagen1.png",
                            path: "./src/public/img/imagen1.png",
                            cid: "imagen1",
                        },
                        ],
                    });
                }
                
            });
        }else{
            const arreglo4 = arreglo1.map(Number);
            var arreglo5 = arreglo4.map((item, index) => {
                return [arreglo2[index] +' '+date1 +' OBS: ' +arreglo3[index]+' | '];
            });

            let queries = '';

            arreglo5.forEach(function(item) {
                 queries += "UPDATE Validacion_Tareas SET Val_obs = '"+item+"' WHERE Val_tarea_id = ?; "; 

            });
             pool.query(queries, arreglo4, async (err, result) => {
                if(err){
                    console.log(err);
                }else{
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

                    const Email = await pool.query(
                        "SELECT\n" +
                        "Email\n" +
                        "FROM\n" +
                        "	Usuarios U\n" +
                        "	INNER JOIN Validacion_Tareas VT ON VT.Val_respnombre = U.Descripcion\n" +
                        "WHERE\n" +
                        " VT.Val_tarea_id IN ("+arreglo1+")"
                    );         

                    const arremailp = emailp.map(function (email) {
                        return email.Email;
                    });

                    const arreEmail = Email.map(function (email) {
                        return email.Email;
                    });

                    const filePathName1 = path.resolve(__dirname, "../views/email/emailmesj.hbs"); 
                    const mensaje = fs.readFileSync(filePathName1, "utf8");
                    const datemail = new Date().toLocaleDateString('en-GB');

                    // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
                    const template = hbs.compile(mensaje);
                    const context = {
                        datemail, 
                    };
                    const html = template(context);

                    await transporter.sendMail({
                        from: "SAPMA <sapmadand@sercoing.cl>",
                        to: arreEmail,
                        cc: arremailp,
                        subject: "SAPMA - Notificación de Comentarios en Tareas Rechazadas",
                        html,
                        attachments: [
                        {
                            filename: "imagen1.png",
                            path: "./src/public/img/imagen1.png",
                            cid: "imagen1",
                        },
                        ],
                    });
                }
                
            });
        }
});

module.exports = router;