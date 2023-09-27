const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isLoggedIn } = require("../lib/auth");
const { authRole, roles } = require("../lib/rol");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const pdf = require("dynamic-html-pdf");
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

const prot = new Array();

function enviar(req, res, result) {
  res.render("protocolos/protocolos", { prot: result });
}

router.get("/protocolos", isLoggedIn,  async (req, res) => {
    await enviar(req, res);
    // await pool.query('Select * from Estados', (err, result) => {
    // res.render('protocolos/protocolos', {estados:result} );
    // });
  }
);

router.post("/protocoloss", isLoggedIn,  async (req, res) => {
    const { tarea } = req.body;
    const { Id_Cliente } = req.user;
    const { est } = req.body;
    const { date1 } = req.body;
    const { date2 } = req.body;

    if (tarea > 0) {
      await pool.query("SELECT\n" +
      "	T.Id AS IDT,\n" +
      "	date_format( T.Fecha, '%d-%m-%Y' ) AS FECHA,\n" +
      "	VC.vce_codigo AS CODIGO,\n" +
      "	VC.vcgas_gerenciaN AS GERENCIA,\n" +
      "	VC.vcgas_areaN AS AREA,\n" +
      "	VC.vcgas_sectorN AS SECTOR,\n" +
      "	TP.Descripcion AS SERVICIO,\n" +
      "	ES.Descripcion AS ESTADO \n" +
      "FROM\n" +
      "	Tareas T\n" +
      "	INNER JOIN VIEW_tareaCliente V ON V.vtc_tareaId = T.Id\n" +
      "	INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
      "	INNER JOIN Protocolo_Capitulo PCA ON PCA.Id_Protocolo = P.Id\n" +
      "	INNER JOIN Protocolo_Capturas PCAP ON PCAP.Id_Protocolo = P.Id \n" +
      "	AND PCAP.Capitulo = PCA.Capitulo\n" +
      "	LEFT JOIN Tarea_Respuesta TR ON TR.Id_Tarea = T.Id \n" +
      "	AND TR.Capitulo = PCA.Capitulo \n" +
      "	AND TR.Correlativo = PCAP.Correlativo\n" +
      "	INNER JOIN VIEW_equiposCteGerAreSec VC ON VC.vce_idEquipo = T.Id_Equipo\n" +
      "	INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
      "	INNER JOIN Estados ES ON ES.Id = T.Id_Estado\n" +
      "	INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = T.Id \n" +
      "WHERE\n" +
      "	V.vtc_idCliente = "+Id_Cliente+"\n" +
      "	AND V.vtc_tareaId = "+tarea+"\n" +
      "	AND T.Id_Estado IN (5, 6) \n" +
      "	AND TE.te_Id_aux_estado IN (5, 6) \n" +
      "	AND TE.te_Estado_val = 0 \n" +
      " GROUP BY T.Id;",
        (err, result) => {
          if (!result.length) {
            res.render("protocolos/protocolos", { title: "No se encuentran tareas en el rango seleccionado!!!" });
          } else {
            prot.push(result);
            enviar(req, res, result);
          }
        }
      );
    } else {
      await pool.query(
        "SELECT\n" +
        "    T.Id AS IDT,\n" +
        "    DATE_FORMAT(T.Fecha, '%d-%m-%Y') AS FECHA,\n" +
        "    VC.vce_codigo AS CODIGO,\n" +
        "    VC.vcgas_gerenciaN AS GERENCIA,\n" +
        "    VC.vcgas_areaN AS AREA,\n" +
        "    VC.vcgas_sectorN AS SECTOR,\n" +
        "    TP.Descripcion AS SERVICIO,\n" +
        "    ES.Descripcion AS ESTADO \n" +
        "FROM\n" +
        "    Tareas T\n" +
        "    INNER JOIN VIEW_tareaCliente V ON V.vtc_tareaId = T.Id\n" +
        "    INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo\n" +
        "    INNER JOIN Protocolo_Capitulo PCA ON PCA.Id_Protocolo = P.Id\n" +
        "    INNER JOIN Protocolo_Capturas PCAP ON PCAP.Id_Protocolo = P.Id \n" +
        "    AND PCAP.Capitulo = PCA.Capitulo\n" +
        "    LEFT JOIN Tarea_Respuesta TR ON TR.Id_Tarea = T.Id \n" +
        "    AND TR.Capitulo = PCA.Capitulo \n" +
        "    AND TR.Correlativo = PCAP.Correlativo\n" +
        "    INNER JOIN VIEW_equiposCteGerAreSec VC ON VC.vce_idEquipo = T.Id_Equipo\n" +
        "    INNER JOIN TipoProtocolo TP ON TP.Id = P.Id_TipoProtocolo\n" +
        "    INNER JOIN Estados ES ON ES.Id = T.Id_Estado\n" +
        "    INNER JOIN Tareas_Estado TE ON TE.te_Id_Tarea = T.Id \n" +
        "WHERE\n" +
        "    V.vtc_idCliente = "+Id_Cliente+"\n" +
        "    AND T.Id_Estado IN (5, 6) \n" +
        "    AND TE.te_Id_aux_estado IN (5, 6) \n" +
        "    AND TE.te_Estado_val = 0 \n" +
        "	   AND T.Fecha BETWEEN \""+date1+"\" AND \""+date2+"\"\n" +
        "GROUP BY\n" +
        "    T.Id \n" +
        "ORDER BY\n" +
        "    T.Fecha DESC;",
        (err, result) => {
          if (!result.length) {
            res.render("protocolos/protocolos", { title: "No se encuentran tareas en el rango seleccionado!!!" });
          } else {
            enviar(req, res, result);
            prot.push(result);
          }
        }
      );
    }
  }
);



