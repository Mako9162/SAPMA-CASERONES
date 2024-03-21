const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole } = require('../lib/rol');
const moment = require('moment');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const hbs = require("handlebars");

const correo = "sapmamlcc@sercoing.cl";
const pass = "y_ret@9'23tJ$.`N";

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

router.get('/reportes', isLoggedIn, async (req, res) => {
    const {Id_Cliente} = req.user;
    const gerencias= await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' GROUP BY vcgas_idGerencia ');
    res.render('reportes/reporte', {
        gerencias: gerencias
    });
    
});  

router.get('/get_databi', function(request, response, next){

    const type = request.query.type;

    const search_query = request.query.parent_value;
    console.log(search_query);

    if(type == 'load_areass')
    {
        var query = `
        SELECT DISTINCT vcgas_idArea AS Id, vcgas_areaN AS Data FROM VIEW_ClienteGerAreSec 
        WHERE vcgas_idGerencia = '${search_query}' 
        ORDER BY vcgas_areaN ASC
        `;
    }

    if(type == 'load_sectoress')
    {
        var query = `
        SELECT DISTINCT vcgas_idSector AS Id, vcgas_sectorN AS Data FROM VIEW_ClienteGerAreSec 
        WHERE vcgas_idArea = '${search_query}' 
        ORDER BY vcgas_sectorN ASC
        `;
    }

    if(type == 'load_equiposs')
    {
        var query = `
        SELECT DISTINCT vce_idEquipo AS Id, vce_codigo AS Data FROM VIEW_equiposCteGerAreSec 
        WHERE vcgas_idSector = '${search_query}' 
        ORDER BY vce_codigo ASC
        `;
    }


    pool.query(query, function(error, data){

        const data_arr = [];

        data.forEach(function(row){
            data_arr.push([row.Id, row.Data]);
        });

        response.json(data_arr);

    });

});

