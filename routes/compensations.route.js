const express = require("express");
const router = express.Router();

const compensations = require('../controllers/compensations.controller');

router.get("/", function (req, res, next) {
    res.render("compensations/index.ejs", { menu: compensations.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/compensations/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", function (req, res, next) {
    compensations.listAll(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    compensations.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    compensations.addNew(req, res);
});


module.exports = router