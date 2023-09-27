const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole} = require('../lib/rol');
const multer = require('multer');

router.get('/sup',  isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query("SELECT\n" +
    "	S.Id AS ID,\n" +
    "	S.Descripcion AS SUP\n" +
    "FROM\n" +
    "	Superintendencias S\n" +
    "WHERE\n" +
    "	S.Id_Cliente = "+Id_Cliente+"", async (err,result)=>{
        if (err){
            console.log(err);
        }else{
            res.render('admin/sup', {sup:result});

        }
    });
});

router.post('/verificar_sup', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const sup = req.body.sup;
    const { Id_Cliente } = req.user;
  
    pool.query("SELECT * FROM Superintendencias WHERE Descripcion = ? AND Id_Cliente = ?", [sup, Id_Cliente], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                res.send({error: "Ya existe una superintendencia con esa descripción"});
            } else {
                res.json({success: true});
            }
        }
    });
});
  
router.post('/agregar_sup', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const sup = req.body.sup;
    const { Id_Cliente } = req.user;
    pool.query("INSERT INTO Superintendencias (Descripcion, Id_Cliente) VALUES (?,?)", [sup, Id_Cliente], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            const newId = result.insertId;
            res.json({
                id: newId,
                sup: sup
            });
        }
    });
});
  
router.post('/eliminar-sup', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id_sup = req.body.idt;

    pool.query("DELETE FROM Superintendencias WHERE Id IN ("+id_sup+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.post('/actualizar-sup', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idid; 
    const sup = req.body.sup;

    pool.query("UPDATE Superintendencias SET Descripcion = ? WHERE Id = ?;", [sup, id], (err, result) => {
      if (err) {
          console.log(err);
      } else {
          res.json({
              id: id,
              sup: sup
          });
      }
  });
});

router.get('/ger',  isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query("SELECT\n" +
    "	G.Id AS ID,\n" +
    "	G.Descripcion AS GER,\n" +
    "	G.Detalle AS DES,\n" +
    "	G.Contacto AS CON,\n" +
    "	G.Telefono AS TEL,\n" +
    "	G.Email AS EMAIL\n" +
    "FROM\n" +
    "	Gerencias G\n" +
    "WHERE\n" +
    "	G.Id_Cliente = "+Id_Cliente+"", async (err,result)=>{
        if (err){
            console.log(err);
        }else{
            res.render('admin/gerencias', {ger:result});

        }
    });
});

router.post('/verificar_gerencia', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const gerencia = req.body.gerencia;
    const { Id_Cliente } = req.user;
  
    pool.query("SELECT * FROM Gerencias WHERE Descripcion = ? AND Id_Cliente = ?", [gerencia, Id_Cliente], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                res.send({error: "Ya existe una gerencia con esa descripción"});
            } else {
                res.json({success: true});
            }
        }
    });
});
  
router.post('/agregar_gerencia', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const gerencia = req.body.gerencia;
    const descripcion = req.body.descripcion;
    const contacto = req.body.contacto;
    const telefono = req.body.telefono;
    const email = req.body.email;
    const { Id_Cliente } = req.user;
  
    pool.query("INSERT INTO Gerencias (Descripcion, Id_Cliente, Detalle, Contacto, Telefono, Email ) VALUES (?,?,?,?,?,?)", [gerencia, Id_Cliente, descripcion, contacto, telefono, email], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json({
                id: result.insertId,
                gerencia: gerencia,
                descripcion: descripcion,
                contacto: contacto,
                telefono: telefono,
                email: email
            });
        }
    });
});
  
