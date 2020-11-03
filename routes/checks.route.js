const express = require("express");
const router = express.Router();

const checksController = require('../controllers/checks.controller');
const splittedChecksController = require('../controllers/splittedChecks.controller');

router.get("/", function (req, res, next) {
    res.render('checks/index', { menu: checksController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/checks/client/" + clientId);
});

router.get("/split/new/:checkId", function (req, res, next) {
    splittedChecksController.showNewForm(req, res);
});

router.get("/split/:checkId", function (req, res, next) {
    splittedChecksController.listAll(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    checksController.showNewForm(req, res);
});

router.post('/new/:clientId', function (req, res, next) {
    checksController.addNew(req, res);
})

router.get("/client/:clientId", function (req, res, next) {
    checksController.listAll(req, res);
});

module.exports = router;
