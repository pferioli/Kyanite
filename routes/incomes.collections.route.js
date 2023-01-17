const express = require("express");
const router = express.Router();

const collectionsController = require('../controllers/collections.controller');

const { lastVisitedUrl, checkPrivileges, UserPrivilegeLevel } = require('../helpers/authorization.helper');

// router.get("/", function (req, res, next) {
//     res.render("incomes/index.ejs", { menu: 'incomes', user: req.user });
// });

//<<<<<------ COLLECTIONS ------>>>>>//

router.get("/", function (req, res) {
    res.render("incomes/collections/index.ejs", { menu: collectionsController.CURRENT_MENU, user: req.user });
});

router.post("/", function (req, res) {

    let redirectUrl = '/incomes/collections/client/' + req.body.clientId + '?periodId=' + req.body.periodId

    if (req.query.refresh) redirectUrl = redirectUrl + '&refresh=' + req.query.refresh;
    if (req.query.showAll) redirectUrl = redirectUrl + '&showAll=' + req.query.showAll;

    res.redirect(redirectUrl);
});

router.get("/client/:clientId", lastVisitedUrl(),
    function (req, res) {
        collectionsController.listAll(req, res);
    });

router.get("/client/:clientId/details/:collectionId", lastVisitedUrl(), function (req, res) {
    collectionsController.info(req, res);
});

router.get("/client/:clientId/reassign/:collectionId", lastVisitedUrl(), function (req, res) {
    collectionsController.showReassignForm(req, res);
});

router.get("/client/:clientId/report/download", lastVisitedUrl(), function (req, res) {
    collectionsController.collectionsReport(req, res);
});

router.post("/reassign", lastVisitedUrl(), function (req, res) {
    collectionsController.reassingCollection(req, res);
});

//MANUAL...

router.get("/new/:clientId", lastVisitedUrl(), function (req, res) {
    collectionsController.showNewForm(req, res);
});

router.post("/new/:clientId", lastVisitedUrl(), function (req, res) {
    collectionsController.addNew(req, res);
});

router.post("/delete/multiple", checkPrivileges(UserPrivilegeLevel.eLevel.get("ADMINISTRATOR").value /*, { failureRedirect: '/incomes/collections' } */), lastVisitedUrl(),
    function (req, res, next) {
        collectionsController.deleteMultipleCollections(req, res);
    });

router.post("/delete", checkPrivileges(UserPrivilegeLevel.eLevel.get("ADMINISTRATOR").value /*, { failureRedirect: '/incomes/collections' }*/), lastVisitedUrl(),
    function (req, res, next) {
        collectionsController.deleteCollection(req, res);
    });


//IMPORT...

router.get("/import/new/:clientId", lastVisitedUrl(), function (req, res) {
    collectionsController.showUploadForm(req, res);
});

router.post('/import/new/:clientId', lastVisitedUrl(), [collectionsController.gcs.multer.single('attachment')],
    function (req, res) {
        collectionsController.importCollections(req, res);
    },
);

router.get("/import/wait/:clientId", lastVisitedUrl(), function (req, res) {
    collectionsController.waitImportProcess(req, res);
});

router.get("/import/show/:clientId", lastVisitedUrl(), function (req, res) {
    collectionsController.listImportedCollections(req, res);
});

router.get("/import/confirm/:clientId", lastVisitedUrl(), function (req, res) {
    collectionsController.addNewImportedCollections(req, res);
});

router.post("/import/killActiveSessions", lastVisitedUrl(), function (req, res) {
    collectionsController.killActiveSessions(req, res);
});

//IMPORT --> AJAX

router.get("/import/status/:controlId", lastVisitedUrl(), function (req, res) {   //AJAX
    collectionsController.checkImportProcess(req, res);
});

//REPORTS...

router.get("/client/:clientId/invoice/:collectionId", lastVisitedUrl(), function (req, res) {
    collectionsController.createInvoice(req, res);
});

module.exports = router