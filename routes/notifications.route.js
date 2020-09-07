const express = require("express");
const router = express.Router();
const notifications = require('../controllers/notifications.controller');

router.get("/user/:id", function (req, res, next) {
    notifications.findPendings(req, res);
});

module.exports = router