router.get("/protocolo/:IDT", isLoggedIn, async (req, res) => {

    const { IDT } = req.params;
    const { Id_Cliente } = req.user;
    const { Login } = req.user;

    const headers = { "User-Agent": "node-fetch" };

    const response = await fetch(
      "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
        Login +
        "&idCliente=" +
        Id_Cliente +
        "&tarea=" +
        IDT,
      { headers }
    )
      .then((res) => res.json())
      .then((data) => {
        return data;
      });
    const imagen = Object.values(response);
    const imagenes = imagen[2];

    const dir = "src/images/";

    imagenes.forEach(function(url) {
      var filename = dir + url.split("/").pop();
      request.head(url, function(err, res, body){
        request(url).pipe(fs.createWriteStream(filename));
      });
    });


    await pool.query(
      "SELECT\n" +
      "        Tareas.Id AS TR_TAREA_ID,\n" +
      "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
      "        Protocolos.Id AS 'TR_PROT_ID',\n" +
      "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
      "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
      "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
      "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
      "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
      "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
      "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
      "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
      "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
      "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
      "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
      "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
      "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar.',IF\n" +
      "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
      "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
      "        	 AS 'TR_RESPUESTA',\n" +
      "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
      "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
      "        IF\n" +
      "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
      "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
      "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
      "       IF\n" +
      "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
      "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
      "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
      "        	EQ.AreaDESC AS 'TR_AREA',\n" +
      "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
      "        FROM\n" +
      "        	Protocolos\n" +
      "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
      "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
      "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
      "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
      "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
      "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
      "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
      "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
      "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
      "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
      "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
      "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
      "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
      "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
      "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
      "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
      "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
      "        	INNER JOIN (\n" +
      "        	SELECT\n" +
      "        		E.Id 'EqID',\n" +
      "        		S.Descripcion 'SecDESC',\n" +
      "        	A.Descripcion 'AreaDESC',\n" +
      "       		G.Descripcion 'GerDESC',\n" +
      "        		C.Descripcion 'CteDESC' \n" +
      "       	FROM\n" +
      "        		Equipos E\n" +
      "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
      "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
      "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
      "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
      "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
      "        WHERE \n" +
      "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
          }
          const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
          const cap1 = cap.filter(onlyUnique);

          res.render("protocolos/protocolo", {
            IDT: result[0].TR_TAREA_ID,
            TR_GERENCIA: result[0].TR_GERENCIA,
            TR_AREA: result[0].TR_AREA,
            TR_SECTOR: result[0].TR_SECTOR,
            FECHA: result[0].FECHA,
            TAREATIPO: result[0].TR_PROT_TAREATIPO,
            TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
            TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
            TR_PROT_ID: result[0].TR_PROT_ID,
            TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
            TR_ESTADO: result[0].TR_ESTADO,
            cap1: cap1,
            prot: result,
            imagenes: imagenes,
          });
          

        }
      }
    );
  }
);

router.get("/protocoloc/:IDT", isLoggedIn, authRole(['Cli_C']), async (req, res) => {
  const { IDT } = req.params;
  const { Id_Cliente } = req.user;
  const { Login } = req.user;

  const headers = { "User-Agent": "node-fetch" };

  const response = await fetch(
    "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
      Login +
      "&idCliente=" +
      Id_Cliente +
      "&tarea=" +
      IDT,
    { headers }
  )
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  const imagen = Object.values(response);
  const imagenes = imagen[2];

  const dir = "src/images/";

  imagenes.forEach(function(url) {
    var filename = dir + url.split("/").pop();
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(filename));
    });
  });


  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar.',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
        const cap1 = cap.filter(onlyUnique);

        res.render("protocolos/protocolo", {
          IDT: result[0].TR_TAREA_ID,
          TR_GERENCIA: result[0].TR_GERENCIA,
          TR_AREA: result[0].TR_AREA,
          TR_SECTOR: result[0].TR_SECTOR,
          FECHA: result[0].FECHA,
          TAREATIPO: result[0].TR_PROT_TAREATIPO,
          TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
          TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
          TR_PROT_ID: result[0].TR_PROT_ID,
          TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
          TR_ESTADO: result[0].TR_ESTADO,
          cap1: cap1,
          prot: result,
          imagenes: imagenes,
        });
        

      }
    }
  );
});

