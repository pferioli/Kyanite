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

const winston = require('./helpers/winston.helper');
const passport = require('./helpers/passport.helper');

const dotenv = require("dotenv").config();

//---------------------------------------------------------------------------//

var app = express();

app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// view engine setup
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(morgan('combined', { stream: winston.stream.write }));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pjson = require('./package.json')

winston.info(`welcome to kyanite, starting app in ${process.env.NODE_ENV} environment, version is ${pjson.version}`);

//---------------------------------------------------------------------------//
//---------------------------------------------------------------------------//

require('@google-cloud/debug-agent').start({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  serviceContext: {
    service: pjson.name,
    version: pjson.version,
    enableCanary: true,
  }
});

//---------------------------------------------------------------------------//

let sequelizeConfig = require('./config/config.json')[process.env.NODE_ENV];

let mySQLStoreConfig = {
  user: sequelizeConfig.username,
  password: sequelizeConfig.password,
  database: sequelizeConfig.database
}

if (process.env.NODE_ENV == 'production') {
  mySQLStoreConfig.socketPath = sequelizeConfig.dialectOptions.socketPath;
}
else {
  mySQLStoreConfig.port = sequelizeConfig.port;
  mySQLStoreConfig.host = sequelizeConfig.host;
}

app.use(
  session({
    store: new MySQLStore(mySQLStoreConfig),
    key: "session_cookie_kyanite",
    secret: "secret4kyanite",
    resave: true,
    saveUninitialized: false,
    trustProxy: true,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: (480 * 60 * 1000)
    },
  })
);
app.use(flash());

passport(app);  //set passport strategy

app.use(function (req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.warning = req.flash("warning");
  res.locals.success = req.flash("success");
  res.locals.metadata = req.flash("metadata");
  res.locals.user = req.user;
  next();
});

//---------------------------------------------------------------------------//
// ROUTES
//---------------------------------------------------------------------------//

app.use('/auth', require('./routes/auth.route'));

//--- from here, all routes require an authenticated user...

const connectEnsureLogin = require('connect-ensure-login');

app.use(connectEnsureLogin.ensureLoggedIn('/auth/login'));

function ensureSecondFactor(req, res, next) {
  if (req.session.secondFactor === 'totp' || req.session.secondFactor === 'disabled') { return next(); }
  res.redirect('/auth/login/verify');
}

app.use(ensureSecondFactor);

// secured routes...

app.get("/", function (req, res, next) {
  res.render("dashboard.ejs", { menu: 'home' });
});

app.use('/clients', require('./routes/clients.route'));

app.use('/suppliers', require('./routes/suppliers.route'));

app.use('/homeOwners', require('./routes/homeOwners.route'));

app.use('/periods', require('./routes/billingPeriods.route'));

app.use('/incomes', require('./routes/incomes.route'));

app.use('/expenses/paymentReceipts', require('./routes/paymentReceipts.route'));

app.use('/notifications', require('./routes/notifications.route'));

app.use('/accountingImputations', require('./routes/accountingImputations.route'));

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

//---------------------------------------------------------------------------//
// CUBE.JS
//---------------------------------------------------------------------------//

// const CubejsServerCore = require('@cubejs-backend/server-core');

// const dbType = 'mysql';

// const options = {
//   dbType,
//   devServer: false,
//   logger: (msg, params) => {
//     console.log(`${msg}: ${JSON.stringify(params)}`);
//   },
//   schemaPath: 'schema'
// };

// const core = CubejsServerCore.create(options);

// core.initApp(app);

module.exports = app;
