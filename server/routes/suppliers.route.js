const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const suppliersController = require('../controllers/suppliers.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.listAll(req, res);
});

router.get("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.showNewForm(req, res);
});

router.post('/new', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.addNew(req, res);
})

router.post('/delete', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.delete(req, res);
})

router.post("/categories", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.newCategory(req, res);
});

router.post("/categories/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.newCategory(req, res);
});

router.post("/categories/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.newCategory(req, res);
});

router.get("/info/raw/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.findSupplierById(req, res);
});

router.get("/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.info(req, res);
});

router.post("/edit/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.edit(req, res);
});

router.get("/edit/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
  suppliersController.showEditForm(req, res);
});

module.exports = router;
