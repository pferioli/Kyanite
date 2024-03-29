const express = require("express");
const router = express.Router();

const paymentReceiptsController = require('../controllers/paymentReceipts.controller');

router.get("/", function (req, res, next) {
    res.render('expenses/paymentReceipts/index');
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/expenses/paymentReceipts/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.refresh) redirectUrl = redirectUrl + '&refresh=' + req.query.refresh;
    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get('/client/:clientId', function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

router.get('/client/:clientId/new', function (req, res, next) {
    paymentReceiptsController.showNewForm(req, res);
});

router.post('/client/:clientId/new', [paymentReceiptsController.gcs.multer.single('attachment')],
    function (req, res, next) {
        paymentReceiptsController.addNew(req, res, next);
    });

router.get('/info/:receiptId', function (req, res, next) {
    paymentReceiptsController.info(req, res);
});

router.get('/edit/:receiptId', function (req, res, next) {
    paymentReceiptsController.showEditForm(req, res);
});

router.post('/edit/:receiptId', [paymentReceiptsController.gcs.multer.single('attachment')],
    function (req, res, next) {
        paymentReceiptsController.edit(req, res, next);
    });

router.post('/delete', function (req, res, next) {
    paymentReceiptsController.delete(req, res, next);
});

router.get("/client/:clientId/createPaymentOrder/:receiptId", function (req, res, next) {
    paymentReceiptsController.showNewPOForm(req, res);
});

router.post("/client/:clientId/createPaymentOrder/:receiptId", function (req, res, next) {
    paymentReceiptsController.createPO(req, res)
});

//AJAX Calls

router.get("/ajax/types", function (req, res, next) {
    paymentReceiptsController.receiptTypes(req, res);
});

router.get("/ajax/types/:id", function (req, res, next) {
    paymentReceiptsController.receiptTypesByID(req, res);
});

router.get("/ajax/getPaymentReceiptById/:paymentReceipt", function (req, res, next) {
    paymentReceiptsController.getPaymentReceiptById(req, res);
});

router.post("/ajax/checkPaymentReceiptExists", function (req, res, next) {
    paymentReceiptsController.checkPaymentReceiptExists(req, res);
});

router.get("/ajax/pending/getSuppliersList/:clientId", function (req, res, next) {
    paymentReceiptsController.getPendingSuppliersList(req, res);
});

router.get("/ajax/pending/client/:clientId/bySupplierId/:supplierId", function (req, res, next) {
    paymentReceiptsController.pendingBySupplierId(req, res);
});

router.get("/ajax/pending/client/:clientId/billingPeriods", function (req, res, next) {
    paymentReceiptsController.listBillingPeriodsWithPendingPaymentReceipts(req, res);
});

module.exports = router;
