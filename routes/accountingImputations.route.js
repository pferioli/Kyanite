const express = require("express");
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login');

const accountingImputationsController = require('../controllers/accountingImputations.controller');

router.get("/groups", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    accountingImputationsController.findAllGroups(req, res);
});

router.post("/groups/new", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    console.log('new group')
});

router.get("/groups/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    accountingImputationsController.findGroupById(req, res);
});

router.get("/", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    accountingImputationsController.findAll(req, res);
});

router.get("/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    accountingImputationsController.findById(req, res);
});

router.get("/byGroup/:id", connectEnsureLogin.ensureLoggedIn(), function (req, res) {
    accountingImputationsController.findByGroupId(req, res);
});

router.post("/new", connectEnsureLogin.ensureLoggedIn(), function (req, res, next) {
    console.log('new')
});

module.exports = router;
