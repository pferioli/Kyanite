const express = require("express");
const router = express.Router();

const unidentifiedDepositsController = require('../controllers/unidentifiedDeposits.controller');

//<<<<<------ UNIDENTIFIED DEPOSITS (DNI) ------>>>>>//

router.get("/", function (req, res, next) {
    res.render("incomes/unidentifiedDeposits/index.ejs", { menu: unidentifiedDepositsController.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/incomes/unidentifiedDeposits/client/" + clientId);
});

router.get("/client/:clientId", function (req, res, next) {
    unidentifiedDepositsController.listAll(req, res);
});

router.get("/identify/:depositId", function (req, res, next) {
    unidentifiedDepositsController.showIdentifyDepositForm(req, res);
});

router.post("/identify/:depositId", function (req, res, next) {
    unidentifiedDepositsController.identifyDeposit(req, res);
});

module.exports = router