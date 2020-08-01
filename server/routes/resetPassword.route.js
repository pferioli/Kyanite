const express = require("express");
const router = express.Router();
const passwordManager = require('../controllers/resetPassword.controller');

router.get("/forgot", function (req, res) {
    res.render("forgotPassword.ejs");
});

router.post("/forgot", function (req, res) {
    passwordManager.encodeJWT(req, res);
});

router.get('/reset/:id/:token', function (req, res) {
    passwordManager.decodeJWT(req, res);
});

router.post("/reset", function (req, res) {
    passwordManager.change(req, res);
});

module.exports = router