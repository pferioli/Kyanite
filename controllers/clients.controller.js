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
    Client.findAll({
        include: [{
            model: TaxCategory
        }]
    }).then(function (clients) {
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

    try {
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
            functionalUnitsCount: req.body.functionalUnitsCount,
            lotSize: req.body.lotSize,
            address: req.body.address,
            city: req.body.city,
            zipCode: req.body.zipCode,
            phone: req.body.phone,
            email: req.body.email,
            comments: req.body.comments,
            userId: req.user.id
        }

        Client.create(client).
            then(function (result) {
                winston.info(`User #${req.user.id} created succesfully a new client ${JSON.stringify(client)} - ${result.id}`)
                req.flash(
                    "success",
                    "El cliente fue agregado exitosamente a la base de datos"
                )
            })
            .catch(function (err) {
                winston.error(`An error ocurred while user #${req.user.id} tryed to create a new client ${JSON.stringify(client)} - ${err}`)
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo agregar al nuevo cliente en la base de datos"
                )
            })
            .finally(() => {
                res.redirect("/clients");
            })

    } catch (error) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo modificar el cliente en la base de datos"
        );

        winston.error(`An error ocurred while creating new client ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/clients");
    }

};

module.exports.showEditForm = async function (req, res, next) {

    const client = await Client.findByPk(req.params.id);

    const taxCategories = await TaxCategory.findAll({ where: { enabled: true } });

    res.render("clients/edit.ejs", {
        menu: CURRENT_MENU, data: { taxCategories, client },
    });

};

module.exports.edit = async function (req, res) {

    try {
        let client = await Client.findByPk(req.params.id);

        if (!client) {
            req.flash("error", "No se pudo encontrar ningun cliente con ese ID en la base de datos");
            winston.error(`Cannot find any client with ID ${req.params.id} in database for user #${req.user.id} edit request`);
            res.redirect("/clients"); return;
        }

        const existingClient = await Client.findAll(
            {
                where: {
                    id: { [Op.ne]: client.id },
                    [Op.or]: [
                        { cuit: req.body.cuit },
                        { internalCode: req.body.internalCode }
                    ]
                }
            });

        if (existingClient.length > 0) {
            req.flash("warning", "Ya existe un cliente registrado con el ese número de C.U.I.T. o Código Interno...");
            req.flash("metadata", req.body);
            res.redirect('/clients/edit/' + req.params.id);
            return;
        }

        client.internalCode = req.body.internalCode;
        client.name = req.body.name;
        client.cuit = req.body.cuit;
        client.taxCategoryId = req.body.taxCategory;
        client.functionalUnitsCount = (req.body.functionalUnitsCount === '' ? null : req.body.functionalUnitsCount);
        client.lotSize = (req.body.lotSize === '' ? null : req.body.lotSize);
        client.address = req.body.address;
        client.city = req.body.city;
        client.zipCode = req.body.zipCode;
        client.phone = req.body.phone;
        client.email = req.body.email;
        client.comments = req.body.comments;
        client.userId = req.user.id;

        client.save()
            .then(function (result) {
                req.flash(
                    "success",
                    "El cliente fue actualizado exitosamente en la base de datos"
                );
                winston.info(`User #${req.user.id} updated succesfully a client #${client.id} ${JSON.stringify(client)}`);
            })
            .catch(function (err) {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo modificar el cliente en la base de datos"
                );
                winston.error(`An error ocurred while user #${req.user.id} tryed to update client #${client.id} ${JSON.stringify(client)} - ${err}`);
            })
            .finally(() => {
                res.redirect("/clients");
            })

    } catch (error) {

        req.flash(
            "error",
            "Ocurrio un error y no se pudo modificar el cliente en la base de datos"
        );
        winston.error(`An error ocurred while updating the client #${req.params.id} ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/clients");
    }
}

module.exports.info = async function (req, res) {
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