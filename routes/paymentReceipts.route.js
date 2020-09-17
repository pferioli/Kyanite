const express = require("express");
const router = express.Router();

const paymentReceiptsController = require('../controllers/paymentReceipts.controller');

router.get("/", function (req, res, next) {
    res.render('expenses/bills/index');
});

router.post("/", function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

router.get("/info/:clientId", function (req, res, next) {
});

router.get('/new/:clientId', function (req, res, next) {
    paymentReceiptsController.showNewForm(req, res);
})

router.post('/new/:clientId', [paymentReceiptsController.gcs.multer.single('attachment')],
    function (req, res, next) {
        paymentReceiptsController.addNew(req, res, next);
    },
);

router.get("/types", function (req, res, next) {
    paymentReceiptsController.receiptTypes(req, res);
});

router.get("/types/:id", function (req, res, next) {
    paymentReceiptsController.receiptTypesByID(req, res);

});

router.get("/:clientId", function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

module.exports = router;
