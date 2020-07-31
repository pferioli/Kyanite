const express = require("express");
const router = express.Router();

const passport = require('../helpers/passport.helper');
const connectEnsureLogin = require('connect-ensure-login');

const bcrypt = require("bcrypt");

router.get("/", connectEnsureLogin.ensureLoggedOut(), function (req, res) {
    res.render("login");
});

router.post("/", passport.authenticate("local-login", {
    session: true,
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
}), function (req, res, info) {
    res.render("login.ejs");
}
);

router.post("/bcrypt", function (req, res) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
        res.send(`hash: ${hash}`);
    });
});

module.exports = router;