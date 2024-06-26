const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole, roles } = require('../lib/rol');
const helpers = require('../lib/helpers');
const moment = require('moment');
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

router.get('/verificar_sesion', (req, res, next) => {
    const now = Date.now();
    const maxIdleTime = 20 * 60 * 1000;
    const timeLeft = Math.floor((req.session.lastActive + maxIdleTime - now) / 1000);
    if(timeLeft <= 90 && timeLeft >= 0){
        res.json({ sessionExpired: true, timeLeft: timeLeft });
    }else{
        res.json({ sessionExpired: false, timeLeft: timeLeft });
    }
});

router.get('/continuar', (req, res, next) => {
    req.session.lastActive = Date.now();
    res.send("seguimos");
});

router.get('/home', isLoggedIn, (req, res) => {
    res.render('home/home');  
    console.log(req.user);
});

router.get('/users', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const {Id_Cliente, Id_Perfil} = req.user;
    
    if (Id_Perfil === 2){
        const clientes= await pool.query('SELECT Id AS id_cli, Descripcion AS des_cli  FROM Clientes where Id = '+Id_Cliente+'');
        await pool.query("SELECT\n" +
        "	U.Id,\n" +
        "	U.Login,\n" +
        "	U.Descripcion,\n" +
        "	U.Email,\n" +
        "	U.Telefono,\n" +
        "	U.Activo AS Estado,\n" +
        "IF\n" +
        "	(\n" +
        "		P.Descripcion = 'Cliente Menu A',\n" +
        "		'Perfil Area',\n" +
        "	IF\n" +
        "		(\n" +
        "			P.Descripcion = 'Admincli',\n" +
        "			'Admin. Cliente',\n" +
        "		IF\n" +
        "			(\n" +
        "				P.Descripcion = 'Cliente Menu B',\n" +
        "				'Perfil Gerencia',\n" +
        "			IF\n" +
        "				(\n" +
        "					P.Descripcion = 'Cliente Menu C',\n" +
        "					'Perfil General',\n" +
        "				IF\n" +
        "					(\n" +
        "						P.Descripcion = 'Cliente Menu D',\n" +
        "						'Perfil Sector',\n" +
        "				IF\n" +
        "					(\n" +
        "						P.Descripcion = 'GerVer',\n" +
        "						'Perfil Gerencia Visualizador',\n" +
        "					IF\n" +
        "					( P.Descripcion = 'Cliente Menu E', 'Perfil Equipo', P.Descripcion ))))))) AS Perfiles,\n" +
        "	C.Descripcion AS Cliente \n" +
        "FROM\n" +
        "	Usuarios U\n" +
        "	INNER JOIN Clientes C ON U.Id_Cliente = C.Id\n" +
        "	INNER JOIN Perfiles P ON U.Id_Perfil = P.Id \n" +
        "WHERE\n" +
        "	 U.Id_Cliente = "+Id_Cliente+"\n" +
        "   AND P.Id IN (3, 4, 5, 6, 7, 8, 10)", (err, result) => {
            res.render('users/users', { users:result, clientes:clientes});
        });
    }else if( Id_Perfil === 9) {
        const clientes= await pool.query('SELECT Id AS id_cli, Descripcion AS des_cli  FROM Clientes where Id = '+Id_Cliente+'');
        await pool.query("SELECT\n" +
        "	U.Id,\n" +
        "	U.Login,\n" +
        "	U.Descripcion,\n" +
        "	U.Email,\n" +
        "	U.Telefono,\n" +
        "	U.Activo AS Estado,\n" +
        "IF\n" +
        "	(\n" +
        "		P.Descripcion = 'Cliente Menu A',\n" +
        "		'Perfil Area',\n" +
        "	IF\n" +
        "		(\n" +
        "			P.Descripcion = 'Admincli',\n" +
        "			'Admin. Cliente',\n" +
        "		IF\n" +
        "			(\n" +
        "				P.Descripcion = 'Cliente Menu B',\n" +
        "				'Perfil Gerencia',\n" +
        "			IF\n" +
        "				(\n" +
        "					P.Descripcion = 'Cliente Menu C',\n" +
        "					'Perfil General',\n" +
        "				IF\n" +
        "					(\n" +
        "						P.Descripcion = 'Cliente Menu D',\n" +
        "						'Perfil Sector',\n" +
        "					IF\n" +
        "					( P.Descripcion = 'Cliente Menu E', 'Perfil Equipo', P.Descripcion )))))) AS Perfiles,\n" +
        "	C.Descripcion AS Cliente \n" +
        "FROM\n" +
        "	Usuarios U\n" +
        "	INNER JOIN Clientes C ON U.Id_Cliente = C.Id\n" +
        "	INNER JOIN Perfiles P ON U.Id_Perfil = P.Id \n" +
        "WHERE\n" +
        "	U.Id_Cliente = "+Id_Cliente+"", (err, result) => {
            res.render('users/users', { users:result, clientes:clientes});
        });
    }

});