router.post('/reportes', isLoggedIn, async (req, res) => {
    const {Id_Cliente} = req.user;
    const date = new Date().toLocaleDateString('en-GB');
    const fecha = date.replace(/\//g, "-");
    const {date1, date2, nombre, enlace, gerencia, area, sector, equipo, rep_todo} = req.body;
    const ger = [Id_Cliente, date1, date2, nombre, enlace, gerencia, 5, 1, rep_todo];
    const are = [Id_Cliente, date1, date2, nombre, enlace, area, 4, 1, rep_todo];
    const sec = [Id_Cliente, date1, date2, nombre, enlace, sector, 7, 1, rep_todo];
    const equi = [Id_Cliente, date1, date2, nombre, enlace, equipo, 8, 1, rep_todo];
    const todo = [Id_Cliente, date1, date2, nombre, enlace, 0 , 6, 1, rep_todo];
    console.log(req.body);
    if (gerencia.length > 0 && !area && !sector) {
        await pool.query('INSERT INTO reporte_bi (rep_Id_cli, rep_fecha_ini, rep_fecha_fin, rep_nombre, rep_enlace, rep_perfil, rep_id_perfil, rep_estado, rep_todos) VALUES (?)',[ger], (err, req) =>{
            if (err) {
                console.log(err);
            }else{
                console.log('gerencia');
            }
        });
    }else if (gerencia.length > 0 && area.length > 0 && !sector){
        await pool.query('INSERT INTO reporte_bi (rep_Id_cli, rep_fecha_ini, rep_fecha_fin, rep_nombre, rep_enlace, rep_perfil, rep_id_perfil, rep_estado, rep_todos) VALUES (?)',[are], (err, req) =>{
            if (err) {
                console.log(err);
            }else{
                console.log('area');
            }
        });
    }else if (gerencia.length > 0 && area.length > 0 && sector.length > 0 && !equipo){
        await pool.query('INSERT INTO reporte_bi (rep_Id_cli, rep_fecha_ini, rep_fecha_fin, rep_nombre, rep_enlace, rep_perfil, rep_id_perfil, rep_estado, rep_todos) VALUES (?)',[sec], (err, req) =>{
            if (err) {
                console.log(err);
            }else{
                console.log('sector');
            }
        });
    }else if(gerencia.length > 0 && area.length > 0 && sector.length > 0  && equipo.length > 0){
        await pool.query('INSERT INTO reporte_bi (rep_Id_cli, rep_fecha_ini, rep_fecha_fin, rep_nombre, rep_enlace, rep_perfil, rep_id_perfil, rep_estado, rep_todos) VALUES (?)',[equi], (err, req) =>{
            if (err) {
                console.log(err);
            }else{
                console.log('equipo');
            }
        });
    }else if (!gerencia && !area && !sector && !equipo){
        await pool.query('INSERT INTO reporte_bi (rep_Id_cli, rep_fecha_ini, rep_fecha_fin, rep_nombre, rep_enlace, rep_perfil, rep_id_perfil, rep_estado, rep_todos) VALUES (?)',[todo], (err, req) =>{
            if (err) {
                console.log(err);
            }else{
                console.log('todo');
            }
        });
        res.render('reportes/reporte',{ 
            title: "Debe seleccionar una gerencia, area o sector",
            gerencias: gerencia 
        });
    }    
});   

router.get('/listarep', isLoggedIn, async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query(
        "SELECT\n" +
        "	R.rep_id AS REPORTE,\n" +
        "	DATE_FORMAT( R.rep_fecha_ini, '%d-%m-%Y' ) AS FECHA_INI,\n" +
        "	DATE_FORMAT( R.rep_fecha_fin, '%d-%m-%Y' ) AS FECHA_FIN,\n" +
        "	DATE_FORMAT( R.rep_fecha_carga, '%d-%m-%Y' ) AS FECHA_CARGA,\n" +
        "	R.rep_nombre,\n" +
        "	R.rep_enlace,\n" +
        "IF\n" +
        "	(\n" +
        "		R.rep_id_perfil = 5,\n" +
        "		'GERENCIA',\n" +
        "	IF\n" +
        "		(\n" +
        "			R.rep_id_perfil = 4,\n" +
        "			'AREA',\n" +
        "		IF\n" +
        "			(\n" +
        "				R.rep_id_perfil = 8,\n" +
        "				'EQUIPO',\n" +
        "			IF\n" +
        "			( R.rep_id_perfil = 7, 'SECTOR', 'CLIENTE' )))) AS PERFIL,\n" +
        "	CONCAT_WS( '\\\\', G.Descripcion, A.Descripcion, E.Descripcion, S.Descripcion, C.Descripcion ) AS DETALLE \n" +
        "FROM\n" +
        "	reporte_bi R\n" +
        "	LEFT JOIN Gerencias G ON R.rep_perfil = G.Id \n" +
        "	AND R.rep_id_perfil = 5\n" +
        "	LEFT JOIN Equipos E ON R.rep_perfil = E.Id \n" +
        "	AND R.rep_id_perfil = 8\n" +
        "	LEFT JOIN Areas A ON R.rep_perfil = A.Id \n" +
        "	AND R.rep_id_perfil = 4\n" +
        "	LEFT JOIN Sectores S ON R.rep_perfil = S.Id \n" +
        "	AND R.rep_id_perfil = 7\n" +
        "	LEFT JOIN Clientes C ON R.rep_Id_cli = C.Id \n" +
        "	AND R.rep_id_perfil = 6 \n" +
        "WHERE\n" +
        "	R.rep_Id_cli = "+Id_Cliente+"\n" +
        "	AND R.rep_estado = 1;"
        , (err, result) => {
        if(!result.length){
            res.render('reportes/listarep', {message: 'No hay reportes en el sistema'});       
        }else{
            res.render('reportes/listarep', {reportes: result});
        }
    });
});

