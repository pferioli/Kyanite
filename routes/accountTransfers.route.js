const express = require("express");
const router = express.Router();

const accountTransfersController = require('../controllers/accountTransfers.controller');

router.get("/", function (req, res, next) {
    res.render('transfers/index', { menu: accountTransfersController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/transfers/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get("/new/:clientId", function (req, res, next) {
    accountTransfersController.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    accountTransfersController.addNew(req, res);
});

router.get("/edit/:clientId/:transferId", function (req, res, next) {
    accountTransfersController.showEditForm(req, res);
});

router.get("/info/:clientId/:transferId", function (req, res, next) {
    accountTransfersController.info(req, res);
});

router.get("/print/:clientId/:transferId", function (req, res, next) {
    accountTransfersController.printReceipt(req, res);
});

router.post("/edit/:transferId", function (req, res, next) {
    accountTransfersController.edit(req, res);
});

router.post('/delete', function (req, res, next) {
    accountTransfersController.delete(req, res);
})

router.get("/client/:clientId", function (req, res, next) {
    accountTransfersController.listAll(req, res);
});

module.exports = router;
