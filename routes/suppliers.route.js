const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const suppliersController = require('../controllers/suppliers.controller');

router.get("/", function (req, res, next) {
  suppliersController.listAll(req, res);
});

router.get("/new", function (req, res, next) {
  suppliersController.showNewForm(req, res);
});

router.post('/new', function (req, res, next) {
  suppliersController.addNew(req, res);
})

router.post('/delete', function (req, res, next) {
  suppliersController.delete(req, res);
})

router.post("/categories", function (req, res, next) {
  suppliersController.newCategory(req, res);
});

router.post("/categories/new", function (req, res, next) {
  suppliersController.newCategory(req, res);
});

router.post("/categories/:id", function (req, res, next) {
  suppliersController.newCategory(req, res);
});

router.get("/info/raw/:id", function (req, res, next) {
  suppliersController.findSupplierById(req, res);
});

router.get("/info/:id", function (req, res, next) {
  suppliersController.info(req, res);
});

router.post("/edit/:id", function (req, res, next) {
  suppliersController.edit(req, res);
});

router.get("/edit/:id", function (req, res, next) {
  suppliersController.showEditForm(req, res);
});

module.exports = router;