router.post('/eliminar-gerencia', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id_ger = req.body.idt;

    pool.query("DELETE FROM Gerencias WHERE Id IN ("+id_ger+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.post('/actualizar-gerencia', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idid; 
    const gerencia = req.body.gerencia;
    const descripcion = req.body.descripcion;
    const contacto = req.body.contacto;
    const telefono = req.body.telefono;
    const email = req.body.email;

    pool.query("UPDATE Gerencias SET Descripcion = ?, Detalle = ?, Contacto = ?, Telefono = ?, Email = ? WHERE Id = ?;", [gerencia, descripcion, contacto, telefono, email, id], (err, result) => {
      if (err) {
          console.log(err);
      } else {
          res.json({
              id: id,
              gerencia: gerencia,
              descripcion: descripcion,
              contacto: contacto,
              telefono: telefono,
              email: email
          });
      }
  });
});

router.get('/are',  isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query("SELECT\n" +
    "	A.Id AS ID,\n" +
    "	A.Descripcion AS AREA,\n" +
    "	G.Descripcion AS GERENCIA\n" +
    "FROM\n" +
    "	Areas A\n" +
    "	INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
    "WHERE\n" +
    "	G.Id_Cliente = "+Id_Cliente+"", async (err,result)=>{
        if (err){
            console.log(err);
        }else{
            const gerencias = await pool.query("SELECT\n" +
            "	G.Id AS ID,\n" +
            "	G.Descripcion AS GER\n" +
            "FROM\n" +
            "	Gerencias G\n" +
            "WHERE\n" +
            "	G.Id_Cliente = "+Id_Cliente+"");
            res.render('admin/areas', {
                are:result,
                gerencias: gerencias
            });

        }
    });
});

router.post('/verificar_area', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const gerencia = req.body.gerencia;
    const area = req.body.area;

    const [existingArea] = await pool.query("SELECT * FROM Areas WHERE Descripcion = ? AND Id_Gerencia = ?", [area, gerencia]);
    if (existingArea) {
        res.status(400).json({ error: "Ya existe un área con la misma gerencia." });
    } else {
        res.json({ success: true });
    }
});

router.post('/agregar_area', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const gerencia = req.body.gerencia;
    const area = req.body.area;

    await pool.query("INSERT INTO Areas (Descripcion, Id_Gerencia ) VALUES (?,?)", [area, gerencia], async (err, result) => {
        if (err) {
            console.log(err);
        } else {
            const gere = await pool.query("SELECT Descripcion FROM Gerencias Where Id = "+gerencia+"");
            res.json({
                id: result.insertId,
                area: area,
                gerencia: gere[0].Descripcion
            });
        }
    });
    
});

router.post('/eliminar-area', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id_area = req.body.idt;

    pool.query("DELETE FROM Areas WHERE Id IN ("+id_area+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.post('/actualizar-area', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    console.log(req.body);
    const id = req.body.ida; 
    const area = req.body.area;
    const gerencia = req.body.gerencia;

    await pool.query("UPDATE Areas SET Descripcion = ?, Id_Gerencia = ? WHERE Id = ?;", [area, gerencia, id], async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const gere = await pool.query("SELECT Descripcion FROM Gerencias Where Id = "+gerencia+"");
            res.json({
                id: id,
                area: area,
                gerencia: gere[0].Descripcion
            });
      }
    });
});

router.get('/sec',  isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    await pool.query("SELECT\n" +
    "	S.Id AS ID,\n" +
    "	S.Descripcion As SECTOR,\n" +
    "	A.Descripcion AS AREA,\n" +
    "	G.Descripcion AS GERENCIA\n" +
    "FROM\n" +
    "	Sectores S \n" +
    "INNER JOIN Areas A On A.Id = S.Id_Area\n" +
    "INNER JOIN Gerencias G ON G.Id = A.Id_Gerencia\n" +
    "WHERE	\n" +
    "	G.Id_Cliente = "+Id_Cliente+"", async (err,result)=>{
        if (err){
            console.log(err);
        }else{
            const gerencias = await pool.query("SELECT\n" +
            "	G.Id AS ID,\n" +
            "	G.Descripcion AS GER\n" +
            "FROM\n" +
            "	Gerencias G\n" +
            "WHERE\n" +
            "	G.Id_Cliente = "+Id_Cliente+"");
            res.render('admin/sectores', {
                sec:result,
                gerencias: gerencias
            });

        }
    });
});

