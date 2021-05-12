const express = require("express");
const router = express.Router();

const homeOwnersController = require('../controllers/homeOwners.controller');

router.get("/", function (req, res, next) {
    res.render('homeOwners/index', { menu: homeOwnersController.CURRENT_MENU });
});

router.post("/", function (req, res, next) {
    const clientId = req.body.clientId;
    res.redirect("/homeOwners/client/" + clientId);
});

router.get("/client/:clientId/new", function (req, res, next) {
    homeOwnersController.showNewForm(req, res);
});

router.post("/client/:clientId/new", function (req, res, next) {
    homeOwnersController.addNew(req, res);
});

router.get("/client/:clientId/upload", function (req, res, next) {
    homeOwnersController.showUploadForm(req, res);
});

router.post("/client/:clientId/upload", [homeOwnersController.gcs.multer.single('attachment')], function (req, res, next) {
    homeOwnersController.upload(req, res);
});

router.get("/client/:clientId", function (req, res, next) {
    homeOwnersController.listAll(req, res);
});

router.get("/edit/:id", function (req, res, next) {
    homeOwnersController.showEditForm(req, res);
});

router.get("/history/:id", function (req, res, next) {
    homeOwnersController.history(req, res);
});

router.post("/delete", function (req, res, next) {
    homeOwnersController.delete(req, res);
});

router.post("/edit", function (req, res, next) {
    homeOwnersController.edit(req, res);
});

router.get("/import/new/:clientId", function (req, res, next) {
    homeOwnersController.showUploadForm(req, res);
});

router.post("/import/new/:clientId", [homeOwnersController.gcs.multer.single('attachment')],
    function (req, res, next) {
        homeOwnersController.importHomeOwners(req, res);
    });

router.get("/ajax/getByClient/:clientId", function (req, res, next) {
    homeOwnersController.getHomeOwnersByClient(req, res);
});

router.get("/ajax/getById/:homeOwnerId", function (req, res, next) {
    homeOwnersController.getHomeOwnerById(req, res);
});

module.exports = router;
