const cron = require("cron");
const pool = require("../database");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path"); ;
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

const job = new cron.CronJob("0 0 0 * * *", function(req, res) {
    pool.query(
        "SELECT\n" +
        "	VT.Val_tarea_id AS Tarea,\n" +
        "	DATE_FORMAT(VT.Val_fechaval_ins, '%d-%m-%Y') AS Fecha,\n" +
        "	TC.clienteId AS Cliente\n" +
        "FROM\n" +
        "	Validacion_Tareas VT\n" +
        "	INNER JOIN VIEW_tareaCliente TC ON TC.tareaId = VT.Val_tarea_id\n" +
        "WHERE\n" +
        "	DATE(VT.Val_fechaval_ins)  = DATE_SUB( CURRENT_DATE(), INTERVAL 5 DAY )\n" +
        "AND VT.Val_id_estado = 5;",
        async (err, result, fields) => {
        if (!result.length){
            console.log("No hay tareas pendientes de validación");
        }else{
            const resultado = Object.values(result);
            const Id_Cliente = resultado[0].Cliente;
            const fechaq = resultado[0].Fecha;
            const date = fechaq.replace(/-/g, '/');
            var date1 = new Date().toLocaleDateString('en-GB');
            const tareas = resultado.map(function(result) {
                return result.Tarea;
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
              "						T.Id IN ( "+tareas+" ) \n" +
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
              
  
              const filePathName1 = path.resolve(__dirname, "../views/email/noti5.hbs"); 
              const mensaje = fs.readFileSync(filePathName1, "utf8");
    
              // Compilar la plantilla con Handlebars y proporcionar la fecha como una variable
              const template = hbs.compile(mensaje);
              const context = {
                date, 
                date1
              };
              const html = template(context);
    
              await transporter.sendMail({
                from: "SAPMA <sapmadand@sercoing.cl>",
                to: arremail, 
                cc: [arremailp, arremailgen],
                bcc: correo,
                subject: "SAPMA - Aprobación de Tareas - RECORDATORIO",
                html,
                attachments: [
                  {
                    filename: "imagen1.png",
                    path: "./src/public/img/imagen1.png",
                    cid: "imagen1",
                  },
                ],
              });  

        }        
    });
}); 

job.start();
