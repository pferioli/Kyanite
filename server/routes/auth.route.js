const express = require("express");
const router = express.Router();

const passport = require('../helpers/passport.helper');
const connectEnsureLogin = require('connect-ensure-login');

const User = require('../models').user;

const authController = require('../controllers/authcontroller');

//---------------------------------------------------------------------------//
// LOGIN & LOGOUT //
//---------------------------------------------------------------------------//

router.get("/login", connectEnsureLogin.ensureLoggedOut('/logout'), function (req, res) {
    res.render("login/login.ejs");
});

router.post("/login", passport.authenticate("local-login", {
    session: true,
    /*successRedirect: "/",*/
    failureRedirect: "/auth/login",
    failureFlash: true,
}), function (req, res) {

    // if (req.user.mustChange === true) {
    //     res.redirect('/password/forgot');
    // }

    if (req.user.enabled2FA === true) {
        res.redirect('/auth/login/verify'); return;
    }

    res.redirect('/');
});

router.get("/logout", function (req, res) {
    req.logout();
    res.render("login/logout.ejs");
});

//---------------------------------------------------------------------------//
// PASSWORD MANAGMENT //
//---------------------------------------------------------------------------//

router.post("/bcrypt", function (req, res) {
    authController.hashPassword(req, res);
});

router.get("/password/forgot", function (req, res) {
    res.render("login/password/forgot.ejs");
});

router.post("/password/forgot", function (req, res) {
    authController.encodeJWT(req, res);
});

router.get('/password/reset/:id/:token', function (req, res) {
    res.render('login/password/change', { userId: req.params.id });
});

router.post("/password/reset/:id/:token", function (req, res) {
    authController.decodeJWT(req, res);
});

//---------------------------------------------------------------------------//
// TWO-FACTOR AUTHENTICATION //
//---------------------------------------------------------------------------//

router.get('/setup2fa', connectEnsureLogin.ensureLoggedIn('/auth/login'), function (req, res) {
    authController.setup2fa(req, res)
});

router.get('/login/verify', connectEnsureLogin.ensureLoggedIn('/auth/login'), function (req, res) {
    res.render("login/password/verify.ejs")
});

router.post('/login/verify', connectEnsureLogin.ensureLoggedIn('/auth/login'), function (req, res) {
    authController.verify(req, res);
});

module.exports = router;