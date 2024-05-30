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

const aprob = new Array();

function enviar(  req, res, result){
    res.render( 'aprob/aprobadas' , { aprob: result });
}

router.get('/aprobadas', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan']), async (req, res)=>{
    res.render( 'aprob/aprobadas');
});

router.post('/aprobadas', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan']), async (req, res)=>{
    
    try {
        const {tarea, date1, date2, ot} = req.body;
        const {Id, Id_Perfil} = req.user;
        const test = '%test';

        switch (Id_Perfil) {
            case 2:
            case 6:
            case 9:

            if (tarea > 0){

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", ?, NULL, NULL, NULL, ?, ?, NULL, NULL);',
                    [tarea, test, Id_Perfil]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }else if (ot > 0){

                const aprob = await pool.query();

                if(!aprob){
                    res.json({ title: "No se encuentran tareas!!!" });
                }else{
                    res.json(aprob[0]);
                }


            }else{

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, ?, ?, ?, ?, NULL, NULL);',
                    [date1, date2, test, Id_Perfil]
                );

                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }

         
            break;

            case 4:
            case 5:
            case 7:
            case 8:
            case 10:

            if (tarea > 0){

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", ?, NULL, NULL, NULL, ?, ?, ?, NULL );',
                    [tarea, test, Id_Perfil, Id]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }else if( ot > 0){
            
                console.log("ot: " + ot);

            }else{

                const aprob = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, ?, ?, ?, ?, ?, NULL );',
                    [date1, date2, test, Id_Perfil, Id]
                );
    
                if(!aprob){
                    res.json({ title: "No se encuentran tareas en el rango seleccionado!!!" });
                }else{
                    res.json(aprob[0]);
                }

            }

            break;
            
        }

    } catch (error) {
        console.log(error);
    }

});

router.get('/aprobaciones', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan']), async (req, res)=>{

    try {

        const {Id, Id_Perfil} = req.user;
        const test = '%test';

        switch (Id_Perfil) {
            case 2:
            case 6:
            case 9:

                const actualizar_tareas1 = await pool.query('CALL sp_ActualizarTareaDetalle();');
        
                const aprobaciones1 = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, NULL, NULL, ?, ?, NULL, 0 );',
                    [test, Id_Perfil]
                );
        
                if (!aprobaciones1) {
                    res.render('aprob/aprob', { Mensaje: "Sin Tareas Pendientes" });
                } else {
                    res.render('aprob/aprob', { aprob: aprobaciones1[0] });
                }

                break;
            case 4:
            case 5:
            case 7:
            case 8:
            case 10:
  
                const actualizar_tareas2 = await pool.query('CALL sp_ActualizarTareaDetalle();');
            
                const aprobaciones2 = await pool.query('CALL sp_TareasFull ( "CONSULTA_CLIENTE", NULL, NULL, NULL, NULL, ?, ?, ?, 0 );',
                    [test, Id_Perfil, Id]
                );
        
                if (!aprobaciones2) {
                    res.render('aprob/aprob', { Mensaje: "Sin Tareas Pendientes" });
                } else {
                    res.render('aprob/aprob', { aprob: aprobaciones2[0] });
                }

                break;
        }
        

    } catch (error) {
        
        console.log(error);

    }
    
});

