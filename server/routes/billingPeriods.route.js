const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const billingPeriodsController = require('../controllers/billingPeriods.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('billingPeriods/index', { menu: billingPeriodsController.CURRENT_MENU });
});

router.post("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/periods/" + clientId);
});

router.get("/active/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    billingPeriodsController.getActive(req, res);
});

router.get("/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    billingPeriodsController.listAll(req, res);
});

router.post("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    billingPeriodsController.create(req, res);
});

router.post("/close", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    billingPeriodsController.close(req, res);
});

router.post("/open", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    billingPeriodsController.open(req, res);
});

module.exports = router;
