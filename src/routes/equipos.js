const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole, roles } = require('../lib/rol');
const XLSX = require('xlsx');
const hbs = require("handlebars");
const fs = require("fs");
const path = require("path");
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

const data = new Array();

function enviar(req, res, result) {
  res.render("equipos/equi", { data: result });
}                    

router.get('/equipos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('dataocolos/protocolos', {estados:result} );
    // });

});

router.post('/equipos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
        const {Id_Cliente} = req.user;
        const {equipo} = req.body;
        if (!equipo){
            await pool.query(
                "SELECT\n" +
                "	EF.eg_id_equipo AS ID,\n" +
                "	EF.eg_codigo AS TAG,\n" +
                "IF\n" +
                "	( EF.eg_equipo_critico = 1, 'SI', 'NO' ) AS CRITICO,\n" +
                "IF\n" +
                "	( EF.eg_dinamico = 1, 'SI', 'NO' ) AS DINAMICO,\n" +
                "	EE.vcgas_gerenciaN AS GERENCIA,\n" +
                "	EE.vcgas_areaN AS AREA,\n" +
                "	EE.vcgas_idSector AS ID_SECTOR,\n" +
                "	EE.vcgas_sectorN AS SECTOR,\n" +
                "	EF.eg_detalle_ubicacion AS UBICACION,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	EF.eg_serie AS SERIE,\n" +
                "	EF.eg_certificacion AS CERTIFICACION,\n" +
                "	EF.eg_marca AS MARCA,\n" +
                "	EF.eg_modelo AS MODELO,\n" +
                "	EF.eg_agente AS AGENTE,\n" +
                "	EF.eg_peso AS PESO,\n" +
                "	EF.eg_ph AS PH,\n" +
                "	EF.eg_ubicacion_tecnica AS UTECNICA,\n" +
                "	EF.eg_superintendencia AS SUPERINTENDENCIA,\n" +
                "	EF.eg_unidad AS UNIDAD \n" +
                "FROM\n" +
                "	Equipos_General EF\n" +
                "	INNER JOIN VIEW_equiposCteGerAreSec EE ON EE.vce_idEquipo = EF.eg_id_equipo\n" +
                "	INNER JOIN Equipos E ON E.Id = eg_id_equipo\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo \n" +
                "   WHERE E.Activo = 1\n" +
                "ORDER BY\n" +
                "	EF.eg_id_equipo DESC", async (err, result) => {
                    if (!result.length) {
                        res.render("equipos/equi", { title: "Error en la busqueda!!!" });
                      } else {
                        data.push(result);
                        enviar(req, res, result);
                      }
            });
        }else{
            await pool.query(
                "SELECT\n" +
                "	EF.eg_id_equipo AS ID,\n" +
                "	EF.eg_codigo AS TAG,\n" +
                "IF\n" +
                "	( EF.eg_equipo_critico = 1, 'SI', 'NO' ) AS CRITICO,\n" +
                "IF\n" +
                "	( EF.eg_dinamico = 1, 'SI', 'NO' ) AS DINAMICO,\n" +
                "	EE.vcgas_gerenciaN AS GERENCIA,\n" +
                "	EE.vcgas_areaN AS AREA,\n" +
                "	EE.vcgas_idSector AS ID_SECTOR,\n" +
                "	EE.vcgas_sectorN AS SECTOR,\n" +
                "	EF.eg_detalle_ubicacion AS UBICACION,\n" +
                "	TP.Descripcion AS TIPO,\n" +
                "	EF.eg_serie AS SERIE,\n" +
                "	EF.eg_certificacion AS CERTIFICACION,\n" +
                "	EF.eg_marca AS MARCA,\n" +
                "	EF.eg_modelo AS MODELO,\n" +
                "	EF.eg_agente AS AGENTE,\n" +
                "	EF.eg_peso AS PESO,\n" +
                "	EF.eg_ph AS PH,\n" +
                "	EF.eg_ubicacion_tecnica AS UTECNICA,\n" +
                "	EF.eg_superintendencia AS SUPERINTENDENCIA,\n" +
                "	EF.eg_unidad AS UNIDAD \n" +
                "FROM\n" +
                "	Equipos_General EF\n" +
                "	INNER JOIN VIEW_equiposCteGerAreSec EE ON EE.vce_idEquipo = EF.eg_id_equipo\n" +
                "	INNER JOIN Equipos E ON E.Id = eg_id_equipo\n" +
                "	INNER JOIN TipoEquipo TP ON TP.Id = E.Id_Tipo \n" +
                "WHERE\n" +
                "	EF.eg_codigo = '"+equipo+"'\n" +
                "   AND E.Activo = 1\n" +
                "ORDER BY\n" +
                "	EF.eg_id_equipo DESC", [Id_Cliente], async (err, result) => {
                    if (!result.length) {
                        res.render("equipos/equi", { title: "No se encuentra este equipo!!!" });
                      } else {
                        data.push(result);
                        enviar(req, res, result);
                      }
            });
        }
});

