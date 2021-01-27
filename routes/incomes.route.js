const express = require("express");
const router = express.Router();

const collectionsController = require('../controllers/collections.controller');

router.get("/", function (req, res, next) {
    res.render("incomes/index.ejs", { menu: 'incomes', user: req.user });
});

//<<<<<------ COLLECTIONS ------>>>>>//

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

router.get("/collections/client/:clientId/details/:collectionId", function (req, res, next) {
    collectionsController.info(req, res);
});

//MANUAL...

router.get("/collections/new/:clientId", function (req, res, next) {
    collectionsController.showNewForm(req, res);
});

router.post("/collections/new/:clientId", function (req, res, next) {
    collectionsController.addNew(req, res);
});

//IMPORT...

router.get("/collections/import/:clientId", function (req, res, next) {
    collectionsController.listImportedCollections(req, res);
});

router.get("/collections/import/new/:clientId", function (req, res, next) {
    collectionsController.showUploadForm(req, res);
});

router.post('/collections/import/new/:clientId', [collectionsController.gcs.multer.single('attachment')],
    function (req, res) {
        collectionsController.importCollections(req, res);
    },
);

router.get("/collections/import/:clientId/wait/:controlId", function (req, res, next) {
    collectionsController.waitImportProcess(req, res);
});

//IMPORT CONFIRM/CANCEL


//IMPORT --> AJAX

router.get("/collections/import/status/:controlId", function (req, res, next) {   //AJAX
    collectionsController.checkImportProcess(req, res);
});

//REPORTS...

router.get("/collections/client/:clientId/invoice/:collectionId", function (req, res, next) {
    collectionsController.createInvoice(req, res);
});

module.exports = router