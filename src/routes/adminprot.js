const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { authRole} = require('../lib/rol');

router.get('/tipo_respuesta', isLoggedIn, authRole(['Plan', 'Admincli']) , async (req, res) =>{
    try {
        const tipo_respuesta = await pool.query("SELECT Id, Descripcion FROM TipoRespuesta");
        res.json(tipo_respuesta);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Ocurrió un error al obtener los tipos de respuesta' });
        }  
});

router.get('/new_prot', isLoggedIn, authRole(['Plan', 'Admincli']) , async (req, res) =>{
    const {Id_Cliente} = req.user;
    const tipo_protocolo = await pool.query("SELECT Id, Descripcion, Abreviacion FROM TipoProtocolo;");
    const tipo_equipo = await pool.query("SELECT Id, Descripcion FROM TipoEquipo ORDER BY Descripcion ASC;");
    const protocolos = await pool.query("SELECT Id, Descripcion FROM Protocolos WHERE Id_Cliente=?;", [Id_Cliente]);
    res.render('adminprot/newprot',{
        tipo_protocolo: tipo_protocolo,
        tipo_equipo: tipo_equipo,
        protocolos: protocolos
    });
});

router.post('/crear_prot', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const { Id_Cliente } = req.user;
    const { tipoprotocolo, tipoe, protocolo, capitulos, capturas } = req.body;
    try {
        const new_prot = await pool.query("INSERT INTO Protocolos (Id_TipoProtocolo, Descripcion, Id_TipoEquipo, Es_Ubicacion, Id_Cliente) VALUES (?,?,?,0,?);", [
            tipoprotocolo, protocolo, tipoe, Id_Cliente
        ]);

        const newId = new_prot.insertId;

        const newCapitulos = capitulos.map((capitulo) => [newId, capitulo.id, capitulo.capitulo, 0]);

        let query = "INSERT INTO Protocolo_Capitulo (Id_Protocolo, Capitulo, Descripcion, Es_Varios) VALUES ";
        const values = [];
        newCapitulos.forEach((capitulo, index) => {
            query += "(?,?,?,?)";
            values.push(...capitulo);
            if (index !== newCapitulos.length - 1) {
            query += ",";
            }
        });
    
        await pool.query(query, values);

        const newCapturas = capturas.map((captura) =>[newId, captura.idCapitulo, 0, captura.correlativo, captura.captura, captura.tipo]);

        let query1 = "INSERT INTO Protocolo_Capturas (Id_Protocolo, Capitulo, Subcapitulo, Correlativo, Descripcion, Id_TipoRespuesta) VALUES ";
        const values1 = [];
        newCapturas.forEach((captura, index) => {
            query1 += "(?,?,?,?,?,?)";
            values1.push(...captura);
            if (index !== newCapturas.length - 1) {
                query1 += ",";
            }
        });

        await pool.query(query1, values1);
        res.json({message: 'Protocolo creado'});
    
    } catch (err) {
      console.log(err);
    }
});

router.get('/ver_protocolos', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res)=>{
    
    const tipo_protocolo = await pool.query("SELECT Id, Descripcion, Abreviacion FROM TipoProtocolo;");
    res.render('adminprot/ver',{
        tipo_protocolo: tipo_protocolo
    });
});

router.get('/tipoprot/:tipoProtocolo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
    const {Id_Cliente} = req.user;
    const { tipoProtocolo } = req.params;
    const protocolos = await pool.query("	SELECT\n" +
    "    	X.Id As Id,\n" +
    "    	X.Descripcion As Descripcion,\n" +
    "    	TP.Abreviacion AS Abreviacion,\n" +
    "		X.Id_TipoEquipo,\n" +
    "   	TE.Descripcion AS TIPOEQUIPO \n" +
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
    "       INNER JOIN TipoEquipo TE ON  TE.Id = X.Id_TipoEquipo \n" +
    "    WHERE\n" +
    "    	X.Id_TipoProtocolo = ?\n" +
    "    ORDER BY\n" +
    "    	X.Id;",[Id_Cliente, Id_Cliente, tipoProtocolo]);
    res.json(protocolos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los protocolos' });
    }    
});