router.post('/aprobaciones', isLoggedIn, authRole(['Cli_C','Cli_B', 'GerVer', 'Cli_A', 'Cli_D', 'Cli_E', 'Admincli', 'Plan']), async (req, res)=>{

    try {

        const idt = (req.body.idt);
        const Login = req.user.usuario;
        var data = [];
        var est_or= "Terminada validada";

        if (req.body['datos']) {
            for (var i = 0; i < req.body['datos'].length; i++) {
              var tarea = {
                Tarea: req.body['datos'][i]['idt'],
                OT: req.body['datos'][i]['ot'],
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
        await workbook.xlsx.readFile(path.resolve(__dirname, "../plantillas/aprobaciones.xlsx"));
        const worksheet = workbook.getWorksheet(1);        
        let fila = 5; 

        data.forEach((dato) => {
            worksheet.getCell('A' + fila).value = dato.Tarea;
            worksheet.getCell('B' + fila).value = dato.OT;
            worksheet.getCell('C' + fila).value = dato.Fecha;
            worksheet.getCell('D' + fila).value = dato.Estado_de_Tarea;
            worksheet.getCell('E' + fila).value = dato.Tipo_de_servicio;
            worksheet.getCell('F' + fila).value = dato.Tag;
            worksheet.getCell('G' + fila).value = dato.Gerencia;
            worksheet.getCell('H' + fila).value = dato.Area;
            worksheet.getCell('I' + fila).value = dato.Sector;
            worksheet.getCell('J' + fila).value = dato.Detalle_de_ubicacion;
            worksheet.getCell('K' + fila).value = dato.Ubicacion_tecnica;
            worksheet.getCell('L' + fila).value = dato.Estado_equipo;
            worksheet.getCell('M' + fila).value = dato.Observacion_equipo;
            worksheet.getCell('N' + fila).value = dato.Repuesto;
            worksheet.getCell('O' + fila).value = dato.Observacion;
            worksheet.getCell('P' + fila).value = dato.Fecha_aprobacion;
            worksheet.getCell('Q' + fila).value = dato.Aprobado_por;
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

        const act1 = await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3]);
        const act2 = await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3]);

        let queries = '';

        arreglo4.forEach(function(item) {
            queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
        });

        await pool.query(queries, arreglo3);

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

        const template = hbs.compile(mensaje);
        const context = {
        datemail, 
        };
        const html = template(context);

        await transporter.sendMail({
            from: "SAPMA <sapmamlcc@sercoing.cl>",
            //to: "marancibia@sercoing.cl",
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

        res.send('ok');

    } catch (error) {
        console.log(error);

    }

    // await pool.query("UPDATE Tareas SET Id_Estado = 4 WHERE Id IN (?)", [arreglo3], async (err, result) => {
    //     if(err){
    //         console.log(err);
    //     }else{                  
    //         await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 4, Val_respnombre = '"+Login+"', Val_fechaval_cte = NOW() WHERE  Val_tarea_id IN (?)", [arreglo3] , (err, result) => {
    //             if(err){
    //                 console.log(err);
    //             }else{
    //                 res.json({message: "archivo creado"});
    //                 let queries = '';

    //                 arreglo4.forEach(function(item) {
    //                     queries += "UPDATE Validacion_Tareas SET Val_obs = '"+'APROBADA | '+item+"' WHERE Val_tarea_id = ?; "; 
    //                 });
    //                 pool.query(queries, arreglo3, async (err, result) => {
    //                     if(err){
    //                         console.log(err);
    //                     }else{
    //                         const emailc = await pool.query(
    //                             "SELECT\n" +
    //                             "	USUARIO,\n" +
    //                             "	U.Email \n" +
    //                             "FROM\n" +
    //                             "	(\n" +
    //                             "	SELECT\n" +
    //                             "		USUARIO \n" +
    //                             "	FROM\n" +
    //                             "		(\n" +
    //                             "		SELECT\n" +
    //                             "			T.LID,\n" +
    //                             "			X.* \n" +
    //                             "		FROM\n" +
    //                             "			(\n" +
    //                             "			SELECT\n" +
    //                             "				L.ID LID,\n" +
    //                             "				L.UGE LUGE,\n" +
    //                             "				L.UAR LUAR,\n" +
    //                             "				L.USEC LUSEC,\n" +
    //                             "				L.UEQU LUEQU \n" +
    //                             "			FROM\n" +
    //                             "				(\n" +
    //                             "				SELECT\n" +
    //                             "					V.vce_idEquipo ID,\n" +
    //                             "					UG.id_user UGE,\n" +
    //                             "					UA.id_user UAR,\n" +
    //                             "					US.id_user USEC,\n" +
    //                             "					UE.id_user UEQU \n" +
    //                             "				FROM\n" +
    //                             "					VIEW_equiposCteGerAreSec V\n" +
    //                             "					LEFT JOIN userger UG ON UG.id_ger = V.vcgas_idGerencia\n" +
    //                             "					LEFT JOIN userarea UA ON UA.id_area = V.vcgas_idArea\n" +
    //                             "					LEFT JOIN usersector US ON US.id_sector = V.vcgas_idSector\n" +
    //                             "					LEFT JOIN userequipo UE ON UE.id_equipo = V.vce_idEquipo \n" +
    //                             "				WHERE\n" +
    //                             "					V.vce_idEquipo IN (\n" +
    //                             "					SELECT\n" +
    //                             "						E.Id \n" +
    //                             "					FROM\n" +
    //                             "						Tareas T\n" +
    //                             "						INNER JOIN Equipos E ON E.Id = T.Id_Equipo \n" +
    //                             "					WHERE\n" +
    //                             "						T.Id IN ( "+arreglo3+" ) \n" +
    //                             "					GROUP BY\n" +
    //                             "						E.Id \n" +
    //                             "					) \n" +
    //                             "				) AS L \n" +
    //                             "			) AS T\n" +
    //                             "		CROSS JOIN LATERAL ( SELECT LUGE, 'LUGE' UNION ALL SELECT LUAR, 'LUAR' UNION ALL SELECT LUSEC, 'LUSEC' UNION ALL SELECT LUEQU, 'LUEQU' ) AS X ( USUARIO, NIVEL )) AS CORREO \n" +
    //                             "	WHERE\n" +
    //                             "		USUARIO IS NOT NULL \n" +
    //                             "	GROUP BY\n" +
    //                             "		USUARIO \n" +
    //                             "	) AS CORREO2\n" +
    //                             "	INNER JOIN Usuarios U ON U.Id = USUARIO \n" +
    //                             "WHERE\n" +
    //                             "	U.Activo = 1;"
    //                           );
                    
    //                           const emailp = await pool.query(
    //                             "SELECT\n" +
    //                               "	U.Id,\n" +
    //                               "	U.Email \n" +
    //                               "FROM\n" +
    //                               "	Usuarios U \n" +
    //                               "WHERE\n" +
    //                               "	U.Id_Perfil = 2 \n" +
    //                               "	AND U.Id_Cliente = " +
    //                               Id_Cliente +
    //                               " \n" +
    //                               "	AND U.Activo = 1;"
    //                           );
    
    //                         const emailgen = await pool.query(
    //                             "SELECT\n" +
    //                             "	U.Id,\n" +
    //                             "	U.Email \n" +
    //                             "FROM\n" +
    //                             "	Usuarios U \n" +
    //                             "WHERE\n" +
    //                             "	U.Id_Perfil = 6 \n" +
    //                             "	AND U.Id_Cliente = " +
    //                             Id_Cliente +
    //                             " \n" +
    //                             "	AND U.Activo = 1;"
    //                         );
                    
    //                           const arremail = emailc.map(function (email) {
    //                             return email.Email;
    //                           });
                    
    //                           const arremailp = emailp.map(function (email) {
    //                             return email.Email;
    //                           });
    
    //                           const arremailgen = emailgen.map(function (email) {
    //                             return email.Email;
    //                           });
                              
    //                           const datemail = new Date().toLocaleDateString('en-GB');
                    
    //                           const filePathName1 = path.resolve(__dirname, "../views/email/emailcli.hbs"); 
    //                           const mensaje = fs.readFileSync(filePathName1, "utf8");
                    
                    
    //                           // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
    //                           const template = hbs.compile(mensaje);
    //                           const context = {
    //                             datemail, 
    //                           };
    //                           const html = template(context);
                    
    //                           await transporter.sendMail({
    //                             from: "SAPMA <sapmadand@sercoing.cl>",
    //                             // to: "marancibia@sercoing.cl",
    //                             to: arremailp,
    //                             cc: [arremail, arremailgen],
    //                             bcc: correo,
    //                             subject: "SAPMA - Tareas Aprobadas",
    //                             html,
    //                             attachments: [
    //                               {
    //                                 filename: "imagen1.png",
    //                                 path: "./src/public/img/imagen1.png",
    //                                 cid: "imagen1",
    //                               },
    //                               {
    //                                 filename: 'aprobaciones_'+datemail+'.xlsx',
    //                                 content: buffer
    //                               }
    //                             ],
    //                           });
    //                     }
            
    //                 });
    //             }

    //         });  
            
            
    //     }
    // });
    
});

module.exports = router;