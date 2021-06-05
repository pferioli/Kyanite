const express = require("express");
const router = express.Router();

const checksController = require('../controllers/checks.controller');
const splittedChecksController = require('../controllers/splittedChecks.controller');

router.get("/", function (req, res, next) {
    res.render('checks/index', { menu: checksController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/checks/client/" + clientId);
});

//SPLITTED CHECKS

router.get("/split/new/:checkId", function (req, res, next) {
    splittedChecksController.showNewForm(req, res);
});

router.post('/split/new/:checkId', function (req, res, next) {
    splittedChecksController.addNew(req, res);
})

router.get('/split/delete/:checkId', function (req, res, next) {
    splittedChecksController.delete(req, res);
})

router.get('/split/edit/:checkId', function (req, res, next) {
    splittedChecksController.showEditForm(req, res);
})

router.post('/split/edit/:checkId', function (req, res, next) {
    splittedChecksController.edit(req, res);
})

router.get("/split/:checkId", function (req, res, next) {
    splittedChecksController.listAll(req, res);
});

//CHECKS

router.get("/new/:clientId", function (req, res, next) {
    checksController.showNewForm(req, res);
});

router.post('/new/:clientId', function (req, res, next) {
    checksController.addNew(req, res);
});

router.post('/delete', function (req, res, next) {
    checksController.delete(req, res);
});

router.post('/status', function (req, res, next) {
    checksController.updateStatus(req, res);
});

router.get("/client/:clientId", function (req, res, next) {
    checksController.listAll(req, res);
});


//REPORTS...

router.get("/client/:clientId/report", function (req, res, next) {
    checksController.walletChecksReport(req, res);
});

//AJAX

router.get("/ajax/getBanks", function (req, res, next) {
    checksController.getBanks(req, res);
});

router.get("/split/ajax/getAvailableChecks/:id", function (req, res, next) {
    splittedChecksController.getSplittedChecks(req, res);
});

router.get("/split/ajax/info/:checkId", function (req, res, next) {
    splittedChecksController.getSplittedCheckById(req, res);
});

router.get("/split/ajax/remainingBalance/:checkId", function (req, res, next) {
    splittedChecksController.getRemainingBalance(req, res);
});

router.get("/split/ajax/getChecksByPaymentReceipt/:paymentReceiptId", function (req, res, next) {
    splittedChecksController.getSplittedCheckByPaymentReceiptId(req, res);
});
module.exports = router;
