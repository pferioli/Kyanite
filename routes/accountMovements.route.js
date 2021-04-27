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
        redirectUrl += "&accountId=" + accountsIds
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

router.get("/fixBalance", async function (req, res, next) {
    const clientId = req.query.clientId;
    const periodId = req.query.periodId;
    const accountId = req.query.accountId;

    const totalBalance = await accountMovementsController.fixBalanceMovements(clientId, periodId, accountId);

    res.send({ totalBalance: totalBalance });
})
module.exports = router;
