const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isLoggedIn } = require("../lib/auth");
const { authRole } = require("../lib/rol");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const pdf = require("dynamic-html-pdf");
global.ReadableStream = require('web-streams-polyfill').ReadableStream;
const puppeteer = require('puppeteer');
const fs = require("fs");
const path = require("path"); 
const request = require('request');
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

router.get("/protocolos", isLoggedIn,  async (req, res) => {
  res.render("protocolos/protocolos");
});

router.post("/protocoloss", isLoggedIn,  async (req, res) => {

  try {

    const { date1, date2, tarea, test } = req.body;

    let tt; 

    if (test === 'on') {
        tt = "%test"; 
    } else {
        tt = ''; 
    }

    if (tarea > 0) {

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const pTarea = await pool.query("CALL sp_TareasFull ('PARA_VALIDAR_ID', ?, NULL , NULL , NULL , ? , NULL, NULL, NULL );",[tarea, tt]);

      if(!pTarea){
        res.json({ title: "Sin Información." });
      }else{
        res.json(pTarea[0]);
      }

    }else{

      const actualizar_tareas = await pool.query('CALL sp_ActualizarTareaDetalle();');

      const pRango = await pool.query("CALL sp_TareasFull ('PARA_VALIDAR_RANGO', NULL, NULL , ? , ? , ? , NULL, NULL, NULL );", [date1, date2, tt]);

      if(!pRango){
        res.json({ title: "Sin Información." });
      }else{
        res.json(pRango[0]);
      }

    }
    
  } catch (error) {

    console.log(error);
    
  }

});

router.get("/protocolo/:IDT", isLoggedIn, authRole(['Cli_C', 'Cli_B', 'Cli_A', 'Cli_D', 'Cli_E', 'Plan', 'Admincli', 'GerVer']), async (req, res) => {

  try {
    const { IDT } = req.params;

    const consultaImagenes =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    const imagenes = [];

    if (consultaImagenes.length > 0) {
      const img = consultaImagenes[0].Archivos.split('|');
      const images = img.map((img) => {
        return "/images/" + IDT + "_" + img;
      });     
      imagenes.push(...images);
    }

    const info_prot = await pool.query(
      " SELECT\n" +
      "	Tareas.Id AS TR_TAREA_ID,\n" +
      "	date_format( Tareas.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
      "	Protocolos.Id AS 'TR_PROT_ID',\n" +
      "	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      "	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      "	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      "	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      "	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      "	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      "	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      "	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      "	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      "	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      "	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      "	Estados.Descripcion AS 'TR_ESTADO',\n" +
      "    CONVERT (\n" +
      "        CAST(\n" +
      "            CONVERT (\n" +
      "            IF\n" +
      "                (\n" +
      "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
      "                    'No aplica',\n" +
      "                IF\n" +
      "                    (\n" +
      "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
      "                        'Sistema sin revisar.',\n" +
      "                    IF\n" +
      "                        (\n" +
      "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
      "                            'Sistema operativo',\n" +
      "                        IF\n" +
      "                            (\n" +
      "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
      "                                'Sist. operativo con obs.',\n" +
      "                            IF\n" +
      "                                (\n" +
      "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
      "                                    'Sist. fuera de serv.',\n" +
      "                                IF\n" +
      "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
      "            ) AS BINARY \n" +
      "        ) USING UTF8 \n" +
      "    ) AS 'TR_RESPUESTA',\n" +
      "	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      "	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      "IF\n" +
      "	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      "	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      "	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      "IF\n" +
      "	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      "	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      "	EQ.SecDESC AS 'TR_SECTOR',\n" +
      "	EQ.AreaDESC AS 'TR_AREA',\n" +
      "	EQ.GerDESC AS 'TR_GERENCIA' \n" +
      "FROM\n" +
      "	Protocolos\n" +
      "	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      "	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      "	INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      "	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      "	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      "	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      "	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      "	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      "	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      "	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      "	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      "	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      "	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      "	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      "	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      "	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      "	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      "	INNER JOIN (\n" +
      "	SELECT\n" +
      "		E.Id 'EqID',\n" +
      "		S.Descripcion 'SecDESC',\n" +
      "		A.Descripcion 'AreaDESC',\n" +
      "		G.Descripcion 'GerDESC',\n" +
      "		C.Descripcion 'CteDESC' \n" +
      "	FROM\n" +
      "		Equipos E\n" +
      "		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      "		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      "		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      "		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      "	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      "WHERE\n" +
      "	Tareas.Id = ?\n" +
      "ORDER BY\n" +
      "	TR_PROT_DESC_CAPI ASC,\n" +
      "	FIELD( TR_PROT_CAPTURA, 'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP' ),\n" +
      "	TR_PROT_CAPTURA ASC", [IDT]
    );
    
    const codigo = info_prot[0].TR_EQUIPO_COD;
    const id_bat = await pool.query("SELECT eq_bat_id FROM Equipos WHERE Codigo =?", [codigo]);
    const bat_id = id_bat[0].eq_bat_id;
    const bat = await pool.query("SELECT * FROM Baterias_UPS WHERE bat_id =?", [bat_id]);

    const agregarDatosBateria = (info_prot, bat) => {

      for (let i = 0; i < info_prot.length; i++) {

        if (bat.length > 0) {
          info_prot[i] = { ...info_prot[i], ...bat[0] };
        }
      }
    };
    
    await agregarDatosBateria(info_prot, bat);

    res.render("protocolos/protocolo",{
      prot: info_prot,
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].TR_RESPUESTA,
      OT: info_prot[2].TR_RESPUESTA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      BAT: info_prot[0].bat_marca,
      imagenes: imagenes

    });

  } catch (error) {
    
    console.log(error);
  }

});

