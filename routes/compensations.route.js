const express = require("express");
const router = express.Router();

const compensations = require('../controllers/compensations.controller');

router.get("/", function (req, res, next) {
    res.render("compensations/index.ejs", { menu: compensations.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/compensations/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", function (req, res, next) {
    compensations.listAll(req, res);
});

router.get("/client/:clientId/new", function (req, res, next) {
    compensations.showNewForm(req, res);
});

router.post("/client/:clientId/new", function (req, res, next) {
    compensations.addNew(req, res);
});


router.get("/edit/:clientId/:compensationId", function (req, res, next) {
    compensations.showEditForm(req, res);
});

router.get("/info/:clientId/:compensationId", function (req, res, next) {
    compensations.info(req, res);
});

router.post("/edit", function (req, res, next) {
    compensations.edit(req, res);
});

router.post('/delete', function (req, res, next) {
    compensations.delete(req, res);
})

module.exports = router