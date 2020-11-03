const express = require("express");
const router = express.Router();

const accountingImputationsController = require('../controllers/accountingImputations.controller');

router.get("/groups", function (req, res) {
    accountingImputationsController.findAllGroups(req, res);
});

router.post("/groups/new", function (req, res) {
    console.log('new group')
});

router.get("/groups/:id", function (req, res) {
    accountingImputationsController.findGroupById(req, res);
});

router.get("/", function (req, res) {
    accountingImputationsController.findAll(req, res);
});

router.get("/:id", function (req, res) {
    accountingImputationsController.findById(req, res);
});

router.get("/byGroup/:id", function (req, res) {
    accountingImputationsController.findByGroupId(req, res);
});

router.post("/new", function (req, res, next) {
    console.log('new')
});

module.exports = router;