router.get('/editequi/:ID', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    const Id_Equipo = req.params.ID;  
    const consulta_dinamico = await pool.query("SELECT eg_dinamico FROM Equipos_General WHERE eg_id_equipo = ?;", [Id_Equipo]);  
    const dinamico = consulta_dinamico[0].eg_dinamico;

    try {

        if (dinamico === 1) {
            const primera = await pool.query("SELECT EF.eg_id_equipo AS ID,\n" +
            "        	EF.eg_codigo AS TAG,\n" +
            "        	E.Id_Tipo AS ID_TIPO_EQUIPO,\n" +
            "        	TE.Descripcion AS TIPO_EQUIPO,\n" +
            "        	EF.eg_serie AS SERIE,\n" +
            "        	EF.eg_certificacion AS CERTIFICACION,\n" +
            "        	AG.Id AS ID_AGENTE,\n" +
            "        	EF.eg_agente AS AGENTE,\n" +
            "        	EF.eg_equipo_critico AS CRITICO,\n" +
            "        	EF.eg_dinamico AS DINAMICO,\n" +
            "        	EF.eg_ph AS PH,\n" +
            "        	EF.eg_peso AS PESO,\n" +
            "        	EF.eg_unidad AS UNIDAD,\n" +
            "        	EF.eg_observacion AS OBS,\n" +
            "        	MM.Id AS ID_MM,\n" +
            "        	MM.Descripcion AS DESC_MM,\n" +
            "        	G.Descripcion AS GERENCIA,\n" +
            "        	A.Descripcion AS AREA,\n" +
            "        	S.Id AS ID_SECTOR,\n" +
            "        	S.Descripcion AS SECTOR,\n" +
            "        	EF.eg_detalle_ubicacion AS DETALLE_UBICACION,\n" +
            "        	EF.eg_unidad AS UNIDAD,\n" +
            "        	EF.eg_superintendencia AS SUPERINTENDENCIA,\n" +
            "        	EF.eg_ubicacion_tecnica AS UBICACION_TECNICA \n" +
            "        FROM\n" +
            "        	Equipos_General EF\n" +
            "        	INNER JOIN Equipos E ON E.Id = EF.eg_id_equipo\n" +
            "        	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
            "        	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
            "        	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
            "        	INNER JOIN TipoEquipo TE ON TE.Id = E.Id_Tipo\n" +
            "        	LEFT JOIN MMEquipo MM ON MM.Id = E.Id_MM\n" +
            "        	LEFT JOIN Agentes AG ON AG.Descripcion = EF.eg_agente \n" +
            "        WHERE\n" +
            "        	EF.eg_id_equipo = ?;",[Id_Equipo]);
            const agentes = await pool.query("SELECT Id, Descripcion FROM Agentes;");
            const marca_modelo = await pool.query("SELECT Id, Descripcion FROM MMEquipo;");
            const tipo_equipo = await pool.query("SELECT Id, Descripcion FROM TipoEquipo ORDER BY Descripcion ASC;");
            const protocolos = await pool.query("SELECT\n" +
                "	TP.Id AS ID_TP,\n" +
                "	TP.Descripcion AS TIPO_PROTOCOLO,\n" +
                "   TP.Abreviacion AS ABREVIACION,\n" +
                "	P.Id AS ID_P,\n" +
                "	P.Descripcion As PROTOCOLO\n" +
                "FROM\n" +
                "	EquipoProtocolo EP\n" +
                "	INNER JOIN TipoProtocolo TP ON TP.Id = EP.ep_id_tipo_protocolo\n" +
                "	INNER JOIN Protocolos P ON P.Id = EP.ep_id_protocolo\n" +
                "WHERE\n" +
                "	EP.EP_id_equipo = ?;",[Id_Equipo]);
            const tipo_protocolo = await pool.query("SELECT Id, Descripcion, Abreviacion FROM TipoProtocolo;");   
            const gerencias = await pool.query('SELECT vcgas_idGerencia AS Id, vcgas_gerenciaN AS Descripcion FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' GROUP BY vcgas_idGerencia '); 
            res.render('equipos/editequi', {
                Equipo: primera[0],
                tipo_equipo : tipo_equipo,  
                tipo_protocolo: tipo_protocolo,
                agentes: agentes,
                marca_modelo: marca_modelo,
                gerencias: gerencias,
                protocolos: protocolos    
            });
        }else{
            const primera = await pool.query("SELECT EF.eg_id_equipo AS ID,\n" +
            "        	EF.eg_codigo AS TAG,\n" +
            "        	E.Id_Tipo AS ID_TIPO_EQUIPO,\n" +
            "        	TE.Descripcion AS TIPO_EQUIPO,\n" +
            "        	EF.eg_serie AS SERIE,\n" +
            "        	EF.eg_certificacion AS CERTIFICACION,\n" +
            "        	AG.Id AS ID_AGENTE,\n" +
            "        	EF.eg_agente AS AGENTE,\n" +
            "        	EF.eg_equipo_critico AS CRITICO,\n" +
            "        	EF.eg_dinamico AS DINAMICO,\n" +
            "        	EF.eg_ph AS PH,\n" +
            "        	EF.eg_peso AS PESO,\n" +
            "        	EF.eg_unidad AS UNIDAD,\n" +
            "        	MM.Id AS ID_MM,\n" +
            "        	MM.Descripcion AS DESC_MM,\n" +
            "        	EF.eg_observacion AS OBS,\n" +
            "        	G.Descripcion AS GERENCIA,\n" +
            "        	A.Descripcion AS AREA,\n" +
            "        	S.Id AS ID_SECTOR,\n" +
            "        	S.Descripcion AS SECTOR,\n" +
            "        	EF.eg_detalle_ubicacion AS DETALLE_UBICACION,\n" +
            "        	EF.eg_unidad AS UNIDAD,\n" +
            "        	EF.eg_superintendencia AS SUPERINTENDENCIA,\n" +
            "        	EF.eg_ubicacion_tecnica AS UBICACION_TECNICA \n" +
            "        FROM\n" +
            "        	Equipos_General EF\n" +
            "        	INNER JOIN Equipos E ON E.Id = EF.eg_id_equipo\n" +
            "        	INNER JOIN Sectores S ON S.Id = E.Id_Sector\n" +
            "        	INNER JOIN Areas A ON A.Id = S.Id_Area\n" +
            "        	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
            "        	INNER JOIN TipoEquipo TE ON TE.Id = E.Id_Tipo\n" +
            "        	LEFT JOIN MMEquipo MM ON MM.Id = E.Id_MM\n" +
            "        	LEFT JOIN Agentes AG ON AG.Descripcion = EF.eg_agente \n" +
            "        WHERE\n" +
            "        	EF.eg_id_equipo = ?;",[Id_Equipo]);

            const tipo_equipo = await pool.query("SELECT Id, Descripcion FROM TipoEquipo ORDER BY Descripcion ASC;");
            const agentes = await pool.query("SELECT Id, Descripcion FROM Agentes;");
            const marca_modelo = await pool.query("SELECT Id, Descripcion FROM MMEquipo;");
            const pesoymedida = primera[0].PESO;
            const [peso, medida] = pesoymedida.split(' ');
            const protocolos = await pool.query("SELECT\n" +
                "	TP.Id AS ID_TP,\n" +
                "	TP.Descripcion AS TIPO_PROTOCOLO,\n" +
                "   TP.Abreviacion AS ABREVIACION,\n" +
                "	P.Id AS ID_P,\n" +
                "	P.Descripcion As PROTOCOLO\n" +
                "FROM\n" +
                "	EquipoProtocolo EP\n" +
                "	INNER JOIN TipoProtocolo TP ON TP.Id = EP.ep_id_tipo_protocolo\n" +
                "	INNER JOIN Protocolos P ON P.Id = EP.ep_id_protocolo\n" +
                "WHERE\n" +
                "	EP.EP_id_equipo = ?;",[Id_Equipo]);
            const tipo_protocolo = await pool.query("SELECT Id, Descripcion, Abreviacion FROM TipoProtocolo;");   
            const gerencias = await pool.query('SELECT vcgas_idGerencia AS Id, vcgas_gerenciaN AS Descripcion FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' GROUP BY vcgas_idGerencia '); 
            res.render('equipos/editequi', {
                Equipo: primera[0],
                tipo_equipo : tipo_equipo,  
                agentes: agentes,
                peso: peso,
                medida: medida,
                tipo_protocolo: tipo_protocolo,
                marca_modelo: marca_modelo,
                protocolos: protocolos,
                gerencias: gerencias    
            });
        }
        
    } catch (err) {
        console.log(err);
    }   
});

router.post('/elimequi', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    const usuario = req.user.usuario;
    const Perfil = req.user.Perfil;
    const fecha = req.body.fecha;
    const fecha1 = new Date(fecha); 
    const nowFormat = fecha1.toISOString().slice(0, 19).replace("T", " ");
    const obj = req.body;
    const date = new Date()
    const dateString = date.toISOString().replace('T', ' ').substring(0, 19);
    const obs = "ALTA " + dateString;
    const {Id} = req.user;
    const {Login} = req.user;
    var equipos = obj.datos.map(function(item){
        return item.id
    });

    var tags = obj.datos.map(function(item){
        return item.tag
    });

    try {
        const primero = await pool.query("SELECT TAREA FROM VIEW_DetalleEquiposDET WHERE EQUIPO_ID IN (?) AND FECHA >= ?;", [equipos, fecha]);
        const tareas = primero.map(elemento => elemento.TAREA);
        
        if (tareas.length === 0) {
                var data1 =[];
                    if (req.body['datos']) {
                        // Recorrer el objeto 'req.body' con un bucle for
                        for (var i = 0; i < req.body['datos'].length; i++) {
                          // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data1'
                          var tarea = {
                            Id_Equipo: req.body['datos'][i]['id'],
                            Tag: req.body['datos'][i]['tag'],
                            Gerencia: req.body['datos'][i]['ger'],
                            Area: req.body['datos'][i]['area'],
                            Sector: req.body['datos'][i]['sec'],
                            A_contar_de: nowFormat,
                            Efectivo_desde: dateString,
                            Responsable: usuario    
                          };
                          data1.push(tarea);
                        }
                    }

                      // Crear un libro de trabajo y una hoja
                    var wb = XLSX.utils.book_new();
                    var ws = XLSX.utils.json_to_sheet(data1);

                    // Calcular el ancho máximo de cada columna
                    var range = XLSX.utils.decode_range(ws['!ref']);
                    var colWidths = [];
                    for (var col = range.s.c; col <= range.e.c; col++) {
                        var maxWidth = 0;
                        for (var row = range.s.r; row <= range.e.r; row++) {
                            var cell_address = {c:col, r:row};
                            var cell_ref = XLSX.utils.encode_cell(cell_address);
                            var cell = ws[cell_ref];
                            if (cell) {
                                var cellValue = cell.v.toString();
                                if (cellValue.length > maxWidth) {
                                    maxWidth = cellValue.length;
                                }
                            }
                        }
                        colWidths.push({wch:maxWidth});
                    }

                    // Establecer el ancho de las columnas
                    ws['!cols'] = colWidths;

                    // Agregar la hoja al libro de trabajo
                    XLSX.utils.book_append_sheet(wb, ws, 'Baja de Equipos');


                    // Generar el archivo en memoria
                    var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});

                    const equipo1 = await pool.query("UPDATE Equipos SET Activo = 0 WHERE Id IN (?);", [equipos]);

                    const equipo2 = await pool.query("UPDATE Equipos_General SET eg_activo = 0 WHERE eg_id_equipo IN (?);", [equipos]);

                    const obs_equipos = "BAJA: "+ Login + " | " +dateString ;

                    const valores = equipos.map(equipo => [equipo, 2, Id, fecha1, obs_equipos]);
                    const equipo3 = await pool.query("INSERT INTO Equipos_LOG (el_Id_equipo, el_Id_estado, el_Id_usuario, el_Fecha, el_Observacion) VALUES ?", [valores]);
                    
                    const datemail = new Date().toLocaleDateString('en-GB');
                                    const filePathName1 = path.resolve(__dirname, "../views/email/equipos.hbs"); 
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
                                    
                                      await transporter.sendMail({
                                        from: "SAPMA <sapmadand@sercoing.cl>",
                                        to: [email_plan],
                                        bcc: "sapmadand@sercoing.cl",
                                        subject: "SAPMA - Baja de Equipos",
                                        html,
                                        attachments: [
                                          {
                                            filename: "imagen1.png",
                                            path: "./src/public/img/imagen1.png",
                                            cid: "imagen1",
                        
                                          },
                                          {
                                            filename: 'bajas_de_equipo_'+datemail+'.xlsx',
                                            content: buffer
                                          }
                                        ],
                                      });
                                      res.send("ok");                  
          } else {
            const primera = await pool.query("SELECT TAREA, date_format(FECHA, '%d-%m-%Y') AS FECHA, CODIGO, GERENCIA, AREA, SECTOR, SERVICIO, TECNICO FROM VIEW_DetalleEquiposDET WHERE TAREA IN ("+tareas+") ORDER BY FECHA ASC;");
        
                    var data1 =[];

                    if (req.body['datos']) {
                        // Recorrer el objeto 'req.body' con un bucle for
                        for (var i = 0; i < req.body['datos'].length; i++) {
                          // Crear un objeto con las propiedades del objeto 'req.body' y agregarlo al array 'data1'
                          var tarea = {
                            Id_Equipo: req.body['datos'][i]['id'],
                            Tag: req.body['datos'][i]['tag'],
                            Gerencia: req.body['datos'][i]['ger'],
                            Area: req.body['datos'][i]['area'],
                            Sector: req.body['datos'][i]['sec'],
                            A_contar_de: nowFormat,
                            Efectivo_desde: dateString,
                            Responsable: usuario    
                          };
                          data1.push(tarea);
                        }
                    }

                    var data = [];
                    for (var i = 0; i < primera.length; i++) {
                        data.push({
                            Tarea: primera[i].TAREA,
                            Fecha: primera[i].FECHA,
                            Tag: primera[i].CODIGO,
                            Gerencia: primera[i].GERENCIA,
                            Area: primera[i].AREA,
                            Sector: primera[i].SECTOR,
                            Tipo_de_Tarea: primera[i].SERVICIO,
                            Tecnico: primera[i].TECNICO,
                            Estado: "Anulada",
                            Observación: "ANULADO POR BAJA DE EQUIPO",
                            Fecha_Anulación: dateString,
                            Anulada_por: usuario
                        });
                    }
                      // Crear un libro de trabajo y una hoja
                    var wb = XLSX.utils.book_new();
                    var ws = XLSX.utils.json_to_sheet(data);
                    var ws2 = XLSX.utils.json_to_sheet(data1);

                    // Calcular el ancho máximo de cada columna
                    var range = XLSX.utils.decode_range(ws['!ref']);
                    var colWidths = [];
                    for (var col = range.s.c; col <= range.e.c; col++) {
                        var maxWidth = 0;
                        for (var row = range.s.r; row <= range.e.r; row++) {
                            var cell_address = {c:col, r:row};
                            var cell_ref = XLSX.utils.encode_cell(cell_address);
                            var cell = ws[cell_ref];
                            if (cell) {
                                var cellValue = cell.v.toString();
                                if (cellValue.length > maxWidth) {
                                    maxWidth = cellValue.length;
                                }
                            }
                        }
                        colWidths.push({wch:maxWidth});
                    }

                    // Establecer el ancho de las columnas
                    ws['!cols'] = colWidths;

                    // Agregar la hoja al libro de trabajo
                    XLSX.utils.book_append_sheet(wb, ws, 'Tareas Anuladas');
                    XLSX.utils.book_append_sheet(wb, ws2, 'Baja de Equipos');


                    // Generar el archivo en memoria
                    var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});

                    
                    const datemail = new Date().toLocaleDateString('en-GB');
                    const filePathName1 = path.resolve(__dirname, "../views/email/equipos.hbs"); 
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

                      const est_old = await pool.query("SELECT T.Id, T.Id_Estado FROM Tareas T WHERE T.Id IN ("+tareas+")");
                    const idToEstado = {};
                    const comment = "ANULADO POR BAJA DE EQUIPO | " + dateString;
                    est_old.forEach(row => {
                        idToEstado[row.Id] = row.Id_Estado;
                    });
                    const arreglo1 = [];
                    for (let i = 0; i < tareas.length; i++) {
                        const item = tareas[i];
                        const id = item;
                        const estado = idToEstado[id];
                        arreglo1.push([item, 3, comment, date, date, usuario, Perfil, usuario, estado]);
                    }
            const segunda =  await pool.query("INSERT IGNORE INTO Validacion_Tareas ( Val_tarea_id, Val_id_estado, Val_obs, Val_fechaval_inf, Val_fechaval_cte, Val_respnombre, Val_respcargo, Val_respsapma, Val_id_estado_old )\n" +
                    "VALUES ?", [arreglo1]);  
                    
            const tercera =  await pool.query("UPDATE Tareas SET Id_Estado = 3 WHERE Id IN (?)", [tareas]);   

            const equipo1 = await pool.query("UPDATE Equipos SET Activo = 0 WHERE Id IN (?);", [equipos]);

            const equipo2 = await pool.query("UPDATE Equipos_General SET eg_activo = 0 WHERE eg_id_equipo IN (?);", [equipos]);

            const obs_equipos = "BAJA: "+ Login + " | " +dateString ;

            const valores = equipos.map(equipo => [equipo, 2, Id, fecha1, obs_equipos]);
            const equipo3 = await pool.query("INSERT INTO Equipos_LOG (el_Id_equipo, el_Id_estado, el_Id_usuario, el_Fecha, el_Observacion) VALUES ?", [valores]);
            
            await transporter.sendMail({
                from: "SAPMA <sapmadand@sercoing.cl>",
                to: [email_plan],
                bcc: "sapmadand@sercoing.cl",
                subject: "SAPMA - Baja de Equipos",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",

                  },
                  {
                    filename: 'bajas_de_equipo_'+datemail+'.xlsx',
                    content: buffer
                  }
                ],
              });

              res.send('ok');
        }
          
    } catch (err) {
        console.log(err);
    }

});

