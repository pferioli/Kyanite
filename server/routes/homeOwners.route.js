const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const homeOwnersController = require('../controllers/homeOwners.controller');

router.get("/", function (req, res, next) {
    res.render('homeOwners/index', { menu: homeOwnersController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/homeOwners/client/" + clientId);
});

router.get("/client/:id/new", function (req, res, next) {
    homeOwnersController.showNewForm(req, res);
});

router.post("/client/:id/new", function (req, res, next) {
});

router.get("/client/:id", function (req, res, next) {
    homeOwnersController.listAll(req, res);
});

router.get("/client/:id/info", function (req, res, next) {
    console.log("info")
});

module.exports = router;
