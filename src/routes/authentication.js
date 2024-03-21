const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn} = require('../lib/auth');
const { authRole} = require('../lib/rol');
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
});

router.post('/users/add',isLoggedIn, authRole(['Plan', 'Admincli']), (req, res, next) => {
  passport.authenticate('local.signup', (err, user, info) => {

    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json({ error: 'Error al crear usuario' });
    }
    const userId = user.userId; 
    const userPerfil = user.userPerfil;
    const userPass1= user.userPass1;
    // obtener el Id_Perfil desde el objeto user
    res.json({ 
      userId: userId,
      userPerfil: userPerfil,
      userPass1: userPass1
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