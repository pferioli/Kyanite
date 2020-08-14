const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');
const home = require('../controllers/home.controller');

function loggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}
//connectEnsureLogin.ensureLoggedIn()
router.get("/", loggedIn, function (req, res, next) {
    home.welcome(req, res);
});

module.exports = router