router.post('/elimlista', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    const usuario = req.user.usuario;
    const Perfil = req.user.Perfil;
    const fecha = req.body.fecha;
    const fecha1 = new Date(fecha); 
    const nowFormat = fecha1.toISOString().slice(0, 19).replace("T", " ");
    const obj = req.body.uniqueDatos;
    const date = new Date()
    const dateString = date.toISOString().replace('T', ' ').substring(0, 19);
    const obs = "ALTA " + dateString;
    const {Id, Login} = req.user;

    const info = await pool.query("SELECT Id, Codigo, Id_Sector FROM Equipos WHERE Codigo IN (?) GROUP BY Id;", [obj]);

    var equipos = info.map(function(item){
        return item.Id;
    });

    try {
        const primero = await pool.query('SELECT TAREA FROM VIEW_DetalleEquiposDET WHERE EQUIPO_ID IN (?) AND FECHA >= ?', [equipos, fecha]);
        const tareas = primero.map(elemento => elemento.TAREA);

        if (tareas.length === 0) {
            const equi_excel = await pool.query("SELECT EQUIPO_ID, CODIGO, GERENCIA, AREA, SECTOR FROM VIEW_DetalleEquiposDET WHERE EQUIPO_ID IN (?) GROUP BY EQUIPO_ID;",[equipos]);
            var data1 = [];
            for (var i = 0; i < equi_excel.length; i++) {
                data1.push({
                    Id_Equipo: equi_excel[i].EQUIPO_ID,
                    Tag: equi_excel[i].CODIGO,
                    Gerencia: equi_excel[i].GERENCIA,
                    Area: equi_excel[i].AREA,
                    Sector: equi_excel[i].SECTOR,
                    Estado: "Anulada",
                    A_contar_de: nowFormat,
                    Efectivo_desde: dateString,
                    Responsable: usuario  
                });
            } 

            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.json_to_sheet(data1);

            // Calcular el ancho máximo de cada columna
            var range = XLSX.utils.decode_range(ws['!ref']);
            var colWidths = [];
            for (var col = range.s.c; col <= range.e.c; col++) {
                var maxWidth = 0;
                for (var row = range.s.r; row <= range.e.r; row++) {
                    var cell_address = {c:col, r:row};
                    var cell_ref = XLSX.utils.encode_cell(cell_address);
                    var cell = ws[cell_ref];
                    if (cell) {
                        var cellValue = cell.v.toString();
                        if (cellValue.length > maxWidth) {
                            maxWidth = cellValue.length;
                        }
                    }
                }
                colWidths.push({wch:maxWidth});
            }

            // Establecer el ancho de las columnas
            ws['!cols'] = colWidths;

            console.log(wb)

            // Agregar la hoja al libro de trabajo
            XLSX.utils.book_append_sheet(wb, ws, 'Baja de Equipos');

            // Generar el archivo en memoria
            var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});
            const equipo1 = await pool.query("UPDATE Equipos SET Activo = 0 WHERE Id IN (?);", [equipos]);

            const equipo2 = await pool.query("UPDATE Equipos_General SET eg_activo = 0 WHERE eg_id_equipo IN (?);", [equipos]);

            const obs_equipos = "BAJA: "+ Login + " | " +dateString ;

            const valores = equipos.map(equipo => [equipo, 2, Id, fecha1, obs_equipos]);
            const equipo3 = await pool.query("INSERT INTO Equipos_LOG (el_Id_equipo, el_Id_estado, el_Id_usuario, el_Fecha, el_Observacion) VALUES ?", [valores]);
                    
            const datemail = new Date().toLocaleDateString('en-GB');
            const filePathName1 = path.resolve(__dirname, "../views/email/equipos.hbs"); 
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
                                    
              await transporter.sendMail({
                from: "SAPMA <sapmadand@sercoing.cl>",
                to: [email_plan],
                bcc: "sapmadand@sercoing.cl",
                subject: "SAPMA - Baja de Equipos",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",
                        
                  },
                  {
                    filename: 'bajas_de_equipo_'+datemail+'.xlsx',
                    content: buffer
                  }
                ],
              });
              res.send("ok");       
        }else{
            const equi_excel = await pool.query("SELECT EQUIPO_ID, CODIGO, GERENCIA, AREA, SECTOR FROM VIEW_DetalleEquiposDET WHERE EQUIPO_ID IN (?) GROUP BY EQUIPO_ID;",[equipos]);
            const primeras = await pool.query("SELECT TAREA, date_format(FECHA, '%d-%m-%Y') AS FECHA, CODIGO, GERENCIA, AREA, SECTOR, SERVICIO, TECNICO FROM VIEW_DetalleEquiposDET WHERE TAREA IN ("+tareas+") ORDER BY FECHA ASC;");        
                    
                    var data1 = [];
                    for (var i = 0; i < equi_excel.length; i++) {
                        data1.push({
                            Id_Equipo: equi_excel[i].EQUIPO_ID,
                            Tag: equi_excel[i].CODIGO,
                            Gerencia: equi_excel[i].GERENCIA,
                            Area: equi_excel[i].AREA,
                            Sector: equi_excel[i].SECTOR,
                            Estado: "Anulada",
                            A_contar_de: nowFormat,
                            Efectivo_desde: dateString,
                            Responsable: usuario  
                        });
                    } 

                    var data = [];
                    for (var i = 0; i < equi_excel.length; i++) {
                        data.push({
                            Tarea: primeras[i].TAREA,
                            Fecha: primeras[i].FECHA,
                            Tag: primeras[i].CODIGO,
                            Gerencia: primeras[i].GERENCIA,
                            Area: primeras[i].AREA,
                            Sector: primeras[i].SECTOR,
                            Tipo_de_Tarea: primeras[i].SERVICIO,
                            Tecnico: primeras[i].TECNICO,
                            Estado: "Anulada",
                            Observación: "ANULADO POR BAJA DE EQUIPO",
                            Fecha_Anulación: dateString,
                            Anulada_por: usuario
                        });
                    }
                    
                    // Crear un libro de trabajo y una hoja
                    var wb = XLSX.utils.book_new();
                    var ws = XLSX.utils.json_to_sheet(data);
                    var ws2 = XLSX.utils.json_to_sheet(data1);

                    // Calcular el ancho máximo de cada columna
                    var range = XLSX.utils.decode_range(ws['!ref']);
                    var colWidths = [];
                    for (var col = range.s.c; col <= range.e.c; col++) {
                        var maxWidth = 0;
                        for (var row = range.s.r; row <= range.e.r; row++) {
                            var cell_address = {c:col, r:row};
                            var cell_ref = XLSX.utils.encode_cell(cell_address);
                            var cell = ws[cell_ref];
                            if (cell) {
                                var cellValue = cell.v.toString();
                                if (cellValue.length > maxWidth) {
                                    maxWidth = cellValue.length;
                                }
                            }
                        }
                        colWidths.push({wch:maxWidth});
                    }

                    // Establecer el ancho de las columnas
                    ws['!cols'] = colWidths;

                    // Agregar la hoja al libro de trabajo
                    XLSX.utils.book_append_sheet(wb, ws, 'Tareas Anuladas');
                    XLSX.utils.book_append_sheet(wb, ws2, 'Baja de Equipos');


                    // Generar el archivo en memoria
                    var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});

                    const datemail = new Date().toLocaleDateString('en-GB');
                    const filePathName1 = path.resolve(__dirname, "../views/email/equipos.hbs"); 
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

                      const est_old = await pool.query("SELECT T.Id, T.Id_Estado FROM Tareas T WHERE T.Id IN ("+tareas+")");
                    const idToEstado = {};
                    const comment = "ANULADO POR BAJA DE EQUIPO | " + dateString;
                    est_old.forEach(row => {
                        idToEstado[row.Id] = row.Id_Estado;
                    });
                    const arreglo1 = [];
                    for (let i = 0; i < tareas.length; i++) {
                        const item = tareas[i];
                        const id = item;
                        const estado = idToEstado[id];
                        arreglo1.push([item, 3, comment, date, date, usuario, Perfil, usuario, estado]);
                    }
            const segunda =  await pool.query("INSERT IGNORE INTO Validacion_Tareas ( Val_tarea_id, Val_id_estado, Val_obs, Val_fechaval_inf, Val_fechaval_cte, Val_respnombre, Val_respcargo, Val_respsapma, Val_id_estado_old )\n" +
                    "VALUES ?", [arreglo1]);  
                    
            const tercera =  await pool.query("UPDATE Tareas SET Id_Estado = 3 WHERE Id IN (?)", [tareas]);   

            const equipo1 = await pool.query("UPDATE Equipos SET Activo = 0 WHERE Id IN (?);", [equipos]);

            const equipo2 = await pool.query("UPDATE Equipos_General SET eg_activo = 0 WHERE eg_id_equipo IN (?);", [equipos]);

            const obs_equipos = "BAJA: "+ Login + " | " +dateString ;

            const valores = equipos.map(equipo => [equipo, 2, Id, fecha1, obs_equipos]);
            const equipo3 = await pool.query("INSERT INTO Equipos_LOG (el_Id_equipo, el_Id_estado, el_Id_usuario, el_Fecha, el_Observacion) VALUES ?", [valores]);
            
            await transporter.sendMail({
                from: "SAPMA <sapmadand@sercoing.cl>",
                to: [email_plan],
                bcc: "sapmadand@sercoing.cl",
                subject: "SAPMA - Baja de Equipos",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",

                  },
                  {
                    filename: 'bajas_de_equipo_'+datemail+'.xlsx',
                    content: buffer
                  }
                ],
              });

              res.send('ok');

        }
    } catch (err) {
        console.log(err);
    }
     
});

