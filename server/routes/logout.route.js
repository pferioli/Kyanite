const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
    req.logout();
    res.render("logout.ejs");
});

module.exports = router;