router.post("/protocolo/validar", isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
  
  try {

    const {usuario, Id_Cliente} = req.user;
    const datas = Object.values(req.body);
    
    const actTareaEstado = await pool.query(`UPDATE Tareas_Estado SET te_Estado_val = 1 WHERE te_Id_Tarea IN (${datas});`);

    const arreglo = [];
    arreglo.push(datas);
    const arreglo1 = arreglo[0];
    const arreglo2 = arreglo1.toString();
    const arreglo3 = arreglo2.split(",");
    const arreglo4 = arreglo3.map(Number);
    const date = new Date();
    const arreglo5 = arreglo4.map(function (id) {
      return [id, 5, 5, usuario, date, 0];
    });

    const insValTareas = await pool.query("INSERT INTO Validacion_Tareas (Val_tarea_id, Val_id_estado, Val_id_estado_old, Val_respsapma, Val_fechaval_inf, Val_rechazo) Values ?", [arreglo5]);

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
      "						T.Id IN ( "+datas+" ) \n" +
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
    const filePathName1 = path.resolve(__dirname, "../views/email/emailplan.hbs"); 
    const mensaje = fs.readFileSync(filePathName1, "utf8");
    const template = hbs.compile(mensaje);

    const context = {
      datemail, 
    };

    const html = template(context);

    await transporter.sendMail({
      from: "SAPMA <sapmamlcc@sercoing.cl>",
      //to: 'marancibia@sercoing.cl',
      to: [arremailgen, arremail],
      cc: arremailp,
      bcc: correo,
      subject: "SAPMA - Aprobación de Tareas",
      html,
      attachments: [
        {
          filename: "imagen1.png",
          path: "./src/public/img/imagen1.png",
          cid: "imagen1",
        },
      ],
    });

    res.send("ok");

  } catch (error) {
    
    console.log(error);

  }
});

