const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn} = require('../lib/auth');
const {roles, authRole} = require('../lib/rol');
const pool = require('../database');

router.get('/', isNotLoggedIn, (req, res) => {
    res.render('index');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local.signin', {
    successRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true
    })(req, res, next)
    ;
});

router.get('/users/add', isLoggedIn,  async (req, res) => {
    await pool.query('SELECT Id, Descripcion FROM Clientes', (err, result) => {
    res.render('users/nuevo', { clientes: result });
    });
     // const user = req.user.Id_Perfil;
    // console.log(user);
});

router.post('/users/add', (req, res, next) => {
  passport.authenticate('local.signup', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json({ error: 'Error al crear usuario' });
    }
    const userId = user.userId; 
    const userPerfil = user.userPerfil; // obtener el Id_Perfil desde el objeto user
    res.json({ 
      userId: userId,
      userPerfil: userPerfil // enviar el Id_Perfil en la respuesta JSON
    }); 
  })(req, res, next);
});

  

router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout(function(err) {
        if (err) { 
          return next(err); 
          }
        res.redirect('/');
      });
});

module.exports = router;