const express = require("express");
const router = express.Router();

const usersController = require('../controllers/users.controller');

router.get("/", function (req, res, next) {
    usersController.listAll(req, res);
});

router.get("/avatar", function (req, res, next) {
    usersController.getAvatar(req, res);
});

router.get("/new", function (req, res, next) {
    usersController.showNewForm(req, res);
});

router.post("/new", function (req, res, next) {
    usersController.addNew(req, res);
});

router.post("/manage2fa", function (req, res, next) {
    usersController.manage2fa(req, res);
});

module.exports = router