router.get('/equiposnew', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    const tipo_equipo = await pool.query("SELECT Id, Descripcion FROM TipoEquipo ORDER BY Descripcion ASC;");
    const marca_modelo = await pool.query("SELECT Id, Descripcion FROM MMEquipo ORDER BY Descripcion ASC;");
    const gerencias = await pool.query('SELECT vcgas_idGerencia AS Id, vcgas_gerenciaN AS Descripcion FROM VIEW_ClienteGerAreSec WHERE vcgas_idCliente = '+Id_Cliente+' GROUP BY vcgas_idGerencia ');
    const tipo_protocolo = await pool.query("SELECT Id, Descripcion, Abreviacion FROM TipoProtocolo;");
    const sup = await pool.query("SELECT Id, Descripcion FROM Superintendencias WHERE Id_Cliente = ?;",[Id_Cliente]);
    const agentes = await pool.query("SELECT Id, Descripcion FROM Agentes;");

    res.render('equipos/nuevo',{
        tipo_equipo : tipo_equipo,
        marca_modelo : marca_modelo,
        gerencias : gerencias,
        tipo_protocolo : tipo_protocolo,
        sup: sup,
        agentes: agentes
    });
});

router.get('/ruta/protocolos/:tipoProtocolo/:tipoEquipo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
    const {Id_Cliente} = req.user;
    const { tipoProtocolo } = req.params;
    const {tipoEquipo} = req.params
    const protocolos = await pool.query("	SELECT\n" +
    "    	X.Id As Id,\n" +
    "    	X.Descripcion As Descripcion,\n" +
    "    	TP.Abreviacion AS Abreviacion,\n" +
    "		X.Id_TipoEquipo\n" +
    "    FROM\n" +
    "    	(\n" +
    "    	SELECT\n" +
    "    		Id,\n" +
    "    		Descripcion,\n" +
    "    		Id_TipoProtocolo,\n" +
    "    		Id_Cliente, \n" +
    "				Id_TipoEquipo \n" +
    "    	FROM\n" +
    "    		(\n" +
    "    		SELECT\n" +
    "    			P.Id,\n" +
    "    			P.Descripcion,\n" +
    "    			3 AS 'Id_TipoProtocolo',\n" +
    "    			P.Id_Cliente, \n" +
    "					P.Id_TipoEquipo \n" +
    "    		FROM\n" +
    "    			Protocolos P \n" +
    "    		WHERE\n" +
    "    			P.Id_Cliente = ?\n" +
    "    			AND P.Id_TipoProtocolo = 2 \n" +
    "    		) AS A UNION\n" +
    "    	SELECT\n" +
    "    		P.Id,\n" +
    "    		P.Descripcion,\n" +
    "    		P.Id_TipoProtocolo,\n" +
    "    		P.Id_Cliente,\n" +
    "				P.Id_TipoEquipo \n" +
    "    	FROM\n" +
    "    		Protocolos P \n" +
    "    	WHERE\n" +
    "    		P.Id_Cliente = ?\n" +
    "    	) AS X\n" +
    "    	INNER JOIN TipoProtocolo TP ON TP.Id = X.Id_TipoProtocolo \n" +
    "    WHERE\n" +
    "    	X.Id_TipoProtocolo = ?\n" +
    // "		AND X.Id_TipoEquipo = ?\n" +
    "    ORDER BY\n" +
    "    	X.Id;",[Id_Cliente, Id_Cliente, tipoProtocolo]);
    res.json(protocolos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los protocolos' });
    }    
});

