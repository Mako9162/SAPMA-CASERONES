const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');
const crypto = require('crypto');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'Login',
    passwordField: 'Clave',
    passReqToCallback: true
}, async (req, Login, Clave, done) => {    
    const rows = await pool.query('SELECT * FROM Usuarios WHERE Login = ? AND Activo = 1 AND Id_Perfil NOT LIKE "%3%"', [Login]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchClave(Clave, user.Clave);
        if (validPassword) {
            done(null, user, req.flash('success', 'Bienvenido ' + user.Login));
        } else {
            done(null, false, req.flash('message', 'Usuario o contraseña Incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'Usuario o contraseña Incorrecta'));
    }
}));

function generateValidationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

async function checkUniqueValidationCode(code) {
    const rows = await pool.query('SELECT * FROM Usuarios WHERE PassValidacion = ?', [code]);
    return rows.length === 0;
}

async function createUser(newUser) {
    newUser.Clave = await helpers.encryptPassword(newUser.Clave);

    let validationCode;
    do {
        validationCode = generateValidationCode();
    } while (!(await checkUniqueValidationCode(validationCode)));

    newUser.PassValidacion = validationCode;

    const result = await pool.query('INSERT INTO Usuarios SET ?', [newUser]);
    newUser.Id = result.insertId;
    return newUser;
}

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

    const pass1 = await pool.query("SELECT PassValidacion FROM Usuarios WHERE Id= ?", [createdUser.Id]);
    const passVal1 = pass1[0].PassValidacion;

    return done(null, { 
        userId: createdUser.Id,
        userPerfil: createdUser.Id_Perfil,
        userPass1: passVal1
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.Id);
});

passport.deserializeUser(async ( Id, done) => {
    const rows = await pool.query('SELECT U.Id, U.Login, U.Clave, U.Id_Cliente, U.Id_Perfil, U.Email, U.Descripcion AS usuario, C.Descripcion, P.Descripcion AS Perfil FROM Usuarios U INNER JOIN Clientes C ON U.Id_Cliente = C.Id INNER JOIN Perfiles P ON P.Id = U.Id_Perfil WHERE U.Id = ?', [Id]);
    done(null, rows[0]);
});