const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');
const clients = require('../controllers/clients.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clients.listAll(req, res);
});

router.get("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clients.addNew(req, res);
});

router.get("/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clients.getInfo(req, res);
});

module.exports = router;
