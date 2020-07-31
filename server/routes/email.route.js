const express = require("express");
const router = express.Router();
const sendgrid = require('../helpers/sendgrid.helper');

router.get("/", function (req, res, next) {
    sendgrid.sendgridExample()
});

module.exports = router