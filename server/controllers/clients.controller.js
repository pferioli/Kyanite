const mysql = require("../lib/db");

module.exports.listAll = function (req, res, next) {
    mysql.connection.query(
        "select * from vcliente order by razon_social asc",
        function (err, rows) {
            if (err) {
                console.error(err);
            } else {
                res.render("clients/index.ejs", {
                    user: req.user,
                    data: { rows },
                });
            }
        }
    );
}

module.exports.addNew = function (req, res, next) {
    mysql.connection.query(
        "select id, descripcion from categoria_impositiva where activo = 1",
        function (err, rows) {
            if (err) {
                console.error(err);
            } else {
                res.render("clients/add.ejs", {
                    categories: { rows },
                });
            }
        }
    );
};

module.exports.getInfo = function (req, res) {
    const id = req.params.id;
    mysql.connection.query("select * from vcliente where id = ?", [id], function (
        err,
        rows
    ) {
        if (err) {
            console.error(err);
        } else {
            res.render("clients/info.ejs", {
                user: req.user,
                information: rows[0],
            });
        }
    });
}