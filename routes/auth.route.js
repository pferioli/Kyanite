const express = require("express");
const router = express.Router();

const passport = require('../helpers/passport.helper');
const connectEnsureLogin = require('connect-ensure-login');

const authController = require('../controllers/auth.controller');

//---------------------------------------------------------------------------//
// LOGIN & LOGOUT //
//---------------------------------------------------------------------------//

router.get("/login", connectEnsureLogin.ensureLoggedOut('/auth/logout'), function (req, res) {
    res.render("login/login.ejs");
});

router.post("/login", passport.authenticate("local-login", {
    session: true,
    /*successRedirect: "/",*/
    failureRedirect: "/auth/login",
    failureFlash: true,
}), function (req, res) {
    if (req.user.secret) {
        res.redirect('/auth/login/verify'); return;
    }
    req.session.secondFactor = "disabled"
    res.redirect('/');
});

router.get("/logout", function (req, res) {
    req.session.secondFactor = undefined;   //to reset 2FA
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
    authController.setup2fa(req, res);
});

router.get('/login/verify', connectEnsureLogin.ensureLoggedIn('/auth/login'), function (req, res) {
    res.render("login/totp/verify.ejs")
});

router.post('/login/verify', passport.authenticate('local-topt', { failureRedirect: '/login/verify', failureFlash: true }),
    function (req, res) {
        req.session.secondFactor = 'totp';
        res.redirect('/');
    });

module.exports = router;