router.get('/listarepc', isLoggedIn, authRole(['Cli_C']), async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query(
        "    SELECT\n" +
        "        	R.rep_id AS REPORTE,\n" +
        "        	DATE_FORMAT( R.rep_fecha_ini, '%d-%m-%Y' ) AS FECHA_INI,\n" +
        "        	DATE_FORMAT( R.rep_fecha_fin, '%d-%m-%Y' ) AS FECHA_FIN,\n" +
        "        	DATE_FORMAT( R.rep_fecha_carga, '%d-%m-%Y' ) AS FECHA_CARGA,\n" +
        "        	R.rep_nombre,\n" +
        "        	R.rep_enlace,\n" +
        "        IF\n" +
        "        	(\n" +
        "        		R.rep_id_perfil = 5,\n" +
        "        		'GERENCIA',\n" +
        "        	IF\n" +
        "        		(\n" +
        "        			R.rep_id_perfil = 4,\n" +
        "        			'AREA',\n" +
        "        		IF\n" +
        "        			(\n" +
        "        				R.rep_id_perfil = 8,\n" +
        "        				'EQUIPO',\n" +
        "        			IF\n" +
        "        			( R.rep_id_perfil = 7, 'SECTOR', 'CLIENTE' )))) AS PERFIL,\n" +
        "        	CONCAT_WS( '\\\\\\\\', G.Descripcion, A.Descripcion, E.Descripcion, S.Descripcion, C.Descripcion ) AS DETALLE \n" +
        "        FROM\n" +
        "        	reporte_bi R\n" +
        "        	LEFT JOIN Gerencias G ON R.rep_perfil = G.Id \n" +
        "        	AND R.rep_id_perfil = 5\n" +
        "        	LEFT JOIN Equipos E ON R.rep_perfil = E.Id \n" +
        "        	AND R.rep_id_perfil = 8\n" +
        "        	LEFT JOIN Areas A ON R.rep_perfil = A.Id \n" +
        "        	AND R.rep_id_perfil = 4\n" +
        "        	LEFT JOIN Sectores S ON R.rep_perfil = S.Id \n" +
        "        	AND R.rep_id_perfil = 7\n" +
        "        	LEFT JOIN Clientes C ON R.rep_Id_cli = C.Id \n" +
        "        	AND R.rep_id_perfil = 6 \n" +
        "        WHERE\n" +
        "        	R.rep_Id_cli = "+Id_Cliente+"\n" +
        "           AND R.rep_id_perfil = 6 \n" +
        "			OR R.rep_todos = 1\n" +
        "        	AND R.rep_estado = 1"    
        , (err, result) => {
        if(!result.length){
            res.render('reportes/listarep', {message: 'No hay reportes en el sistema'});       
        }else{
            res.render('reportes/listarep', {reportes: result});
        
        }
    });
});

router.get('/listarepb', isLoggedIn, authRole(['Cli_B', ['GerVer']]), async (req, res) => {
    const {Id} = req.user;
    const {Id_Cliente} = req.user;
    await pool.query(    "SELECT\n" +
        "	R.rep_id AS REPORTE,\n" +
        "	DATE_FORMAT( R.rep_fecha_ini, '%d-%m-%Y' ) AS FECHA_INI,\n" +
        "	DATE_FORMAT( R.rep_fecha_fin, '%d-%m-%Y' ) AS FECHA_FIN,\n" +
        "	DATE_FORMAT( R.rep_fecha_carga, '%d-%m-%Y' ) AS FECHA_CARGA,\n" +
        "	R.rep_nombre,\n" +
        "	R.rep_enlace,\n" +
        "IF\n" +
        "	(\n" +
        "		R.rep_id_perfil = 5,\n" +
        "		'GERENCIA',\n" +
        "	IF\n" +
        "		(\n" +
        "			R.rep_id_perfil = 4,\n" +
        "			'AREA',\n" +
        "		IF\n" +
        "			(\n" +
        "				R.rep_id_perfil = 8,\n" +
        "				'EQUIPO',\n" +
        "			IF\n" +
        "			( R.rep_id_perfil = 7, 'SECTOR', 'CLIENTE' )))) AS PERFIL,\n" +
        "	CONCAT_WS( '\\\\', G.Descripcion, A.Descripcion, E.Descripcion, S.Descripcion, C.Descripcion ) AS DETALLE \n" +
        "FROM\n" +
        "	reporte_bi R\n" +
        "	LEFT JOIN Gerencias G ON R.rep_perfil = G.Id \n" +
        "	AND R.rep_id_perfil = 5\n" +
        "	LEFT JOIN Equipos E ON R.rep_perfil = E.Id \n" +
        "	AND R.rep_id_perfil = 8\n" +
        "	LEFT JOIN Areas A ON R.rep_perfil = A.Id \n" +
        "	AND R.rep_id_perfil = 4\n" +
        "	LEFT JOIN Sectores S ON R.rep_perfil = S.Id \n" +
        "	AND R.rep_id_perfil = 7\n" +
        "	LEFT JOIN Clientes C ON R.rep_Id_cli = C.Id \n" +
        "	AND R.rep_id_perfil = 6 \n" +
    "   LEFT JOIN userger UG ON R.rep_perfil = UG.id_ger\n" +
    "WHERE\n" +
    "	R.rep_Id_cli = "+Id_Cliente+" \n" +
    "   AND R.rep_estado = 1 \n" +
    "   ANd UG.id_user = "+Id+" ;", (err, result) => {
        if(!result.length){
            res.render('reportes/listarep', {message: 'No hay reportes en el sistema'});       
        }else{
            res.render('reportes/listarep', {reportes: result});
           
        }
    });
});

