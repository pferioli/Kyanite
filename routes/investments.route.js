const express = require("express");
const router = express.Router();

const investmentsController = require('../controllers/investments.controller');

router.get("/", function (req, res, next) {
    res.render("investments/index.ejs", { menu: investmentsController.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/investments/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", function (req, res, next) {
    investmentsController.listAll(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    investmentsController.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    investmentsController.addNew(req, res);
});

router.post("/accredit", function (req, res, next) {
    investmentsController.accredit(req, res);
});

module.exports = router