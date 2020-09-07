const Model = require('../models')
const Client = Model.client;
const HomeOwner = Model.homeOwner;

const gcs = require('../helpers/google.upload.helper');

const winston = require('../helpers/winston.helper');

module.exports = { gcs };

const CURRENT_MENU = 'homeOwners'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    HomeOwner.findAll({ where: { clientId: clientId } }).then(function (homeOwners) {
        res.render('homeOwners/homeOwners.ejs', { menu: CURRENT_MENU, data: { client: client, homeOwners: homeOwners } })
    });
};

module.exports.showNewForm = async function (req, res, next) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    res.render('homeOwners/add.ejs', { menu: CURRENT_MENU, data: { client: client } })
};

module.exports.addNew = async function (req, res, next) {
    try {
        const clientId = req.params.clientId;

        // const existingHomeOwner = await HomeOwner.findAll({ where: { cuit: req.body.cuil } });

        // if (existingHomeOwner.length > 0) {
        //     req.flash("waning", "Ya existe un propietarops registrado con el ese número de C.U.I.L.");
        //     req.flash("metadata", req.body);
        //     res.redirect('/suppliers/new');
        //     return;
        // }

        const homeOwner = {
            clientId: clientId,
            property: req.body.property,
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            cuil: req.body.cuil,
            comments: req.body.comments,
            coefficient: req.body.coefficient,
            userId: req.user.id
        }

        HomeOwner.create(homeOwner)
            .then(function (result) {
                req.flash(
                    "success",
                    "El propietario fue agregado exitosamente a la base de datos"
                );
                winston.info(`homeOwner #${result.id} was succesfully added by user #${req.user.id}`);

            })
            .catch(err => {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo agregar al nuevo propietario en la base de datos"
                );
                winston.error(`an error ocurred when user #${req.user.id} tryed to add a new homeOwner - ${err}`);

            })
            .finally(() => {
                res.redirect(`/homeOwners/client/${clientId}`);
            })

    } catch (err) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo modificar el propietario en la base de datos"
        );

        winston.error(`An error ocurred while creating new homeOwner ${JSON.stringify(req.body)} - ${err}`);

        res.redirect(`/homeOwners/client/${clientId}`);
    }
};

module.exports.edit = async function (req, res, next) {
    try {
        const clientId = req.params.clientId;
        const id = req.params.id;

        res.redirect(`/homeOwners/client/${clientId}`);

    } catch (err) {

    }
};

module.exports.showUploadForm = async function (req, res, next) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    res.render('homeOwners/upload.ejs', { menu: CURRENT_MENU, data: { client: client } })
};


module.exports.upload = async function (req, res, next) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    const gcsFileName = `homeOwners/${Date.now()}-${clientId}-${req.file.originalname}`;

    winston.info(`uploading file ${req.file.originalname} to GSC as ${gcsFileName}`);

    gcs.sendUploadToGCS(req, gcsFileName)
        .then(result => {
            console.log("must load file to db")
        })
        .catch(error => { })
        .finally(() => {
            res.redirect(`/homeOwners/client/${clientId}`);
        });

};