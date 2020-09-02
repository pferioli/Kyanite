const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const paymentReceiptsController = require('../controllers/paymentReceipts.controller');


router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('expenses/bills/index');
});

router.post("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

router.get("/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
});

router.get('/new/:id', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.showNewForm(req, res);
})

router.post('/new/:id', connectEnsureLogin.ensureLoggedIn(), [paymentReceiptsController.gcs.multer.single('attachment')],
    function (req, res, next) {
        paymentReceiptsController.addNew(req, res, next);
    },

);

router.get("/types", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.receiptTypes(req, res);
});

router.get("/types/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.receiptTypesByID(req, res);

});

router.get("/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

module.exports = router;