router.get("/protocolob/:IDT", isLoggedIn, authRole(['Cli_B']), async (req, res) => {
  const { IDT } = req.params;
  const { Id_Cliente } = req.user;
  const { Login } = req.user;

  const headers = { "User-Agent": "node-fetch" };

  const response = await fetch(
    "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
      Login +
      "&idCliente=" +
      Id_Cliente +
      "&tarea=" +
      IDT,
    { headers }
  )
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  const imagen = Object.values(response);
  const imagenes = imagen[2];

  const dir = "src/images/";

  imagenes.forEach(function(url) {
    var filename = dir + url.split("/").pop();
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(filename));
    });
  });


  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
        const cap1 = cap.filter(onlyUnique);

        res.render("protocolos/protocolo", {
          IDT: result[0].TR_TAREA_ID,
          TR_GERENCIA: result[0].TR_GERENCIA,
          TR_AREA: result[0].TR_AREA,
          TR_SECTOR: result[0].TR_SECTOR,
          FECHA: result[0].FECHA,
          TAREATIPO: result[0].TR_PROT_TAREATIPO,
          TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
          TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
          TR_PROT_ID: result[0].TR_PROT_ID,
          TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
          TR_ESTADO: result[0].TR_ESTADO,
          cap1: cap1,
          prot: result,
          imagenes: imagenes,
        });
        

      }
    }
  );
  }
);

router.get("/protocoloa/:IDT", isLoggedIn, authRole(['Cli_A']), async (req, res) => {
  const { IDT } = req.params;
  const { Id_Cliente } = req.user;
  const { Login } = req.user;

  const headers = { "User-Agent": "node-fetch" };

  const response = await fetch(
    "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
      Login +
      "&idCliente=" +
      Id_Cliente +
      "&tarea=" +
      IDT,
    { headers }
  )
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  const imagen = Object.values(response);
  const imagenes = imagen[2];

  const dir = "src/images/";

  imagenes.forEach(function(url) {
    var filename = dir + url.split("/").pop();
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(filename));
    });
  });


  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar.',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
        const cap1 = cap.filter(onlyUnique);

        res.render("protocolos/protocolo", {
          IDT: result[0].TR_TAREA_ID,
          TR_GERENCIA: result[0].TR_GERENCIA,
          TR_AREA: result[0].TR_AREA,
          TR_SECTOR: result[0].TR_SECTOR,
          FECHA: result[0].FECHA,
          TAREATIPO: result[0].TR_PROT_TAREATIPO,
          TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
          TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
          TR_PROT_ID: result[0].TR_PROT_ID,
          TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
          TR_ESTADO: result[0].TR_ESTADO,
          cap1: cap1,
          prot: result,
          imagenes: imagenes,
        });
        

      }
    }
  );
  }
);

router.get("/protocolod/:IDT", isLoggedIn, authRole(['Cli_D']), async (req, res) => {
  const { IDT } = req.params;
  const { Id_Cliente } = req.user;
  const { Login } = req.user;

  const headers = { "User-Agent": "node-fetch" };

  const response = await fetch(
    "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
      Login +
      "&idCliente=" +
      Id_Cliente +
      "&tarea=" +
      IDT,
    { headers }
  )
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  const imagen = Object.values(response);
  const imagenes = imagen[2];

  const dir = "src/images/";

  imagenes.forEach(function(url) {
    var filename = dir + url.split("/").pop();
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(filename));
    });
  });


  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
        const cap1 = cap.filter(onlyUnique);

        res.render("protocolos/protocolo", {
          IDT: result[0].TR_TAREA_ID,
          TR_GERENCIA: result[0].TR_GERENCIA,
          TR_AREA: result[0].TR_AREA,
          TR_SECTOR: result[0].TR_SECTOR,
          FECHA: result[0].FECHA,
          TAREATIPO: result[0].TR_PROT_TAREATIPO,
          TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
          TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
          TR_PROT_ID: result[0].TR_PROT_ID,
          TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
          TR_ESTADO: result[0].TR_ESTADO,
          cap1: cap1,
          prot: result,
          imagenes: imagenes,
        });
        

      }
    }
  );
}
);

