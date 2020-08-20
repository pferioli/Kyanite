const Model = require('../models')
const Client = Model.client;
const TaxCategory = Model.taxCategory;

function populateClients(req, res) {
    Client.findAll({ attributes: ['id', 'name'] }).then(function (clients) {
        res.send(clients);
    });
}

function listAll(req, res, next) {
    Client.findAll().then(function (clients) {
        res.render("clients/index.ejs", {
            data: { clients },
        });
    });
};

function showNewForm(req, res, next) {
    TaxCategory.findAll({ where: { enabled: true } }).then(function (taxCategories) {
        res.render("clients/add.ejs", {
            data: { taxCategories },
        });
    });
};

async function addNew(req, res, next) {
    const Op = require('Sequelize').Op

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
        enabled: true,
        user: req.user.id
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

async function getInfo(req, res) {
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
    const taxCategories = await TaxCategory.findAll({ where: { enabled: true } });

    res.render("clients/info.ejs", { data: { client, taxCategories } });
};

module.exports = {
    populateClients,
    listAll,
    showNewForm,
    addNew,
    getInfo
}