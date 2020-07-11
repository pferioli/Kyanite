const express = require("express");
const router = express.Router();

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

var mysql = require("../lib/db");

// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  mysql.connection.query("SELECT * FROM USUARIOS WHERE ID = " + id, function (err, rows) {
    done(err, rows[0]);
  });
});

// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use('local-login', new LocalStrategy({
  // by default, local strategy uses username and password, we will override with email
  usernameField: 'CORREO_ELECTRONICO',
  passwordField: 'CLAVE',
  passReqToCallback: true // allows us to pass back the entire request to the callback
},
  function (req, email, password, done) { // callback with email and password from our form

    mysql.connection.query("SELECT * FROM USUARIOS WHERE CORREO_ELECTRONICO = ?", [email], function (err, rows) {
      if (err)
        return done(err);
      if (!rows.length) {
        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
      }

      // if the user is found but the password is wrong
      if (!(rows[0].password == password))
        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

      // all is well, return successful user
      return done(null, rows[0]);

    });
  }));

router.get('/',
  function (req, res) {
    res.render('login');
  });

// router.post("/", passport.authenticate('local-login', {
//   successRedirect: '/welcome',
//   failureRedirect: '/login',
//   failureFlash: true
// }), function (req, res, info) {
//   res.render('login/index', { 'message': req.flash('message') });
// });

router.post("/", function (req, res, info) {
  res.render('login/index', { 'message': req.flash('message') });
});

// app.get('/logout',
//   function (req, res) {
//     req.logout();
//     res.redirect('/');
//   });

module.exports = router;