router.get("/protocoloe/:IDT", isLoggedIn, authRole(['Cli_E']), async (req, res) => {
  const { IDT } = req.params;
  const { Id_Cliente } = req.user;
  const { Login } = req.user;

  const headers = { "User-Agent": "node-fetch" };

  const response = await fetch(
    "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +
      Login +
      "&idCliente=" +
      Id_Cliente +
      "&tarea=" +
      IDT,
    { headers }
  )
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  const imagen = Object.values(response);
  const imagenes = imagen[2];

  const dir = "src/images/";

  imagenes.forEach(function(url) {
    var filename = dir + url.split("/").pop();
    request.head(url, function(err, res, body){
      request(url).pipe(fs.createWriteStream(filename));
    });
  });


  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        const cap = result.map((a) => a.TR_PROT_DESC_CAPI);
        const cap1 = cap.filter(onlyUnique);

        res.render("protocolos/protocolo", {
          IDT: result[0].TR_TAREA_ID,
          TR_GERENCIA: result[0].TR_GERENCIA,
          TR_AREA: result[0].TR_AREA,
          TR_SECTOR: result[0].TR_SECTOR,
          FECHA: result[0].FECHA,
          TAREATIPO: result[0].TR_PROT_TAREATIPO,
          TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
          TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
          TR_PROT_ID: result[0].TR_PROT_ID,
          TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
          TR_ESTADO: result[0].TR_ESTADO,
          cap1: cap1,
          prot: result,
          imagenes: imagenes,
        });
        

      }
    }
  );
}
);