router.get('/protselect/:id', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    try {
    const { id } = req.params;
    const protocoloselect = await pool.query("SELECT\n" +
    "	P.Id_Protocolo AS ID_PROTOCOLO,\n" +
    "	P.Capitulo AS ID_CAPITULO,\n" +
    "	P.Descripcion AS CAPITULO,\n" +
    "	PC.Correlativo AS CORRELATIVO,\n" +
    "	PC.Descripcion AS CAPTURA,\n" +
    "	TR.Id AS ID_TR,\n" +
    "	TR.Descripcion AS TIPO_RESPUESTA\n" +
    "FROM\n" +
    "	Protocolo_Capitulo P\n" +
    "	INNER JOIN Protocolo_Capturas PC ON PC.Capitulo = P.Capitulo AND PC.Id_Protocolo = P.Id_Protocolo\n" +
    "	INNER JOIN  TipoRespuesta TR ON TR.Id = PC.Id_TipoRespuesta\n" +
    "WHERE\n" +
    "	P.Id_Protocolo =?",[id]);
    res.json(protocoloselect);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los protocolos' });
    }    
});

router.post('/eliminar_protocolo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {protocolo} = req.body;
    try {
        const tareas = await pool.query("SELECT Id FROM Tareas WHERE Id_Protocolo = ? AND FECHA >= NOW()", [protocolo]);
        if (tareas.length > 0) {
            // Enviar un error
            res.status(400).send("No se puede eliminar el protocolo porque hay tareas asociadas");
        } else {
            // Ejecutar el resto del código
            const captura = await pool.query("DELETE FROM Protocolo_Capturas WHERE Id_Protocolo = ?", [protocolo]);
            const capitulo = await pool.query("DELETE FROM Protocolo_Capitulo WHERE Id_Protocolo = ?", [protocolo]);
            const prot = await pool.query("DELETE FROM Protocolos WHERE Id = ?", [protocolo]);
            res.status(200).send("Protocolo eliminado");
        }
    } catch (err) {
        console.log(err);
    }
});


router.post('/actualizar_protocolo', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {

    const {protocolo, capitulos, capturas, nombre} = req.body;
    
    var capitulosConProtocolo = capitulos.map(function(capitulo) {
        return [
            protocolo,
            capitulo.idCapitulo,
            capitulo.capitulo,
            0
        ];
    });

    var capturasConProtocolo = capturas.map(function(captura) {
        return [
            protocolo,
            captura.idCapitulo,
            0,
            captura.correlativo,
            captura.captura,
            captura.tipo
        ];
    });

    try {
        const nombre_prot = await pool.query("UPDATE Protocolos SET Descripcion = ? WHERE Id = ?;",[nombre, protocolo]);
        const capturas = await pool.query("DELETE FROM Protocolo_Capturas WHERE Id_Protocolo = ?", [protocolo]);
        const capitulos = await pool.query("DELETE FROM Protocolo_Capitulo WHERE Id_Protocolo = ?", [protocolo]);
        
        let query = "INSERT INTO Protocolo_Capitulo (Id_Protocolo, Capitulo, Descripcion, Es_Varios) VALUES ";
        const values = [];
        capitulosConProtocolo.forEach((capitulo, index) => {
            query += "(?,?,?,?)";
            values.push(...capitulo);
            if (index !== capitulosConProtocolo.length - 1) {
            query += ",";
            }
        });
    
        await pool.query(query, values);

        let query1 = "INSERT INTO Protocolo_Capturas (Id_Protocolo, Capitulo, Subcapitulo, Correlativo, Descripcion, Id_TipoRespuesta) VALUES ";
        const values1 = [];
        capturasConProtocolo.forEach((captura, index) => {
            query1 += "(?,?,?,?,?,?)";
            values1.push(...captura);
            if (index !== capturasConProtocolo.length - 1) {
                query1 += ",";
            }
        });

        await pool.query(query1, values1);
        res.json({message: 'Protocolo actualizado'});
    } catch (err) {
        console.log(err);
    }

});