router.get('/usersc', isLoggedIn, authRole(['Cli_C']), async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query("SELECT\n" +
    "	U.Login,\n" +
    "	U.Descripcion,\n" +
    "	U.Email,\n" +
    "	U.Telefono,\n" +
    "	U.Activo AS Estado,\n" +
    "IF\n" +
    "	(\n" +
    "		P.Descripcion = 'Cliente Menu D',\n" +
        "		'Perfil Sector',\n" +
        "	IF\n" +
        "		(\n" +
        "			P.Descripcion = 'Cliente Menu C',\n" +
        "			'Perfil General',\n" +
        "		IF\n" +
        "			(\n" +
        "				P.Descripcion = 'Cliente Menu E',\n" +
        "				'Perfil Equipo',\n" +
        "			IF\n" +
        "				(\n" +
        "					P.Descripcion = 'Cliente Menu A',\n" +
        "					'Perfil Area',\n" +
        "				IF\n" +
        "				( P.Descripcion = 'Cliente Menu B', 'Perfil Gerencia', P.Descripcion ))))) AS Perfiles \n" +
        "FROM\n" +
        "	Usuarios U\n" +
        "	INNER JOIN Perfiles P ON U.Id_Perfil = P.Id \n" +
        "WHERE\n" +
        "	U.Id_Perfil IN ( 4, 5, 6, 7, 8 ) \n" +
        "	AND U.Activo = 1 \n" +
        "	AND U.Id_Cliente = "+Id_Cliente+"", (err, result) => {
            res.render('users/usersc', { usersc:result});
    });
});

router.get('/users/delete/:Id', isLoggedIn, async (req, res) => {

        const { Id } = req.params;
        await pool.query('UPDATE Usuarios SET Activo = 0 WHERE Id = ?', [Id], (err, result) => {
            if (err){
                throw err; 
            }else{
                res.redirect('/users');
            }

        });
});

router.get('/users/activar/:Id', isLoggedIn, async (req, res) => {

    const { Id } = req.params;
    await pool.query('UPDATE Usuarios SET Activo = 1 WHERE Id = ?', [Id], (err, result) => {
        if (err){
            throw err; 
        }else{
            res.redirect('/users');
        }

    });
});