router.post("/protocolo/validar", isLoggedIn, async (req, res) => {
    const usuario = req.user.usuario;
    const datas = Object.values(req.body);
    const { Id_Cliente } = req.user;

    await pool.query(`UPDATE Tareas_Estado SET te_Estado_val = 1 WHERE te_Id_Tarea IN (${datas})`, async (err, result) => {
        if (err) {
          console.log(err);
        } else {
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


          // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
          const template = hbs.compile(mensaje);
          const context = {
            datemail, 
          };
          const html = template(context);

          await transporter.sendMail({
            from: "SAPMA <sapmadand@sercoing.cl>",
            // to: 'marancibia@sercoing.cl',
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
          await pool.query("INSERT INTO Validacion_Tareas (Val_tarea_id, Val_id_estado, Val_id_estado_old, Val_respsapma, Val_fechaval_inf, Val_rechazo) Values ?",
            [arreglo5],
            async (err, result) => {
              if (err) {
                console.log(err);
              }else{
                await pool.query(
                  "UPDATE Tareas_Detalle\n" +
                  "INNER JOIN (\n" +
                  "	SELECT\n" +
                  "		A.IDTAREA,\n" +
                  "		A.ESTADO,\n" +
                  "		B.REPUESTO,\n" +
                  "		D.OBS \n" +
                  "	FROM\n" +
                  "		(\n" +
                  "		SELECT\n" +
                  "			V.idTarea IDTAREA,\n" +
                  "			TR.Respuesta ESTADO \n" +
                  "		FROM\n" +
                  "			VIEW_tareasDET V\n" +
                  "			INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = V.idTarea\n" +
                  "			LEFT JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = V.idTarea\n" +
                  "			INNER JOIN Protocolos P ON P.Id = V.idProtocolo\n" +
                  "			INNER JOIN Protocolo_Capitulo PCA ON PCA.Id_Protocolo = P.Id\n" +
                  "			INNER JOIN Protocolo_Capturas PCAP ON PCAP.Id_Protocolo = PCA.Id_Protocolo \n" +
                  "			AND PCA.Capitulo = PCAP.Capitulo\n" +
                  "			INNER JOIN Tarea_Respuesta TR ON TR.Id_Tarea = V.idTarea \n" +
                  "			AND TR.Capitulo = PCA.Capitulo \n" +
                  "			AND TR.Correlativo = PCAP.Correlativo \n" +
                  "		WHERE\n" +
                  "			PCA.Descripcion LIKE '%. Estado%' \n" +
                  "			AND PCAP.Descripcion = '1. Estado' \n" +
                  "			AND TD.tdet_Estado_Equipo IS NULL \n" +
                  "			AND TV.te_Id_Tarea IN ("+datas+") \n" +
                  "		) AS A\n" +
                  "		LEFT JOIN (\n" +
                  "		SELECT\n" +
                  "			V.idTarea IDTAREA,\n" +
                  "		IF\n" +
                  "			((\n" +
                  "					REPLACE ( GROUP_CONCAT( DISTINCT TR.Respuesta SEPARATOR ' - ' ), ' - SC', '' )) = 'SC',\n" +
                  "				'',\n" +
                  "				REPLACE ( GROUP_CONCAT( DISTINCT TR.Respuesta SEPARATOR ' - ' ), ' - SC', '' ) \n" +
                  "			) AS 'REPUESTO' \n" +
                  "		FROM\n" +
                  "			VIEW_tareasDET V\n" +
                  "			INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = V.idTarea\n" +
                  "			LEFT JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = V.idTarea\n" +
                  "			INNER JOIN Protocolos P ON P.Id = V.idProtocolo\n" +
                  "			INNER JOIN Protocolo_Capitulo PCA ON PCA.Id_Protocolo = P.Id\n" +
                  "			INNER JOIN Protocolo_Capturas PCAP ON PCAP.Id_Protocolo = PCA.Id_Protocolo \n" +
                  "			AND PCA.Capitulo = PCAP.Capitulo\n" +
                  "			INNER JOIN Tarea_Respuesta TR ON TR.Id_Tarea = V.idTarea \n" +
                  "			AND TR.Capitulo = PCA.Capitulo \n" +
                  "			AND TR.Correlativo = PCAP.Correlativo \n" +
                  "		WHERE\n" +
                  "			PCA.Descripcion LIKE '%. REPUE%' \n" +
                  "			AND PCAP.Descripcion LIKE '%REPUES%' \n" +
                  "			AND TD.tdet_Estado_Equipo IS NULL \n" +
                  "			AND TV.te_Id_Tarea IN ("+datas+") \n" +
                  "		GROUP BY\n" +
                  "			1 \n" +
                  "		) AS B ON B.IDTAREA = A.IDTAREA\n" +
                  "		INNER JOIN (\n" +
                  "		SELECT\n" +
                  "			V.idTarea IDTAREA,\n" +
                  "			TR.Respuesta OBS \n" +
                  "		FROM\n" +
                  "			VIEW_tareasDET V\n" +
                  "			INNER JOIN Tareas_Estado TV ON TV.te_Id_Tarea = V.idTarea\n" +
                  "			LEFT JOIN Tareas_Detalle TD ON TD.tdet_Id_Tarea = V.idTarea\n" +
                  "			INNER JOIN Protocolos P ON P.Id = V.idProtocolo\n" +
                  "			INNER JOIN Protocolo_Capitulo PCA ON PCA.Id_Protocolo = P.Id\n" +
                  "			INNER JOIN Protocolo_Capturas PCAP ON PCAP.Id_Protocolo = PCA.Id_Protocolo \n" +
                  "			AND PCA.Capitulo = PCAP.Capitulo\n" +
                  "			INNER JOIN Tarea_Respuesta TR ON TR.Id_Tarea = V.idTarea \n" +
                  "			AND TR.Capitulo = PCA.Capitulo \n" +
                  "			AND TR.Correlativo = PCAP.Correlativo \n" +
                  "		WHERE\n" +
                  "			PCA.Descripcion LIKE '%. Estado%' \n" +
                  "			AND PCAP.Descripcion REGEXP 'Observaciones EST' \n" +
                  "			AND TD.tdet_Estado_Equipo IS NULL \n" +
                  "			AND TV.te_Id_Tarea IN ("+datas+") \n" +
                  "		) AS D ON D.IDTAREA = A.IDTAREA \n" +
                  "	) AS C ON C.IDTAREA = tdet_Id_Tarea \n" +
                  "	SET tdet_Estado_Equipo = C.ESTADO,\n" +
                  "	tdet_Repuestos = C.REPUESTO,\n" +
                  "	tdet_Observaciones_Estado = C.OBS \n" +
                  "WHERE\n" +
                  "	tdet_Id_Tarea > 1;",
                   async (err, result) => {
                    if (err){
                      console.log(err);
                    }else{
                      await pool.query(
                        "UPDATE Tareas_Detalle \n" +
                        "INNER JOIN (\n" +
                        "	 SELECT\n" +
                        "	 NEW.TAREANEW,\n" +
                        "	 OLD.Fecha_old,\n" +
                        "	 OLD.TareaId_old,\n" +
                        "	 OLD.RespuestaEstado_old  \n" +
                        "	FROM\n" +
                        "		 (\n" +
                        "			 SELECT\n" +
                        "			 T.Id_Equipo,\n" +
                        "			 T.Id TAREANEW  \n" +
                        "		FROM\n" +
                        "			 Tareas T \n" +
                        "			INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico \n" +
                        "			INNER JOIN VIEW_tareaCliente VTC ON VTC.vtc_tareaId = T.Id \n" +
                        "			JOIN Tareas_Estado TV ON TV.te_Id_Tarea = T.Id \n" +
                        "			JOIN Validacion_Tareas VT ON VT.Val_tarea_id = T.Id  \n" +
                        "		WHERE\n" +
                        "			 U.Descripcion NOT LIKE '%TEST%'  \n" +
                        "			AND VTC.vtc_idCliente = "+Id_Cliente+" \n" +
                        "			AND T.Id_Estado = 5  \n" +
                        "			AND VT.Val_rechazo = 0  \n" +
                        "			AND TV.te_Estado_val = 1  \n" +
                        "		) AS NEW \n" +
                        "		LEFT JOIN (\n" +
                        "			 SELECT\n" +
                        "			 T.Id AS 'TareaId_old',\n" +
                        "			 T.Fecha AS 'Fecha_old',\n" +
                        "			 T.Id_Equipo AS 'EquipoId_old',\n" +
                        "			 TR.Respuesta AS 'RespuestaEstado_old'  \n" +
                        "		FROM\n" +
                        "			 Tareas T \n" +
                        "			INNER JOIN Protocolos P ON P.Id = T.Id_Protocolo \n" +
                        "			INNER JOIN Protocolo_Capitulo PC ON PC.Id_Protocolo = P.Id \n" +
                        "			INNER JOIN Protocolo_Capturas PCA ON PCA.Capitulo = PC.Capitulo  \n" +
                        "			AND PCA.Id_Protocolo = P.Id \n" +
                        "			INNER JOIN Tarea_Respuesta TR ON TR.Id_Tarea = T.Id  \n" +
                        "			AND TR.Capitulo = PC.Capitulo  \n" +
                        "			AND TR.Correlativo = PCA.Correlativo  \n" +
                        "		WHERE\n" +
                        "			 T.Id IN (\n" +
                        "				 SELECT\n" +
                        "				 MAX( T2.Id ) TareaAnterior  \n" +
                        "			FROM\n" +
                        "				 Tareas T2 \n" +
                        "				INNER JOIN (\n" +
                        "					 SELECT\n" +
                        "					 MAX( T.Fecha ) FECHA,\n" +
                        "					 T.Id_Equipo  \n" +
                        "				FROM\n" +
                        "					 Tareas T  \n" +
                        "				WHERE\n" +
                        "					 T.Id_Estado = 4  \n" +
                        "					AND T.Id_Equipo IN (\n" +
                        "						 SELECT\n" +
                        "						 T.Id_Equipo  \n" +
                        "					FROM\n" +
                        "						 Tareas T \n" +
                        "						INNER JOIN Usuarios U ON U.Id = T.Id_Tecnico \n" +
                        "						INNER JOIN VIEW_tareaCliente VTC ON VTC.vtc_tareaId = T.Id \n" +
                        "						JOIN Tareas_Estado TV ON TV.te_Id_Tarea = T.Id \n" +
                        "						JOIN Validacion_Tareas VT ON VT.Val_tarea_id = T.Id  \n" +
                        "					WHERE\n" +
                        "						 U.Descripcion NOT LIKE '%TEST%'  \n" +
                        "						AND VTC.vtc_idCliente = "+Id_Cliente+"  \n" +
                        "						AND T.Id_Estado = 5  \n" +
                        "						AND VT.Val_rechazo = 0  \n" +
                        "						AND TV.te_Estado_val = 1  \n" +
                        "					)  \n" +
                        "				GROUP BY\n" +
                        "					 T.Id_Equipo  \n" +
                        "				) AS W ON W.Id_Equipo = T2.Id_Equipo  \n" +
                        "				AND T2.Fecha = W.FECHA  \n" +
                        "			GROUP BY\n" +
                        "				 T2.Id_Equipo,\n" +
                        "				 T2.Fecha  \n" +
                        "			)  \n" +
                        "			AND PC.Descripcion LIKE '%. Estado%'  \n" +
                        "			AND PCA.Descripcion LIKE '1. Estado'  \n" +
                        "		) AS OLD ON OLD.EquipoId_old = NEW.Id_Equipo  \n" +
                        "	) AS N ON N.TAREANEW = tdet_Id_Tarea  \n" +
                        "	SET tdet_Id_TareaAnterior = N.TareaId_old,\n" +
                        "	 tdet_Estado_EquipoAnterior = N.RespuestaEstado_old,\n" +
                        "	 tdet_Fecha_TareaAnterior = N.Fecha_old  \n" +
                        "WHERE\n" +
                        "	 tdet_Id_Tarea > 1;",
                         (err, result) => {
                          if (err){
                            console.log(err);
                          }else{
                            console.log('todo ok');
                          }
                      });
                    }
                });
              }
            });
      }
    });
});



router.get("/pdf/:IDT/:CODIGO", isLoggedIn, async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");

  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar.',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const estado = result[0].TR_ESTADO;
        const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs"); 
        const html1 = fs.readFileSync(filePathName, "utf8");
        const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
        const img = "file:///" + ruta_imagen;
        const options = {
          format: "letter",
          orientation: "portrait",
          border: "5mm",
          paginationOffset: 1,       // Override the initial pagination number
            "footer": {
              "height": "5mm",
              "contents": {
                default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
              }
            },
          localUrlAccess: true,
          base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
        };

        const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
        const imagendebd1 = Object.values(imagendebd);

        if (imagendebd1.length > 0) {
          const imagendebd2 = imagendebd1[0].Archivos.split('|');
          const ruta15 = path.join(__dirname, "../images/");
          console.log(ruta15);
          const imagenes =  imagendebd2.map((img) => {
            return "File:///"+ruta15  +IDT+"_"+img;
          });
  
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img,
              imagenes:imagenes
            },
            path: "src/pdf/" + IDT + "_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }else{
 
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }
      }
  });

});