router.get('/listarepa', isLoggedIn, authRole(['Cli_A']), async (req, res) => {
    const {Id} = req.user;
    const {Id_Cliente} = req.user;
    await pool.query(   
        "SELECT\n" +
        "	R.rep_id AS REPORTE,\n" +
        "	DATE_FORMAT( R.rep_fecha_ini, '%d-%m-%Y' ) AS FECHA_INI,\n" +
        "	DATE_FORMAT( R.rep_fecha_fin, '%d-%m-%Y' ) AS FECHA_FIN,\n" +
        "	DATE_FORMAT( R.rep_fecha_carga, '%d-%m-%Y' ) AS FECHA_CARGA,\n" +
        "	R.rep_nombre,\n" +
        "	R.rep_enlace,\n" +
        "IF\n" +
        "	(\n" +
        "		R.rep_id_perfil = 5,\n" +
        "		'GERENCIA',\n" +
        "	IF\n" +
        "		(\n" +
        "			R.rep_id_perfil = 4,\n" +
        "			'AREA',\n" +
        "		IF\n" +
        "			(\n" +
        "				R.rep_id_perfil = 8,\n" +
        "				'EQUIPO',\n" +
        "			IF\n" +
        "			( R.rep_id_perfil = 7, 'SECTOR', 'CLIENTE' )))) AS PERFIL,\n" +
        "	CONCAT_WS( '\\\\\\\\', G.Descripcion, A.Descripcion, E.Descripcion, S.Descripcion, C.Descripcion ) AS DETALLE \n" +
        "FROM\n" +
        "	reporte_bi R\n" +
        "	LEFT JOIN Gerencias G ON R.rep_perfil = G.Id \n" +
        "	AND R.rep_id_perfil = 5\n" +
        "	LEFT JOIN Equipos E ON R.rep_perfil = E.Id \n" +
        "	AND R.rep_id_perfil = 8\n" +
        "	LEFT JOIN Areas A ON R.rep_perfil = A.Id \n" +
        "	AND R.rep_id_perfil = 4\n" +
        "	LEFT JOIN Sectores S ON R.rep_perfil = S.Id \n" +
        "	AND R.rep_id_perfil = 7\n" +
        "	LEFT JOIN Clientes C ON R.rep_Id_cli = C.Id \n" +
        "	AND R.rep_id_perfil = 6\n" +
        "	LEFT JOIN userarea UG ON R.rep_perfil = UG.id_area \n" +
        "WHERE\n" +
        "	( R.rep_Id_cli = "+Id_Cliente+" AND R.rep_estado = 1 AND UG.id_user = "+Id+" ) \n" +
        "	OR R.rep_id IN ( SELECT rep_id FROM userarea UA INNER JOIN reporte_bi RE ON RE.rep_perfil = UA.id_ger WHERE UA.id_user = "+Id+" AND RE.rep_todos = 1 GROUP BY rep_id ) GROUP BY R.rep_id;"
        , (err, result) => {
            if(!result.length){
                res.render('reportes/listarep', {message: 'No hay reportes en el sistema'});       
            }else{
                res.render('reportes/listarep', {reportes: result});
            
            }
    });
});

