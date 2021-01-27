const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Collection = Model.collection;
const CollectionConcept = Model.collectionConcept;
const CollectionSecurity = Model.collectionSecurity;
const BillingPeriod = Model.billingPeriod;
const HomeOwner = Model.homeOwner;
const Account = Model.account;
const AccountType = Model.accountType;
const Check = Model.check;
const CheckSplitted = Model.checkSplitted;
const User = Model.user;
const CollectionImport = Model.collectionImport;
const CollectionImportControl = Model.collectionImportControl;

const gcs = require('../helpers/gcs.helper'); module.exports = { gcs };

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const path = require("path");

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'collections'; const CURRENT_MENU_IMPORT = CURRENT_MENU + '_import'

module.exports.CURRENT_MENU = CURRENT_MENU;

const CollectionStatus = require('../utils/statusMessages.util').Collections;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    let periods = [];

    if (typeof req.body.periodId != 'undefined') {
        periods = req.body.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }
    }

    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    //CollectionStatus.eStatus.get('opened').value

    const status = (showAll === true) ? [0, 1, 2, 3, 4] : [1, 2, 3];

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            statusId: { [Op.in]: status }
        },
        include: [{ model: HomeOwner }, { model: BillingPeriod }, { model: User }],
    };

    const client = await Client.findByPk(clientId);

    const collections = await Collection.findAll(options);

    res.render('incomes/collections/collections',
        {
            menu: CURRENT_MENU,
            data: { client: client, collections: collections, periods: periods },
            params: { showAll: showAll }
        });
};

module.exports.showNewForm = async function (req, res) {
    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);

    const Accounts = await Account.findAll(
        { where: { clientId: clientId }, include: [{ model: AccountType }] });

    const period = await BillingPeriod.findOne({
        where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    });

    res.render("incomes/collections/manual/add", { menu: CURRENT_MENU, data: { client, clientAccounts: Accounts, period } });
};

module.exports.addNew = async function (req, res, next) {

    let bHasErrors = false;

    const clientId = req.params.clientId;

    const tables = JSON.parse(req.body.tables); //console.log(tables);

    winston.info(`User #${req.user.id} is adding a new Manual Collection to database for customer id # ${clientId}`)

    try {

        let collection = {
            clientId: clientId,
            periodId: req.body.billingPeriodId,
            propertyId: req.body.homeOwnerId,
            receiptDate: req.body.emissionDate,
            receiptNumber: 0,
            batchNumber: null,
            amountConcepts: req.body.amountConcepts,
            amountSecurities: req.body.amountSecurities,
            securityCode: uuidv4(),
            comments: req.body.comments,
            statusId: CollectionStatus.eStatus.get('pending').value,
            userId: req.user.id
        };

        collection = await Collection.create(collection)

        winston.info(`the collection was saved succesfully with id: ${collection.id} - ${collection}`)

        //TABLE CONCEPTS --> CONCEPTS

        winston.info(`now saving ${tables.concepts.length} concepts for collectionId: ${collection.id}`)

        for (index = 0; index < tables.concepts.length; index++) {

            try {

                let collectionConcept = {
                    collectionId: collection.id,
                    type: tables.concepts[index].type,
                    description: tables.concepts[index].concept,
                    amount: parseFloat(tables.concepts[index].amount.replace(/[^0-9\.-]+/g, "")),
                    userId: req.user.id
                };

                collectionConcept = await CollectionConcept.create(collectionConcept)

                winston.info(`the collection concept (${collectionConcept.type}) was saved succesfully - collectionId: ${collection.id} id: ${collectionConcept.id}`)

            } catch (error) {

                winston.info(`an error ocurred saving a concept in the database - collectionId: ${collection.id} - ${err}`)

                bHasErrors = true;
            }
        }

        //TABLE SECURITIES --> SECURITIES

        winston.info(`now saving ${tables.values.length} securities for collectionId: ${collection.id}`)

        for (index = 0; index < tables.values.length; index++) {

            try {

                let collectionSecurity = {
                    collectionId: collection.id,
                    type: tables.values[index].type,
                    description: tables.values[index].comment,
                    accountId: null,
                    checkId: null,
                    amount: parseFloat(tables.values[index].amount.replace(/[^0-9\.-]+/g, "")),
                    userId: req.user.id
                };

                switch (collectionSecurity.type) {
                    case "EF": { collectionSecurity.accountId = tables.values[index].valueId; } break;

                    case "DC": { collectionSecurity.accountId = tables.values[index].valueId; } break;

                    case "CH": {
                        const check = await CheckSplitted.findByPk(tables.values[index].valueId, { include: [{ model: Check }] });

                        check.update({ statusId: SplitCheckStatus.eStatus.get('assigned').value });

                        collectionSecurity.accountId = check.check.accountId;
                        collectionSecurity.checkId = check.id;
                    } break;
                }

                collectionSecurity = await CollectionSecurity.create(collectionSecurity);

                winston.info(`the collection security(${collectionSecurity.type}) was saved succesfully - collectionId: ${collection.id} id: ${collectionSecurity.id} `)

            } catch (error) {

                winston.info(`an error ocurred saving a security in the database - collectionId: ${collection.id} - ${err}`)

                bHasErrors = true;
            }
        }

        if (bHasErrors === false) {

            let receiptNumber = await db.sequelize.query(`SELECT nextval('${clientId}','C') as "nextval"`, { type: QueryTypes.SELECT });

            receiptNumber = receiptNumber[0].nextval;

            collection.update({
                receiptNumber: receiptNumber,
                statusId: CollectionStatus.eStatus.get('processed').value,
            });

            winston.info(`Collection ${collection.id} created succesfully`)

            req.flash("success", `La cobranza ha sido registrada correctamente bajo el recibo #${collection.receiptNumber}`)
        }
    } catch (error) {

        winston.error(`An error ocurred while user #${req.user.id} tryed to create a new collection ${JSON.stringify(collection)} - ${err} `)

        req.flash("error", "Ocurrio un error y no se pudo agregar la nueva cobranza en la base de datos");

    } finally {
        res.redirect('/incomes/collections/client/' + clientId);
    }

};

