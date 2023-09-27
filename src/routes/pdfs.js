const express = require('express');
const router = express.Router();
const { isLoggedIn } = require("../lib/auth");
const pdf = require("dynamic-html-pdf");
const fs = require('fs');
const request = require('request');
const pool = require('../database');
const path = require('path');
const fetch = require("node-fetch");
const AdmZip = require('adm-zip');

router.post('/pdfs', isLoggedIn, async (req, res)=> {
    const ID1 = Object.values(req.body);  
    const ID = [ID1[0]];
    const {usuario} = req.user;
    const ruta =  path.resolve(__dirname ,"../pdf/" + ID + ".pdf");   
    const { Id_Cliente } = req.user;
    const { Login } = req.user;
    const headers = { "User-Agent": "node-fetch" };
    const IDSS = ID.reduce((a, b) => a.concat(b));
    const ID2 = ID1[1];
    const equipores = IDSS.map((x, i) => `${x}_${ID2[i]}`);
    for (let i = 0; i < IDSS.length; i++) {
        const urlimagen = "https://sapma.sercoing.cl/svc/ver_tarea.py?login=" +Login +"&idCliente=" +Id_Cliente +"&tarea=" +IDSS[i]
        const response = await fetch(urlimagen, { headers }
        ).then((res) => res.json())
        .then((data) => {
                return data;
        });
        const imagen = Object.values(response);
        const imagenes = imagen[2];
    
        const dir = "src/images/";
    
        imagenes.forEach(function (url) {
            var filename = dir + url.split("/").pop();
            request.head(url, function (err, res, body) {
                request(url).pipe(fs.createWriteStream(filename));
            });
        });
    };

    const data =   await pool.query(
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
        "					CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica.',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revizar.',IF\n" +
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
        "   Tareas.Id  IN (" +ID +") ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC",);

        const result = Object.values(JSON.parse(JSON.stringify(data)));
        
        let grouped = [];

        for (let i = 0; i < result.length; i++) {
            let obj = result[i];
            if (!grouped[obj.TR_TAREA_ID]) {
                grouped[obj.TR_TAREA_ID] = [];
            }
            grouped[obj.TR_TAREA_ID].push(obj);
        }

        const resultado = Object.values(grouped);

            for (const TR_TAREA_ID in resultado) {
                const objects = resultado[TR_TAREA_ID];
                const codigo = objects[0].TR_EQUIPO_COD;
                const TAREA = objects[0].TR_TAREA_ID;
                const estado = objects[0].TR_ESTADO;
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
                        default: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px"><center>SAPMA-Sercoing | Tarea Nº:  '+TAREA+' | Estado: '+estado+' | Página <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></center></div>', // fallback value
                        
                    }
                    },
                localUrlAccess: true,
                base: ('https://sapmadand.sercoing.cl:3000', 'https://localhost:3000')
                };
    
                const imagendebd =  await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea = ?", [TAREA]);
                const imagendebd1 = Object.values(imagendebd);
    
                if (imagendebd1.length > 0) {
                const imagendebd2 = imagendebd1[0].Archivos.split('|');
                const ruta15 = path.join(__dirname, "../images/");
                const imagenes =  imagendebd2.map((img) => {
                    return "File:///"+ruta15  +TAREA+"_"+img;
                });
        
                const document = {
                    type: "file", // 'file' or 'buffer'
                    template: html1,
                    context: {
                    IDT: objects[0].TR_TAREA_ID,
                    TR_GERENCIA: objects[0].TR_GERENCIA,
                    TR_AREA: objects[0].TR_AREA,
                    TR_SECTOR: objects[0].TR_SECTOR,
                    FECHA: objects[0].FECHA,
                    TAREATIPO: objects[0].TR_PROT_TAREATIPO,
                    TR_PROT_DESC_TAREATIPO: objects[0].TR_PROT_DESC_TAREATIPO,
                    TR_EQUIPO_COD: objects[0].TR_EQUIPO_COD,
                    TR_PROT_ID: objects[0].TR_PROT_ID,
                    TR_PROT_DESC_PROT: objects[0].TR_PROT_DESC_PROT,
                    TR_ESTADO: objects[0].TR_ESTADO,
                    prot: objects,
                    img: img,
                    imagenes:imagenes
                    },
                    path: "src/pdf/" + TAREA +"_"+codigo+".pdf", // it is not required if type is buffer
                };
                
            await pdf.create(document, options)
                    .then((res) => {
                    console.log("PDF creado");
                    })
                    .catch((error) => {
                    console.error(error);
                    });
                    
                }else{
        
                const document = {
                    type: "file", // 'file' or 'buffer'
                    template: html1,
                    context: {
                    IDT: objects[0].TR_TAREA_ID,
                    TR_GERENCIA: objects[0].TR_GERENCIA,
                    TR_AREA: objects[0].TR_AREA,
                    TR_SECTOR: objects[0].TR_SECTOR,
                    FECHA: objects[0].FECHA,
                    TAREATIPO: objects[0].TR_PROT_TAREATIPO,
                    TR_PROT_DESC_TAREATIPO: objects[0].TR_PROT_DESC_TAREATIPO,
                    TR_EQUIPO_COD: objects[0].TR_EQUIPO_COD,
                    TR_PROT_ID: objects[0].TR_PROT_ID,
                    TR_PROT_DESC_PROT: objects[0].TR_PROT_DESC_PROT,
                    TR_ESTADO: objects[0].TR_ESTADO,
                    prot: objects,
                    img: img
                    },
                    path: "src/pdf/" + TAREA +"_"+codigo+".pdf", // it is not required if type is buffer
                };
        
            await pdf.create(document, options)
                    .then((res) => {
                    console.log("PDF creado");
                    })
                    .catch((error) => {
                    console.error(error);
                    });
                
                }
            }

            if(typeof IDSS === 'string'){
                res.send("archivo creado 1");
            }else{

              const ruta1 = path.resolve(__dirname, "../pdf");
              const ruta2 = path.resolve(__dirname, "../zip");
              const fileZip = `${ruta2}/archivo_${usuario}.zip`;
              
              const zip = new AdmZip();
              
              await equipores.forEach(id => {
                const filePath = `${ruta1}/${id}.pdf`;
                try {
                  zip.addLocalFile(filePath);
                } catch (error) {
                  console.error(`Error al agregar el archivo ${id}.pdf:`, error);
                }
              });
              
              try {
                zip.writeZip(fileZip, (err) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Archivo creado");
                  }
                });
              } catch (error) {
                console.error(`Error al escribir el archivo zip:`, error);
              }
              
              
              
                // res.download(ruta2 + "/archivo_"+usuario+".zip", (err) => {
                //     if (err) {
                //         console.log(err);
                //     }else{
                //         console.log(res.download);
                //         console.log("descargado");
                //     }
                // });
               
              res.json({message: "archivo creado"});
            }
       
});

