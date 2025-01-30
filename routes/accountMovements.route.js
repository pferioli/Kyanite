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

router.post("/client/:clientId", function (req, res, next) {
    const clientId = req.params.clientId;
    const periodId = req.query.periodId;
    const showAll = req.query.showAll;
    res.redirect(`/movements/client/${clientId}?periodId=${periodId}&showAll=${showAll}`)
});

router.get("/client/:clientId/details/:movementId", function (req, res, next) {
    accountMovementsController.showDetails(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    accountMovementsController.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    accountMovementsController.addNew(req, res);
});

//REPORTS...

router.get("/client/:clientId/report", function (req, res, next) {
    accountMovementsController.createInvoice(req, res);
});

//https://kyanite-aaii.rj.r.appspot.com/movements/fixBalance?clientId=8&periodId=651&accountId=43

//https://kyanite-aaii.rj.r.appspot.com/movements/fixBalance?clientId=24&periodId=799&accountId=174

router.get("/fixBalance", async function (req, res, next) {
    const clientId = req.query.clientId;
    const periodId = req.query.periodId;
    const accountId = req.query.accountId;

    const totalBalance = await accountMovementsController.fixBalanceMovements(clientId, periodId, accountId);

    res.send({ totalBalance: totalBalance });
})


router.get("/fixMonthlyBalance", async function (req, res, next) {
    const clientId = req.query.clientId;
    const periodId = req.query.periodId;
    const accountId = req.query.accountId;

    const totalBalance = await accountMovementsController.fixBalanceMovements(clientId, periodId, accountId);

    res.send({ totalBalance: totalBalance });
})
module.exports = router;


/*

https://kyanite-aaii.rj.r.appspot.com/movements/fixBalance?clientId=9&periodId=905&accountId=52
https://kyanite-aaii.rj.r.appspot.com/movements/fixBalance?clientId=9&periodId=905&accountId=56
https://kyanite-aaii.rj.r.appspot.com/movements/fixBalance?clientId=9&periodId=905&accountId=57
https://kyanite-aaii.rj.r.appspot.com/movements/fixBalance?clientId=9&periodId=905&accountId=58

*/