router.get('/listarepd', isLoggedIn, authRole(['Cli_D']), async (req, res) => {
    const {Id} = req.user;
    const {Id_Cliente} = req.user;
    await pool.query(  "SELECT\n" +
        "	R.rep_id AS REPORTE,\n" +
        "	DATE_FORMAT( R.rep_fecha_ini, '%d-%m-%Y' ) AS FECHA_INI,\n" +
        "	DATE_FORMAT( R.rep_fecha_fin, '%d-%m-%Y' ) AS FECHA_FIN,\n" +
        "	DATE_FORMAT( R.rep_fecha_carga, '%d-%m-%Y' ) AS FECHA_CARGA,\n" +
        "	R.rep_nombre,\n" +
        "	R.rep_enlace,\n" +
        "IF\n" +
        "	(\n" +
        "		R.rep_id_perfil = 5,\n" +
        "		'GERENCIA',\n" +
        "	IF\n" +
        "		(\n" +
        "			R.rep_id_perfil = 4,\n" +
        "			'AREA',\n" +
        "		IF\n" +
        "			(\n" +
        "				R.rep_id_perfil = 8,\n" +
        "				'EQUIPO',\n" +
        "			IF\n" +
        "			( R.rep_id_perfil = 7, 'SECTOR', 'CLIENTE' )))) AS PERFIL,\n" +
        "	CONCAT_WS( '\\\\\\\\', G.Descripcion, A.Descripcion, E.Descripcion, S.Descripcion, C.Descripcion ) AS DETALLE \n" +
        "FROM\n" +
        "	reporte_bi R\n" +
        "	LEFT JOIN Gerencias G ON R.rep_perfil = G.Id \n" +
        "	AND R.rep_id_perfil = 5\n" +
        "	LEFT JOIN Equipos E ON R.rep_perfil = E.Id \n" +
        "	AND R.rep_id_perfil = 8\n" +
        "	LEFT JOIN Areas A ON R.rep_perfil = A.Id \n" +
        "	AND R.rep_id_perfil = 4\n" +
        "	LEFT JOIN Sectores S ON R.rep_perfil = S.Id \n" +
        "	AND R.rep_id_perfil = 7\n" +
        "	LEFT JOIN Clientes C ON R.rep_Id_cli = C.Id \n" +
        "	AND R.rep_id_perfil = 6\n" +
        "	LEFT JOIN usersector US ON R.rep_perfil = US.id_sector \n" +
        "WHERE\n" +
        "	( R.rep_Id_cli = "+Id_Cliente+" AND R.rep_estado = 1 AND US.id_user = "+Id+" ) \n" +
        "	OR R.rep_id IN (\n" +
        "	SELECT\n" +
        "		rep_id \n" +
        "	FROM\n" +
        "		usersector US\n" +
        "		INNER JOIN reporte_bi RE ON RE.rep_perfil = US.id_ger \n" +
        "	WHERE\n" +
        "		US.id_user = "+Id+" \n" +
        "		AND RE.rep_todos = 1 \n" +
        "	GROUP BY\n" +
        "	rep_id \n" +
        "	)GROUP BY R.rep_id;"
        , (err, result) => {
        if(!result.length){
            res.render('reportes/listarep', {message: 'No hay reportes en el sistema'});       
        }else{
            res.render('reportes/listarep', {reportes: result});
           
        }
    });
});

router.get('/listarepe', isLoggedIn, authRole(['Cli_E']), async (req, res) => {
    const {Id} = req.user;
    const {Id_Cliente} = req.user;
    await pool.query("SELECT\n" +
        "	R.rep_id AS REPORTE,\n" +
        "	DATE_FORMAT( R.rep_fecha_ini, '%d-%m-%Y' ) AS FECHA_INI,\n" +
        "	DATE_FORMAT( R.rep_fecha_fin, '%d-%m-%Y' ) AS FECHA_FIN,\n" +
        "	DATE_FORMAT( R.rep_fecha_carga, '%d-%m-%Y' ) AS FECHA_CARGA,\n" +
        "	R.rep_nombre,\n" +
        "	R.rep_enlace,\n" +
        "IF\n" +
        "	(\n" +
        "		R.rep_id_perfil = 5,\n" +
        "		'GERENCIA',\n" +
        "	IF\n" +
        "		(\n" +
        "			R.rep_id_perfil = 4,\n" +
        "			'AREA',\n" +
        "		IF\n" +
        "			(\n" +
        "				R.rep_id_perfil = 8,\n" +
        "				'EQUIPO',\n" +
        "			IF\n" +
        "			( R.rep_id_perfil = 7, 'SECTOR', 'CLIENTE' )))) AS PERFIL,\n" +
        "	CONCAT_WS( '\\\\\\\\', G.Descripcion, A.Descripcion, E.Descripcion, S.Descripcion, C.Descripcion ) AS DETALLE \n" +
        "FROM\n" +
        "	reporte_bi R\n" +
        "	LEFT JOIN Gerencias G ON R.rep_perfil = G.Id \n" +
        "	AND R.rep_id_perfil = 5\n" +
        "	LEFT JOIN Equipos E ON R.rep_perfil = E.Id \n" +
        "	AND R.rep_id_perfil = 8\n" +
        "	LEFT JOIN Areas A ON R.rep_perfil = A.Id \n" +
        "	AND R.rep_id_perfil = 4\n" +
        "	LEFT JOIN Sectores S ON R.rep_perfil = S.Id \n" +
        "	AND R.rep_id_perfil = 7\n" +
        "	LEFT JOIN Clientes C ON R.rep_Id_cli = C.Id \n" +
        "	AND R.rep_id_perfil = 6\n" +
        "	LEFT JOIN userequipo US ON R.rep_perfil = US.id_equipo \n" +
        "WHERE\n" +
        "	( R.rep_Id_cli = 28 AND R.rep_estado = 1 AND US.id_user = 318 ) \n" +
        "	OR R.rep_id IN (\n" +
        "	SELECT\n" +
        "		rep_id \n" +
        "	FROM\n" +
        "		userequipo UE\n" +
        "		INNER JOIN reporte_bi RE ON RE.rep_perfil = UE.id_ger \n" +
        "	WHERE\n" +
        "		UE.id_user = 318 \n" +
        "		AND RE.rep_todos = 1 \n" +
        "	GROUP BY\n" +
        "		rep_id \n" +
        "	) \n" +
        "GROUP BY\n" +
        "	R.rep_id;", (err, result) => {
        if(!result.length){
            res.render('reportes/listarep', {message: 'No hay reportes en el sistema'});       
        }else{
            res.render('reportes/listarep', {reportes: result});
           
        }
    });
});

