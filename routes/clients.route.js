const express = require("express");
const router = express.Router();

const clientsController = require('../controllers/clients.controller');

router.get("/populate", function (req, res, next) {
  clientsController.populateClients(req, res);
});

router.get("/", function (req, res, next) {
  clientsController.listAll(req, res);
});

router.get("/new", function (req, res, next) {
  clientsController.showNewForm(req, res);
});

router.post('/new', function (req, res, next) {
  clientsController.addNew(req, res);
})

router.post('/delete', function (req, res, next) {
  clientsController.delete(req, res);
})

router.post('/undelete', function (req, res, next) {
  clientsController.undelete(req, res);
})

router.get("/info/:id", function (req, res, next) {
  clientsController.info(req, res);
});

router.post("/edit/:id", function (req, res, next) {
  clientsController.edit(req, res);
});

router.get("/edit/:id", function (req, res, next) {
  clientsController.showEditForm(req, res);
});

module.exports = router;
