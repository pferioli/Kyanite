const express = require("express");
const router = express.Router();

const receiptsIssuanceController = require('../controllers/receiptsIssuance.controller');

router.get("/", function (req, res, next) {
    res.render("incomes/receiptsIssuance/index.ejs", { menu: receiptsIssuanceController.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {
    res.redirect("/incomes/receiptsIssuance/client/" + req.body.clientId + '?periodId=' + req.body.periodId);
});

router.get("/client/:clientId", function (req, res, next) {
    receiptsIssuanceController.listAll(req, res);
});

router.post("/printReceipts", function (req, res, next) {
    receiptsIssuanceController.printReceipts(req, res);
});

module.exports = router