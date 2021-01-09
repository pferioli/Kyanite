const express = require("express");
const router = express.Router();

const collectionsController = require('../controllers/collections.controller');

router.get("/", function (req, res, next) {
    res.render("incomes/index.ejs", { menu: 'incomes', user: req.user });
});

router.get("/collections", function (req, res, next) {
    res.render("incomes/collections/index.ejs", { menu: collectionsController.CURRENT_MENU, user: req.user });
});

router.post("/collections", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/incomes/collections/client/" + clientId);
});

router.get("/collections/client/:clientId", function (req, res, next) {
    collectionsController.listAll(req, res);
});

router.get("/collections/new/:clientId", function (req, res, next) {
    collectionsController.showNewForm(req, res);
})

router.post("/collections/new/:clientId", function (req, res, next) {
    collectionsController.addNew(req, res);
})

module.exports = router