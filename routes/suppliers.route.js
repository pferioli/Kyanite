const express = require("express");
const router = express.Router();

const suppliersController = require('../controllers/suppliers.controller');

router.get("/", function (req, res, next) {
  suppliersController.listAll(req, res);
});

router.get("/new", function (req, res, next) {
  suppliersController.showNewForm(req, res);
});

router.post('/new', function (req, res, next) {
  suppliersController.addNew(req, res);
})

router.post('/delete', function (req, res, next) {
  suppliersController.delete(req, res);
})

router.post("/categories/new", function (req, res, next) {
  suppliersController.newCategory(req, res);
});

// router.post("/categories", function (req, res, next) {
//   suppliersController.newCategory(req, res);
// });

// router.post("/categories/:id", function (req, res, next) {
//   suppliersController.newCategory(req, res);
// });

router.get("/info/:id", function (req, res, next) {
  suppliersController.info(req, res);
});

router.post("/edit/:id", function (req, res, next) {
  suppliersController.edit(req, res);
});

router.get("/edit/:id", function (req, res, next) {
  suppliersController.showEditForm(req, res);
});

router.get("/payments/:supplierId", function (req, res, next) {
  res.render("suppliers/payments/index", { supplierId: req.params.supplierId })
})

router.post("/payments", function (req, res, next) {
  suppliersController.listPayments(req, res);
})

router.get("/payments/report/:supplierId", function (req, res, next) {
  suppliersController.createBalanceReport(req, res);
})

//AJAX

router.get("/ajax/raw/:id", function (req, res, next) {
  suppliersController.findSupplierById(req, res);
});

module.exports = router;