router.post('/check-tag', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {tag} = req.body;
    await pool.query("SELECT Codigo FROM Equipos WHERE Codigo = ?", [tag], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          res.send({ exists: true });
        } else {
          res.send({ exists: false });
        }
    });
});

router.post('/guardar_equipo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
    const {tag, tipoe, tipoe_text, ph, dinamico, obs_dand, serie, cer, agente, pesoConMedida, unidad, mm, mm_text, critico, sup, sector, du, ut, tipoProtocoloIds, protocoloIds} = req.body;
    const {Id} = req.user;
    const {Login} = req.user;
    let marca;
    let modelo;

    if (mm_text.includes('|')) {
        let parts = mm_text.split('|');
        marca = parts[0].trim();
        modelo = parts[1].trim();
    } else {
        marca = mm_text;
        modelo = '';
    }

    const descripcion = tipoe_text+" - "+agente;
    const {Id_Cliente} = req.user;

    const mapeo = {};

    // Mapear por ubicación
    for (let i = 0; i < tipoProtocoloIds.length; i++) {
        const ubicacion = tipoProtocoloIds[i];
        const protocoloId = protocoloIds[i];
        mapeo[ubicacion] = protocoloId;
    }

    // Crear variables
    const inspeccion = mapeo['1'];
    const mantencion = mapeo['2'];
    const prueba = mapeo['3'];

    try {

        if(dinamico === '0'){

            const primera =  await pool.query("INSERT INTO Equipos (Codigo, Descripcion, Id_Tipo, Id_MM, Detalle, Id_Sector, Activo, Dinamico) VALUES (?,?,?,?,?,?,?,?);", [tag,
            descripcion, tipoe, mm, du, sector, 1, 0 ]);

            const newId = primera.insertId;
            var prot = tipoProtocoloIds.map(function(tipo, index) {
                return [newId, tipo, protocoloIds[index], tipoe];
            });

            const segunda = await pool.query("INSERT INTO EquipoProtocolo (ep_id_equipo, ep_id_tipo_protocolo, ep_id_protocolo, ep_id_tipo_equipo) VALUES ?;", [prot]);

            const tercera = await pool.query("INSERT INTO Equipos_General\n" +
            "(eg_id_equipo, eg_codigo, eg_detalle_ubicacion, eg_marca, eg_modelo, eg_certificacion, eg_serie, eg_peso, eg_agente,\n" +
            "eg_ubicacion_tecnica, eg_superintendencia, eg_equipo_critico, eg_unidad, eg_activo, eg_ph, eg_dinamico, eg_tipo_equipo, eg_observacion) VALUES\n" +
            "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);", [newId, tag, du, marca, modelo, cer, serie, pesoConMedida, agente, ut, sup, critico, unidad, 1, ph, 0, tipoe, obs_dand]);

            const obs = "REGISTRADO POR: "+Login;

            const cuarta = await pool.query("INSERT INTO Equipos_LOG (el_Id_equipo, el_Id_estado, el_Id_usuario, el_Fecha, el_Observacion) VALUES (?,?,?, NOW(), ?);",
            [newId, 1, Id, obs]);

            res.json({message: "Equipo creado", newId: newId});
        }else{
            const primera =  await pool.query("INSERT INTO Equipos (Codigo, Descripcion, Id_Tipo, Id_MM, Detalle, Id_Sector, Activo, DInamico) VALUES (?,?,?,?,?,?,?,?);", [tag,
                descripcion, tipoe, mm, du, sector, 1, 1 ]);
    
                const newId = primera.insertId;
                var prot = tipoProtocoloIds.map(function(tipo, index) {
                    return [newId, tipo, protocoloIds[index], tipoe];
                });
    
                const segunda = await pool.query("INSERT INTO EquipoProtocolo (ep_id_equipo, ep_id_tipo_protocolo, ep_id_protocolo, ep_id_tipo_equipo) VALUES ?;", [prot]);
    
                const tercera = await pool.query("INSERT INTO Equipos_General\n" +
                "(eg_id_equipo, eg_codigo, eg_detalle_ubicacion, eg_ubicacion_tecnica, eg_superintendencia, eg_unidad, eg_activo, eg_dinamico, eg_tipo_equipo, eg_observacion) VALUES\n" +
                "(?,?,?,?,?,?,?,?,?,?);", [newId, tag, du, ut, sup, unidad, 1, 1, tipoe, obs_dand]);

                const date = new Date().toLocaleDateString('en-GB');
                const date1 = date.replace(/\//g, "-");
                
                const obs_final = date1+" | "+Login+" | OBS: "+obs_dand;

                const cuarta = await pool.query("INSERT INTO Equipos_Dinamicos (ed_serie, ed_certificacion, ed_marca, ed_modelo, ed_peso, ed_agente, ed_equipo_critico, ed_tipo_equipo, ed_activo, ed_observacion) Values\n" +
                "(?,?,?,?,?,?,?,?,?,?);", [serie, cer, marca, modelo, pesoConMedida, agente, critico, tipoe, 1 , obs_final]);
    
                const obs = "REGISTRADO POR: "+Login;
    
                const quinta = await pool.query("INSERT INTO Equipos_LOG (el_Id_equipo, el_Id_estado, el_Id_usuario, el_Fecha, el_Observacion) VALUES (?,?,?, NOW(), ?);",
                [newId, 1, Id, obs]);
    
                res.json({message: "Equipo creado"});
        }
        
    } catch (err) {
        console.log(err);
    }
});

