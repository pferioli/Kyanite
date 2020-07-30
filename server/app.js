const express = require("express");
const path = require("path");
const createError = require("http-errors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const favicon = require("serve-favicon");
const MySQLStore = require("express-mysql-session")(session);
const LocalStrategy = require("passport-local").Strategy;

const bcrypt = require("bcrypt");

// // Create a Winston logger that streams to Stackdriver Logging.
// const winston = require("winston");
// const { LoggingWinston } = require("@google-cloud/logging-winston");
// const loggingWinston = new LoggingWinston();
// const logger = winston.createLogger({
//   level: "info",
//   transports: [new winston.transports.Console(), loggingWinston],
// });

let db_settings = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
};

if (process.env.NODE_ENV === "production") {
  const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";

  db_settings.socketPath = `${dbSocketPath}/${process.env.INSTANCE_CONNECTION_NAME}`;
}

var app = express();

app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// view engine setup
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    store: new MySQLStore(db_settings),
    key: "session_cookie_name",
    secret: "session_cookie_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//var mysql = require("./lib/db")(db_settings);

const mysql = require("mysql");

let connection = mysql.createConnection(db_settings);

connection.connect(function (error) {
  if (!!error) {
    console.log(error);
  } else {
    console.log(`Connected to ${db_settings.database} db:)`);
  }
});

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
  connection.query("select * from usuario where id = ?", [id], function (
    err,
    user
  ) {
    done(err, user[0]);
  });
});

// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use(
  "local-login",
  new LocalStrategy(
    {
      // by default, local strategy uses username and password, we will override with email
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true, // allows us to pass back the entire request to the callback
      failureFlash: true,
      successFlash: "Hey, Welcome back",
    },
    function (req, email, password, done) {
      // callback with email and password from our form

      connection.query(
        "select * from usuario where email = ?",
        [email],
        function (err, rows) {
          if (err) return done(err);
          if (!rows.length) {
            return done(
              null,
              false,
              req.flash(
                "error",
                "No se encontró el usuario en la base de datos"
              )
            ); // req.flash is the way to set flashdata using connect-flash
          }

          bcrypt.compare(password, rows[0].clave, function (err, result) {
            if (err) return done(err);

            if (result === false) {
              // if the user is found but the password is wrong
              return done(
                null,
                false,
                req.flash("error", "La contraseña ingresada es incorrecta")
              ); // create the loginMessage and save it to session as flashdata
            } else {
              return done(null, rows[0]); // all is well, return successful user
            }
          });
        }
      );
    }
  )
);

app.use(function (req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.get("/", isAuthenticated, function (req, res, next) {
  res.render("home.ejs", { menu: 'home', user: req.user });
});

app.get("/login", function (req, res) {
  res.render("login");
});

var upload = require('./routes/google.upload.route')
app.use('/upload', upload)

app.post(
  "/login",
  passport.authenticate("local-login", {
    session: true,
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res, info) {
    res.render("login/index");
  }
);

app.get("/clients", isAuthenticated, function (req, res, next) {
  connection.query(
    "select * from vcliente order by razon_social asc",
    function (err, rows) {
      if (err) {
        console.error(err);
      } else {
        res.render("clients/index.ejs", {
          user: req.user,
          data: { rows },
        });
      }
    }
  );
});

app.get("/clients/new", isAuthenticated, function (req, res, next) {
  connection.query(
    "select descripcion from categoria_impositiva where activo = 1",
    function (err, rows) {
      if (err) {
        console.error(err);
      } else {
        res.render("clients/add.ejs", {
          user: req.user,
          categories: { rows },
        });
      }
    }
  );
});

app.get("/clients/info/:id", isAuthenticated, function (req, res, next) {
  const id = req.params.id;
  connection.query("select * from vcliente where id = ?", [id], function (
    err,
    rows
  ) {
    if (err) {
      console.error(err);
    } else {
      res.render("clients/info.ejs", {
        user: req.user,
        information: rows[0],
      });
    }
  });
});

app.get("/incomes", isAuthenticated, function (req, res, next) {
  res.render("incomes/index.ejs", { menu: 'incomes', user: req.user });
});

app.post("/bcrypt", function (req, res) {
  bcrypt.hash(req.body.password, 10, function (err, hash) {
    res.send(`hash: ${hash}`);
  });
});

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