module.exports.info = async function (req, res) {
    const clientId = req.params.clientId;
    const collectionId = req.params.collectionId;

    const client = await Client.findByPk(clientId);

    Collection.findByPk(collectionId, {
        include: [{ model: HomeOwner }, { model: BillingPeriod }, { model: User },
        { model: CollectionConcept, as: "Concepts" }, { model: CollectionSecurity, as: "Securities" }],
    })
        .then(collection => {
            res.render('incomes/collections/info',
                {
                    menu: CURRENT_MENU,
                    data: { client: client, collection: collection },
                });
        })
        .catch(err => {

            req.flash(
                "error",
                "Ocurrio un error y no se pudo encontrar la cobranza seleccionada en la base de datos"
            );

            winston.error(`An error ocurred while user #${req.user.id} tryed to find collection #${collectionId} details from database - ${err} `)

            res.redirect('incomes/collections/client/' + clientId);
        })
};

module.exports.createInvoice = function (req, res) {

    const { createReport } = require("../reports/collections/manualCollection.report");

    const clientId = req.params.clientId;
    const collectionId = req.params.collectionId;

    Collection.findByPk(collectionId, {
        include: [{ model: Client }, { model: HomeOwner }, { model: BillingPeriod },
        { model: User, include: [{ model: Model.userSignature }] },
        { model: CollectionConcept, as: "Concepts", },
        {
            model: CollectionSecurity, as: "Securities", include: [
                {
                    model: CheckSplitted, include: [{ model: Model.check }]
                    //where: { checkId: { [Op.ne]: null } }
                },
                {
                    model: Account, include: [{ model: AccountType }, { model: Model.bank }]
                    //where: { accountId: { [Op.ne]: null } }
                }]
        }],
    })
        .then(collection => {
            createReport(collection, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))
        })
        .catch(err => {
            console.error(err);
        })
};

module.exports.showUploadForm = async function (req, res) {

    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);

    const period = await BillingPeriod.findOne({
        where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    });

    let importCtrl = await CollectionImportControl.findOne({
        where: { statusId: { [Op.in]: [1, 2] } }, include: [{ model: User }]
    });

    // if (importCtrl) {
    //     req.flash("warning", `Hay un proceso de importación sin finalizar del usuario ${importCtrl.user.name}`);
    // };

    res.render("incomes/collections/import/upload", { menu: CURRENT_MENU_IMPORT, data: { client, period, active: importCtrl } });
};