router.get('/get_equi', function(request, response, next){

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

    pool.query(query, function(error, data){

        const data_arr = [];

        data.forEach(function(row){
            data_arr.push([row.Id, row.Data]);
        });

        response.json(data_arr);

    });

});

router.post('/actualizar_equipo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
    // console.log(req.body.data);
    const dataArray = req.body.datosTabla;
    const obs = req.body.observaciones;
    const {id_equipo} = req.body.data;
    const {Login} =  req.user

    const {tipoe, mm, mm_text, dinamico, ph, cer, critico, unidad,  pesoConMedida, ut, sup, serie, du, tipoe_text, agente, id_sector_old, sector_new} = req.body.data;
    
    let sector;

    if (sector_new === '') {
        sector = id_sector_old;
    } else {
        sector = sector_new;
    }


    let marca;
    let modelo;

    if (mm_text.includes('|')) {
        let parts = mm_text.split('|');
        marca = parts[0].trim();
        modelo = parts[1].trim();
        // Resto del código
    } else {
        marca = mm_text;
        modelo = '';
    }

    const descripcion = tipoe_text+' | '+agente;

    const { protocoloId1Array, idP1Array } = req.body.data;
    
    const mapeo1 = {};

    // Mapear por ubicación
    for (let i = 0; i < protocoloId1Array.length; i++) {
      const ubicacion = protocoloId1Array[i];
      const idP1 = idP1Array[i];
      mapeo1[ubicacion] = idP1;
    }
    
    // Crear variables
    const inspeccion1 = mapeo1['1'];
    const mantencion1 = mapeo1['2'];
    const prueba1 = mapeo1['3'];

    try {

        if (dinamico === '0'){
            const result1 = await pool.query(
                "UPDATE Equipos SET Descripcion = ?, Id_Tipo = ?, Id_MM = ?, Serie = ?, Detalle = ?, Id_Sector = ?, Id_PInsp = ?, Id_PMant = ?, Id_PPrue = ? WHERE Id = ?;",
                [descripcion, tipoe, mm, serie, du, sector, inspeccion1, mantencion1, prueba1, id_equipo]
            );
        
            const result2 = await pool.query(
                "UPDATE Equipos_General SET eg_detalle_ubicacion = ?, eg_marca = ?, eg_modelo = ?, eg_certificacion = ?, eg_serie = ?, eg_peso = ?, eg_agente = ?, eg_ph = ?, eg_ubicacion_tecnica = ?, eg_superintendencia = ?, eg_equipo_critico = ?, eg_unidad = ?, eg_tipo_equipo = ?, eg_dinamico = ? WHERE eg_id_equipo = ?;",
                [du, marca, modelo, cer, serie, pesoConMedida, agente, ph, ut, sup, critico, unidad, tipoe, dinamico, id_equipo]
            );

            if (serie !== '') {
                const result3 = await pool.query("DELETE FROM Equipos_Dinamicos WHERE ed_serie = ?;", [serie]);  
            }
        
            const prot = idP1Array.map(function (tipo, index) {
                return [tipo, tipoe, id_equipo, protocoloId1Array[index]];
            });
        
            await Promise.all(
                prot.map(async ([protocolo, tipoe, id_equipo, tipo]) => {
                await pool.query(
                    "UPDATE EquipoProtocolo SET ep_id_protocolo = ?, ep_id_tipo_equipo= ? WHERE ep_id_equipo = ? AND ep_id_tipo_protocolo = ?;",
                    [protocolo, tipoe, id_equipo, tipo]
                );
                })
            );
        
            const { cambios } = req.body.data;
            const result = cambios.map(item => ({
                protocoloId: item.protocoloId1,
                idP: item.idP1
            }));
        
            const { protactu } = req.body.data;
            const result_protactu = protactu.map(item => ({
                protocoloId1: item.protocoloId,
                idP1: item.idP
            }));
        
            const filteredResult = result.filter(item => {
                const match = result_protactu.find(
                    element => element.protocoloId1 === item.protocoloId && element.idP1 !== item.idP
                );
                return match;
            });
            
            const idP1s = filteredResult.map(item => {
                const match = result_protactu.find(element => element.protocoloId1 === item.protocoloId);
                return match.idP1;
            });
          
        
            if (idP1s.length > 0) {
                const tareas = await pool.query("SELECT\n" +
                    "    	T.Id\n" +
                    "    FROM\n" +
                    "    	Tareas T \n" +
                    "    	INNER JOIN Protocolos P On P.Id = T.Id_Protocolo\n" +
                    "    WHERE\n" +
                    "    	T.Id_Equipo = ?\n" +
                    "    	AND T.Fecha >= NOW()\n" +
                    "    	AND T.Id_Estado IN (1, 2)\n" +
                    "		AND T.Id_Protocolo IN (?);", [id_equipo, idP1s]);
        
                    const tareasString = tareas.map((row) => row.Id).join('-');
                    const date = new Date();
                    const newArray = dataArray.map((item) => {
                        const [parte1, parte2] = item.datosActuales.split(':');
                        const [parte3, parte4] = item.cambiosRealizar.split(':');
                        
                        return [id_equipo, parte1, parte2, parte4, Login, obs, date];
                    });
                
                    const result3 = await pool.query(
                        "INSERT INTO EquiposElog (elog_id_equipo, elog_descripcion, elog_original, elog_nuevo, elog_usuario, elog_observacion, elog_fecha) VALUES ?;",
                        [newArray]
                    );
        
                    const fecha = await pool.query("SELECT elog_fecha \n" +
                        "FROM EquiposElog \n" +
                        "WHERE elog_id_equipo = ? \n" +
                        "ORDER BY elog_fecha DESC \n" +
                        "LIMIT 1",
                        [id_equipo]
                    );
                
                    const result4 = await pool.query(
                        "UPDATE EquiposElog SET elog_tareas_afectadas = ? WHERE elog_fecha = ? AND elog_id_equipo = ?;",
                        [tareasString, fecha[0].elog_fecha, id_equipo]
                    );
                
                    const updatedTaskIds = [];
                
                    for (let i = 0; i < result.length; i++) {
                    const protocoloId = result[i].protocoloId;
                    const idP = result[i].idP;
                    for (let j = 0; j < tareas.length; j++) {
                        const tareaId = tareas[j].Id;
                        const updateResult = await pool.query(
                        "UPDATE Tareas T INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo SET T.Id_Protocolo = ? WHERE T.Id = ? AND P.Id_TipoProtocolo = ?",
                        [idP, tareaId, protocoloId]
                        );
                        if (updateResult.affectedRows > 0) {
                        updatedTaskIds.push(tareaId);
                        }
                    }
                    }
                
                    res.json({ message: "Equipo creado" });
            }else{
                const date = new Date();
                const newArray = dataArray.map((item) => {
                    const [parte1, parte2] = item.datosActuales.split(':');
                    const [parte3, parte4] = item.cambiosRealizar.split(':');
                    
                    return [id_equipo, parte1, parte2, parte4, Login, obs, date];
                });
                const result3 = await pool.query(
                    "INSERT INTO EquiposElog (elog_id_equipo, elog_descripcion, elog_original, elog_nuevo, elog_usuario, elog_observacion, elog_fecha) VALUES ?;",
                    [newArray]
                );
                
                res.json({ message: "Equipo actualizado" });
            }     
        }else{

            const conserie = await pool.query("SELECT ed_serie FROM Equipos_Dinamicos WHERE ed_serie = ? AND ed_serie <> '' ", [serie]);
            const concer = await pool.query("SELECT ed_certificacion FROM Equipos_Dinamicos WHERE ed_certificacion = ? AND ed_certificacion <> '' ", [cer]);
            const conseries = await pool.query("SELECT ed_serie FROM Equipos_Dinamicos WHERE ed_serie = ? AND ed_serie <> '' ", [cer]);
            const concers = await pool.query("SELECT ed_certificacion FROM Equipos_Dinamicos WHERE ed_certificacion = ? AND ed_certificacion <> '' ", [serie]);
            

            if (conserie.length > 0 || concer.length > 0) {
                res.json({ error: "Serie o certificación ya existen." });
            } else {
                const result1 = await pool.query(
                    "UPDATE Equipos SET Descripcion = ?, Id_Tipo = ?, Id_MM = ?, Detalle = ?, Id_Sector = ? WHERE Id = ?;",
                    [descripcion, tipoe, mm, du, sector, id_equipo]
                );
            
                const result2 = await pool.query(
                    "UPDATE Equipos_General SET eg_detalle_ubicacion = ?, eg_marca = ?, eg_modelo = ?, eg_certificacion = ?, eg_serie = ?, eg_peso = ?, eg_agente = ?, eg_ph = ?, eg_ubicacion_tecnica = ?, eg_superintendencia = ?, eg_equipo_critico = ?, eg_unidad = ?, eg_tipo_equipo = ?, eg_dinamico = ? WHERE eg_id_equipo = ?;",
                    [du, '', '', null, null, '', '', '', ut, sup, null, unidad, tipoe, dinamico, id_equipo]
                );
    
                const result3 = await pool.query("INSERT INTO Equipos_Dinamicos (ed_serie, ed_certificacion, ed_marca, ed_modelo, ed_peso, ed_agente, ed_equipo_critico, ed_tipo_equipo, ed_activo) Values\n" +
                    "(?,?,?,?,?,?,?,?,?);", [serie, cer, marca, modelo, pesoConMedida, agente, critico, tipoe, 1]);
    
           
                const prot = idP1Array.map(function (tipo, index) {
                    return [tipo, tipoe, id_equipo, protocoloId1Array[index]];
                });
            
                await Promise.all(
                    prot.map(async ([protocolo, tipoe, id_equipo, tipo]) => {
                    await pool.query(
                        "UPDATE EquipoProtocolo SET ep_id_protocolo = ?, ep_id_tipo_equipo= ? WHERE ep_id_equipo = ? AND ep_id_tipo_protocolo = ?;",
                        [protocolo, tipoe, id_equipo, tipo]
                    );
                    })
                );
            
                const { cambios } = req.body.data;
                const result = cambios.map(item => ({
                    protocoloId: item.protocoloId1,
                    idP: item.idP1
                }));
            
                const { protactu } = req.body.data;
                const result_protactu = protactu.map(item => ({
                    protocoloId1: item.protocoloId,
                    idP1: item.idP
                }));
            
                const filteredResult = result.filter(item => {
                    const match = result_protactu.find(
                        element => element.protocoloId1 === item.protocoloId && element.idP1 !== item.idP
                    );
                    return match;
                });
                
                const idP1s = filteredResult.map(item => {
                    const match = result_protactu.find(element => element.protocoloId1 === item.protocoloId);
                    return match.idP1;
                });
              
            
                if (idP1s.length > 0) {
                    const tareas = await pool.query("SELECT\n" +
                        "    	T.Id\n" +
                        "    FROM\n" +
                        "    	Tareas T \n" +
                        "    	INNER JOIN Protocolos P On P.Id = T.Id_Protocolo\n" +
                        "    WHERE\n" +
                        "    	T.Id_Equipo = ?\n" +
                        "    	AND T.Fecha >= NOW()\n" +
                        "    	AND T.Id_Estado IN (1, 2)\n" +
                        "		AND T.Id_Protocolo IN (?);", [id_equipo, idP1s]);
            
                        const tareasString = tareas.map((row) => row.Id).join('-');
                        const date = new Date();
                        const newArray = dataArray.map((item) => {
                            const [parte1, parte2] = item.datosActuales.split(':');
                            const [parte3, parte4] = item.cambiosRealizar.split(':');
                            
                            return [id_equipo, parte1, parte2, parte4, Login, obs, date];
                        });
                    
                        const result3 = await pool.query(
                            "INSERT INTO EquiposElog (elog_id_equipo, elog_descripcion, elog_original, elog_nuevo, elog_usuario, elog_observacion, elog_fecha) VALUES ?;",
                            [newArray]
                        );
            
                        const fecha = await pool.query("SELECT elog_fecha \n" +
                            "FROM EquiposElog \n" +
                            "WHERE elog_id_equipo = ? \n" +
                            "ORDER BY elog_fecha DESC \n" +
                            "LIMIT 1",
                            [id_equipo]
                        );
                    
                        const result4 = await pool.query(
                            "UPDATE EquiposElog SET elog_tareas_afectadas = ? WHERE elog_fecha = ? AND elog_id_equipo = ?;",
                            [tareasString, fecha[0].elog_fecha, id_equipo]
                        );
                    
                        const updatedTaskIds = [];
                    
                        for (let i = 0; i < result.length; i++) {
                        const protocoloId = result[i].protocoloId;
                        const idP = result[i].idP;
                        for (let j = 0; j < tareas.length; j++) {
                            const tareaId = tareas[j].Id;
                            const updateResult = await pool.query(
                            "UPDATE Tareas T INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo SET T.Id_Protocolo = ? WHERE T.Id = ? AND P.Id_TipoProtocolo = ?",
                            [idP, tareaId, protocoloId]
                            );
                            if (updateResult.affectedRows > 0) {
                            updatedTaskIds.push(tareaId);
                            }
                        }
                        }
                    
                        res.json({ message: "Equipo actualizado" });
                }else{
                    const date = new Date();
                    const newArray = dataArray.map((item) => {
                        const [parte1, parte2] = item.datosActuales.split(':');
                        const [parte3, parte4] = item.cambiosRealizar.split(':');
                        
                        return [id_equipo, parte1, parte2, parte4, Login, obs, date];
                    });
                    const result3 = await pool.query(
                        "INSERT INTO EquiposElog (elog_id_equipo, elog_descripcion, elog_original, elog_nuevo, elog_usuario, elog_observacion, elog_fecha) VALUES ?;",
                        [newArray]
                    );
                    
                    res.json({ message: "Equipo actualizado" });
                }       
            }             
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error en el servidor" });
    }

});

