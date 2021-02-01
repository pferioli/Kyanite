const Model = require('../models')
const Client = Model.client;
const HomeOwner = Model.homeOwner;
const Notification = Model.notification;

const gcs = require('../helpers/gcs.helper'); module.exports = { gcs };

const path = require("path");

const { v4: uuidv4 } = require('uuid');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'homeOwners'; const CURRENT_MENU_IMPORT = CURRENT_MENU + '_import';

module.exports.CURRENT_MENU = CURRENT_MENU;

const NotificationUtils = require('../utils/notifications.util').notifications;

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

//-------------------- IMPORT --------------------//

module.exports.showUploadForm = async function (req, res) {

    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);

    res.render("homeOwners/import/upload", { menu: CURRENT_MENU_IMPORT, data: { client } });
};

module.exports.importHomeOwners = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    if (!req.file) {
        req.flash("warning", "No se encontro ningun archivo con datos para hacer la importación");
        res.redirect(`/homeOwners/import/new/${clientId}`);
        return;
    }

    if (path.extname(req.file.originalname) != '.csv') {
        req.flash("error", "El formato del archivo seleccionado no corresponde, debe ser del tipo CSV (codificación UTF-8)");
        res.redirect(`/homeOwners/import/new/${clientId}`);
        return;
    }

    winston.info(`beginning the homeOwners import from file ${req.file.originalname} for client #${clientId} on user #${req.user.id} request`);

    const filename = uuidv4();

    const gcsFileName = `homeOwners/${filename}.csv`; //${Date.now()}-${req.file.originalname}

    const gcsBucketName = `${process.env.GOOGLE_CLOUD_PROJECT}_bucket_temp`;

    winston.info(`uploading file ${req.file.originalname} to GSC as ${gcsFileName} in bucket ${gcsBucketName}`);

    const client = await Client.findByPk(clientId);

    let regCounter = 0;

    gcs.sendUploadToGCS(req, gcsFileName, gcsBucketName)
        .then(writeResult => {

            gcs.readPropertyFileFromGCS(gcsFileName, gcsBucketName)
                .then(async (readResult) => {

                    for (index = 0; index < readResult.length; index++) {

                        try {

                            let homeOwner = {
                                clientId: clientId,
                                property: (readResult[index].property.toUpperCase().startsWith('UF'), readResult[index].property.toUpperCase(), 'UF' + readResult[index].property),
                                name: readResult[index].name,
                                phone: (readResult[index].phone ? readResult[index].phone : null),
                                email: (readResult[index].email ? readResult[index].email : null),
                                cuil: (readResult[index].cuil ? readResult[index].cuil : null),
                                comments: (readResult[index].comments ? readResult[index].comments : null),
                                coefficient: readResult[index].coefficient.replace(",", '.'),
                                createdBy: req.user.id
                            }

                            homeOwner = await HomeOwner.create(homeOwner)

                            regCounter++;

                        } catch (error) {
                            winston.error(`An error ocurred while inserting the record #${index} into homeOwners table - ${err}`)
                        }
                    }

                    return index;

                })
                .catch((err) => {
                    winston.error(`An error ocurred while reading the the collections file ${gcsFileName} from bucket ${gcsBucketName} - ${err} `)
                })
                .finally((resolve) => {
                    Notification.create({
                        type: NotificationUtils.eType.get('homeOwners').value,
                        severity: NotificationUtils.eSeverity.get('warning').value,
                        user: req.user.id,
                        description: `el proceso de importacion de propietarios para el barrio ${client.internalCode} ha finalizado (${regCounter} registros)`,
                        enabled: true
                    })

                    console.log("proceso finalizado")
                });
        })
        .catch((err) => {
            winston.error(`An error ocurred while writing the the import file ${gcsFileName} from bucket ${gcsBucketName} - ${err} `)
        });

    req.flash("success", "el proceso de carga puede demorar, se le notificará cuando el proceso este completo");
    res.redirect(`/homeOwners/client/${clientId}`);
}

//------------------ AJAX CALLS ------------------//

module.exports.getHomeOwnersByClient = async function (req, res, next) {
    const clientId = req.params.clientId;
    HomeOwner.findAll({ where: { clientId: clientId } }).then(function (homeOwners) {
        res.send(homeOwners)
    });
}
