const express = require("express");
const router = express.Router();

const accountMovementsController = require('../controllers/accountMovements.controller');

router.get("/", function (req, res, next) {
    res.render('accountMovements/index', { menu: accountMovementsController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    accountMovementsController.listAll(req, res);
});

module.exports = router;
