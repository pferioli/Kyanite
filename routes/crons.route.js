const express = require("express");
const router = express.Router();

const winston = require('../helpers/winston.helper');

const expirationDateReminder = require('../controllers/investments.controller').expirationDateReminder

router.get("/investments/expiration", function (req, res, next) {

    console.log(req.headers["X-Appengine-Cron"])

    res.sendStatus(200);

    expirationDateReminder();
});

module.exports = router;
