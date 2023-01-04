const express = require("express");
const router = express.Router();

router.get("/start", function (req, res, next) {
    console.log("_ah/start received"); res.sendStatus(200);
});

router.get("/stop", function (req, res, next) {
    console.log("_ah/start received"); res.sendStatus(200);
});

module.exports = router;
