const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'Login',
    passwordField: 'Clave',
    passReqToCallback: true
}, async (req, Login, Clave, done) => {    
    const rows = await pool.query('SELECT * FROM Usuarios WHERE Login = ? AND Activo = 1', [Login]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchClave(Clave, user.Clave);
        if (validPassword) {
            done(null, user, req.flash('success', 'Bienvenido ' + user.Login));
        } else {
            done(null, false, req.flash('message', 'Contraseña Incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'El Usuario No Existe'));
    }
}));

// Creamos una función que se encargará de insertar el nuevo usuario en la base de datos
async function createUser(newUser) {
    newUser.Clave = await helpers.encryptPassword(newUser.Clave);
    const result = await pool.query('INSERT INTO Usuarios SET ?', [newUser]);
    newUser.Id = result.insertId;
    return newUser;
  }
  
  // Creamos una estrategia de autenticación que utiliza la función createUser()
passport.use('local.signup', new LocalStrategy({
        usernameField: 'Login',
        passwordField: 'Clave',
        passReqToCallback: true
    }, async (req, Login, Clave, done) => {
        const {Descripcion, Email, Telefono, Id_Perfil, Id_Cliente} = req.body;
        const newUser = {
        Login,
        Clave,
        Descripcion,
        Email,
        Telefono,
        Id_Perfil,
        Id_Cliente,
        Activo : 1
        };
        const createdUser = await createUser(newUser);

        return done(null, { 
            userId: createdUser.Id,
            userPerfil: createdUser.Id_Perfil
         });
    }));

  


passport.serializeUser((user, done) => {
    done(null, user.Id);
});

passport.deserializeUser(async ( Id, done) => {
    const rows = await pool.query('SELECT U.Id, U.Login, U.Clave, U.Id_Cliente, U.Id_Perfil, U.Email, U.Descripcion AS usuario, C.Descripcion, P.Descripcion AS Perfil FROM Usuarios U INNER JOIN Clientes C ON U.Id_Cliente = C.Id INNER JOIN Perfiles P ON P.Id = U.Id_Perfil WHERE U.Id = ?', [Id]);
    done(null, rows[0]);
});