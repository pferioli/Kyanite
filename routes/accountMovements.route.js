const express = require("express");
const router = express.Router();

const accountMovementsController = require('../controllers/accountMovements.controller');

router.get("/", function (req, res, next) {
    res.render('accountMovements/index', { menu: accountMovementsController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    const accountsIds = req.body.accountId;

    let redirectUrl = "/movements/client/" + clientId;

    if (accountsIds != undefined) {
        redirectUrl += "?accountId=" + accountsIds
    }

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", function (req, res, next) {
    accountMovementsController.listAll(req, res);
});

module.exports = router;
