const express = require("express");
const router = express.Router();

const usersController = require('../controllers/users.controller');

router.get("/avatar", function (req, res, next) {
    usersController.getAvatar(req, res);
});

module.exports = router


