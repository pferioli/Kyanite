const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const billingPeriodsController = require('../controllers/billingPeriods.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('billingPeriods/index');
});

router.post("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    billingPeriodsController.listAll(req, res);
});

router.get("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('billingPeriods/add');
});

router.post("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
});

module.exports = router;