router.get('/vistarepo/:Id', isLoggedIn, async (req, res) => {
    const {Id} = req.params;

    await pool.query('SELECT rep_enlace FROM reporte_bi WHERE rep_id = '+Id+'', (err, result) => {
        if (err) {
            console.log(err);
        }else{
            const powerbi =Object.values(result);
            const power = powerbi[0].rep_enlace;
            res.render('reportes/vistarepo', {power:power});
        }
    });
   
});

router.get('/vistarepoc/:Id', isLoggedIn, authRole(['Cli_C']), async (req, res) => {
    const {Id} = req.params;
    console.log(Id);

    await pool.query('SELECT rep_enlace FROM reporte_bi WHERE rep_id = '+Id+'', (err, result) => {
        if (err) {
            console.log(err);
        }else{
            const powerbi =Object.values(result);
            const power = powerbi[0].rep_enlace;
            res.render('reportes/vistarepo', {power:power});
        }
    });
   
});

router.get('/vistarepob/:Id', isLoggedIn, authRole(['Cli_B', 'GerVer']), async (req, res) => {
    const {Id} = req.params;
    console.log(Id);

    await pool.query('SELECT rep_enlace FROM reporte_bi WHERE rep_id = '+Id+'', (err, result) => {
        if (err) {
            console.log(err);
        }else{
            const powerbi =Object.values(result);
            const power = powerbi[0].rep_enlace;
            res.render('reportes/vistarepo', {power:power});
        }
    });
   
});

router.get('/vistarepoa/:Id', isLoggedIn, authRole(['Cli_A']), async (req, res) => {
    const {Id} = req.params;
    console.log(Id);

    await pool.query('SELECT rep_enlace FROM reporte_bi WHERE rep_id = '+Id+'', (err, result) => {
        if (err) {
            console.log(err);
        }else{
            const powerbi =Object.values(result);
            const power = powerbi[0].rep_enlace;
            res.render('reportes/vistarepo', {power:power});
        }
    });
   
});

router.get('/vistarepod/:Id', isLoggedIn, authRole(['Cli_D']), async (req, res) => {
    const {Id} = req.params;
    console.log(Id);

    await pool.query('SELECT rep_enlace FROM reporte_bi WHERE rep_id = '+Id+'', (err, result) => {
        if (err) {
            console.log(err);
        }else{
            const powerbi =Object.values(result);
            const power = powerbi[0].rep_enlace;
            res.render('reportes/vistarepo', {power:power});
        }
    });
   
});

router.get('/vistarepoe/:Id', isLoggedIn, authRole(['Cli_E']), async (req, res) => {
    const {Id} = req.params;
    console.log(Id);

    await pool.query('SELECT rep_enlace FROM reporte_bi WHERE rep_id = '+Id+'', (err, result) => {
        if (err) {
            console.log(err);
        }else{
            const powerbi =Object.values(result);
            const power = powerbi[0].rep_enlace;
            res.render('reportes/vistarepo', {power:power});
        }
    });
   
});

