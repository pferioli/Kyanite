const Model = require('../models')
const Client = Model.client;
const HomeOwner = Model.homeOwner;

const gcs = require('../helpers/googleUpload.helper');

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
            createdBy: req.user.id
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
            "Ocurrio un error y no se pudo agregar el propietario en la base de datos"
        );

        winston.error(`An error ocurred while creating new homeOwner ${JSON.stringify(req.body)} - ${err}`);

        res.redirect(`/homeOwners/client/${clientId}`);
    }
};

module.exports.showEditForm = async function (req, res, next) {

    const ownerId = req.params.id;

    const mode = req.query.mode;

    try {

        const homeOwner = await HomeOwner.findByPk(ownerId, { include: [{ model: Client }] });

        res.render('homeOwners/edit.ejs', { menu: CURRENT_MENU, mode: mode, data: { homeOwner: homeOwner } })

    } catch (err) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo modificar el propietario en la base de datos"
        );

        winston.error(`An error ocurred while updating homeOwner #${ownerId} ${JSON.stringify(req.body)} - ${err}`);
    }
};

module.exports.edit = async function (req, res) {

    const mode = req.body.mode;

    if (mode === 'update') { update(req, res); }

    if (mode === 'transfer') { transfer(req, res); }
};

async function update(req, res) {

    const ownerId = req.body.ownerId;
    const clientId = req.body.clientId;

    let homeOwner = await HomeOwner.findByPk(ownerId);

    homeOwner.phone = req.body.phone;
    homeOwner.email = req.body.email;
    homeOwner.cuil = req.body.cuil;
    homeOwner.comments = req.body.comments;
    homeOwner.updatedBy = req.user.id;

    homeOwner.save()
        .then(result => {
            req.flash(
                "success",
                "El propietario fue actualizado exitosamente a la base de datos"
            );
            winston.info(`homeOwner #${result.id} was succesfully updated by user #${req.user.id}`);
        })
        .catch(err => {
            req.flash(
                "error",
                "Ocurrio un error y no se pudo actualizar al propietario en la base de datos"
            );
            winston.error(`an error ocurred when user #${req.user.id} tryed to update homeOwner ${ownerId} - ${err}`);
        })
        .finally(() => {
            res.redirect(`/homeOwners/client/${clientId}`);
        })
};

async function transfer(req, res) {

    const clientId = req.body.clientId;
    const currentHomeOwnerId = req.body.ownerId;

    let currentHomeOwner = await HomeOwner.findByPk(currentHomeOwnerId);
    currentHomeOwner.updatedBy = req.user.id;

    const property = currentHomeOwner.property;

    //creamos el nuevo usuario...

    const nextHomeOwner = await HomeOwner.create({
        clientId: clientId,
        property: currentHomeOwner.property,
        coefficient: currentHomeOwner.coefficient,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        cuil: req.body.cuil,
        comments: req.body.comments,
        createdBy: req.user.id
    })
        .then(() => { //actualizamos el campo updateBy y luego deshabilitamos el usuario anterior

            currentHomeOwner.save()
                .then(() => {
                    currentHomeOwner.destroy()
                        .then(result => {
                            req.flash(
                                "success",
                                `El cambio de titularidad para la propiedad ${property} fue actualizado exitosamente a la base de datos`
                            );
                            winston.info(`homeOwner #${result.id} was succesfully updated by user #${req.user.id}`);
                        })
                })

        })
        .catch(err => {
            req.flash(
                "error",
                "Ocurrio un error y no se pudo actualizar al propietario en la base de datos"
            );
            winston.error(`an error ocurred when user #${req.user.id} tryed to update homeOwner ${ownerId} - ${err}`);
        })
        .finally(() => {
            res.redirect(`/homeOwners/client/${clientId}`);
        })
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

module.exports.delete = async function (req, res, next) {

    const clientId = req.body.clientId;
    const ownerId = req.body.ownerId;

    const homeOwner = await HomeOwner.findByPk(ownerId);

    if (homeOwner) {
        homeOwner.destroy()
            .then(numAffectedRows => {
                req.flash(
                    "success",
                    "El propietario fue eliminado exitosamente a la base de datos"
                )
                winston.info(`homeOwner #${ownerId} was deleted by user #${req.user.id} `);
            })
            .catch(err => {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo eliminar el propietario de la base de datos"
                )
                winston.error(`an error ocurred when user "${req.user.id} tryed to delete homeOwner #${ownerId} - ${err}`);
            })
            .finally(function () {
                res.redirect(`/homeOwners/client/${clientId}`);
            })
    }
};

module.exports.history = async function (req, res, next) {

    const ownerId = req.params.id;

    const currentHomeOwner = await HomeOwner.findByPk(ownerId, { include: [{ model: Client }] });

    if (!currentHomeOwner) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo encontrar los datos de la propiedad en la base de datos"
        )
        res.redirect(`/homeOwners/client/${clientId}`); return;
    };

    const historyHomeOwners = await HomeOwner.findAll({
        where: { clientId: currentHomeOwner.clientId, property: currentHomeOwner.property }, paranoid: false
    });

    res.render('homeOwners/history.ejs', { menu: CURRENT_MENU, data: { property: currentHomeOwner.property, client: currentHomeOwner.client, homeOwners: historyHomeOwners } })
};


//------------------ AJAX CALLS ------------------//

module.exports.getHomeOwnersByClient = async function (req, res, next) {
    const clientId = req.params.clientId;
    HomeOwner.findAll({ where: { clientId: clientId } }).then(function (homeOwners) {
        res.send(homeOwners)
    });
}