router.get('/archivo', isLoggedIn, async (req, res) => {
    const { usuario } = req.user;
    const ruta =  path.resolve(__dirname ,"../zip");
    res.download(ruta + "/archivo_"+usuario+".zip", (err) => {
        if (err) {
            console.log(err);
        }else{
            console.log("descargado");
        }
    });
});

router.get('/archivo/:IDT/:CODIGO', isLoggedIn, async (req, res) => {
  const { IDT } = req.params;
  const { CODIGO } = req.params;
  const {Login} = req.user;
  const {Id_Cliente} = req.user;
  const ruta =  path.resolve(__dirname ,"../pdf/" + IDT +"_"+CODIGO+".pdf");

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
    "         TipoProtocolo.Abreviacion AS 'TR_PROT_TAREATIPO',\n" +
    "         UPPER ( TipoProtocolo.Descripcion ) AS 'TR_PROT_DESC_TAREATIPO',\n" +
    "         Equipos.Codigo AS 'TR_EQUIPO_COD',\n" +
    "         Protocolos.Descripcion AS 'TR_PROT_DESC_PROT',\n" +
    "         Protocolo_Capitulo.Capitulo AS 'TR_PROT_CAPIT_ID',\n" +
    "         UPPER( Protocolo_Capitulo.Descripcion ) AS 'TR_PROT_DESC_CAPI',\n" +
    "         Protocolo_Capitulo.Es_Varios AS 'TR_PROT_ESVARIOS',\n" +
    "         Protocolo_Capturas.Correlativo AS 'TR_PROT_CAPTURA_ID',\n" +
    "         Protocolo_Capturas.Descripcion AS 'TR_PROT_CAPTURA',\n" +
    "         TipoRespuesta.Id AS 'TR_PROT_TRESP_ID',\n" +
    "         TipoRespuesta.Descripcion AS 'TR_PROT_TRESP_TIPO',\n" +
    "         Estados.Descripcion AS 'TR_ESTADO',\n" +
    "         CONVERT(CAST(CONVERT(IF(Tarea_Respuesta.Respuesta = 'SC','No aplica.',IF(Tarea_Respuesta.Respuesta = 'SSR','Sistema sin revizar.',IF\n" +
    "         (Tarea_Respuesta.Respuesta = 'SOP','Sistema operativo.',IF(Tarea_Respuesta.Respuesta = 'SOCO','Sist. operativo con obs.',\n" +
    "         IF(Tarea_Respuesta.Respuesta = 'SFS','Sist. fuera de serv.',IF( Tarea_Respuesta.Respuesta = 'SNO', 'Sist. no operativo.', Tarea_Respuesta.Respuesta )))))) USING latin1) AS BINARY) USING UTF8)\n" +
    "          AS 'TR_RESPUESTA',\n" +
    "         Usuarios.Descripcion AS 'TR_TECNICO',\n" +
    "         UPPER( TE.Descripcion ) AS 'TR_TIPO_EQUIPO',\n" +
    "        IF\n" +
    "         ( TipoContingente.Id > 0, 'SI', 'NO' ) AS 'TR_CONTINGENTE_YN',\n" +
    "         TipoContingente.Id AS 'TR_CONTINGENTE_ID',\n" +
    "         TipoContingente.Descripcion AS 'TR_CONTINGENTE_DESC',\n" +
    "       IF\n" +
    "         ( Tareas_Motivos.Motivo IS NULL, 'NO', 'SI' ) AS 'TR_INCIDENCIA_YN',\n" +
    "         Tareas_Motivos.Motivo AS 'TR_INCIDENCIA',\n" +
    "         EQ.SecDESC AS 'TR_SECTOR',\n" +
    "         EQ.AreaDESC AS 'TR_AREA',\n" +
    "         EQ.GerDESC AS 'TR_GERENCIA' \n" +
    "        FROM\n" +
    "         Protocolos\n" +
    "         INNER JOIN Clientes ON Protocolos.Id_Cliente = Clientes.Id\n" +
    "         INNER JOIN Protocolo_Capitulo ON Protocolos.Id = Protocolo_Capitulo.Id_Protocolo\n" +
    "        INNER JOIN TipoProtocolo ON Protocolos.Id_TipoProtocolo = TipoProtocolo.Id\n" +
    "         INNER JOIN Protocolo_Capturas ON Protocolos.Id = Protocolo_Capturas.Id_Protocolo \n" +
    "         AND Protocolo_Capitulo.Capitulo = Protocolo_Capturas.Capitulo\n" +
    "         INNER JOIN TipoRespuesta ON Protocolo_Capturas.Id_TipoRespuesta = TipoRespuesta.Id\n" +
    "         INNER JOIN Tareas ON Protocolos.Id = Tareas.Id_Protocolo\n" +
    "         INNER JOIN Tarea_Respuesta ON Tareas.Id = Tarea_Respuesta.Id_Tarea \n" +
    "         AND Protocolo_Capitulo.Capitulo = Tarea_Respuesta.Capitulo \n" +
    "         AND Protocolo_Capturas.Correlativo = Tarea_Respuesta.Correlativo\n" +
    "         INNER JOIN Estados ON Tareas.Id_Estado = Estados.Id\n" +
    "         INNER JOIN Equipos ON Tareas.Id_Equipo = Equipos.Id\n" +
    "         INNER JOIN Usuarios ON Tareas.Id_Tecnico = Usuarios.Id\n" +
    "         LEFT JOIN TipoContingente ON Tareas.Contingente = TipoContingente.Id\n" +
    "         LEFT JOIN Tareas_Motivos ON Tareas.Id = Tareas_Motivos.Id_Tarea\n" +
    "       INNER JOIN TipoEquipo TE ON TE.Id = Equipos.Id_Tipo\n" +
    "         INNER JOIN Usuarios U ON U.Id = Tareas.Id_Tecnico\n" +
    "         INNER JOIN (\n" +
    "         SELECT\n" +
    "           E.Id 'EqID',\n" +
    "           S.Descripcion 'SecDESC',\n" +
    "         A.Descripcion 'AreaDESC',\n" +
    "           G.Descripcion 'GerDESC',\n" +
    "           C.Descripcion 'CteDESC' \n" +
    "         FROM\n" +
    "           Equipos E\n" +
    "           INNER JOIN Sectores S ON E.Id_Sector = S.Id\n" +
    "           INNER JOIN Areas A ON S.Id_Area = A.Id\n" +
    "           INNER JOIN Gerencias G ON A.Id_Gerencia = G.Id\n" +
    "           INNER JOIN Clientes C ON G.Id_Cliente = C.Id \n" +
    "         ) AS EQ ON Tareas.Id_Equipo = EQ.EqID \n" +
    "        WHERE \n" +
    "   Tareas.Id =" +IDT +" ORDER BY TR_PROT_DESC_CAPI  ASC, FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observacies PV SSA', 'Observaciones PV EP'),  TR_PROT_CAPTURA ASC",
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
        }
      }
  });
});



module.exports = router;