router.get("/pdfc/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_C']), async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT + "_"+CODIGO+".pdf");

  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar.',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const estado = result[0].TR_ESTADO;
        const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
        const html1 = fs.readFileSync(filePathName, "utf8");
        const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
        const img = "file:///" + ruta_imagen;
        const options = {
          format: "letter",
          orientation: "portrait",
          border: "5mm",
          paginationOffset: 1,       // Override the initial pagination number
            "footer": {
              "height": "5mm",
              "contents": {
                default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
              }
            },
          localUrlAccess: true,
          base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
        };

        const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
        const imagendebd1 = Object.values(imagendebd);

        if (imagendebd1.length > 0) {
          const imagendebd2 = imagendebd1[0].Archivos.split('|');
          const ruta15 = path.join(__dirname, "../images/");
          console.log(ruta15);
          const imagenes =  imagendebd2.map((img) => {
            return "File:///"+ruta15  +IDT+"_"+img;
          });
  
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img,
              imagenes:imagenes
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }else{
 
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }
      }
  });
});

router.get("/pdfb/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_B']), async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revizar',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const estado = result[0].TR_ESTADO;
        const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
        const html1 = fs.readFileSync(filePathName, "utf8");
        const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
        const img = "file:///" + ruta_imagen;
        const options = {
          format: "letter",
          orientation: "portrait",
          border: "5mm",
          paginationOffset: 1,       // Override the initial pagination number
            "footer": {
              "height": "5mm",
              "contents": {
                default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
              }
            },
          localUrlAccess: true,
          base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
        };

        const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
        const imagendebd1 = Object.values(imagendebd);

        if (imagendebd1.length > 0) {
          const imagendebd2 = imagendebd1[0].Archivos.split('|');
          const ruta15 = path.join(__dirname, "../images/");
          console.log(ruta15);
          const imagenes =  imagendebd2.map((img) => {
            return "File:///"+ruta15  +IDT+"_"+img;
          });
  
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img,
              imagenes:imagenes
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }else{
 
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }
      }
  });
});

