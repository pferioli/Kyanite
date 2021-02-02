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
    const clientId = req.body.clientId;
    res.redirect("/incomes/collections/client/" + clientId);
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