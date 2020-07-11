const express = require("express");
const path = require("path");
const logger = require("morgan");
const createError = require("http-errors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser')
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);
const LocalStrategy = require('passport-local').Strategy

var bcrypt = require('bcrypt');

const flash = require("express-flash");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.use(logger("develepment"));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser());

app.use(session({
  store: new MySQLStore(
    {
      "user": "root",
      "password": "root",
      "database": "sessions",
      "host": "34.95.177.222",
      "port": 3306,
    }),
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 },
}))

app.use(passport.initialize())
app.use(passport.session())

var mysql = require("./lib/db");

// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  done(null, user.ID);
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  mysql.connection.query("SELECT * FROM USUARIOS WHERE ID = " + id,
    function (err, user) {
      done(err, user[0]);
    });
});

// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use('local-login', new LocalStrategy({
  // by default, local strategy uses username and password, we will override with email
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,// allows us to pass back the entire request to the callback
  failureFlash: true,
  successFlash: "Hey, Welcome back",
},
  function (req, email, password, done) { // callback with email and password from our form

    mysql.connection.query("SELECT * FROM USUARIOS WHERE EMAIL = ?", [email], function (err, rows) {
      if (err)
        return done(err);
      if (!rows.length) {
        return done(null, false, req.flash('error', 'No se encontró el usuario en la base de datos')); // req.flash is the way to set flashdata using connect-flash
      }

      bcrypt.compare(password, rows[0].CLAVE, function (err, result) {
        if (err)
          return done(err);

        if (result === false) {
          // if the user is found but the password is wrong
          return done(null, false, req.flash('error', 'La contraseña ingresada es incorrecta')); // create the loginMessage and save it to session as flashdata
        } else {
          return done(null, rows[0]);   // all is well, return successful user
        }
      });
    });
  }
));

app.use(function (req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.get("/", isAuthenticated, function (req, res, next) {
  res.render('home.ejs', { user: req.user });
});

app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.post("/login", passport.authenticate('local-login', { session: true, successRedirect: '/', failureRedirect: '/login', failureFlash: true }),
  function (req, res, info) {
    res.render('login/index');
  });

const clientsRouter = require("./routes/clients.route");
app.use("/clients", isAuthenticated, clientsRouter);


app.post("/bcrypt", function (req, res) { bcrypt.hash(req.body.password, 10, function (err, hash) { res.send(`hash: ${hash}`); }); });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