router.get("/pdfa/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_A']), async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar.',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const estado = result[0].TR_ESTADO;
        const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
        const html1 = fs.readFileSync(filePathName, "utf8");
        const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
        const img = "file:///" + ruta_imagen;
        const options = {
          format: "letter",
          orientation: "portrait",
          border: "5mm",
          paginationOffset: 1,       // Override the initial pagination number
            "footer": {
              "height": "5mm",
              "contents": {
                default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
              }
            },
          localUrlAccess: true,
          base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
        };

        const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
        const imagendebd1 = Object.values(imagendebd);

        if (imagendebd1.length > 0) {
          const imagendebd2 = imagendebd1[0].Archivos.split('|');
          const ruta15 = path.join(__dirname, "../images/");
          console.log(ruta15);
          const imagenes =  imagendebd2.map((img) => {
            return "File:///"+ruta15  +IDT+"_"+img;
          });
  
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img,
              imagenes:imagenes
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }else{
 
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }
      }
  }); 
});

router.get("/pdfd/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_D']), async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo.',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo.', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const estado = result[0].TR_ESTADO;
        const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
        const html1 = fs.readFileSync(filePathName, "utf8");
        const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
        const img = "file:///" + ruta_imagen;
        const options = {
          format: "letter",
          orientation: "portrait",
          border: "5mm",
          paginationOffset: 1,       // Override the initial pagination number
            "footer": {
              "height": "5mm",
              "contents": {
                default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
              }
            },
          localUrlAccess: true,
          base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
        };

        const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
        const imagendebd1 = Object.values(imagendebd);

        if (imagendebd1.length > 0) {
          const imagendebd2 = imagendebd1[0].Archivos.split('|');
          const ruta15 = path.join(__dirname, "../images/");
          console.log(ruta15);
          const imagenes =  imagendebd2.map((img) => {
            return "File:///"+ruta15  +IDT+"_"+img;
          });
  
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img,
              imagenes:imagenes
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");

            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }else{
 
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }
      }
  });
});