router.get('/reporte/delete/:Id', isLoggedIn, async (req, res) => {
    const { Id } = req.params;
    await pool.query('UPDATE reporte_bi SET rep_estado = 0 WHERE rep_id = ?', [Id], (err, result) => {
        if (err){
            throw err; 
        }else{
            res.redirect('/listarep');
        }

    });
});

router.get('/fuente', isLoggedIn,  authRole(['Plan', 'Admincli']), async (req, res) => {

    const fecha_anio = await pool.query("SELECT\n" +
    "    YEAR(Fecha) AS Anio,\n" +
    "    COUNT(*) AS Cantidad\n" +
    "FROM\n" +
    "    Tareas\n" +
    "GROUP BY\n" +
    "    YEAR(Fecha)\n" +
    "ORDER BY\n" +
    "    Anio");

    res.render('reportes/fuente', {
        fecha_anio: fecha_anio
    });

});

router.get('/fuente_mes/:year', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const year = req.params.year;

    const meses = await pool.query("SELECT\n" +
    "    MONTH(Fecha) AS Mes,\n" +
    "    COUNT(*) AS Cantidad\n" +
    "FROM\n" +
    "    Tareas\n" +
    "WHERE YEAR(Fecha) = ?\n" +
    "GROUP BY\n" +
    "    MONTH(Fecha)\n" +
    "ORDER BY\n" +
    "    Mes;", [year]);

    const mesesArray = meses.map(mes => mes.Mes);

    res.json(mesesArray);
});