module.exports.importCollections = async function (req, res) {

    // const gcs = require('../helpers/gcs.helper');

    const moment = require('moment'); let bErrors = false;

    const clientId = req.body.clientId || req.params.clientId;

    if (!req.file) {
        req.flash("warning", "No se encontro ningun archivo con datos para hacer la importación");
        res.redirect("/incomes/collections/upload/" + clientId);
        return;
    }

    if (path.extname(req.file.originalname) != '.csv') {
        req.flash("error", "El formato del archivo seleccionado no corresponde, debe ser del tipo CSV (codificación UTF-8)");
        res.redirect("/incomes/collections/upload/" + clientId);
        return;
    }

    winston.info(`beginning the collections import from file ${req.file.originalname} for client #${clientId} on user #${req.user.id} request`);

    let importCtrl = null; importedRows = 0;

    try {
        importCtrl = await CollectionImportControl.create(
            {
                clientId: clientId,
                startedAt: Date.now(),
                statusId: 1,    //started
                userId: req.user.id
            });

        winston.info(`current import control record id is ${importCtrl.id}`);

    } catch (error) {
        winston.error(`An error ocurred while creating the import control register - ${err} `)
    }

    winston.info(`truncating collections_temp table`);

    CollectionImport.destroy({ truncate: true, cascade: false })

        .then((truncateResult) => {

            const filename = uuidv4();

            const gcsFileName = `collections/${filename}.csv`; //${Date.now()}-${req.file.originalname}

            const gcsBucketName = `${process.env.GOOGLE_CLOUD_PROJECT}_bucket_temp`;

            winston.info(`uploading file ${req.file.originalname} to GSC as ${gcsFileName} in bucket ${gcsBucketName}`);

            // const stream = file.createWriteStream({
            //     contentType: req.file.mimetype
            // });

            gcs.sendUploadToGCS(req, gcsFileName, gcsBucketName)
                .then(writeResult => {

                    gcs.readFileFromGCS(gcsFileName, gcsBucketName)
                        .then(async (readResult) => {

                            for (i = 0; i < readResult.length; i++) {

                                try {

                                    collection = await CollectionImport.create({
                                        clientCode: readResult[i].clientCode,
                                        propertyType: readResult[i].propertyType,
                                        property: readResult[i].property,
                                        accountId: readResult[i].accountId,
                                        conceptType: "EC",
                                        conceptDesc: readResult[i].concept,
                                        valueType: "DC",
                                        valueDesc: readResult[i].value,
                                        amount: readResult[i].amount.replace(".", '').replace(",", '.'),
                                        date: moment(readResult[i].date, "DD/MM/YYYY").toDate()
                                    });

                                } catch (err) {
                                    winston.error(`An error ocurred while inserting the record #${index} into temp table - ${err}`)
                                }
                            }

                            importedRows = i;

                        })
                        .catch((err) => {
                            winston.error(`An error ocurred while reading the the collections file ${gcsFileName} from bucket ${gcsBucketName} - ${err} `)
                        })
                        .finally(() => {

                            importCtrl.statusId = 3;
                            importCtrl.finishedAt = Date.now();
                            importCtrl.records = importedRows;
                            importCtrl.save()

                        })
                })
                .catch((err) => {
                    winston.error(`An error ocurred while writing the the collections file ${gcsFileName} from bucket ${gcsBucketName} - ${err} `)
                })
        })
        .catch((err) => {
            winston.error(`An error ocurred while truncating temp collections table - ${err} `)
        });

    res.redirect(`/incomes/collections/import/${clientId}/wait/${importCtrl.id}`);
}

module.exports.waitImportProcess = function (req, res) {

    const controlId = req.params.controlId;

    const clientId = req.params.clientId;

    Client.findByPk(clientId)
        .then((client) => {
            res.render('incomes/collections/import/wait', { menu: CURRENT_MENU_IMPORT, data: { client: client, control: { id: controlId } } });
        })
        .catch((err) => {
            winston.error(`An error ocurred while finding the client record for id #${clientId} - ${err} `)
        });
};

module.exports.listImportedCollections = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    const client = await Client.findByPk(clientId);

    // const sequelize = require('sequelize');

    // let importedRows = 0;

    // CollectionImport.count({})
    //     .then((count) => {
    //         importedRows = count; console.log(count)
    //     })
    //     .catch((err) => {
    //         console.error(err)
    //     })
    //     .finally(() => {
    //         console.log("finished")
    //     })

    CollectionImport.findAll(
        {
            include: [{ model: Account, include: [{ model: AccountType }] }]
        }
    ).then((collections) => {
        res.render('incomes/collections/import/imports', { menu: CURRENT_MENU_IMPORT, data: { client, collections } });
    });
}

//AJAX

module.exports.checkImportProcess = function (req, res) {

    const controlId = req.params.controlId;

    CollectionImportControl.findByPk(controlId)
        .then((result) => { res.send(result) })
        .catch((err) => { res.sendStatus(400).send(err); })
};
