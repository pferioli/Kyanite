const express = require("express");
const router = express.Router();

const usersController = require('../controllers/users.controller');

const Multer = require('multer')
const multer = Multer()

router.get("/", function (req, res, next) {
    usersController.listAll(req, res);
});

router.get("/avatar", function (req, res, next) {
    usersController.getAvatar(req, res);
});

router.get("/edit/:userId", function (req, res, next) {
    usersController.showEditForm(req, res);
});

router.post("/edit", [multer.single('attachment')], function (req, res, next) {
    usersController.edit(req, res);
});

router.get("/new", function (req, res, next) {
    usersController.showNewForm(req, res);
});

router.post("/new", [multer.single('attachment')], function (req, res, next) {
    usersController.addNew(req, res);
});

router.post("/delete", function (req, res, next) {
    usersController.deleteUser(req, res);
})

router.post("/restore", function (req, res, next) {
    usersController.restoreUser(req, res);
})

router.post("/disable2fa", function (req, res, next) {
    usersController.disable2fa(req, res);
});

router.post("/enable2fa", function (req, res, next) {
    usersController.enable2fa(req, res);
});

// router.post('/send2fa', async function (req, res) {
//     res.send(resp);
// })

module.exports = router