router.get('/users/edit/:Id', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const {Perfil} = req.user;
    const {Id} = req.params;
    console.log(Perfil);

    try {
        if(Perfil === 'Planificador'){
            const useru = await pool.query('SELECT * FROM Usuarios Where Id = ?', [Id]);
            const {Id_Perfil, Id_Cliente} = useru[0];
            const perfil= await pool.query(
                "SELECT\n" +
                "	Id AS Id_Perfiles,\n" +
                "IF\n" +
                "(\n" +
                "	Descripcion = 'Cliente Menu A',\n" +
                "	'Perfil Area',\n" +
                "IF\n" +
                "	(\n" +
                "		Descripcion = 'Admincli',\n" +
                "		'Admin. Cliente',\n" +
                "	IF\n" +
                "		(\n" +
                "			Descripcion = 'Cliente Menu B',\n" +
                "		'Perfil Gerencia',\n" +
                "	IF\n" +
                "		(\n" +
                "			Descripcion = 'Cliente Menu C',\n" +
                "		'Perfil General',\n" +
                "	IF\n" +
                "		(\n" +
                "			Descripcion = 'Cliente Menu D',\n" +
                "		'Perfil Sector',\n" +
                "	IF\n" +
                "	( Descripcion = 'Cliente Menu E', 'Perfil Equipo', Descripcion )))))) AS Desc_Perfiles \n" +
                "FROM\n" +
                "	Perfiles \n" +
                "WHERE\n" +
                "	Id = ?", [Id_Perfil]
            );
            const pf = await pool.query("SELECT\n" +
                "    Id,\n" +
                "    CASE Id\n" +
                "        WHEN 3 THEN 'Técnico'\n" +
                "        WHEN 4 THEN 'Perfil Area'\n" +
                "        WHEN 5 THEN 'Perfil Gerencia'\n" +
                "        WHEN 6 THEN 'Perfil General'\n" +
                "        WHEN 7 THEN 'Perfil Sector'\n" +
                "        WHEN 8 THEN 'Perfil Equipo'\n" +
                "        WHEN 10 THEN 'Perfil Gerencia Visualizador'\n" +
                "        ELSE Descripcion\n" +
                "    END AS Descripcion\n" +
                "FROM\n" +
                "    Perfiles\n" +
                "WHERE\n" +
                "    Id IN (3, 4, 5, 6, 7, 8, 10);"
            );
            const cliente = await pool.query('SELECT Id AS Id_Clientex, Descripcion AS Desc_Clientex FROM Clientes WHERE Id =?', [useru[0].Id_Cliente]);
            const clientes= await pool.query('SELECT Id AS id_cli, Descripcion AS des_cli  FROM Clientes');
            const gerencias= await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' AND vcgas_idGerencia NOT IN (SELECT id_ger FROM userger WHERE id_user = '+Id+') GROUP BY vcgas_idGerencia ');
            const geruser = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec INNER JOIN userger ON userger.id_ger = VIEW_ClienteGerAreSec.vcgas_idGerencia WHERE userger.id_user = ? GROUP BY vcgas_idGerencia', [Id]);
            const userarea = await pool.query('SELECT V.vcgas_idGerencia, V.vcgas_gerenciaN, V.vcgas_idArea, V.vcgas_areaN FROM VIEW_ClienteGerAreSec V INNER JOIN userarea UA ON UA.id_area = V.vcgas_idArea WHERE	V.vcgas_idCliente = '+Id_Cliente+' AND UA.id_user = '+Id+' GROUP BY V.vcgas_idArea ORDER BY V.vcgas_idArea ASC;');
            const areas = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' AND vcgas_idArea NOT IN ( SELECT id_area FROM userarea WHERE id_user = '+Id+' ) GROUP BY vcgas_idArea, vcgas_idGerencia ORDER BY vcgas_idArea ASC;');
            const usersectores = await pool.query('SELECT vcgas_idCliente, vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN, vcgas_idSector, vcgas_sectorN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' AND vcgas_idArea NOT IN ( SELECT id_sector FROM usersector WHERE id_user = '+Id+')GROUP BY vcgas_idSector, vcgas_idArea, vcgas_idGerencia'); 
            const sectores = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN, vcgas_idSector, vcgas_sectorN FROM VIEW_ClienteGerAreSec INNER JOIN usersector ON usersector.id_sector = VIEW_ClienteGerAreSec.vcgas_idSector WHERE vcgas_idCliente = '+Id_Cliente+' AND usersector.id_user = '+Id+' GROUP BY vcgas_idSector ORDER BY vcgas_idSector ASC;');
            const equipos = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN, vcgas_idSector, vcgas_sectorN, vce_idEquipo, vce_codigo FROM VIEW_equiposCteGerAreSec INNER JOIN userequipo ON userequipo.id_equipo = VIEW_equiposCteGerAreSec.vce_idEquipo WHERE vcgas_idCliente = '+Id_Cliente+' AND userequipo.id_user = '+Id+' GROUP BY vce_idEquipo ORDER BY vce_idEquipo ASC;');
            res.render('users/edit', {
                useru:useru[0],
                perfil:perfil[0],
                cliente:cliente[0],
                pf: pf,
                clientes:clientes,
                geruser:geruser,
                gerencias:gerencias,
                userarea:userarea,
                areas:areas,
                usersectores:usersectores,
                sectores:sectores,
                equipos:equipos
            });
        }else if(Perfil === 'AdminCliente'){
            const useru = await pool.query('SELECT * FROM Usuarios Where Id = ?', [Id]);
            const {Id_Perfil, Id_Cliente} = useru[0];
            const perfil= await pool.query("SELECT\n" +
                "	Id AS Id_Perfiles,\n" +
                "IF\n" +
                "(\n" +
                "	Descripcion = 'Cliente Menu A',\n" +
                "	'Perfil Area',\n" +
                "IF\n" +
                "	(\n" +
                "		Descripcion = 'Admincli',\n" +
                "		'Admin. Cliente',\n" +
                "	IF\n" +
                "		(\n" +
                "			Descripcion = 'Cliente Menu B',\n" +
                "		'Perfil Gerencia',\n" +
                "	IF\n" +
                "		(\n" +
                "			Descripcion = 'Cliente Menu C',\n" +
                "		'Perfil General',\n" +
                "	IF\n" +
                "		(\n" +
                "			Descripcion = 'Cliente Menu D',\n" +
                "		'Perfil Sector',\n" +
                "	IF\n" +
                "	( Descripcion = 'Cliente Menu E', 'Perfil Equipo', Descripcion )))))) AS Desc_Perfiles \n" +
                "FROM\n" +
                "	Perfiles \n" +
                "WHERE\n" +
                "	Id = ?", [Id_Perfil]
            );
            const pf = await pool.query("SELECT\n" +
                "    Id,\n" +
                "    CASE Id\n" +
                "        WHEN 2 THEN 'Planificador'\n" +
                "        WHEN 3 THEN 'Técnico'\n" +
                "        WHEN 4 THEN 'Perfil Area'\n" +
                "        WHEN 5 THEN 'Perfil Gerencia'\n" +
                "        WHEN 6 THEN 'Perfil General'\n" +
                "        WHEN 7 THEN 'Perfil Sector'\n" +
                "        WHEN 8 THEN 'Perfil Equipo'\n" +
                "        WHEN 9 THEN 'Administrador'\n" +
                "        WHEN 10 THEN 'Perfil Gerencia Visualizador'\n" +
                "        ELSE Descripcion\n" +
                "    END AS Descripcion\n" +
                "FROM\n" +
                "    Perfiles\n" +
                "WHERE\n" +
                "    Id IN (2, 3, 4, 5, 6, 7, 8, 9, 10);"
            );
            const cliente = await pool.query('SELECT Id AS Id_Clientex, Descripcion AS Desc_Clientex FROM Clientes WHERE Id =?', [useru[0].Id_Cliente]);
            const clientes= await pool.query('SELECT Id AS id_cli, Descripcion AS des_cli  FROM Clientes');
            const gerencias= await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' AND vcgas_idGerencia NOT IN (SELECT id_ger FROM userger WHERE id_user = '+Id+') GROUP BY vcgas_idGerencia ');
            const geruser = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN FROM VIEW_ClienteGerAreSec INNER JOIN userger ON userger.id_ger = VIEW_ClienteGerAreSec.vcgas_idGerencia WHERE userger.id_user = ? GROUP BY vcgas_idGerencia', [Id]);
            const userarea = await pool.query('SELECT V.vcgas_idGerencia, V.vcgas_gerenciaN, V.vcgas_idArea, V.vcgas_areaN FROM VIEW_ClienteGerAreSec V INNER JOIN userarea UA ON UA.id_area = V.vcgas_idArea WHERE	V.vcgas_idCliente = '+Id_Cliente+' AND UA.id_user = '+Id+' GROUP BY V.vcgas_idArea ORDER BY V.vcgas_idArea ASC;');
            const areas = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' AND vcgas_idArea NOT IN ( SELECT id_area FROM userarea WHERE id_user = '+Id+' ) GROUP BY vcgas_idArea, vcgas_idGerencia ORDER BY vcgas_idArea ASC;');
            const usersectores = await pool.query('SELECT vcgas_idCliente, vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN, vcgas_idSector, vcgas_sectorN FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' AND vcgas_idArea NOT IN ( SELECT id_sector FROM usersector WHERE id_user = '+Id+')GROUP BY vcgas_idSector, vcgas_idArea, vcgas_idGerencia'); 
            const sectores = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN, vcgas_idSector, vcgas_sectorN FROM VIEW_ClienteGerAreSec INNER JOIN usersector ON usersector.id_sector = VIEW_ClienteGerAreSec.vcgas_idSector WHERE vcgas_idCliente = '+Id_Cliente+' AND usersector.id_user = '+Id+' GROUP BY vcgas_idSector ORDER BY vcgas_idSector ASC;');
            const equipos = await pool.query('SELECT vcgas_idGerencia, vcgas_gerenciaN, vcgas_idArea, vcgas_areaN, vcgas_idSector, vcgas_sectorN, vce_idEquipo, vce_codigo FROM VIEW_equiposCteGerAreSec INNER JOIN userequipo ON userequipo.id_equipo = VIEW_equiposCteGerAreSec.vce_idEquipo WHERE vcgas_idCliente = '+Id_Cliente+' AND userequipo.id_user = '+Id+' GROUP BY vce_idEquipo ORDER BY vce_idEquipo ASC;');
            res.render('users/edit', {
                useru:useru[0],
                perfil:perfil[0],
                cliente:cliente[0],
                pf: pf,
                clientes:clientes,
                geruser:geruser,
                gerencias:gerencias,
                userarea:userarea,
                areas:areas,
                usersectores:usersectores,
                sectores:sectores,
                equipos:equipos
            });
        }
        
    } catch (error) {
        console.log(error);
    }

});

