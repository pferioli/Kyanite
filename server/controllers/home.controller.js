module.exports.welcome = function (req, res, next) {
    res.render("home.ejs", { menu: 'home' });
}
