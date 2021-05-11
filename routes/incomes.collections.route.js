const express = require("express");
const router = express.Router();

const collectionsController = require('../controllers/collections.controller');

// router.get("/", function (req, res, next) {
//     res.render("incomes/index.ejs", { menu: 'incomes', user: req.user });
// });

//<<<<<------ COLLECTIONS ------>>>>>//

router.get("/", function (req, res, next) {
    res.render("incomes/collections/index.ejs", { menu: collectionsController.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res, next) {

    let redirectUrl = '/incomes/collections/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.refresh) redirectUrl = redirectUrl + '&refresh=' + req.query.refresh;
    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", function (req, res, next) {
    collectionsController.listAll(req, res);
});

router.get("/client/:clientId/details/:collectionId", function (req, res, next) {
    collectionsController.info(req, res);
});

//MANUAL...

router.get("/new/:clientId", function (req, res, next) {
    collectionsController.showNewForm(req, res);
});

router.post("/new/:clientId", function (req, res, next) {
    collectionsController.addNew(req, res);
});

router.post("/delete", function (req, res, next) {
    collectionsController.deleteCollection(req, res);
});

//IMPORT...

router.get("/import/new/:clientId", function (req, res, next) {
    collectionsController.showUploadForm(req, res);
});

router.post('/import/new/:clientId', [collectionsController.gcs.multer.single('attachment')],
    function (req, res) {
        collectionsController.importCollections(req, res);
    },
);

router.get("/import/wait/:clientId", function (req, res, next) {
    collectionsController.waitImportProcess(req, res);
});

router.get("/import/show/:clientId", function (req, res, next) {
    collectionsController.listImportedCollections(req, res);
});

router.get("/import/confirm/:clientId", function (req, res, next) {
    collectionsController.addNewImportedCollections(req, res);
});

router.post("/import/killActiveSessions", function (req, res, next) {
    collectionsController.killActiveSessions(req, res);
});

//IMPORT --> AJAX

router.get("/import/status/:controlId", function (req, res, next) {   //AJAX
    collectionsController.checkImportProcess(req, res);
});

//REPORTS...

router.get("/client/:clientId/invoice/:collectionId", function (req, res, next) {
    collectionsController.createInvoice(req, res);
});

module.exports = router