router.get('/get_data', function(request, response, next){
    console.log(request.params);

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

router.post('/pass/:Id', isLoggedIn, async (req, res) => {
    const {Id} = req.params;
    const {pass} = req.body;
    const newpassword = await helpers.encryptPassword(pass);
    await pool.query('UPDATE Usuarios SET Clave = ? WHERE Id = ?', [newpassword, Id], (err, result) => {
        if (err){
            throw err; 
        }else{
            res.redirect('/users/edit/'+Id);
        }
    });
});

router.post('/users/edit/:Id', isLoggedIn,  async (req, res) => {

    const {login, desc, email, telefono, Id_Perfil }  = req.body;
    const userlogin = login;
    const userdesc = desc;
    const useremail = email;
    const usertel = telefono;
    const userperfil = Id_Perfil;
    const {Id} = req.params;

    await pool.query('UPDATE Usuarios SET Login = ?, Descripcion = ?, Email = ?, Telefono = ?, Id_Perfil = ? WHERE Id = ?', [userlogin, userdesc, useremail, usertel, userperfil, Id], (err, result) => {
        if (err){
            throw err; 
        }else{
            res.redirect('/users/edit/'+Id);
        }
    });

});

router.post('/gerencia/:Id/:Id_Perfiles/:Id_Clientex', isLoggedIn, async (req, res) => {
    const {Id, Id_Perfiles, Id_Clientex} = req.params;
    const gers = Object.values(req.body);
    const arreglo = gers.toString();
    const arreglo1 = arreglo.split(',');
    const arreglo2 = arreglo1.map(Number);
    const arreglo3 = arreglo2.map(function (ger){
        return [Id, Id_Perfiles, Id_Clientex, ger];
    });

    await pool.query('INSERT INTO userger (id_user, id_perfil, id_cli, id_ger) VALUES ?', [arreglo3], (err, result) => {
        if (err){
            throw err; 
        }
    });    

});

router.get('/gerencia/:Id/:Id_ger', isLoggedIn, async (req, res) => {
    const {Id, Id_ger} = req.params;

    await pool.query('DELETE FROM userger WHERE id_user = '+Id+' AND id_ger ='+Id_ger+'', (err, result) => {
        if (err){
            throw err; 
        }
    });    
});

router.post('/area/:Id/:Id_Perfiles/:Id_Clientex', isLoggedIn, async (req, res) => {
    const {Id, Id_Perfiles, Id_Clientex} = req.params;

    const area = req.body.arr;
    const ger = req.body.ger;

    const arreglo =  area.map(function(items){
        return [Id, Id_Perfiles, Id_Clientex, items, ger]
    });

    await pool.query('INSERT INTO userarea (id_user, id_perfil, id_cli, id_area, id_ger) VALUES ?', [arreglo], (err, result) => {
        if (err){
            throw err; 
        }
    });    

});

router.get('/area/:Id/:Id_area', isLoggedIn,  async (req, res) => {
    const {Id, Id_area} = req.params;
    await pool.query('DELETE FROM userarea WHERE id_user = '+Id+' AND id_area ='+Id_area+'', (err, result) => {
        if (err){
            throw err; 
        }
    });    
});

router.post('/sector/:Id/:Id_Perfiles/:Id_Clientex', isLoggedIn, async (req, res) => {
    const {Id, Id_Perfiles, Id_Clientex} = req.params;

    const sector = req.body.arr;
    const ger = req.body.ger;

    const arreglo =  sector.map(function(items){
        return [Id, Id_Perfiles, Id_Clientex, items, ger]
    });

    await pool.query('INSERT INTO usersector (id_user, id_perfil, id_cli, id_sector, id_ger) VALUES ?', [arreglo], (err, result) => {
        if (err){
            throw err; 
        }
    });    

});

router.get('/sector/:Id/:sector', isLoggedIn,  async (req, res) => {
    const {Id, sector} = req.params;
    await pool.query('DELETE FROM usersector WHERE id_user = '+Id+' AND id_sector ='+sector+'', (err, result) => {
        if (err){
            throw err; 
        }
    });    
});

router.post('/equipo/:Id/:Id_Perfiles/:Id_Clientex', isLoggedIn, async (req, res) => {
    const {Id, Id_Perfiles, Id_Clientex} = req.params;

    const equipo = req.body.arr;
    const ger = req.body.ger;

    const arreglo =  equipo.map(function(items){
        return [Id, Id_Perfiles, Id_Clientex, items, ger]
    });

    await pool.query('INSERT INTO userequipo (id_user, id_perfil, id_cli, id_equipo, id_ger) VALUES ?', [arreglo], (err, result) => {
        if (err){
            throw err; 
        }
    });    

});

router.get('/equipo/:Id/:equipo', isLoggedIn, async (req, res) => {
    const {Id, equipo} = req.params;
    await pool.query('DELETE FROM userequipo WHERE id_user = '+Id+' AND id_equipo ='+equipo+'', (err, result) => {
        if (err){
            throw err; 
        }
    });    
});

router.post('/mail_user/:pass/:Id', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{

    const user_email = req.user.Email; 
    const { Descripcion, Email, Login, Telefono, Clave, Id_Perfil} =req.body;
    const { pass, Id } =req.params;
    const datemail = moment().format('DD-MM-YYYY');

    try {
        
        if (["4", "5", "6", "7", "8" , "9", "10"].includes(Id_Perfil)) {
            console.log("con pass");
        
            const filePathName1 = path.resolve(__dirname, "../views/email/emailuser.hbs");
            const mensaje = fs.readFileSync(filePathName1, "utf8");
            const template = hbs.compile(mensaje);
            const context = {
                datemail,
                Descripcion,
                Login,
                Email,
                Telefono,
                Clave,
                pass
            };
            const html = template(context);
    
            await transporter.sendMail({
                from: "SAPMA <sapmamlcc@sercoing.cl>",
                to:  user_email,
                cc: Email,
                bcc: "sapmamlcc@sercoing.cl",
                subject: "SAPMA - Creación de usuario",
                html,
                attachments: [
                    {
                        filename: "imagen1.png",
                        path: "./src/public/img/imagen1.png",
                        cid: "imagen1",
    
                    }
                ]
            });

        }
        
        if (["1", "2", "3"].includes(Id_Perfil)){
            console.log("sin pass");
            console.log(Id);

            const update = await pool.query("UPDATE Usuarios SET PassValidacion = ? WHERE Id = ?;",[null, Id]);

            const filePathName1 = path.resolve(__dirname, "../views/email/emailuser.hbs");
            const mensaje = fs.readFileSync(filePathName1, "utf8");
            const template = hbs.compile(mensaje);
            const context = {
                datemail,
                Descripcion,
                Login,
                Email,
                Telefono,
                Clave
            };
            const html = template(context);

            await transporter.sendMail({
                from: "SAPMA <sapmamlcc@sercoing.cl>",
                to:  user_email,
                cc: Email,
                bcc: "sapmamlcc@sercoing.cl",
                subject: "SAPMA - Creación de usuario",
                html,
                attachments: [
                    {
                        filename: "imagen1.png",
                        path: "./src/public/img/imagen1.png",
                        cid: "imagen1",
    
                    }
                ]
            });
        }
        
    } catch (error) {
        console.log("error");
    }
});

module.exports = router;