const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const supplierssController = require('../controllers/suppliers.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.listAll(req, res);
});

router.get("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.showNewForm(req, res);
});

router.post('/new', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.addNew(req, res);
})

router.post("/categories", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.newCategory(req, res);
});

router.post("/categories/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.newCategory(req, res);
});

router.post("/categories/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.newCategory(req, res);
});

router.get("/info/raw/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.findSupplierById(req, res);
});

router.get("/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  supplierssController.getInfo(req, res);
});

module.exports = router;
