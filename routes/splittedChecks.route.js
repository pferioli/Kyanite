const express = require("express");
const router = express.Router();

const splittedChecksController = require('../controllers/splittedChecks.controller');

router.get("/", function (req, res, next) {
    res.render('checks/index', { menu: splittedChecksController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/checks/client/" + clientId);
});

router.get("/new/:checkId", function (req, res, next) {
    splittedChecksController.showNewForm(req, res);
});

router.post('/new/:checkId', function (req, res, next) {
    splittedChecksController.addNew(req, res);
})

router.get("/client/:checkId", function (req, res, next) {
    splittedChecksController.listAll(req, res);
});
module.exports = router;
