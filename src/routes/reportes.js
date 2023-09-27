const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole, roles } = require('../lib/rol');

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

module.exports = router;