router.get("/pdfe/:IDT/:CODIGO", isLoggedIn, authRole(['Cli_E']), async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

  await pool.query(
    "SELECT\n" +
    "        Tareas.Id AS TR_TAREA_ID,\n" +
    "        date_format(Tareas.Fecha, '%d-%m-%Y') AS FECHA,\n" +
    "        Protocolos.Id AS 'TR_PROT_ID',\n" +
    "        	TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "        	UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "        	Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "        	Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "        	Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "        	UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "        	Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "        	Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "        	Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "        	TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "        	TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "        	Estados.Descripcion AS 'TR_ESTADO',\n" +
    "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revisar',IF\n" +
    "        	(Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo.',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "        	IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo.', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "        	 AS 'TR_RESPUESTA',\n" +
    "        	Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "        	UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "        	( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "        	TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "        	TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "        	( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "        	Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "        	EQ.SecDESC AS 'TR_SECTOR',\n" +
    "        	EQ.AreaDESC AS 'TR_AREA',\n" +
    "        	EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "        	Protocolos\n" +
    "        	INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "        	INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "        	INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "        	INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "        	INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "        	INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "        	AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "        	AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "        	INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "        	INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "        	INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "        	LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "       	LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "      	INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "        	INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "        	INNER JOIN (\n" +
    "        	SELECT\n" +
    "        		E.Id 'EqID',\n" +
    "        		S.Descripcion 'SecDESC',\n" +
    "        	A.Descripcion 'AreaDESC',\n" +
    "       		G.Descripcion 'GerDESC',\n" +
    "        		C.Descripcion 'CteDESC' \n" +
    "       	FROM\n" +
    "        		Equipos E\n" +
    "        		INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "        		INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "        		INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "        		INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "        	) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",
    async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const estado = result[0].TR_ESTADO;
        const filePathName = path.resolve(__dirname, "../views/protocolos/pdf.hbs") 
        const html1 = fs.readFileSync(filePathName, "utf8");
        const ruta_imagen = path.resolve(__dirname, "../public/img/imagen1.png");                   
        const img = "file:///" + ruta_imagen;
        const options = {
          format: "letter",
          orientation: "portrait",
          border: "5mm",
          paginationOffset: 1,       // Override the initial pagination number
            "footer": {
              "height": "5mm",
              "contents": {
                default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+IDT+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                
              }
            },
          localUrlAccess: true,
          base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
        };

        const imagendebd = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [IDT]);
        const imagendebd1 = Object.values(imagendebd);

        if (imagendebd1.length > 0) {
          const imagendebd2 = imagendebd1[0].Archivos.split('|');
          const ruta15 = path.join(__dirname, "../images/");
          console.log(ruta15);
          const imagenes =  imagendebd2.map((img) => {
            return "File:///"+ruta15  +IDT+"_"+img;
          });
  
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img,
              imagenes:imagenes
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");

            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }else{
 
          const document = {
            type: "file", // 'file' or 'buffer'
            template: html1,
            context: {
              IDT: result[0].TR_TAREA_ID,
              TR_GERENCIA: result[0].TR_GERENCIA,
              TR_AREA: result[0].TR_AREA,
              TR_SECTOR: result[0].TR_SECTOR,
              FECHA: result[0].FECHA,
              TAREATIPO: result[0].TR_PROT_TAREATIPO,
              TR_PROT_DESC_TAREATIPO: result[0].TR_PROT_DESC_TAREATIPO,
              TR_EQUIPO_COD: result[0].TR_EQUIPO_COD,
              TR_PROT_ID: result[0].TR_PROT_ID,
              TR_PROT_DESC_PROT: result[0].TR_PROT_DESC_PROT,
              TR_ESTADO: result[0].TR_ESTADO,
              prot: result,
              img: img
            },
            path: "src/pdf/" + IDT +"_"+CODIGO+".pdf", // it is not required if type is buffer
          };
  
          pdf.create(document, options)
            .then((res) => {
              console.log("PDF creado");
  
              // console.log(res);
              // const file = Object.values(res);
              // const file1 = file[0];
              // fs.readFile(file1, function (err, res, file) {
              //   res.contentType("application/pdf");
              //   res.send(file1);
              // });
            })
            .catch((error) => {
              console.error(error);
            }).then(() => {
              res.download(ruta,  IDT+"_"+CODIGO+".pdf",   function(err) {
                if (err) {
                  console.log(err);
                }else{
                  console.log("descargado");
                }
            });
          });
        }
      }
  });
});


module.exports = router;
