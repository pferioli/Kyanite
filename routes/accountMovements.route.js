const express = require("express");
const router = express.Router();

const accountMovementsController = require('../controllers/accountMovements.controller');

router.get("/", function (req, res, next) {
    res.render('accountMovements/index', { menu: accountMovementsController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {

    const accountsIds = req.body.accountId;

    let redirectUrl = `/movements/client/${req.body.clientId}?periodId=${req.body.periodId}`;

    if (accountsIds != undefined) {
        redirectUrl += "?accountId=" + accountsIds
    }

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", function (req, res, next) {
    accountMovementsController.listAll(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    accountMovementsController.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    accountMovementsController.addNew(req, res);
});

// AJAX CAlls

router.get("/ajax/calculateMonthlyBalance", async function (req, res, next) {
    const clientId = req.body.clientId || 1;
    const periodId = req.body.periodId || 155;

    const balance = await accountMovementsController.calculateMonthlyBalance(clientId, periodId);

    res.send(balance);
});

module.exports = router;
