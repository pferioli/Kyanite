const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const paymentReceiptsController = require('../controllers/paymentReceipts.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
});

router.get("/paymentReceipts", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('expenses/bills/index');
});

router.post("/paymentReceipts", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.listAll(req, res);
});

router.get("/paymentReceipts/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
});

router.get('/paymentReceipts/new/:id', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.showNewForm(req, res);
})

router.post('/paymentReceipts/new', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
})

router.get("/paymentReceipts/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    paymentReceiptsController.listAll(req, res);

});

module.exports = router;
