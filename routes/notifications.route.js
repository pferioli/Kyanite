const express = require("express");
const router = express.Router();

const notifications = require('../controllers/notifications.controller');

router.get("/show", function (req, res, next) {
    notifications.notifications(req, res);
});

router.post("/ack", function (req, res, next) {
    notifications.ackNotification(req, res);
});

router.post("/clearAll", function (req, res, next) {
    notifications.clearNotifications(req, res);
});

router.get("/user/:id", function (req, res, next) {
    notifications.findPendings(req, res);
});

module.exports = router


