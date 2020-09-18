const express = require("express");
const router = express.Router();

const accountsController = require('../controllers/accounts.controller');

router.get("/", function (req, res, next) {
    res.render('accounts/index', { menu: accountsController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    accountsController.listAll(req, res);
});

router.get("/new/:clientId", function (req, res, next) {
    accountsController.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    accountsController.addNew(req, res);
});

router.get("/edit/:id", function (req, res, next) {
    accountsController.showEditForm(req, res);
});

router.post('/delete', function (req, res, next) {
    accountsController.delete(req, res);
})

router.get("/:clientId", function (req, res, next) {
    accountsController.listAll(req, res);
});

module.exports = router;
