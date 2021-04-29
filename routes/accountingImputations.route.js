const express = require("express");
const router = express.Router();

const accountingImputationsController = require('../controllers/accountingImputations.controller');

router.get("/", function (req, res) {
    accountingImputationsController.findAll(req, res);
});

router.get("/byGroup/:id", function (req, res) {
    accountingImputationsController.findByGroupId(req, res);
});

router.get("/settings", function (req, res, next) {
    accountingImputationsController.showSettings(req, res);
});

router.get("/download", function (req, res, next) {
    accountingImputationsController.exportToFile(req, res);
});

router.post("/new", function (req, res, next) {
    accountingImputationsController.addNewImputationAccount(req, res);
});

router.post("/edit", function (req, res, next) {
    accountingImputationsController.editNewImputationAccount(req, res);
});

router.post("/delete", function (req, res, next) {
    accountingImputationsController.deleteNewImputationAccount(req, res);
});

//GROUPS

router.get("/groups", function (req, res) {
    accountingImputationsController.findAllGroups(req, res);
});

router.post("/groups/new", function (req, res) {
    accountingImputationsController.addNewGroup(req, res);
});

router.post("/groups/delete", function (req, res) {
    accountingImputationsController.deleteGroup(req, res);
});

router.post("/groups/edit", function (req, res) {
    accountingImputationsController.editGroup(req, res);
});

router.get("/groups/:id", function (req, res) {
    accountingImputationsController.findGroupById(req, res);
});


router.get("/:id", function (req, res) {
    accountingImputationsController.findById(req, res);
});

module.exports = router;
