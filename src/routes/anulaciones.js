const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole, roles } = require('../lib/rol');
const nodemailer = require('nodemailer');
const hbs = require("handlebars");
const fs = require("fs");
const path = require("path"); 
const XLSX = require('xlsx');
const moment = require('moment');
const multer = require('multer');
const upload = multer();

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

router.get("/tgenerales", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
  const fecha_anio = await pool.query("SELECT\n" +
    "    YEAR(Fecha) AS Anio,\n" +
    "    COUNT(*) AS Cantidad\n" +
    "FROM\n" +
    "    Tareas\n" +
    "GROUP BY\n" +
    "    YEAR(Fecha)\n" +
    "ORDER BY\n" +
    "    Anio");
  res.render("generales/generales",{
    fecha_anio: fecha_anio
  });
});

router.get('/fuente_mesg/:year', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
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

router.post("/tgenerales", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{

  try {

    const {date3, date4, tarea, test} = req.body;

    let tt; 

    if (test === 'on') {
        tt = "%test"; 
    } else {
        tt = ''; 
    }

    if (date3 > 0 & date4 === '' & tarea === '') {

      const primero = new Date(date3);
      const fechaInicial = primero.toISOString().slice(0,10);

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const gAno = await pool.query("CALL sp_TareasFull ('GENERAL_A', NULL, ? , NULL , null, ? , NULL, NULL, NULL );", [fechaInicial, tt]);

      if (!gAno){
        res.json({ title: "Sin Información." });
      }else{
        res.json(gAno[0]);
      }

    }else if (date3 > 0  & date4 > 0 & tarea === '') {

      const primero = new Date(date3, date4 - 1, 1);
      const fechaInicial = primero.toISOString().slice(0,10);

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const gAnoMes = await pool.query("CALL sp_TareasFull ('GENERAL_AM', NULL, ? , NULL , null, ? , NULL, NULL, NULL );", [fechaInicial, tt]);

      if (!gAnoMes){
        res.json({ title: "Sin Información." });
      }else{
        res.json(gAnoMes[0]);
        console.log(gAnoMes[0]);
      }

    }else if (date3 === '' & date4 === '' & tarea > 0) {

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const gTarea = await pool.query("CALL sp_TareasFull ('GENERAL_ID', ?, NULL , NULL , null, ? , NULL, NULL, NULL );", [tarea, tt]);

      if (!gTarea){
        res.json({ title: "Sin Información." });
      }else{
        res.json(gTarea[0]);
      }
    }

  } catch (error) {

    console.log(error);
    
  }

});


router.post("/anular", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
  const idt = req.body.datos.map((dato) => dato.idt);
  const comment = req.body.comentario;
  const date = new Date();
  const {usuario} = req.user;
  const {Perfil} = req.user;
  const {Id_Cliente} = req.user;

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Para que se muestre en formato de 24 horas
  };
const dates = new Date().toLocaleString('es-CL', options);

const tareas_res = await pool.query("SELECT\n" +
"	* \n" +
"FROM\n" +
"	(\n" +
"	SELECT\n" +
"		T.Id AS IDT,\n" +
"		date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
"		VE.vce_codigo AS CODIGO,\n" +
"		VE.vcgas_gerenciaN AS GERENCIA,\n" +
"		VE.vcgas_areaN AS AREA,\n" +
"		VE.vcgas_sectorN AS SECTOR,\n" +
"		TP.Descripcion AS SERVICIO,\n" +
"		E.Descripcion AS ESTADO,\n" +
"		COUNT(*) OVER ( PARTITION BY VE.vce_codigo ) AS CuentaCodigo \n" +
"	FROM\n" +
"		VIEW_tareaCliente V\n" +
"		INNER JOIN Tareas T ON T.Id = V.vtc_tareaId\n" +
"		INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
"		INNER JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo\n" +
"		INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
"		INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
"		INNER JOIN Estados E ON E.Id = T.Id_Estado \n" +
"	WHERE\n" +
"		V.vtc_idCliente = "+Id_Cliente+" \n" +
"		AND T.Id_Estado IN ( 5, 1, 2, 4, 6 ) \n" +
"		AND T.Id IN ("+idt+") \n" +
"		AND U.Descripcion NOT LIKE '%TEST%' \n" +
"	ORDER BY\n" +
"		CuentaCodigo DESC,\n" +
"		VE.vcgas_gerenciaN,\n" +
"		VE.vcgas_areaN,\n" +
"		VE.vcgas_sectorN,\n" +
"		T.Id_Equipo ASC \n" +
"	) AS R UNION\n" +
"SELECT\n" +
"	* \n" +
"FROM\n" +
"	(\n" +
"	SELECT\n" +
"		T.Id AS IDT,\n" +
"		date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
"		VE.vce_codigo AS CODIGO,\n" +
"		VE.vcgas_gerenciaN AS GERENCIA,\n" +
"		VE.vcgas_areaN AS AREA,\n" +
"		VE.vcgas_sectorN AS SECTOR,\n" +
"		TP.Descripcion AS SERVICIO,\n" +
"		E.Descripcion AS ESTADO,\n" +
"		'CuentaCodigo' \n" +
"	FROM\n" +
"		VIEW_tareaCliente V\n" +
"		INNER JOIN Tareas T ON T.Id = V.vtc_tareaId\n" +
"		INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
"		INNER JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo\n" +
"		INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
"		INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
"		INNER JOIN Estados E ON E.Id = T.Id_Estado \n" +
"	WHERE\n" +
"		V.vtc_idCliente = "+Id_Cliente+" \n" +
"		AND T.Id_Estado IN ( 3 ) \n" +
"		AND T.Id IN ("+idt+") \n" +
"		AND U.Descripcion NOT LIKE '%TEST%' \n" +
"	ORDER BY\n" +
"		CuentaCodigo DESC,\n" +
"		VE.vcgas_gerenciaN,\n" +
"		VE.vcgas_areaN,\n" +
"		VE.vcgas_sectorN,\n" +
"	T.Id_Equipo ASC \n" +
"	) AS X;");

var data = [];
for (var i = 0; i < tareas_res.length; i++) {
  data.push({
      Tarea: tareas_res[i].IDT,
      Fecha: tareas_res[i].FECHA,
      Tag: tareas_res[i].CODIGO,
      Gerencia: tareas_res[i].GERENCIA,
      Area: tareas_res[i].AREA,
      Sector: tareas_res[i].SECTOR,
      Servicio: tareas_res[i].SERVICIO,
      Estado: "Anulada",
      Observación: comment,
      Fecha_Anulación: dates,
      Anulado_Por: usuario 
  });
}

  // Crear un libro de trabajo y una hoja
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(data);

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
  XLSX.utils.book_append_sheet(wb, ws);


  // Generar el archivo en memoria
  var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});

  if (idt > 1){
    const est_old1 = await pool.query("SELECT T.Id_Estado FROM Tareas T WHERE T.Id IN ("+idt+")");
    const estado = est_old1[0].Id_Estado;
    const idtf = idt;
    const arreglo = [idtf, 3, comment, date, date, usuario, Perfil, usuario, estado];
    await pool.query("INSERT IGNORE INTO Validacion_Tareas ( Val_tarea_id, Val_id_estado, Val_obs, Val_fechaval_inf, Val_fechaval_cte, Val_respnombre, Val_respcargo, Val_respsapma, Val_id_estado_old )\n" +
    "VALUES (?)", [arreglo], async (err, result) =>{
        if (err) {
          console.log(err);
        }else{
          await pool.query("UPDATE Tareas SET Id_Estado = 3 WHERE Id IN (?)", [idt], async (err, result) => {
            if (err){
              console.log(err);
            }else{
              await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 3 WHERE Val_tarea_id IN ("+idt+")");
              const datemail = new Date().toLocaleDateString('en-GB');
              const filePathName1 = path.resolve(__dirname, "../views/email/emailanular.hbs"); 
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
              const {Email} = req.user;  
              await transporter.sendMail({
                from: "SAPMA <sapmamlcc@sercoing.cl>",
                // to: "marancibia@sercoing.cl",
                to: [email_plan, Email],
                bcc: "sapmamlcc@sercoing.cl",
                subject: "SAPMA - Tareas Anuladas",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",

                  },
                  {
                    filename: 'anulaciones_'+datemail+'.xlsx',
                    content: buffer
                  }
                ],
              });
            }
          });
        }
    });
  }else{
    const est_old = await pool.query("SELECT T.Id, T.Id_Estado FROM Tareas T WHERE T.Id IN ("+idt+")");
    const idToEstado = {};
    est_old.forEach(row => {
      idToEstado[row.Id] = row.Id_Estado;
    });
    const arreglo1 = [];
    for (let i = 0; i < idt.length; i++) {
      const item = idt[i];
      const id = item;
      const estado = idToEstado[id];
      arreglo1.push([item, 3, comment, date, date, usuario, Perfil, usuario, estado]);
    }
    console.log(arreglo1);
    await pool.query("INSERT IGNORE INTO Validacion_Tareas ( Val_tarea_id, Val_id_estado, Val_obs, Val_fechaval_inf, Val_fechaval_cte, Val_respnombre, Val_respcargo, Val_respsapma, Val_id_estado_old )\n" +
    "VALUES ?", [arreglo1], async (err, result) =>{
        if (err) {
          console.log(err);
        }else{
          await pool.query("UPDATE Tareas SET Id_Estado = 3 WHERE Id IN (?)", [idt], async (err, result) => {
            if (err){
              console.log(err);
            }else{
              const datemail = new Date().toLocaleDateString('en-GB');
              const filePathName1 = path.resolve(__dirname, "../views/email/emailanular.hbs"); 
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
              const {Email} = req.user;        
              await transporter.sendMail({
                from: "SAPMA <sapmamlcc@sercoing.cl>",
                // to: "marancibia@sercoing.cl",
                to: [email_plan, Email],
                bcc: "sapmamlcc@sercoing.cl",
                subject: "SAPMA - Tareas Anuladas",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",
                  },
                  {
                    filename: 'anulaciones_'+datemail+'.xlsx',
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

router.post("/anular_lista", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
  const idt = req.body.numbers;
  const comment = req.body.comentario;
  const date = new Date();
  const {usuario} = req.user;
  const {Perfil} = req.user;
  const {Id_Cliente} = req.user;
  const dates = new Date().toLocaleString('en-GB', { timeZone: 'UTC' });
  const tareas_res = await pool.query("SELECT\n" +
  "	* \n" +
  "FROM\n" +
  "	(\n" +
  "	SELECT\n" +
  "		T.Id AS IDT,\n" +
  "		date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
  "		VE.vce_codigo AS CODIGO,\n" +
  "		VE.vcgas_gerenciaN AS GERENCIA,\n" +
  "		VE.vcgas_areaN AS AREA,\n" +
  "		VE.vcgas_sectorN AS SECTOR,\n" +
  "		TP.Descripcion AS SERVICIO,\n" +
  "		E.Descripcion AS ESTADO,\n" +
  "		COUNT(*) OVER ( PARTITION BY VE.vce_codigo ) AS CuentaCodigo \n" +
  "	FROM\n" +
  "		VIEW_tareaCliente V\n" +
  "		INNER JOIN Tareas T ON T.Id = V.vtc_tareaId\n" +
  "		INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
  "		INNER JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo\n" +
  "		INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
  "		INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
  "		INNER JOIN Estados E ON E.Id = T.Id_Estado \n" +
  "	WHERE\n" +
  "		V.vtc_idCliente = "+Id_Cliente+" \n" +
  "		AND T.Id_Estado IN ( 5, 1, 2, 4, 6 ) \n" +
  "		AND T.Id IN ("+idt+") \n" +
  "		AND U.Descripcion NOT LIKE '%TEST%' \n" +
  "	ORDER BY\n" +
  "		CuentaCodigo DESC,\n" +
  "		VE.vcgas_gerenciaN,\n" +
  "		VE.vcgas_areaN,\n" +
  "		VE.vcgas_sectorN,\n" +
  "		T.Id_Equipo ASC \n" +
  "	) AS R UNION\n" +
  "SELECT\n" +
  "	* \n" +
  "FROM\n" +
  "	(\n" +
  "	SELECT\n" +
  "		T.Id AS IDT,\n" +
  "		date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
  "		VE.vce_codigo AS CODIGO,\n" +
  "		VE.vcgas_gerenciaN AS GERENCIA,\n" +
  "		VE.vcgas_areaN AS AREA,\n" +
  "		VE.vcgas_sectorN AS SECTOR,\n" +
  "		TP.Descripcion AS SERVICIO,\n" +
  "		E.Descripcion AS ESTADO,\n" +
  "		'CuentaCodigo' \n" +
  "	FROM\n" +
  "		VIEW_tareaCliente V\n" +
  "		INNER JOIN Tareas T ON T.Id = V.vtc_tareaId\n" +
  "		INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
  "		INNER JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo\n" +
  "		INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
  "		INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
  "		INNER JOIN Estados E ON E.Id = T.Id_Estado \n" +
  "	WHERE\n" +
  "		V.vtc_idCliente = "+Id_Cliente+" \n" +
  "		AND T.Id_Estado IN ( 3 ) \n" +
  "		AND T.Id IN ("+idt+") \n" +
  "		AND U.Descripcion NOT LIKE '%TEST%' \n" +
  "	ORDER BY\n" +
  "		CuentaCodigo DESC,\n" +
  "		VE.vcgas_gerenciaN,\n" +
  "		VE.vcgas_areaN,\n" +
  "		VE.vcgas_sectorN,\n" +
  "	T.Id_Equipo ASC \n" +
  "	) AS X;");
 
  var data = [];
  for (var i = 0; i < tareas_res.length; i++) {
    data.push({
        Tarea: tareas_res[i].IDT,
        Fecha: tareas_res[i].FECHA,
        Tag: tareas_res[i].CODIGO,
        Gerencia: tareas_res[i].GERENCIA,
        Area: tareas_res[i].AREA,
        Sector: tareas_res[i].SECTOR,
        Servicio: tareas_res[i].SERVICIO,
        Estado: "Anulada",
        Observación: comment,
        Fecha_Anulación: dates,
        Anulado_Por: usuario 
    });
  }

  // Crear un libro de trabajo y una hoja
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(data);

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
  XLSX.utils.book_append_sheet(wb, ws);


  // Generar el archivo en memoria
  var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});


  const est_old = await pool.query("SELECT T.Id, T.Id_Estado FROM Tareas T WHERE T.Id IN ("+idt+")");
  const idToEstado = {};
  est_old.forEach(row => {
    idToEstado[row.Id] = row.Id_Estado;
  });
  const arreglo1 = [];
  for (let i = 0; i < idt.length; i++) {
    const item = idt[i];
    const id = item;
    const estado = idToEstado[id];
    arreglo1.push([item, 3, comment, date, date, usuario, Perfil, usuario, estado]);
  }
    await pool.query("INSERT IGNORE INTO Validacion_Tareas ( Val_tarea_id, Val_id_estado, Val_obs, Val_fechaval_inf, Val_fechaval_cte, Val_respnombre, Val_respcargo, Val_respsapma, Val_id_estado_old )\n" +
    "VALUES ?", [arreglo1], async (err, result) =>{
        if (err) {
          console.log(err);
        }else{
          await pool.query("UPDATE Tareas SET Id_Estado = 3 WHERE Id IN (?)", [idt], async (err, result) => {
            if (err){
              console.log(err);
            }else{
              await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 3 WHERE Val_tarea_id IN ("+idt+")");
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
              const {Email} = req.user;
              const datemail = new Date().toLocaleDateString('en-GB');
              const filePathName1 = path.resolve(__dirname, "../views/email/emailanular.hbs"); 
              const mensaje = fs.readFileSync(filePathName1, "utf8");
              const template = hbs.compile(mensaje);
              const context = {
                      datemail, 
                    };
              const html = template(context);        
              await transporter.sendMail({
                from: "SAPMA <sapmamlcc@sercoing.cl>",
                // to: "marancibia@sercoing.cl",
                to: [Email, email_plan],
                bcc: "sapmamlcc@sercoing.cl",
                subject: "SAPMA - Tareas Anuladas",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",
                  },
                  {
                    filename: 'anulaciones_'+datemail+'.xlsx',
                    content: buffer
                  }
                ],
              });
            }
          });
        }
    });

});

router.post("/anular_ex", isLoggedIn, upload.single('file'), authRole(['Plan', 'Admincli']), async (req, res) =>{
  const workbook = XLSX.read(req.file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  const tasks = data.map(row => row['Tarea']);
  const idt = tasks.map(number => number.toString());
  const comment = req.body.comentario;
  const date = new Date();
  const {usuario} = req.user;
  const {Perfil} = req.user;
  const {Id_Cliente} = req.user;
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Para que se muestre en formato de 24 horas
  };
const dates = new Date().toLocaleString('es-CL', options);
  const tareas_res = await pool.query("SELECT\n" +
  "	* \n" +
  "FROM\n" +
  "	(\n" +
  "	SELECT\n" +
  "		T.Id AS IDT,\n" +
  "		date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
  "		VE.vce_codigo AS CODIGO,\n" +
  "		VE.vcgas_gerenciaN AS GERENCIA,\n" +
  "		VE.vcgas_areaN AS AREA,\n" +
  "		VE.vcgas_sectorN AS SECTOR,\n" +
  "		TP.Descripcion AS SERVICIO,\n" +
  "		E.Descripcion AS ESTADO,\n" +
  "		COUNT(*) OVER ( PARTITION BY VE.vce_codigo ) AS CuentaCodigo \n" +
  "	FROM\n" +
  "		VIEW_tareaCliente V\n" +
  "		INNER JOIN Tareas T ON T.Id = V.vtc_tareaId\n" +
  "		INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
  "		INNER JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo\n" +
  "		INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
  "		INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
  "		INNER JOIN Estados E ON E.Id = T.Id_Estado \n" +
  "	WHERE\n" +
  "		V.vtc_idCliente = "+Id_Cliente+" \n" +
  "		AND T.Id_Estado IN ( 5, 1, 2, 4, 6 ) \n" +
  "		AND T.Id IN ("+idt+") \n" +
  "		AND U.Descripcion NOT LIKE '%TEST%' \n" +
  "	ORDER BY\n" +
  "		CuentaCodigo DESC,\n" +
  "		VE.vcgas_gerenciaN,\n" +
  "		VE.vcgas_areaN,\n" +
  "		VE.vcgas_sectorN,\n" +
  "		T.Id_Equipo ASC \n" +
  "	) AS R UNION\n" +
  "SELECT\n" +
  "	* \n" +
  "FROM\n" +
  "	(\n" +
  "	SELECT\n" +
  "		T.Id AS IDT,\n" +
  "		date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
  "		VE.vce_codigo AS CODIGO,\n" +
  "		VE.vcgas_gerenciaN AS GERENCIA,\n" +
  "		VE.vcgas_areaN AS AREA,\n" +
  "		VE.vcgas_sectorN AS SECTOR,\n" +
  "		TP.Descripcion AS SERVICIO,\n" +
  "		E.Descripcion AS ESTADO,\n" +
  "		'CuentaCodigo' \n" +
  "	FROM\n" +
  "		VIEW_tareaCliente V\n" +
  "		INNER JOIN Tareas T ON T.Id = V.vtc_tareaId\n" +
  "		INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico\n" +
  "		INNER JOIN VIEW_equiposCteGerAreSec VE ON VE.vce_idEquipo = T.Id_Equipo\n" +
  "		INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
  "		INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
  "		INNER JOIN Estados E ON E.Id = T.Id_Estado \n" +
  "	WHERE\n" +
  "		V.vtc_idCliente = "+Id_Cliente+" \n" +
  "		AND T.Id_Estado IN ( 3 ) \n" +
  "		AND T.Id IN ("+idt+") \n" +
  "		AND U.Descripcion NOT LIKE '%TEST%' \n" +
  "	ORDER BY\n" +
  "		CuentaCodigo DESC,\n" +
  "		VE.vcgas_gerenciaN,\n" +
  "		VE.vcgas_areaN,\n" +
  "		VE.vcgas_sectorN,\n" +
  "	T.Id_Equipo ASC \n" +
  "	) AS X;");

  var dato = [];
  for (var i = 0; i < tareas_res.length; i++) {
    dato.push({
        Tarea: tareas_res[i].IDT,
        Fecha: tareas_res[i].FECHA,
        Tag: tareas_res[i].CODIGO,
        Gerencia: tareas_res[i].GERENCIA,
        Area: tareas_res[i].AREA,
        Sector: tareas_res[i].SECTOR,
        Servicio: tareas_res[i].SERVICIO,
        Estado: "Anulada",
        Observación: comment,
        Fecha_Anulación: dates,
        Anulado_Por: usuario 
    });
  }

  // Crear un libro de trabajo y una hoja
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(dato);

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
  XLSX.utils.book_append_sheet(wb, ws);


  // Generar el archivo en memoria
  var buffer = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});


  const est_old = await pool.query("SELECT T.Id, T.Id_Estado FROM Tareas T WHERE T.Id IN ("+idt+")");
  const idToEstado = {};
  est_old.forEach(row => {
    idToEstado[row.Id] = row.Id_Estado;
  });
  const arreglo1 = [];
  for (let i = 0; i < idt.length; i++) {
    const item = idt[i];
    const id = item;
    const estado = idToEstado[id];
    arreglo1.push([item, 3, comment, date, date, usuario, Perfil, usuario, estado]);
  }
    await pool.query("INSERT IGNORE INTO Validacion_Tareas ( Val_tarea_id, Val_id_estado, Val_obs, Val_fechaval_inf, Val_fechaval_cte, Val_respnombre, Val_respcargo, Val_respsapma, Val_id_estado_old )\n" +
    "VALUES ?", [arreglo1], async (err, result) =>{
        if (err) {
          console.log(err);
        }else{
          await pool.query("UPDATE Tareas SET Id_Estado = 3 WHERE Id IN (?)", [idt], async (err, result) => {
            if (err){
              console.log(err);
            }else{
              await pool.query("UPDATE Validacion_Tareas SET Val_id_estado = 3 WHERE Val_tarea_id IN ("+idt+")");
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
              const {Email} = req.user;
              const datemail = new Date().toLocaleDateString('en-GB');
              const filePathName1 = path.resolve(__dirname, "../views/email/emailanular.hbs"); 
              const mensaje = fs.readFileSync(filePathName1, "utf8");
              const template = hbs.compile(mensaje);
              const context = {
                      datemail, 
                    };
              const html = template(context);        
              await transporter.sendMail({
                from: "SAPMA <sapmamlcc@sercoing.cl>",
                to: [Email, email_plan],
                // to: "marancibia@sercoing.cl",
                bcc: "sapmamlcc@sercoing.cl",
                subject: "SAPMA - Tareas Anuladas",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",
                  },
                  {
                    filename: 'anulaciones_'+datemail+'.xlsx',
                    content: buffer
                  }
                ],
              });
            }
          });
        }
    });

});

router.get('/download', (req, res) => {
  const filePath = path.join(__dirname, '../plantillas/anular_tareas.xls');
  // console.log(filePath);
  res.download(filePath);
});

module.exports = router;