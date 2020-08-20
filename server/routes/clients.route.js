const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const clientsController = require('../controllers/clients.controller');

router.get("/populate", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clientsController.populateClients(req, res);
});


router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clientsController.listAll(req, res);
});

router.get("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clientsController.showNewForm(req, res);
});

router.get("/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clientsController.getInfo(req, res);
});

router.post('/new', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  clientsController.addNew(req, res);
})

module.exports = router;
