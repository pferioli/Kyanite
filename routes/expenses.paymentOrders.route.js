const express = require("express");
const router = express.Router();

const paymentOrdersController = require('../controllers/paymentOrders.controller');

router.get("/", function (req, res, next) {
    res.render('expenses/paymentOrders/index');
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/expenses/paymentOrders/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.refresh) redirectUrl = redirectUrl + '&refresh=' + req.query.refresh;
    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get('/client/:clientId', function (req, res, next) {
    paymentOrdersController.listAll(req, res);
})

router.post('/delete', function (req, res, next) {
    paymentOrdersController.deletePO(req, res);
})

//REPORTS...

router.get("/client/:clientId/report", function (req, res, next) {
    paymentOrdersController.expensesReport(req, res);
});

router.get("/client/:clientId/report/download", function (req, res, next) {
    paymentOrdersController.downloadExpensesReport(req, res);
});

router.get("/client/:clientId/invoice/:paymentOrderId", function (req, res, next) {
    paymentOrdersController.createInvoice(req, res);
});

router.post("/printPaymentOrders", function (req, res, next) {
    paymentOrdersController.printPaymentOrders(req, res);
});

// AJAX CALLS

router.get('/ajax/calculateRemainingBalance/:receiptId', function (req, res, next) {
    paymentOrdersController.calculateRemainingBalance(req.params.receiptId)
        .then(balance => {
            res.send({ value: balance });
        })
        .catch(err => {
            res.sendStatus(500).send(err)
        })
})


module.exports = router;
