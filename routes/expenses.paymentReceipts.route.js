const express = require("express");
const router = express.Router();

const paymentReceiptsController = require('../controllers/paymentReceipts.controller');

router.get("/", function (req, res, next) {
    res.render('expenses/bills/index');
});

router.post("/", function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

router.get('/client/:clientId/new', function (req, res, next) {
    paymentReceiptsController.showNewForm(req, res);
})

router.post('/client/:clientId/new', [paymentReceiptsController.gcs.multer.single('attachment')],
    function (req, res, next) {
        paymentReceiptsController.addNew(req, res, next);
    },
);

router.get("/createPaymentOrder/:receiptId", function (req, res, next) {
    paymentReceiptsController.showNewPOForm(req, res);
});

router.post("/createPaymentOrder/:receiptId", function (req, res, next) {
});

router.get("/info/:receiptId", function (req, res, next) {
});

router.get("/delete/:receiptId", function (req, res, next) {
});

router.get("/download/:receiptId", function (req, res, next) {
});

router.get("/client/:clientId", function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

//AJAX Calls

router.get("/ajax/types", function (req, res, next) {
    paymentReceiptsController.receiptTypes(req, res);
});

router.get("/ajax/types/:id", function (req, res, next) {
    paymentReceiptsController.receiptTypesByID(req, res);

});

router.get("/ajax/pending/getSuppliersList/:clientId", function (req, res, next) {
    paymentReceiptsController.getPendingSuppliersList(req, res);
});

router.get("/ajax/pending/client/:clientId/bySupplierId/:supplierId", function (req, res, next) {
    paymentReceiptsController.pendingBySupplierId(req, res);
});

module.exports = router;
