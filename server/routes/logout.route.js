const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
    req.logout();
    res.render("login/logout.ejs");
});

module.exports = router;