router.post('/generar', isLoggedIn,  authRole(['Plan', 'Admincli']), async (req, res) => {
    
    try {
        const { ano, mes } = req.body;
        const { Email } = req.user;
        const mesFormateado = mes.toString().padStart(2, '0');

        const fecha_inicio = moment(`${ano}-${mesFormateado}-01`, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
        
        const equipos = await pool.query("CALL sp_repoEquipos();");
        const rows_equipos = equipos[0].map(row => {
            return [
                row.EquipoID,
                row.EquipoCodigo,
                row.EquipoDescripcion,
                row.EquipoIdTipo,
                row.EquipoTipoDesc,
                row.EquipoDetalle,
                row.EquipoActivo,
                row.EquipoDinamico,
                row.Aux_Marca,
                row.Aux_Modelo,
                row.Aux_Serie,
                row.Aux_Certificacion,
                row.Aux_Peso,
                row.Aux_Agente,
                row.Aux_Ph,
                row.Aux_Critico,
                row.EAUX_Superintendencia,
                row.EAUX_UbicacionTecnica,
                row.EAUX_Unidad,
                row.GAS_SectorID,
                row.GAS_SectorDesc,
                row.GAS_AreaID,
                row.GAS_AreaDesc,
                row.GAS_GerenciaID,
                row.GAS_GerenciaDesc,
                row.spciCant
            ];
        });

        const tareas = await pool.query("CALL sp_repoListadoTareas (?);", [fecha_inicio])
        const rows_tareas = tareas[0].map(row => {

            return [

                row.Tarea_ID,
                row.Tarea_Fecha,
                row.Tarea_Equipo,
                row.Estado_ID,
                row.Estado_Desc,
                row.Usuario_ID,
                row.Usuario_Desc,
                row.TipoTarea_ID,
                row.TipoTarea_Desc,
                row.TipoTarea_Abr,
                row.Adjuntos,
                row.ProtNombre,
                row.spciCant  

            ];
        });

        const estado_op = await pool.query("Call sp_repoEO (?);", [fecha_inicio]);
        const rows_estado_op = estado_op[0].map(row => {

            return [

                row.TareaID,
                row.TareaEstadoID,
                row.TareaEstadoOp

            ];
        });

        const ejecucion = await pool.query("CALL sp_repoFechaEjecucion (?);", [fecha_inicio]);
        const rows_ejecucion = ejecucion[0].map(row => {

            return [

                row.TareaID,
                row.TareaEstadoID,
                row.TareaFechaEejec 

            ];
        });
        
        const incidencias = await pool.query("CALL sp_repoIncidencias (?);", [fecha_inicio]);
        const rows_incidencias = incidencias[0].map(row => {

            return [

                row.TareaID,
                row.EstadoID,
                row.IncidenciaMotivo,
                row.Incidencia 
            ];
        });

        let wb = XLSX.utils.book_new();

        let ws_data = [
            [
                'EquipoID',
                'EquipoCodigo',
                'EquipoDescripcion',
                'EquipoIdTipo',
                'EquipoTipoDesc',
                'EquipoDetalle',
                'EquipoActivo',
                'EquipoDinamico',
                'Aux_Marca',
                'Aux_Modelo',
                'Aux_Serie',
                'Aux_Certificacion',
                'Aux_Peso',
                'Aux_Agente',
                'Aux_Ph',
                'Aux_Critico',
                'EAUX_Superintendencia',
                'EAUX_UbicacionTecnica',
                'EAUX_Unidad',
                'GAS_SectorID',
                'GAS_SectorDesc',
                'GAS_AreaID',
                'GAS_AreaDesc',
                'GAS_GerenciaID',
                'GAS_GerenciaDesc',
                'spciCant'
            ],
            ...rows_equipos
        ];
        let ws1 = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws1, 'equipos');

        let ws_data_tareas = [
            [
                'Tarea_ID',
                'Tarea_Fecha',
                'Tarea_Equipo',
                'Estado_ID',
                'Estado_Desc',
                'Usuario_ID',
                'Usuario_Desc',
                'TipoTarea_ID',
                'TipoTarea_Desc',
                'TipoTarea_Abr',
                'Adjuntos',
                'ProtNombre',
                'spciCant' 
            ],
            ...rows_tareas
        ];
        let ws2 = XLSX.utils.aoa_to_sheet(ws_data_tareas);
        XLSX.utils.book_append_sheet(wb, ws2, 'tareas');

        let ws_data_eo = [
            [
                'TareaID',
                'TareaEstadoID',
                'TareaEstadoOp'

            ],
            ...rows_estado_op
        ];
        let ws3 = XLSX.utils.aoa_to_sheet(ws_data_eo);
        XLSX.utils.book_append_sheet(wb, ws3, 'eo');

        let ws_data_ejecucion = [
            [
                'TareaID',
                'TareaEstadoID',
                'TareaFechaEejec '

            ],
            ...rows_ejecucion
        ];
        let ws4 = XLSX.utils.aoa_to_sheet(ws_data_ejecucion);
        XLSX.utils.book_append_sheet(wb, ws4, 'ejecucion');

        let ws_data_incidencias = [
            [
                'TareaID',
                'EstadoID',
                'IncidenciaMotivo',
                'Incidencia'

            ],
            ...rows_incidencias
        ];
        let ws5 = XLSX.utils.aoa_to_sheet(ws_data_incidencias);
        XLSX.utils.book_append_sheet(wb, ws5, 'incidencias')

        const datemail = moment().format('YYYY-MM-DD');

        const filePath = path.resolve(__dirname,`../plantillas/${ano}-${mesFormateado}.xlsx`);
        XLSX.writeFile(wb, filePath);

        const filePathName1 = path.resolve(__dirname, "../views/email/emailbi.hbs");
        const mensaje = fs.readFileSync(filePathName1, "utf8");
        const template = hbs.compile(mensaje);
        const context = {
            datemail,
        };
        const html = template(context);

        await transporter.sendMail({
            from: "SAPMA <sapmamlcc@sercoing.cl>",
            to:  Email,
            bcc: "sapmamlcc@sercoing.cl",
            subject: "SAPMA - Data Power BI",
            html,
            attachments: [
                {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",

                },
                {
                    filename: `${ano}-${mesFormateado}.xlsx`,
                    path: filePath,
                }
            ],
        });

        res.send('ok');

    } catch (error) {
        console.log('Error:', error);
    }

});

router.get('/descarga_fuente/:fecha', isLoggedIn, async (req, res) => {
    const datemail = req.params.fecha;
    const [ano, mes] = datemail.split('-');

    const mesFormateado = mes.toString().padStart(2, '0');

    const fechaFormateada = `${ano}-${mesFormateado}`;

    const filePath = path.resolve(__dirname,`../plantillas/${fechaFormateada}.xlsx`);
    
    res.download(filePath, (err) => {
        
        if (err) {
            console.error("Error al descargar el archivo:", err);
            res.status(500).json({ error: "Error al descargar el archivo." });
        } else {
            console.log("Archivo descargado con éxito.");
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error al eliminar el archivo:", err);
                } else {
                    console.log("Archivo eliminado con éxito.");
                }
            });
        }
    });

});

module.exports = router;
