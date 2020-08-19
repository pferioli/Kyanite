const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const paymentReceiptsController = require('../controllers/paymentReceipts.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
});

router.get("/paymentReceipts", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    res.render('expenses/bills/index');
});

router.get("/paymentReceipts/info/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
});

router.post('/paymentReceipts/new', connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
})

module.exports = router;
