process.stdout.setEncoding('utf8');
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const passport = require('passport');
const {database} = require('./keys.js');
const cors = require('cors');

require('./routes/cronJobs');
require('./routes/cronJobs1');

//Inicializar app
const app = express();
require('./lib/passport');

//Configuraciones
app.set('port', 3000 || 3001 || 4000 || 4001);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));

app.set('view engine', '.hbs');

app.use(express.static(path.join(__dirname, 'views', 'js')));


//Middelwares
app.use(cors());
app.use(session({
    secret: 'sapma',
    resave: true,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));

app.use((req, res, next) => {
  const now = Date.now();
  const maxIdleTime = 20 * 60 * 1000; // 20 minutos en milisegundos
  if (req.session.lastActive && now - req.session.lastActive > maxIdleTime) {
    req.session.destroy(() => {
      res.redirect('/');
    });
  } else {
    req.session.lastActive = now;
    next();
  }
 });

app.use(flash());
app.use(morgan('dev'));
// app.use(express.urlencoded({extended: false, parameterLimit: 100000}));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

//Variables globales
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});

//Rutas
app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use(require('./routes/protocolos'));
app.use(require('./routes/aprobaciones'));
app.use(require('./routes/rechazos'));
app.use(require('./routes/reportes'));
app.use(require('./routes/pdfs'));
app.use(require('./routes/equipos'));
app.use(require('./routes/anulaciones'));
app.use(require('./routes/admin'));
app.use(require('./routes/adminprot'));
app.use(require('./routes/planificacion'));

//Archivos publicos
app.use(express.static(path.join(__dirname, 'public')));

//Inicio de servidor
app.listen(app.get('port'), () => {
    console.log('Servidor en línea. Puerto:', app.get('port'));
});