const DIN = new Array();

function enviar1(req, res, result) {
    res.render("equipos/dinamicos", { DIN: result });
}                    
  
router.get('/dinamicos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    await enviar1(req, res);
});

router.post('/dinamicos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {equipo} = req.body;
    if (!equipo){
        await pool.query("SELECT\n" +
        "	ED.ed_id AS ID,\n" +
        "	ED.ed_serie AS SERIE,\n" +
        "	ED.ed_certificacion AS CER,\n" +
        "	ED.ed_marca AS MARCA,\n" +
        "	ED.ed_modelo AS MODELO,\n" +
        "	ED.ed_peso AS PESO,\n" +
        "	ED.ed_agente AS Agente,\n" +
        "IF\n" +
        "	( ED.ed_equipo_critico = 0, 'NO', 'SI' ) AS CRITICO,\n" +
        "	TP.Descripcion AS TIPO \n" +
        "FROM\n" +
        "	Equipos_Dinamicos ED\n" +
        "	INNER JOIN TipoEquipo TP ON TP.Id = ED.ed_tipo_equipo;", async (req, result)=>{
            if (!result.length) {
                res.render("equipos/dinamicos", { title: "Error en la busqueda!!!" });
              } else {
                DIN.push(result);
                enviar1(req, res, result);
              }
        });
    }else{
        await pool.query("SELECT\n" +
        "	ED.ed_id AS ID,\n" +
        "	ED.ed_serie AS SERIE,\n" +
        "	ED.ed_certificacion AS CER,\n" +
        "	ED.ed_marca AS MARCA,\n" +
        "	ED.ed_modelo AS MODELO,\n" +
        "	ED.ed_peso AS PESO,\n" +
        "	ED.ed_agente AS Agente,\n" +
        "IF\n" +
        "	( ED.ed_equipo_critico = 0, 'NO', 'SI' ) AS CRITICO,\n" +
        "	TP.Descripcion AS TIPO \n" +
        "FROM\n" +
        "	Equipos_Dinamicos ED\n" +
        "	INNER JOIN TipoEquipo TP ON TP.Id = ED.ed_tipo_equipo\n" +
        "WHERE\n" +
        "	ED.ed_serie = '"+equipo+"' OR ED.ed_certificacion = '"+equipo+"';", async (req, result)=>{
            if (!result.length) {
                res.render("equipos/dinamicos", { title: "No se encuentra este equipo!!!" });
              } else {
                DIN.push(result);
                enviar1(req, res, result);
              }
        });
    }
});