router.post('/duplicar_prot', isLoggedIn, authRole(['Plan', 'Admincli']), async (req, res) => {
    const {Id_Cliente} = req.user;
    const {tipoprotocolo, tipoe, protocolo, protdup} = req.body;
    try {

        const new_prot = await pool.query("INSERT INTO Protocolos (Id_TipoProtocolo, Descripcion, Id_TipoEquipo, Es_Ubicacion, Id_Cliente) VALUES (?,?,?,0,?);", [
            tipoprotocolo, protocolo, tipoe, Id_Cliente
        ]);

        const newId = new_prot.insertId;
    
        const capitulos = await pool.query("SELECT\n" +
        "    	P.Capitulo AS ID_CAPITULO,\n" +
        "    	P.Descripcion AS CAPITULO,\n" +
        "			P.Es_Varios AS VARIOS\n" +
        "    FROM\n" +
        "    	Protocolo_Capitulo P\n" +
        "    	INNER JOIN Protocolo_Capturas PC ON PC.Capitulo = P.Capitulo AND PC.Id_Protocolo = P.Id_Protocolo\n" +
        "    	INNER JOIN  TipoRespuesta TR ON TR.Id = PC.Id_TipoRespuesta\n" +
        "    WHERE\n" +
        "    	P.Id_Protocolo =? GROUP BY P.Capitulo; ", [protdup]);
        
        const capitulosConProtocolo = []; // Array para almacenar los arrays con los datos de cada capítulo

        capitulos.forEach((capitulo) => {
            const array = []; // Array para almacenar los datos de cada capítulo

            array.push(newId);
            array.push(capitulo.ID_CAPITULO);
            array.push(capitulo.CAPITULO);
            array.push(capitulo.VARIOS);

            capitulosConProtocolo.push(array); // Agregar el array al resultado final
        });

        let query = "INSERT INTO Protocolo_Capitulo (Id_Protocolo, Capitulo, Descripcion, Es_Varios) VALUES ";
        const values = [];
        capitulosConProtocolo.forEach((capitulo, index) => {
            query += "(?,?,?,?)";
            values.push(...capitulo);
            if (index !== capitulosConProtocolo.length - 1) {
            query += ",";
            }
        });

        await pool.query(query, values);

        const capturas = await pool.query("SELECT\n" +
        "    	PC.Capitulo AS CAPITULO, \n" +
        "		PC.Correlativo AS CORRELATIVO,\n" +
        "		PC.Subcapitulo AS SUB,\n" +
        "    	PC.Descripcion AS CAPTURA,\n" +
        "    	TR.Id AS TR\n" +
        "    FROM\n" +
        "    	Protocolo_Capitulo P\n" +
        "    	INNER JOIN Protocolo_Capturas PC ON PC.Capitulo = P.Capitulo AND PC.Id_Protocolo = P.Id_Protocolo\n" +
        "    	INNER JOIN  TipoRespuesta TR ON TR.Id = PC.Id_TipoRespuesta\n" +
        "    WHERE\n" +
        "    	P.Id_Protocolo =?;",[protdup]);

        const capturasConProtocolo = [];

        capturas.forEach((captura) => {
            const array = []; // Array para almacenar los datos de cada capítulo

            array.push(newId);
            array.push(captura.CAPITULO);
            array.push(captura.SUB);
            array.push(captura.CORRELATIVO);
            array.push(captura.CAPTURA);
            array.push(captura.TR);

            capturasConProtocolo.push(array); // Agregar el array al resultado final
        });

        let query1 = "INSERT INTO Protocolo_Capturas (Id_Protocolo, Capitulo, Subcapitulo, Correlativo, Descripcion, Id_TipoRespuesta) VALUES ";
        const values1 = [];
        capturasConProtocolo.forEach((captura, index) => {
            query1 += "(?,?,?,?,?,?)";
            values1.push(...captura);
            if (index !== capturasConProtocolo.length - 1) {
                query1 += ",";
            }
        });

        await pool.query(query1, values1);

        res.json({message: 'Protocolo creado'});        
    } catch (err) {
        
    }
});


module.exports = router;