const express = require("express");
const router = express.Router();

const billingPeriodsController = require('../controllers/billingPeriods.controller');

router.get("/", function (req, res, next) {
    res.render('billingPeriods/index', { menu: billingPeriodsController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/periods/" + clientId);
});

router.get("/active/:clientId", function (req, res, next) {
    billingPeriodsController.getActive(req, res);
});

router.get("/byCustomer/:clientId", function (req, res, next) {
    billingPeriodsController.getAllByClientID(req, res);
});

router.get("/:clientId", function (req, res, next) {
    billingPeriodsController.listAll(req, res);
});

router.post("/new", function (req, res, next) {
    billingPeriodsController.create(req, res);
});

router.post("/close", function (req, res, next) {
    billingPeriodsController.close(req, res);
});

router.post("/open", function (req, res, next) {
    billingPeriodsController.open(req, res);
});

module.exports = router;
