const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

router.get("/", function (req, res, next) {
    res.render("incomes/index.ejs", { menu: 'incomes', user: req.user });
});

module.exports = router