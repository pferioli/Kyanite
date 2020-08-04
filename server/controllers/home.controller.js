const mysql = require("../lib/db");

module.exports.welcome = function (req, res, next) {
    res.locals.user = req.user;
    res.render("home.ejs", { menu: 'home' });
}
