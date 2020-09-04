const express = require("express");
const router = express.Router();

const passwordManagerController = require('../controllers/resetPassword.controller');

router.get("/forgot", function (req, res) {
    res.render("login/password/forgot.ejs");
});

router.post("/forgot", function (req, res) {
    passwordManagerController.encodeJWT(req, res);
});

router.get('/reset/:id/:token', function (req, res) {
    passwordManagerController.decodeJWT(req, res);
});

router.post("/reset/:id/:token", function (req, res) {
    passwordManagerController.change(req, res);
});

module.exports = router