const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');
const home = require('../controllers/home.controller');

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    home.welcome(req, res);
});

module.exports = router

