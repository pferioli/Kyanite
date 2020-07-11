const express = require("express");
const router = express.Router();

var mysql = require("../lib/db");

/* GET users listing. */
router.get("/", function (req, res, next) {
  mysql.connection.query(
    "SELECT * FROM vCLIENTES ORDER BY RAZON_SOCIAL ASC",
    function (err, rows) {
      if (err) {
        console.error(err);
      } else {
        res.render("clients/clients.ejs", {
          user: req.user, data: { rows },
        });
      }
    }
  );
});

router.get("/nuevo", function (req, res, next) {
  mysql.connection.query(
    "SELECT DESCRIPCION FROM CATEGORIAS_IMPOSITIVAS WHERE ACTIVO=1",
    function (err, rows) {
      if (err) {
        console.error(err);
      } else {
        res.render("clients/add.ejs", { user: req.user, categories: { rows } });
      }

    });
});

router.get("/info/:id", function (req, res, next) {
  const id = req.params.id;
  mysql.connection.query(
    "SELECT * FROM vCLIENTES WHERE ID = ?", [id],
    function (err, rows) {
      if (err) {
        console.error(err);
      } else {
        res.render("clients/info.ejs", { user: { displayName: "Pablo Ferioli", email: "ferioli@ar.ibm.com" }, information: rows[0] });
      }

    });
});

module.exports = router;
