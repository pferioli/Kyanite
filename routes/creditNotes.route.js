const express = require("express");
const router = express.Router();

const creditNotesController = require('../controllers/creditNotes.controller');

router.get("/", function (req, res, next) {
    res.render('creditNotes/index');
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/creditNotes/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.refresh) redirectUrl = redirectUrl + '&refresh=' + req.query.refresh;
    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get('/client/:clientId', function (req, res, next) {
    creditNotesController.listAll(req, res);
})

router.get('/client/:clientId/new', function (req, res, next) {
    creditNotesController.showNewForm(req, res);
});

router.post('/client/:clientId/new', function (req, res, next) {
    creditNotesController.addNew(req, res, next);
});

router.post('/delete', function (req, res, next) {
    creditNotesController.deletePO(req, res);
})

module.exports = router;