router.get('/get_areas', function(request, response, next){

    const type = request.query.type;

    const search_query = request.query.parent_value;


    if(type == 'load_areass')
    {
        var query = `
        SELECT DISTINCT vcgas_idArea AS Id, vcgas_areaN AS Data FROM VIEW_ClienteGerAreSec 
        WHERE vcgas_idGerencia = '${search_query}' 
        ORDER BY vcgas_areaN ASC
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

router.post('/verificar_sector', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const area = req.body.area;
    const sector = req.body.sector;

    const [existingSector] = await pool.query("SELECT * FROM Sectores WHERE Descripcion = ? AND Id_Area = ?", [sector, area]);
    if (existingSector) {
        res.status(400).json({ error: "Ya existe este sector con la misma area y gerencia." });
    } else {
        res.json({ success: true });
    }
});

router.post('/agregar_sector', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const sector = req.body.sector;
    const area = req.body.area;
    const gerencia = req.body.gerencia;
    await pool.query("INSERT INTO Sectores (Descripcion, Id_Area ) VALUES (?,?)", [sector, area], async (err, result) => {
        if (err) {
            console.log(err);
        } else {
            const gere = await pool.query("SELECT Descripcion FROM Gerencias Where Id = "+gerencia+"");
            const are = await pool.query("SELECT Descripcion FROM Areas Where Id = "+area+"");
            res.json({
                id: result.insertId,
                sector: sector,
                area: are[0].Descripcion,
                gerencia: gere[0].Descripcion
            });
        }
    });
    
});

router.post('/actualizar-sector', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const id = req.body.ids; 
    const sector = req.body.sector; 
    const area = req.body.area;
    const gerencia = req.body.gerencia;

    await pool.query("UPDATE Sectores SET Descripcion = ?, Id_Area = ? WHERE Id = ?;", [sector, area, id], async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const gere = await pool.query("SELECT Descripcion FROM Gerencias Where Id = "+gerencia+"");
        const are = await pool.query("SELECT Descripcion FROM Areas Where Id = "+area+"");
        res.json({
            id: id,
            sector: sector,
            area: are[0].Descripcion,
            gerencia: gere[0].Descripcion
        });
      }
    });
});

router.post('/eliminar-sector', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id_sector = req.body.idt;

    pool.query("DELETE FROM Sectores WHERE Id IN ("+id_sector+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.get('/mm', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
    await pool.query("SELECT Id As ID, Descripcion AS TIPO FROM MMEquipo", async (err, result) =>{
        if(err){
            console.log(err);
        }else{
            res.render('admin/mm', {mm:result});
        }
    });
});

router.post('/verificar_mm', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const {marca} = req.body;
    const {modelo} = req.body;
    const descripcion = marca+" | "+modelo;
    console.log(req.body);
    pool.query("SELECT * FROM  MMEquipo WHERE Descripcion = ?", [descripcion], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                res.send({error: "Ya existe un un registro con esa descripción"});
            } else {
                res.json({success: true});
            }
        }
    });
});

router.post('/agregar_mm', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {marca} = req.body;
    const {modelo} = req.body;
    const descripcion = marca+" | "+modelo;

    const lastId = await pool.query("SELECT Id FROM MMEquipo ORDER BY Id DESC LIMIT 1");
    const Id = parseInt(lastId[0].Id) + 1;
    await pool.query("INSERT INTO MMEquipo (Id, Descripcion) VALUES (?, ?)", [Id, descripcion], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json({
                id: Id,
                descripcion: descripcion
            });
        }
    });
});

router.post('/actualizar-mm', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idid; 
    const {marca} = req.body;
    const {modelo} = req.body;
    const descripcion = marca+" | "+modelo;

    pool.query("UPDATE MMEquipo SET Descripcion = ?  WHERE Id = ?;", [descripcion, id], (err, result) => {
      if (err) {
          console.log(err);
      } else {
          res.json({
              id: id,
              descripcion: descripcion
          });
      }
  });
});

router.post('/eliminar-mm', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idt;

    pool.query("DELETE FROM MMEquipo WHERE Id IN ("+id+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.get('/tipo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
    await pool.query("SELECT Id As ID, Descripcion AS TIPO FROM TipoEquipo", async (err, result) =>{
        if(err){
            console.log(err);
        }else{
            res.render('admin/tipo', {tipo:result});
        }
    });
});

router.post('/verificar_tipo', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const descripcion = req.body.descripcion;  
    pool.query("SELECT * FROM  TipoEquipo WHERE Descripcion = ?", [descripcion], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                res.send({error: "Ya existe un tipo de equipo con esa descripción"});
            } else {
                res.json({success: true});
            }
        }
    });
});

router.post('/agregar_tipo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const descripcion = req.body.descripcion;
    const lastId = await pool.query("SELECT Id FROM TipoEquipo ORDER BY Id DESC LIMIT 1");
    const Id = parseInt(lastId[0].Id) + 1;
    await pool.query("INSERT INTO TipoEquipo (Id, Descripcion) VALUES (?, ?)", [Id, descripcion], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json({
                id: Id,
                descripcion: descripcion
            });
        }
    });
});

router.post('/actualizar-tipo', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idid; 
    const descripcion = req.body.descripcion;

    pool.query("UPDATE TipoEquipo SET Descripcion = ?  WHERE Id = ?;", [descripcion, id], (err, result) => {
      if (err) {
          console.log(err);
      } else {
          res.json({
              id: id,
              descripcion: descripcion
          });
      }
  });
});

router.post('/eliminar-tipo', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idt;

    pool.query("DELETE FROM TipoEquipo WHERE Id IN ("+id+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.get('/agente', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) =>{
    await pool.query("SELECT Id As ID, Descripcion AS TIPO FROM Agentes", async (err, result) =>{
        if(err){
            console.log(err);
        }else{
            res.render('admin/agente', {tipo:result});
        }
    });
});

router.post('/verificar_agente', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const descripcion = req.body.descripcion;  
    pool.query("SELECT * FROM  Agentes WHERE Descripcion = ?", [descripcion], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                res.send({error: "Ya existe un agente de equipo con esa descripción"});
            } else {
                res.json({success: true});
            }
        }
    });
});

router.post('/agregar_agente', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const descripcion = req.body.descripcion;

    await pool.query("INSERT INTO Agentes (Descripcion) VALUES (?)", [descripcion], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            const newId = result.insertId;
            res.json({
                id: newId,
                descripcion: descripcion
            });
        }
    });
});

router.post('/actualizar-agente', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idid; 
    const descripcion = req.body.descripcion;

    pool.query("UPDATE Agentes SET Descripcion = ?  WHERE Id = ?;", [descripcion, id], (err, result) => {
      if (err) {
          console.log(err);
      } else {
          res.json({
              id: id,
              descripcion: descripcion
          });
      }
  });
});

router.post('/eliminar-agente', isLoggedIn, authRole(['Plan', 'Admincli']), (req, res) => {
    const id = req.body.idt;

    pool.query("DELETE FROM Agentes WHERE Id IN ("+id+");", (err, result) => {
      if (err){
        console.log(err);
      }else{
        console.log("ok");
      }
    });
});

router.post('/check-serie', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {serie} = req.body;
    await pool.query("SELECT eg_serie FROM Equipos_General WHERE eg_serie = ?", [serie], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          res.send({ exists: true });
        } else {
          res.send({ exists: false });
        }
    });
});

router.post('/check-serie-din', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {serie} = req.body;
    await pool.query("SELECT ed_serie FROM Equipos_Dinamicos WHERE ed_serie = ?", [serie], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          res.send({ exists: true });
        } else {
          res.send({ exists: false });
        }
    });
});

router.post('/check-cer', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {cer} = req.body;
    await pool.query("SELECT eg_certificacion FROM Equipos_General WHERE eg_certificacion = ?", [cer], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          res.send({ exists: true });
        } else {
          res.send({ exists: false });
        }
    });
});

router.post('/check-cer-din', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {cer} = req.body;
    await pool.query("SELECT ed_certificacion FROM Equipos_Dinamicos WHERE ed_certificacion = ?", [cer], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          res.send({ exists: true });
        } else {
          res.send({ exists: false });
        }
    });
});

router.get('/autocomplete_unidad', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const userInput = req.query.input;
    const results = await pool.query('SELECT eg_unidad FROM Equipos_General WHERE eg_unidad LIKE ? AND eg_unidad <> ""', ['%'+ userInput + '%']);
    res.json(results);
});

router.get('/autocomplete_superintendencia', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const userInput = req.query.input;
    const results = await pool.query('SELECT eg_superintendencia AS SUPER FROM Equipos_General WHERE eg_superintendencia LIKE ? AND eg_superintendencia <> "" GROUP BY eg_superintendencia', ['%'+ userInput + '%']);
    res.json(results);
    console.log(results)
});

router.get('/autocomplete_utec', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const userInput = req.query.input;
    const results = await pool.query('SELECT eg_ubicacion_tecnica AS UTEC FROM Equipos_General WHERE eg_ubicacion_tecnica LIKE ? AND eg_ubicacion_tecnica <> "" GROUP BY eg_ubicacion_tecnica', ['%'+ userInput + '%']);
    res.json(results);
    console.log(results)
});
  

module.exports = router;