router.get('/editdina/:ID', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {ID} = req.params;
    try {
        const marca_modelo = await pool.query("SELECT Id, Descripcion FROM MMEquipo;");
        const agentes = await pool.query("SELECT Id, Descripcion FROM Agentes;");
        const tipo_equipo = await pool.query("SELECT Id, Descripcion FROM TipoEquipo ORDER BY Descripcion ASC;");
        const dinamico =  await pool.query("SELECT\n" +
        "	E.ed_id AS ID,\n" +
        "	E.ed_serie AS SERIE,\n" +
        "	E.ed_certificacion AS CER,\n" +
        "	E.ed_marca AS MARCA,\n" +
        "	E.ed_modelo AS MODELO,\n" +
        "	E.ed_peso AS PESO,\n" +
        "	E.ed_agente AS AGENTE,\n" +
        "	E.ed_equipo_critico AS CRITICO,\n" +
        "	E.ed_tipo_equipo AS TIPO_OLD,\n" +
        "	T.Descripcion AS TIPO,\n" +
        "	E.ed_activo AS ACTIVO,\n" +
        "	E.ed_observacion AS OBS \n" +
        "FROM\n" +
        "	Equipos_Dinamicos E\n" +
        "	INNER JOIN TipoEquipo T ON E.ed_tipo_equipo = T.Id\n" +
        "WHERE\n" +
        "	ed_id = ?;", [ID]);

        const marca = dinamico[0].MARCA;
        const modelo = dinamico[0].MODELO;
        const mm = marca+" | "+modelo; 
        const pesoymedida = dinamico[0].PESO;
        const [peso, medida] = pesoymedida.split(' ');
        console.log(peso);
        res.render('equipos/editdina', 
            {din: dinamico[0],
            marca_modelo: marca_modelo,
            mm:mm,
            agentes: agentes,
            tipo_equipo: tipo_equipo,
            peso: peso,
            medida: medida
        });
    } catch (err) {
        console.log(err);
    }
});

router.post('/actualizar_dinamico', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Login} = req.user;
    const {data} = req.body;
    const {datosTabla} = req.body;
    const {observaciones} = req.body;
    const {id, serie, cer, critico, critico_text, agente, mm, tipo_text, tipoe, pesoconmedida } = data;
    const dataArray = req.body.datosTabla;
    const date = new Date().toLocaleDateString('en-GB');
    const fecha = date.replace(/\//g, "-");
    const dated = new Date();
    let marca;
    let modelo;

    if (mm.includes('|')) {
        let parts = mm.split('|');
        marca = parts[0].trim();
        modelo = parts[1].trim();
        // Resto del código
    } else {
        marca = mm;
        modelo = '';
    }

    const obsD = "DINAMICO:  "+observaciones;

    try { 
        const obs = await pool.query("SELECT ed_observacion AS OBS FROM Equipos_Dinamicos WHERE ed_id = ?;", [id]);
        const obs_act = obs[0].OBS;

        const obs_final = obs_act+" // "+fecha+" | "+Login+" | "+observaciones;

        const actualiza = await pool.query("UPDATE Equipos_Dinamicos SET ed_serie = ?, ed_certificacion = ?, ed_marca = ?, ed_modelo = ?,\n" +
        "ed_peso = ?, ed_agente = ?, ed_equipo_critico = ?, ed_tipo_equipo = ?, ed_observacion = ? WHERE ed_id = ?;",
        [serie, cer, marca, modelo, pesoconmedida, agente, critico, tipoe, obs_final, id]);

        if (typeof dataArray === 'undefined') {
            const newArray = [id, 'observación', 'obs', 'obs', Login, obsD, dated];
            const elog = await pool.query(
                "INSERT INTO EquiposElog (elog_id_equipo, elog_descripcion, elog_original, elog_nuevo, elog_usuario, elog_observacion, elog_fecha) VALUES (?, ?, ?, ?, ?, ?, ?);",
                newArray
            );      
        } else {
            const newArray = dataArray.map((item) => {
                const [parte1, parte2] = item.datosActuales.split(':');
                const [parte3, parte4] = item.cambiosRealizar.split(':');
                
                return [id, parte1, parte2, parte4, Login, obsD, dated];
            });

            const elog = await pool.query(
                "INSERT INTO EquiposElog (elog_id_equipo, elog_descripcion, elog_original, elog_nuevo, elog_usuario, elog_observacion, elog_fecha) VALUES ?;",
                [newArray]
            );
        }

        res.json({ message: "Equipo actualizado" });
    } catch (err) {
        console.log(err);
        res.json({ error: "Error en el servidor" });
    }
});

module.exports = router;

