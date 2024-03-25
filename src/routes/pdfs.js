const express = require('express');
const router = express.Router();
const { isLoggedIn } = require("../lib/auth");
global.ReadableStream = require('web-streams-polyfill').ReadableStream;
const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');
const pool = require('../database');
const path = require('path');
const fetch = require("node-fetch");
const AdmZip = require('adm-zip');
const hbs = require("handlebars");

router.post('/pdfs', isLoggedIn, async (req, res) => {
  try {
    const ID1 = Object.values(req.body);
    const ID = [ID1[0]];
    const { usuario } = req.user;
    const ruta = path.resolve(__dirname, "../pdf/" + ID + ".pdf");
    const IDSS = ID.reduce((a, b) => a.concat(b));
    const ID2 = ID1[1];
    const equipores = IDSS.map((x, i) => `${x}_${ID2[i]}`);

    const data = await pool.query("SELECT\n" +
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
      " Tareas.Id  IN (" + ID + ") \n" +
      " ORDER BY TR_PROT_DESC_CAPI  ASC, \n" +
      " FIELD(TR_PROT_CAPTURA,'Observaciones PV', 'Observación PV', 'Observaciones PV SA', 'Observaciones PV SSA', 'Observaciones PV EP'),	TR_PROT_CAPTURA ASC;"
    );

    const codigo_bat = data[0].TR_EQUIPO_COD;
    const id_bat = await pool.query("SELECT eq_bat_id FROM Equipos WHERE Codigo IN (?)", [codigo_bat]);
    const bat_id = id_bat[0].eq_bat_id;
    const bat = await pool.query("SELECT * FROM Baterias_UPS WHERE bat_id =?", [bat_id]);
    const agregarDatosBateria = (data, bat) => {
      for (let i = 0; i < data.length; i++) {
        if (bat.length > 0) {
          data[i] = { ...data[i], ...bat[0] };
        }
      }
    };
    
    await agregarDatosBateria(info_prot, bat);

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
      const imageBuffer = fs.readFileSync(ruta_imagen);
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const img = 'data:image/png;base64,' + base64Image;

      const options = {
        format: 'letter',
        printBackground: true,
        margin: {
          top: '30px', // Adjust margins for better visibility
          right: '20px',
          bottom: '30px',
          left: '20px',
        },
        displayHeaderFooter: true,
        footerTemplate: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">' + // Centered text, smaller font
          '<center>SAPMA-Sercoing | Tarea Nº: ' + ID + ' | Estado: ' + estado + ' | Página <span class="pageNumber"></span> de <span class="totalPages"></span>' +
          '</center></div>',
      };
      const consultaImagenes = await pool.query("SELECT * FROM Adjuntos WHERE Id_Tarea IN (?)", [TAREA]);
      const imagenes = [];

      if (consultaImagenes.length > 0) {
        const img = consultaImagenes[0].Archivos.split('|');
        const rutaImagenes = path.resolve(__dirname, "../images/");

        const images = img.map((img) => {
          const imagePath = path.join(rutaImagenes, TAREA + "_" + img);
          const imageData = fs.readFileSync(imagePath);
          const base64Image = Buffer.from(imageData).toString('base64');
          return 'data:image/png;base64,' + base64Image;
        });

        imagenes.push(...images);
      }

      let context = {
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

      await page.waitForSelector('img');

      const buffer = await page.pdf(options);

      fs.writeFileSync("src/pdf/" + TAREA + "_" + codigo + ".pdf", buffer); // WriteFileSync

      console.log('PDF guardado');
    }

    if (typeof IDSS === 'string') {

      res.send("archivo creado 1");

    } else {

      const ruta1 = path.resolve(__dirname, "../pdf");
      const ruta2 = path.resolve(__dirname, "../zip");
      const fileZip = `${ruta2}/archivo_${usuario}.zip`;

      const zip = new AdmZip();

      await Promise.all(equipores.map(async (id) => {
        const filePath = `${ruta1}/${id}.pdf`;
        try {
          const data = fs.readFileSync(filePath);
          zip.addFile(`${id}.pdf`, data);
          console.log(`Archivo agregado: ${id}.pdf`);
        } catch (error) {
          console.error(`Error al agregar el archivo ${id}.pdf:`, error);
        }
      }));

      try {
        zip.writeZip(fileZip);
        console.log("Archivo creado");
      } catch (error) {
        console.error(`Error al escribir el archivo zip:`, error);
      }

      res.json({ message: "archivo creado" });
    }
    
  } catch (error) {
    console.log(error);
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
  try {

    const { IDT, CODIGO } = req.params;
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

    const options = {
      format: 'letter',
      printBackground: true,
      margin: {
        top: '30px', // Adjust margins for better visibility
        right: '20px',
        bottom: '30px',
        left: '20px',
      },
      displayHeaderFooter: true,
      footerTemplate: '<div style="font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 8px; margin: 0 auto;">' + // Centered text, smaller font
      '<center>SAPMA-Sercoing | Tarea Nº: ' + IDT + ' | Estado: ' + estado + ' | Página <span class="pageNumber"></span> de <span class="totalPages"></span>' +
      '</center></div>',
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
    
    await page.waitForSelector('img');
    
    const buffer = await page.pdf(options);
    
    fs.writeFile("src/pdf/" + IDT + "_" + CODIGO + ".pdf", buffer, () => console.log('PDF guardado'));
    
    // const fileName = IDT + "_" + CODIGO + ".pdf";

    // res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(buffer);

    const fileName = IDT + "_" + CODIGO + ".pdf";

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
    
    await browser.close();

  } catch (error) {
    console.log(error);
  }
});

module.exports = router;



