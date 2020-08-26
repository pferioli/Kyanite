const Op = require('sequelize').Op
const Model = require('../models');
const Client = Model.client;
const TaxCategory = Model.taxCategory;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'clients'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.populateClients = function (req, res) {
    Client.findAll({ attributes: ['id', 'name'] }).then(function (clients) {
        res.send(clients);
    });
}

module.exports.listAll = function (req, res, next) {
    Client.findAll().then(function (clients) {
        res.render("clients/clients.ejs", { menu: CURRENT_MENU, data: { clients } });
    });
};

module.exports.showNewForm = function (req, res, next) {
    TaxCategory.findAll({ where: { enabled: true } }).then(function (taxCategories) {
        res.render("clients/add.ejs", {
            menu: CURRENT_MENU, data: { taxCategories },
        });
    });
};

module.exports.addNew = async function (req, res, next) {

    const existingClient = await Client.findAll(
        {
            where: {
                [Op.or]: [
                    { cuit: req.body.cuit },
                    { internalCode: req.body.internalCode }
                ]
            }
        }
    );

    if (existingClient.length > 0) {
        req.flash("warning", "Ya existe un cliente registrado con el ese número de C.U.I.T. o Código Interno...");
        req.flash("metadata", req.body);
        res.redirect('/clients/new');
        return;
    }

    const client = {
        internalCode: req.body.internalCode,
        name: req.body.name,
        cuit: req.body.cuit,
        taxCategoryId: req.body.taxCategory,
        address: req.body.address,
        city: req.body.city,
        zipCode: req.body.zipCode,
        phone: req.body.phone,
        email: req.body.email,
        comments: req.body.comments,
        userId: req.user.id
    }

    try {
        Client.create(client).then(function (result) {
            req.flash(
                "success",
                "El cliente fue agregado exitosamente a la base de datos"
            )
            res.redirect("/clients"); return;
        })
    } catch (err) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo agregar al nuevo cliente en la base de datos"
        )
        res.redirect("/clients"); return;
    }
};

module.exports.getInfo = async function (req, res) {
    const clientid = req.params.id;
    const client = await Client.findByPk(clientid, {
        include: [{
            model: TaxCategory
        }]
    });

    if (client === null) {
        res.send(`el ID #${clientid} no existe en la base de datos para ningun cliente registrado, <a href="/clients"> volver al listado </a>`);
        return;
    }
    res.render("clients/info.ejs", { menu: CURRENT_MENU, data: { client } });
};

module.exports.delete = async function (req, res, next) {
    const clientId = req.body.clientId;
    const client = await Client.findByPk(clientId);
    if (client) {
        client.destroy()
            .then(numAffectedRows => {
                req.flash(
                    "success",
                    "El cliente fue eliminado exitosamente a la base de datos"
                )
                winston.info(`client #${clientId} was deleted by user #${req.user.id} `);
            })
            .catch(err => {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo eliminar el cliente de la base de datos"
                )
                winston.error(`an error ocurred when user "${req.user.id} tryed to delete client #${clientId} - ${err}`);
            })
            .finally(function () {
                res.redirect("/clients");
            })
    }
};