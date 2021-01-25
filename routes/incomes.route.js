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

router.get("/collections/upload/:clientId", function (req, res, next) {
    collectionsController.showUploadForm(req, res);
});

// router.get("/collections/import", function (req, res, next) {})

router.post('/collections/import/:clientId', [collectionsController.gcs.multer.single('attachment')],
    function (req, res) {
        collectionsController.importCollections(req, res);
    },
);

router.get("/collections/importing/:clientId/control/:controlId", function (req, res, next) {
    collectionsController.waitImportProcess(req, res);
});

router.get("/collections/importing/:clientId/status/:controlId", function (req, res, next) {
    collectionsController.checkImportProcess(req, res);
});

router.get("/collections/imported/:clientId", function (req, res, next) {
    collectionsController.listImportedCollections(req, res);
});

router.get("/collections/new/:clientId", function (req, res, next) {
    collectionsController.showNewForm(req, res);
});

router.post("/collections/new/:clientId", function (req, res, next) {
    collectionsController.addNew(req, res);
});

router.get("/collections/client/:clientId", function (req, res, next) {
    collectionsController.listAll(req, res);
});

router.get("/collections/client/:clientId/details/:collectionId", function (req, res, next) {
    collectionsController.info(req, res);
});

router.get("/collections/client/:clientId/invoice/:collectionId", function (req, res, next) {
    collectionsController.createInvoice(req, res);
});

module.exports = router