router.get("/pdf/:IDT/:CODIGO/:OT", isLoggedIn, authRole(['Cli_C', 'Cli_B', 'Cli_A', 'Cli_D', 'Cli_E', 'Plan', 'Admincli', 'GerVer']), async (req, res) => {

  try {

    const { IDT, CODIGO, OT } = req.params;
    const consultaImagenes =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [IDT]);
    const imagenes = [];

    if (consultaImagenes.length > 0) {
      const img = consultaImagenes[0].Archivos.split('|');
      const rutaImagenes = path.resolve(__dirname, "../images/");
    
      const images = img.map((img) => {
        const imagePath = path.join(rutaImagenes, IDT + "_" + img);
        const imageData = fs.readFileSync(imagePath);
        const base64Image = Buffer.from(imageData).toString('base64');
        return 'data:image/png;base64,'+ base64Image;
      });
    
      imagenes.push(...images);
    }

    const info_prot = await pool.query("SELECT\n" +
      " Tareas.Id AS TR_TAREA_ID,\n" +
      " date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      " Protocolos.Id AS 'TR_PROT_ID',\n" +
      " TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      " UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      " Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      " Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      " Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      " UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      " Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      " Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      " Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      " TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      " TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      " Estados.Descripcion AS 'TR_ESTADO',\n" +
      " CONVERT ( CAST( CONVERT ( IF ( Tarea_Respuesta.Respuesta = 'SC', 'No aplica',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SSR', 'Sistema sin revisar.', IF(Tarea_Respuesta.Respuesta = 'SOP', 'Sistema operativo',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SOCO', 'Sist. operativo con obs.', IF(Tarea_Respuesta.Respuesta = 'SFS', 'Sist. fuera de serv.',\n" +
      " IF ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 ) AS BINARY ) USING UTF8 ) AS 'TR_RESPUESTA',\n" +
      " Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      " UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      " IF ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      " TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      " TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      " IF( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      " Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      " EQ.SecDESC AS 'TR_SECTOR',\n" +
      " EQ.AreaDESC AS 'TR_AREA',\n" +
      " EQ.GerDESC AS 'TR_GERENCIA' \n" +
      " FROM\n" +
      " Protocolos\n" +
      " INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      " INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      " INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      " INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      " AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      " INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      " INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      " INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      " AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      " AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      " INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      " INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      " INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      " LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      " LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      " INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      " INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      " INNER JOIN (\n" +
      " SELECT\n" +
      " E.Id 'EqID',\n" +
      " S.Descripcion 'SecDESC',\n" +
      " A.Descripcion 'AreaDESC',\n" +
      " G.Descripcion 'GerDESC',\n" +
      " C.Descripcion 'CteDESC' \n" +
      " FROM\n" +
      " Equipos E\n" +
      " INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      " INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      " INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      " INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      " ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      " WHERE \n" +
      " Tareas.Id = "+IDT+" \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    const codigo = info_prot[0].TR_EQUIPO_COD;
    const id_bat = await pool.query("SELECT eq_bat_id FROM Equipos WHERE Codigo =?", [codigo]);
    const bat_id = id_bat[0].eq_bat_id;
    const bat = await pool.query("SELECT * FROM Baterias_UPS WHERE bat_id =?", [bat_id]);
    const agregarDatosBateria = (info_prot, bat) => {
      for (let i = 0; i < info_prot.length; i++) {
        if (bat.length > 0) {
          info_prot[i] = { ...info_prot[i], ...bat[0] };
        }
      }
    };
    
    await agregarDatosBateria(info_prot, bat);

    const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");
    const estado = info_prot[0].TR_ESTADO;
    const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
    const html1 = fs.readFileSync(filePathName, "utf8");
    const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
    const imageBuffer = fs.readFileSync(ruta_imagen);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const img = 'data:image/png;base64,'+base64Image;

    const TR_PROT_DESC_TAREATIPO = info_prot[0].TR_PROT_DESC_TAREATIPO;
    const TR_EQUIPO_COD= info_prot[0].TR_EQUIPO_COD;
    const TR_GERENCIA = info_prot[0].TR_GERENCIA;
    const TR_SECTOR = info_prot[0].TR_SECTOR;
    const TR_ESTADO = info_prot[0].TR_ESTADO;
 
    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '160px', 
        right: '20px',
        bottom: '70px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `
      <style>
        .site-header { 
          border-bottom: 1px solid rgb(227, 227, 227); 
          margin-top: 20px;
          margin-left: 25px;
          padding-bottom: 10px;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          color: #2b2d42;
          display: flex; 
          justify-content: space-between; 
          width: 93%;
        } 

        .site-identity img { 
          max-width: 200px; 
          margin-top: -15px;
        }

        .text_header { 
          word-wrap: break-word; 
          max-width: calc(100% - 180px); 
        }

        .text_header h6 { 
          font-size: 10px; 
          margin: 0 0 0 5px; 
          display: inline-block; 
        }

        .text_header label { 
          font-size: 10px; 
          margin: 5px 0 0 5px; 
          display: inline-block; 
        }
        
      </style>
      <div class="site-header">
        <div class="text_header">
          <h6>PROTOCOLO Nº: ${IDT} / ${TR_PROT_DESC_TAREATIPO}</h6><br>
          <h6>TAG SALA:</h6><label>${TR_EQUIPO_COD}</label><br>
          <h6>ESPECIALIDAD:</h6><label>${TR_GERENCIA}</label><br>
          <h6>SALA:</h6><label>${TR_SECTOR}</label><br>
          <h6>ESTADO:</h6><label>${TR_ESTADO}</label>
        </div>
        <div class="site-identity">
          <img src="${img}" alt="Imagen">
        </div>
      </div>    
        `,
      footerTemplate: `
        <div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">
          <center>SAPMA-Sercoing | Tarea Nº: ${IDT} | Estado: ${estado} | Página <span class="pageNumber"></span> de <span class="totalPages"></span></center>
        </div>
      `,
    };

    let context = {
      IDT: info_prot[0].TR_TAREA_ID,
      TR_GERENCIA: info_prot[0].TR_GERENCIA,
      TR_AREA: info_prot[0].TR_AREA,
      TR_SECTOR: info_prot[0].TR_SECTOR,
      FECHA: info_prot[0].FECHA,
      TAREATIPO: info_prot[0].TR_PROT_TAREATIPO,
      TR_PROT_DESC_TAREATIPO: info_prot[0].TR_PROT_DESC_TAREATIPO,
      TR_EQUIPO_COD: info_prot[0].TR_EQUIPO_COD,
      TR_PROT_ID: info_prot[0].TR_PROT_ID,
      TR_PROT_DESC_PROT: info_prot[0].TR_PROT_DESC_PROT,
      TR_ESTADO: info_prot[0].TR_ESTADO,
      prot: info_prot,
      img: img, 
      imagenes: imagenes
    }

    let template = hbs.compile(html1);
    let html2 = template(context);
    
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        args: ['--disable-image-cache']
    });
    const page = await browser.newPage();
    
    await page.setContent(html2, {
        waitUntil: 'networkidle0'
    });
  
    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + OT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = OT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }

});

module.exports = router;

// router.get("/pdfc/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_C']), async (req, res) => {
//   const { IDT } = req.params;
//   const { CODIGO } = req.params;
//   const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");

//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     async (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         const estado = result[0].TR_ESTADO;
//         const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
//         const html1 = fs.readFileSync(filePathName, "utf8");
//         const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
//         const img = "file:///" + ruta_imagen;
//         const options = {
//           format: "letter",
//           orientation: "portrait",
//           border: "5mm",
//           paginationOffset: 1,       // Override the initial pagination number
//             "footer": {
//               "height": "5mm",
//               "contents": {
//                 default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
//               }
//             },
//           localUrlAccess: true,
//           base: ('https://sapmamlcc.sercoing.cl:3000', 'https://localhost:3000')
//         };

//         const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
//         const imagendebd1 = Object.values(imagendebd);

//         if (imagendebd1.length > 0) {
//           const imagendebd2 = imagendebd1[0].Archivos.split('|');
//           const ruta15 = path.join(__dirname, "../images/");
//           console.log(ruta15);
//           const imagenes =  imagendebd2.map((img) => {
//             return "File:///"+ruta15  +IDT+"_"+img;
//           });
  
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               imagenes:imagenes
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }else{
 
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }
//       }
//   });
// });

// router.get("/pdfb/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_B']), async (req, res) => {
//   const { IDT } = req.params;
//   const { CODIGO } = req.params;
//   const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     async (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         const estado = result[0].TR_ESTADO;
//         const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
//         const html1 = fs.readFileSync(filePathName, "utf8");
//         const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
//         const img = "file:///" + ruta_imagen;
//         const options = {
//           format: "letter",
//           orientation: "portrait",
//           border: "5mm",
//           paginationOffset: 1,       // Override the initial pagination number
//             "footer": {
//               "height": "5mm",
//               "contents": {
//                 default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
//               }
//             },
//           localUrlAccess: true,
//           base: ('https://sapmamlcc.sercoing.cl:3000', 'https://localhost:3000')
//         };

//         const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
//         const imagendebd1 = Object.values(imagendebd);

//         if (imagendebd1.length > 0) {
//           const imagendebd2 = imagendebd1[0].Archivos.split('|');
//           const ruta15 = path.join(__dirname, "../images/");
//           console.log(ruta15);
//           const imagenes =  imagendebd2.map((img) => {
//             return "File:///"+ruta15  +IDT+"_"+img;
//           });
  
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               imagenes:imagenes
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }else{
 
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }
//       }
//   });
// });

// router.get("/pdfa/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_A']), async (req, res) => {
//   const { IDT } = req.params;
//   const { CODIGO } = req.params;
//   const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     async (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         const estado = result[0].TR_ESTADO;
//         const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
//         const html1 = fs.readFileSync(filePathName, "utf8");
//         const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
//         const img = "file:///" + ruta_imagen;
//         const options = {
//           format: "letter",
//           orientation: "portrait",
//           border: "5mm",
//           paginationOffset: 1,       // Override the initial pagination number
//             "footer": {
//               "height": "5mm",
//               "contents": {
//                 default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
//               }
//             },
//           localUrlAccess: true,
//           base: ('https://sapmamlcc.sercoing.cl:3000', 'https://localhost:3000')
//         };

//         const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
//         const imagendebd1 = Object.values(imagendebd);

//         if (imagendebd1.length > 0) {
//           const imagendebd2 = imagendebd1[0].Archivos.split('|');
//           const ruta15 = path.join(__dirname, "../images/");
//           console.log(ruta15);
//           const imagenes =  imagendebd2.map((img) => {
//             return "File:///"+ruta15  +IDT+"_"+img;
//           });
  
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               imagenes:imagenes
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }else{
 
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }
//       }
//   }); 
// });

// router.get("/pdfd/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_D']), async (req, res) => {
//   const { IDT } = req.params;
//   const { CODIGO } = req.params;
//   const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     async (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         const estado = result[0].TR_ESTADO;
//         const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
//         const html1 = fs.readFileSync(filePathName, "utf8");
//         const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
//         const img = "file:///" + ruta_imagen;
//         const options = {
//           format: "letter",
//           orientation: "portrait",
//           border: "5mm",
//           paginationOffset: 1,       // Override the initial pagination number
//             "footer": {
//               "height": "5mm",
//               "contents": {
//                 default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
//               }
//             },
//           localUrlAccess: true,
//           base: ('https://sapmamlcc.sercoing.cl:3000', 'https://localhost:3000')
//         };

//         const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
//         const imagendebd1 = Object.values(imagendebd);

//         if (imagendebd1.length > 0) {
//           const imagendebd2 = imagendebd1[0].Archivos.split('|');
//           const ruta15 = path.join(__dirname, "../images/");
//           console.log(ruta15);
//           const imagenes =  imagendebd2.map((img) => {
//             return "File:///"+ruta15  +IDT+"_"+img;
//           });
  
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               imagenes:imagenes
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");

//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }else{
 
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }
//       }
//   });
// });

// router.get("/pdfe/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_E']), async (req, res) => {
//   const { IDT } = req.params;
//   const { CODIGO } = req.params;
//   const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     async (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         const estado = result[0].TR_ESTADO;
//         const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
//         const html1 = fs.readFileSync(filePathName, "utf8");
//         const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
//         const img = "file:///" + ruta_imagen;
//         const options = {
//           format: "letter",
//           orientation: "portrait",
//           border: "5mm",
//           paginationOffset: 1,       // Override the initial pagination number
//             "footer": {
//               "height": "5mm",
//               "contents": {
//                 default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
//               }
//             },
//           localUrlAccess: true,
//           base: ('https://sapmamlcc.sercoing.cl:3000', 'https://localhost:3000')
//         };

//         const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
//         const imagendebd1 = Object.values(imagendebd);

//         if (imagendebd1.length > 0) {
//           const imagendebd2 = imagendebd1[0].Archivos.split('|');
//           const ruta15 = path.join(__dirname, "../images/");
//           console.log(ruta15);
//           const imagenes =  imagendebd2.map((img) => {
//             return "File:///"+ruta15  +IDT+"_"+img;
//           });
  
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               imagenes:imagenes
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");

//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }else{
 
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//               // console.log(res);
//               // const file = Object.values(res);
//               // const file1 = file[0];
//               // fs.readFile(file1, function (err, res, file) {
//               //   res.contentType("application/pdf");
//               //   res.send(file1);
//               // });
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }
//       }
//   });
// });

// router.get("/pdf/:IDT/:CODIGO", isLoggedIn, async (req, res) => {
//   const { IDT } = req.params;
//   const { CODIGO } = req.params;
//   const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");

//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     async (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {

//         const codigo = result[0].TR_EQUIPO_COD;
//         const id_bat = await pool.query("SELECT eq_bat_id FROM Equipos WHERE Codigo =?", [codigo]);
//         const bat_id = id_bat[0].eq_bat_id;
//         const bat = await pool.query("SELECT * FROM Baterias_UPS WHERE bat_id =?", [bat_id]);
    
//         const agregarDatosBateria = (result, bat) => {
    
//           for (let i = 0; i < result.length; i++) {
    
//             if (bat.length > 0) {
//               result[i] = { ...result[i], ...bat[0] };
//             }
//           }
//         };
        
//         await agregarDatosBateria(result, bat);
//         const estado = result[0].TR_ESTADO;
//         const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
//         const html1 = fs.readFileSync(filePathName, "utf8");
//         const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
//         const img = "file:///" + ruta_imagen;
//         const boot = path.resolve(__dirname, "../public/css/lib/bootstrap/bootstrap.min.css");
//         const boot1 = path.resolve(__dirname, "../public/js/lib/bootstrap/bootstrap.min.js");
//         console.log(boot1);

//         const options = {
//           format: "letter",
//           orientation: "portrait",
//           border: "5mm",
//           paginationOffset: 1,   
//             "footer": {
//               "height": "5mm",
//               "contents": {
//                 default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
//               }
//             },
//           localUrlAccess: true,
//           base: ('https://sapmamlcc.sercoing.cl:3000', 'https://localhost:3000')
//         };

//         const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
//         const imagendebd1 = Object.values(imagendebd);

//         if (imagendebd1.length > 0) {
//           const imagendebd2 = imagendebd1[0].Archivos.split('|');
//           const ruta15 = path.join(__dirname, "../images/");
//           console.log(ruta15);
//           const imagenes =  imagendebd2.map((img) => {
//             return "File:///"+ruta15  +IDT+"_"+img;
//           });
  
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               imagenes:imagenes,
//               boot: boot,
//               boot1: boot1
//             },
//             path: "src/pdf/" + IDT + "_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }else{
 
//           const document = {
//             type: "file", // 'file' or 'buffer'
//             template: html1,
//             context: {
//               IDT: result[0].TR_TAREA_ID,
//               TR_GERENCIA: result[0].TR_GERENCIA,
//               TR_AREA: result[0].TR_AREA,
//               TR_SECTOR: result[0].TR_SECTOR,
//               FECHA: result[0].FECHA,
//               TAREATIPO: result[0].TR_PROT_TAREATIPO,
//               TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//               TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//               TR_PROT_ID: result[0].TR_PROT_ID,
//               TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//               TR_ESTADO: result[0].TR_ESTADO,
//               prot: result,
//               img: img,
//               boot: boot,
//               boot1: boot1
//             },
//             path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
//           };
  
//           pdf.create(document, options)
//             .then((res) => {
//               console.log("PDF creado");
  
//             })
//             .catch((error) => {
//               console.error(error);
//             }).then(() => {
//               res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
//                 if (err) {
//                   console.log(err);
//                 }else{
//                   console.log("descargado");
//                 }
//             });
//           });
//         }
//       }
//   });

// });

// router.get("/protocoloc/:IDT", isLoggedIn, authRole(['Cli_C']), async (req, res) => {
//   const { IDT } = req.params;
//   const { Id_Cliente } = req.user;
//   const { Login } = req.user;

//   const headers = { "User-Agent": "node-fetch" };

//   const response = await fetch(
//     "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
//       Login +
//       "&idCliente=" +
//       Id_Cliente +
//       "&tarea=" +
//       IDT,
//     { headers }
//   )
//     .then((res) => res.json())
//     .then((data) => {
//       return data;
//     });
//   const imagen = Object.values(response);
//   const imagenes = imagen[2];

//   const dir = "src/images/";

//   imagenes.forEach(function(url) {
//     var filename = dir + url.split("/").pop();
//     request.head(url, function(err, res, body){
//       request(url).pipe(fs.createWriteStream(filename));
//     });
//   });


//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         function onlyUnique(value, index, self) {
//           return self.indexOf(value) === index;
//         }
//         const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
//         const cap1 = cap.filter(onlyUnique);

//         res.render("protocolos/protocolo", {
//           IDT: result[0].TR_TAREA_ID,
//           TR_GERENCIA: result[0].TR_GERENCIA,
//           TR_AREA: result[0].TR_AREA,
//           TR_SECTOR: result[0].TR_SECTOR,
//           FECHA: result[0].FECHA,
//           TAREATIPO: result[0].TR_PROT_TAREATIPO,
//           TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//           TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//           TR_PROT_ID: result[0].TR_PROT_ID,
//           TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//           TR_ESTADO: result[0].TR_ESTADO,
//           cap1: cap1,
//           prot: result,
//           imagenes: imagenes,
//         });
        

//       }
//     }
//   );
// });

// router.get("/protocolob/:IDT", isLoggedIn, authRole(['Cli_B']), async (req, res) => {
//   const { IDT } = req.params;
//   const { Id_Cliente } = req.user;
//   const { Login } = req.user;

//   const headers = { "User-Agent": "node-fetch" };

//   const response = await fetch(
//     "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
//       Login +
//       "&idCliente=" +
//       Id_Cliente +
//       "&tarea=" +
//       IDT,
//     { headers }
//   )
//     .then((res) => res.json())
//     .then((data) => {
//       return data;
//     });
//   const imagen = Object.values(response);
//   const imagenes = imagen[2];

//   const dir = "src/images/";

//   imagenes.forEach(function(url) {
//     var filename = dir + url.split("/").pop();
//     request.head(url, function(err, res, body){
//       request(url).pipe(fs.createWriteStream(filename));
//     });
//   });


//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         function onlyUnique(value, index, self) {
//           return self.indexOf(value) === index;
//         }
//         const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
//         const cap1 = cap.filter(onlyUnique);

//         res.render("protocolos/protocolo", {
//           IDT: result[0].TR_TAREA_ID,
//           TR_GERENCIA: result[0].TR_GERENCIA,
//           TR_AREA: result[0].TR_AREA,
//           TR_SECTOR: result[0].TR_SECTOR,
//           FECHA: result[0].FECHA,
//           TAREATIPO: result[0].TR_PROT_TAREATIPO,
//           TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//           TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//           TR_PROT_ID: result[0].TR_PROT_ID,
//           TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//           TR_ESTADO: result[0].TR_ESTADO,
//           cap1: cap1,
//           prot: result,
//           imagenes: imagenes,
//         });
        

//       }
//     }
//   );
//   }
// );

// router.get("/protocoloa/:IDT", isLoggedIn, authRole(['Cli_A']), async (req, res) => {
//   const { IDT } = req.params;
//   const { Id_Cliente } = req.user;
//   const { Login } = req.user;

//   const headers = { "User-Agent": "node-fetch" };

//   const response = await fetch(
//     "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
//       Login +
//       "&idCliente=" +
//       Id_Cliente +
//       "&tarea=" +
//       IDT,
//     { headers }
//   )
//     .then((res) => res.json())
//     .then((data) => {
//       return data;
//     });
//   const imagen = Object.values(response);
//   const imagenes = imagen[2];

//   const dir = "src/images/";

//   imagenes.forEach(function(url) {
//     var filename = dir + url.split("/").pop();
//     request.head(url, function(err, res, body){
//       request(url).pipe(fs.createWriteStream(filename));
//     });
//   });


//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         function onlyUnique(value, index, self) {
//           return self.indexOf(value) === index;
//         }
//         const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
//         const cap1 = cap.filter(onlyUnique);

//         res.render("protocolos/protocolo", {
//           IDT: result[0].TR_TAREA_ID,
//           TR_GERENCIA: result[0].TR_GERENCIA,
//           TR_AREA: result[0].TR_AREA,
//           TR_SECTOR: result[0].TR_SECTOR,
//           FECHA: result[0].FECHA,
//           TAREATIPO: result[0].TR_PROT_TAREATIPO,
//           TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//           TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//           TR_PROT_ID: result[0].TR_PROT_ID,
//           TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//           TR_ESTADO: result[0].TR_ESTADO,
//           cap1: cap1,
//           prot: result,
//           imagenes: imagenes,
//         });
        

//       }
//     }
//   );
//   }
// );

// router.get("/protocolod/:IDT", isLoggedIn, authRole(['Cli_D']), async (req, res) => {
//   const { IDT } = req.params;
//   const { Id_Cliente } = req.user;
//   const { Login } = req.user;

//   const headers = { "User-Agent": "node-fetch" };

//   const response = await fetch(
//     "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
//       Login +
//       "&idCliente=" +
//       Id_Cliente +
//       "&tarea=" +
//       IDT,
//     { headers }
//   )
//     .then((res) => res.json())
//     .then((data) => {
//       return data;
//     });
//   const imagen = Object.values(response);
//   const imagenes = imagen[2];

//   const dir = "src/images/";

//   imagenes.forEach(function(url) {
//     var filename = dir + url.split("/").pop();
//     request.head(url, function(err, res, body){
//       request(url).pipe(fs.createWriteStream(filename));
//     });
//   });


//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         function onlyUnique(value, index, self) {
//           return self.indexOf(value) === index;
//         }
//         const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
//         const cap1 = cap.filter(onlyUnique);

//         res.render("protocolos/protocolo", {
//           IDT: result[0].TR_TAREA_ID,
//           TR_GERENCIA: result[0].TR_GERENCIA,
//           TR_AREA: result[0].TR_AREA,
//           TR_SECTOR: result[0].TR_SECTOR,
//           FECHA: result[0].FECHA,
//           TAREATIPO: result[0].TR_PROT_TAREATIPO,
//           TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//           TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//           TR_PROT_ID: result[0].TR_PROT_ID,
//           TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//           TR_ESTADO: result[0].TR_ESTADO,
//           cap1: cap1,
//           prot: result,
//           imagenes: imagenes,
//         });
        

//       }
//     }
//   );
// }
// );

// router.get("/protocoloe/:IDT", isLoggedIn, authRole(['Cli_E']), async (req, res) => {
//   const { IDT } = req.params;
//   const { Id_Cliente } = req.user;
//   const { Login } = req.user;

//   const headers = { "User-Agent": "node-fetch" };

//   const response = await fetch(
//     "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
//       Login +
//       "&idCliente=" +
//       Id_Cliente +
//       "&tarea=" +
//       IDT,
//     { headers }
//   )
//     .then((res) => res.json())
//     .then((data) => {
//       return data;
//     });
//   const imagen = Object.values(response);
//   const imagenes = imagen[2];

//   const dir = "src/images/";

//   imagenes.forEach(function(url) {
//     var filename = dir + url.split("/").pop();
//     request.head(url, function(err, res, body){
//       request(url).pipe(fs.createWriteStream(filename));
//     });
//   });


//   await pool.query(
//     "SELECT\n" +
//     "        Tareas.Id AS TR_TAREA_ID,\n" +
//     "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
//     "        Protocolos.Id AS 'TR_PROT_ID',\n" +
//     "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
//     "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
//     "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
//     "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
//     "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
//     "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
//     "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
//     "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
//     "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
//     "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
//     "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
//     "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
//     "    CONVERT (\n" +
//     "        CAST(\n" +
//     "            CONVERT (\n" +
//     "            IF\n" +
//     "                (\n" +
//     "                    Tarea_Respuesta.Respuesta = 'SC',\n" +
//     "                    'No aplica',\n" +
//     "                IF\n" +
//     "                    (\n" +
//     "                        Tarea_Respuesta.Respuesta = 'SSR',\n" +
//     "                        'Sistema sin revisar.',\n" +
//     "                    IF\n" +
//     "                        (\n" +
//     "                            Tarea_Respuesta.Respuesta = 'SOP',\n" +
//     "                            'Sistema operativo',\n" +
//     "                        IF\n" +
//     "                            (\n" +
//     "                                Tarea_Respuesta.Respuesta = 'SOCO',\n" +
//     "                                'Sist. operativo con obs.',\n" +
//     "                            IF\n" +
//     "                                (\n" +
//     "                                    Tarea_Respuesta.Respuesta = 'SFS',\n" +
//     "                                    'Sist. fuera de serv.',\n" +
//     "                                IF\n" +
//     "                                ( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING UTF8 \n" +
//     "            ) AS BINARY \n" +
//     "        ) USING UTF8 \n" +
//     "    ) AS 'TR_RESPUESTA',\n" +
//     "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
//     "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
//     "        IF\n" +
//     "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
//     "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
//     "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
//     "       IF\n" +
//     "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
//     "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
//     "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
//     "        	EQ.AreaDESC AS 'TR_AREA',\n" +
//     "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
//     "        FROM\n" +
//     "        	Protocolos\n" +
//     "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
//     "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
//     "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
//     "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
//     "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
//     "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
//     "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
//     "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
//     "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
//     "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
//     "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
//     "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
//     "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
//     "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
//     "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
//     "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
//     "        	INNER JOIN (\n" +
//     "        	SELECT\n" +
//     "        		E.Id 'EqID',\n" +
//     "        		S.Descripcion 'SecDESC',\n" +
//     "        	A.Descripcion 'AreaDESC',\n" +
//     "       		G.Descripcion 'GerDESC',\n" +
//     "        		C.Descripcion 'CteDESC' \n" +
//     "       	FROM\n" +
//     "        		Equipos E\n" +
//     "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
//     "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
//     "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
//     "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
//     "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
//     "        WHERE \n" +
//     "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
//     (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         function onlyUnique(value, index, self) {
//           return self.indexOf(value) === index;
//         }
//         const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
//         const cap1 = cap.filter(onlyUnique);

//         res.render("protocolos/protocolo", {
//           IDT: result[0].TR_TAREA_ID,
//           TR_GERENCIA: result[0].TR_GERENCIA,
//           TR_AREA: result[0].TR_AREA,
//           TR_SECTOR: result[0].TR_SECTOR,
//           FECHA: result[0].FECHA,
//           TAREATIPO: result[0].TR_PROT_TAREATIPO,
//           TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
//           TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
//           TR_PROT_ID: result[0].TR_PROT_ID,
//           TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
//           TR_ESTADO: result[0].TR_ESTADO,
//           cap1: cap1,
//           prot: result,
//           imagenes: imagenes,
//         });
        

//       }
//     }
//   );
// }
// );