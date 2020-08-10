const express = require("express");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const favicon = require("serve-favicon");
const morgan = require('morgan');
const MySQLStore = require("express-mysql-session")(session);

//---------------------------------------------------------------------------//

const mysql = require("./lib/db");
const winston = require('./helpers/winston.helper');
const passport = require('./helpers/passport.helper');

//---------------------------------------------------------------------------//

var app = express();

app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// view engine setup
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(morgan('combined', { stream: winston.stream }));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    store: new MySQLStore(mysql.settings),
    key: "session_cookie_name",
    secret: "session_cookie_secret",
    resave: false,
    saveUninitialized: false,
    trustProxy: true,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: (60 * 1000 * 30)
    },
  })
);

app.use(flash());

passport(app);  //set passport strategy

app.use(function (req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.user = req.user;
  next();
});

app.use('/', require('./routes/home.route'));

app.use('/login', require('./routes/login.route'));

app.use('/logout', require('./routes/logout.route'));

app.use('/logout', require('./routes/logout.route'));

app.use('/password', require('./routes/resetPassword.route'));

app.use('/clients', require('./routes/clients.route'));

app.use('/incomes', require('./routes/incomes.route'));

app.use('/upload', require('./routes/google.upload.route'));

app.use('/sse', require('./routes/serverSentEvents.route'));



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

const scheduledTasks = require('./helpers/scheduledTasks.helper');

module.exports = app;
