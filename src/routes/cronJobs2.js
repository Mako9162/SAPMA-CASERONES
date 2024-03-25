const cron = require('cron');
const fs = require('fs');
const path = require('path');

const tareaCron = new cron.CronJob('0 21 * * *', () => {

    const carpeta1 = path.resolve(__dirname, "../pdf");
    const carpeta2 = path.resolve(__dirname, "../zip");
    // const carpeta3 = path.resolve(__dirname, "../images");

    function borrarArchivosCarpeta(carpeta) {
        fs.readdir(carpeta, (err, archivos) => {
            if (err) {
                console.error(`Error al leer la carpeta ${carpeta}: ${err}`);
                return;
            }
            archivos.forEach(archivo => {
                const rutaArchivo = path.join(carpeta, archivo);
                fs.unlink(rutaArchivo, err => {
                    if (err) {
                        console.error(`Error al borrar ${rutaArchivo}: ${err}`);
                        return;
                    }
                    console.log(`Se borró ${rutaArchivo}`);
                });
            });
        });
    }

    borrarArchivosCarpeta(carpeta1);
    borrarArchivosCarpeta(carpeta2);
    // borrarArchivosCarpeta(carpeta3);
    
}, null, true, 'UTC');

tareaCron.start();

