const express = require("express");
const router = express.Router();

const fixedTermDeposits = require('../controllers/fixedTermDeposits.controller');

router.get("/", function (req, res, next) {
    res.render("fixedTermDeposits/index.ejs", { menu: fixedTermDeposits.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/fixedTermDeposits/client/" + clientId);
});

router.get("/client/:clientId", function (req, res, next) {
    fixedTermDeposits.listAll(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    fixedTermDeposits.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    fixedTermDeposits.addNew(req, res);
});

router.post("/accredit", function (req, res, next) {
    fixedTermDeposits.accredit(req, res);
});

module.exports = router