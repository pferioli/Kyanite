const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const Client = Model.client;
const Collection = Model.collection;
const CollectionConcept = Model.collectionConcept;
const CollectionSecurity = Model.collectionSecurity;
const CollectionProperty = Model.collectionProperty;
const BillingPeriod = Model.billingPeriod;
const HomeOwner = Model.homeOwner;
const Account = Model.account;
const AccountType = Model.accountType;
const Check = Model.check;
const CheckSplitted = Model.checkSplitted;
const User = Model.user;
const CollectionImport = Model.collectionImport;
const CollectionImportControl = Model.collectionImportControl;
const UnidentifiedDeposit = Model.unidentifiedDeposit;

const gcs = require('../helpers/gcs.helper'); module.exports = { gcs };

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const path = require("path");

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'collections'; const CURRENT_MENU_IMPORT = CURRENT_MENU + '_import'

module.exports.CURRENT_MENU = CURRENT_MENU;

const CollectionStatus = require('../utils/statusMessages.util').Collection;
const ImportCollectionStatus = require('../utils/statusMessages.util').ImportCollection;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;
const UnidentifiedDepositStatus = require('../utils/statusMessages.util').UnidentifiedDeposit;

const Notifications = require('../utils/notifications.util');

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    let periods = [];

    if (typeof req.query.periodId != 'undefined') {
        periods = req.query.periodId.split(',');
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
        include: [{ model: BillingPeriod }, { model: User },
        { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] }
        ],
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

        //TABLE PROPERTIES

        winston.info(`now saving propertyId: ${req.body.homeOwnerId} for collectionId: ${collection.id}`)

        const collectionProperty = await CollectionProperty.create({
            collectionId: collection.id,
            propertyId: req.body.homeOwnerId,
            amount: req.body.amountSecurities,
            receiptNumber: null,
            userId: req.user.id
        })

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

                if ((collectionSecurity.type === 'EF') || (collectionSecurity.type === 'DC')) {
                    collectionSecurity.accountId = tables.values[index].valueId;
                } else if (collectionSecurity.type === 'CH') {

                    const check = await CheckSplitted.findByPk(tables.values[index].valueId, { include: [{ model: Check }] });
                    check.update({ statusId: SplitCheckStatus.eStatus.get('assigned').value });
                    collectionSecurity.accountId = check.check.accountId;
                    collectionSecurity.checkId = check.id;

                    //TODO: validar si se completo la utilizacion del cheque
                }

                collectionSecurity = await CollectionSecurity.create(collectionSecurity);

                winston.info(`the collection security(${collectionSecurity.type}) was saved succesfully - collectionId: ${collection.id} id: ${collectionSecurity.id} `)

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                //Si se esta usando cheque cargado en el sistema, viene de una cuenta de "Cheques a depositar" y por
                //lo tanto ya esta computado el ingreso en la CC y no se debe insertar nuevamente.

                if (collectionSecurity.type != 'CH') {

                    const AccountMovement = require('./accountMovements.controller');

                    const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                    const accountMovement = await AccountMovement.addMovement(clientId, collectionSecurity.accountId, collection.periodId, collectionSecurity.amount,
                        accountMovementCategory.eStatus.get('INGRESO_COBRANZA').value, collectionSecurity.id, collection.userId)

                    if (accountMovement === null) {
                        winston.error(`It was not possible to add account movement record for the Collection (ID: ${collection.id})  - ${err}`);
                        throw new Error("It was not possible to add the collection into the account movements table");
                    }
                }

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

module.exports.deleteCollection = async function (req, res) {

    const clientId = req.body.clientId;

    const collectionId = req.body.collectionId;

    try {

        const client = await Client.findByPk(clientId);

        const collection = await Collection.findByPk(collectionId, {
            include: [
                { model: BillingPeriod }, { model: User },
                { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] },
                { model: CollectionConcept, as: "Concepts" }, { model: CollectionSecurity, as: "Securities" }],
        })

        if (collection.billingPeriod.statusId !== BillingPeriodStatus.eStatus.get('opened').value) {
            req.flash("warning", "Solo pueden ser anuladas cobranzas dentro del periodo en curso");
            res.redirect('/incomes/collections/client/' + clientId); return;
        }

        if (collection !== null) {

            await collection.update({ statusId: CollectionStatus.eStatus.get('deleted').value });   //cambiamos el estado de la cobranza como "anulada"

            UnidentifiedDeposit.findOne({ where: { collectionId: collectionId } })  //buscamos si hay DNIs para esa cobranza y lo ponemos "pendiente"
                .then(unidentifiedDeposit => {
                    if (unidentifiedDeposit !== null) {
                        unidentifiedDeposit.update({ statusId: UnidentifiedDepositStatus.eStatus.get('pending').value })
                            .then(() => {
                                winston.info(`unidentified Deposit ${unidentifiedDeposit.id} updated to pending status`)
                            })
                    }
                })

            //Para cada uno de los valores ingresados corregimos el movimiento en la CC

            for (const collectionSecurity of collection.Securities) {

                if (collectionSecurity.type != 'CH') {

                    const AccountMovement = require('./accountMovements.controller');

                    const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                    let collectionType = accountMovementCategory.eStatus.get('INGRESO_COBRANZA').value;

                    if (collection.batchNumber)
                        collectionType = accountMovementCategory.eStatus.get('IMPORTACION_COBRANZA').value

                    const accountMovement = await AccountMovement.deleteMovement(clientId, collectionSecurity.accountId,
                        collection.periodId, collectionType, collectionSecurity.id)

                    if (accountMovement === null) {
                        winston.error(`It was not possible to delete account movement record for the Collection (ID: ${paymentOrder.id})  - ${err}`);
                        throw new Error("It was not possible to add the collection into the account movements table");
                    }

                    AccountMovement.fixBalanceMovements(clientId, collection.periodId, collectionSecurity.accountId);
                }
            }

            winston.info(`collection ${collectionId} deleted succesfully by user #${req.user.id}`)

            req.flash("success", "la cobranza fue anulada exitosamente en la base de datos");

        } else {
            throw new error("no record found for collectionId " + collectionId);
        }

    } catch (err) {

        winston.error(`An error ocurred while user #${req.user.id} tryed to delete collection ${collectionId} - ${err} `)

        req.flash("error", "Ocurrio un error y no se pudo anular la cobranza en la base de datos");

    } finally {
        res.redirect('/incomes/collections/client/' + clientId);
    }
}

module.exports.showReassignForm = async function (req, res) {

    const clientId = req.params.clientId;

    const collectionId = req.params.collectionId;

    const client = await Client.findByPk(clientId);

    const period = await BillingPeriod.findOne({
        where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    });

    const collection = await Collection.findByPk(collectionId,
        { include: [{ model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] }] });

    res.render("incomes/collections/reassign", { menu: CURRENT_MENU, data: { client, period, collection } });
};

module.exports.reassingCollection = async function (req, res) {

    const clientId = req.body.clientId;

    try {

        const properties = JSON.parse(req.body.tables).properties;

        for (const property of properties) {

            const collectionProperty = await CollectionProperty.findByPk(property.propertyId);

            await collectionProperty.update({ propertyId: property.homeOwnerId })
        }

        winston.info(`properties reassigned successfully for collection ${collectionId} by user #${req.user.id}`)

        req.flash("success", "las propiedades fueron actualizadas exitosamente");

    } catch (error) {

        winston.error(`An error ocurred while user #${req.user.id} tryed to reassign properties for collection ${collectionId} - ${err} `)

        req.flash("error", "Ocurrio un error y no se pudo reasignar las propiedades de la cobranza en la base de datos");

    } finally {
        res.redirect('/incomes/collections/client/' + clientId);
    }

};

module.exports.info = async function (req, res) {

    const clientId = req.params.clientId;
    const collectionId = req.params.collectionId;

    const client = await Client.findByPk(clientId);

    Collection.findByPk(collectionId, {
        include: [
            { model: BillingPeriod }, { model: User },
            { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] },
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

    const clientId = req.params.clientId; //req.body.clientId

    if (!req.file) {
        req.flash("warning", "No se encontro ningun archivo con datos para hacer la importación");
        res.redirect("/incomes/collections/import/new/" + clientId);
        return;
    }

    if (path.extname(req.file.originalname) != '.csv') {
        req.flash("error", "El formato del archivo seleccionado no corresponde, debe ser del tipo CSV (codificación UTF-8)");
        res.redirect("/incomes/collections/import/new/" + clientId);
        return;
    }

    winston.info(`beginning the collections import from file ${req.file.originalname} for client #${clientId} on user #${req.user.id} request`);

    let importCtrl = null; totalRows = 0; let skippedRecords = [];

    try {
        importCtrl = await CollectionImportControl.create(
            {
                clientId: clientId,
                startedAt: Date.now(),
                statusId: ImportCollectionStatus.eStatus.get('started').value,
                userId: req.user.id
            });

        winston.info(`current import control record id is ${importCtrl.id}`);

    } catch (error) {
        winston.error(`An error ocurred while creating the import control register - ${err} `)
    }

    const client = await Client.findByPk(clientId);

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

                    gcs.readCollectionsFileFromGCS(gcsFileName, gcsBucketName)
                        .then(async (readResult) => {

                            let accountCache = []; totalRows = readResult.length;

                            for (index = 0; index < readResult.length; index++) {

                                if (client.internalCode.toUpperCase() === readResult[index].clientCode.toUpperCase()) {

                                    //Implementacion de un cache para el accountID

                                    let valueType = 'DC'; let invalidAccountId = false;

                                    let accountItem = await accountCache.find(element => element.id === readResult[index].accountId);

                                    try {

                                        if (accountItem) {
                                            valueType = accountItem.valueType;
                                        } else {

                                            const account = await Account.findByPk(readResult[index].accountId,
                                                { include: [{ model: AccountType }] });

                                            if (account != undefined) {
                                                if (account.accountType.account === 'CMN') {
                                                    valueType = 'EF'
                                                } else if (account.accountType.account === 'VAL') {
                                                    valueType = 'CH'
                                                } else if (account.accountType.account.slice(-1) === '$') {
                                                    valueType = 'DC'
                                                }

                                                if (account.clientId === client.id)
                                                    accountCache.push({ id: readResult[index].accountId, valueType: valueType })
                                                else {
                                                    invalidAccountId = true;
                                                }
                                            } else {
                                                invalidAccountId = true;
                                            }
                                        }

                                    } catch (err) {
                                        invalidAccountId = true;
                                        skippedRecords.push(index);
                                        winston.warn(`cannot get the accountType for the record #${index}, asuming "DC" - ${err}`);
                                    }

                                    try {

                                        if (invalidAccountId === false) {

                                            collection = await CollectionImport.create({
                                                clientCode: readResult[index].clientCode.toUpperCase(),
                                                propertyType: readResult[index].propertyType.toUpperCase(),
                                                property: readResult[index].property,
                                                accountId: readResult[index].accountId,
                                                conceptType: "IM",
                                                conceptDesc: readResult[index].concept,
                                                valueType: valueType,
                                                valueDesc: readResult[index].value,
                                                amount: readResult[index].amount.replace(".", '').replace(",", '.'),
                                                date: moment(readResult[index].date, "DD/MM/YYYY").toDate(),
                                                controlId: importCtrl.id
                                            });
                                        } else {
                                            skippedRecords.push(index);

                                            winston.warn(`the record #${index} has an invalid AccountID #${readResult[index].accountId} for this client ${readResult[index].clientCode}`)
                                        }

                                    } catch (err) {
                                        skippedRecords.push(index);

                                        winston.error(`An error ocurred while inserting the record #${index} into temp table - ${err}`);
                                    }

                                } else {
                                    skippedRecords.push(index);

                                    winston.warn(`the record #${index} belongs to a different client, invalid clientCode ${readResult[index].clientCode}`)
                                }
                            }
                        })
                        .catch((err) => {
                            winston.error(`An error ocurred while reading the the collections file ${gcsFileName} from bucket ${gcsBucketName} - ${err} `)
                        })
                        .finally(() => {

                            let importedRows = 0;

                            CollectionImport.count({})
                                .then((count) => {
                                    importedRows = count;
                                })
                                .catch((err) => {
                                    winston.error(`An error ocurred while reading imported rows from temp table - ${err} `)
                                })
                                .finally(() => {

                                    importCtrl.totalRows = totalRows;
                                    importCtrl.importedRows = importedRows;
                                    importCtrl.finishedAt = Date.now();
                                    importCtrl.statusId = (totalRows === importedRows ?
                                        ImportCollectionStatus.eStatus.get('importing').value : ImportCollectionStatus.eStatus.get('failed').value);
                                    importCtrl.skippedRows = JSON.stringify(skippedRecords);

                                    importCtrl.save();

                                    winston.info(`the collections temp-import from file ${gcsFileName} requested by user #${req.user.id} finished (total ${importedRows} records)`);

                                    (new Notifications).warning('collections', `el proceso de importacion temporal de cobranzas para el barrio ${client.internalCode} ha finalizado (${importedRows} registros)`, req.user.id)
                                })
                        })
                })
                .catch((err) => {
                    winston.error(`An error ocurred while writing the the collections file ${gcsFileName} from bucket ${gcsBucketName} - ${err} `)
                })
        })
        .catch((err) => {
            winston.error(`An error ocurred while truncating temp collections table - ${err} `)
        });

    res.redirect(`/incomes/collections/import/wait/${clientId}?controlId=${importCtrl.id}`);
}

module.exports.waitImportProcess = function (req, res) {

    const controlId = req.params.controlId || req.query.controlId;

    const clientId = req.params.clientId;

    Client.findByPk(clientId)
        .then((client) => {
            res.render('incomes/collections/import/wait', { menu: CURRENT_MENU_IMPORT, data: { client: client, control: { id: controlId } } });
        })
        .catch((err) => {
            winston.error(`An error ocurred while finding the client record for id #${clientId} - ${err} `)
        });
};

module.exports.killActiveSessions = function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    CollectionImportControl.update(
        { statusId: ImportCollectionStatus.eStatus.get('cancelled').value },
        {
            where: {
                statusId: {
                    [Op.in]: [ImportCollectionStatus.eStatus.get('started').value,
                    ImportCollectionStatus.eStatus.get('importing').value,
                    ImportCollectionStatus.eStatus.get('processing').value
                    ]
                }
            }
        }
    )
        .then((result) => {
            req.flash("success", `La sesiones previas de importacion fueron correctamente desbloqueadas (cant. ${result.length})`);
        })
        .catch((err) => {
            req.flash("error", "Ocurrio un error y no fue posible desbloquear las sesiones previas de importacion, de aviso al administrador");
            winston.error(`An error ocurred and it wans't possible to updated the imported sessions for client id #${clientId} - ${err} `)
        })
        .finally(() => {
            res.redirect('/incomes/collections/import/new/' + clientId);
        })

};

module.exports.listImportedCollections = async function (req, res) {

    const controlId = req.params.controlId || req.query.controlId;

    const clientId = req.body.clientId || req.params.clientId;

    const client = await Client.findByPk(clientId);

    const importCtrl = await CollectionImportControl.findByPk(controlId)

    CollectionImport.findAll(
        {
            where: { clientCode: client.internalCode },
            include: [{ model: Account, include: [{ model: AccountType }] }]
        }
    ).then((collections) => {
        res.render('incomes/collections/import/imports', { menu: CURRENT_MENU_IMPORT, data: { client, collections, control: importCtrl } });
    });
};

module.exports.addNewImportedCollections = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    const controlId = req.body.controlId || req.params.controlId || req.query.controlId;

    let importedRows = 0;

    const client = await Client.findByPk(clientId);

    let promise = new Promise(async function (resolve, reject) {

        winston.info(`starting processing stage to register collections into db for client #${clientId}`);

        let importCtrl = await CollectionImportControl.findByPk(controlId, { include: [{ model: User }] });
        importCtrl.statusId = ImportCollectionStatus.eStatus.get('processing').value;
        importCtrl.save()

        winston.info(`gathering client, periods and collections for controlId #${controlId}`);

        const billingPeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        const collections = await CollectionImport.findAll({
            where: { clientCode: client.internalCode, controlId: controlId },
            include: [{ model: Account, include: [{ model: AccountType }] }]
        });

        try {

            winston.info(`parsing ${collections.length} imported-collections into collections table for controlId #${controlId}`);

            for (index = 0; index < collections.length; index++) {

                const importCollection = collections[index];

                const importProperty = `${importCollection.propertyType}${importCollection.property}`;

                const property = await HomeOwner.findOne({
                    where: { clientId: client.id, property: `${importCollection.propertyType}${importCollection.property}` }
                })

                let isUnidentifiedDeposit = false;

                if (property === null && importProperty.toUpperCase() === 'UF999') {
                    isUnidentifiedDeposit = true;
                }

                let collection = {
                    clientId: client.id,
                    periodId: billingPeriod.id,
                    receiptDate: importCollection.date,
                    receiptNumber: 0,
                    batchNumber: importCtrl.id,
                    amountConcepts: importCollection.amount,
                    amountSecurities: importCollection.amount,
                    securityCode: uuidv4(),
                    comments: 'importación automática de cobranza',
                    statusId: CollectionStatus.eStatus.get('pending').value,
                    userId: req.user.id
                };

                collection = await Collection.create(collection)

                if (isUnidentifiedDeposit === false) {

                    const collectionProperty = await CollectionProperty.create({
                        collectionId: collection.id,
                        propertyId: property.id,
                        amount: importCollection.amount,
                        receiptNumber: null,
                        userId: req.user.id
                    })
                } else {
                    winston.info(`collection ${collection.id} has no property associated, marked as unidentified deposit (DNI)`);
                }

                let collectionConcept = {
                    collectionId: collection.id,
                    type: importCollection.conceptType,
                    description: importCollection.conceptDesc,
                    amount: importCollection.amount,
                    userId: req.user.id
                };

                collectionConcept = await CollectionConcept.create(collectionConcept)

                let collectionSecurity = {
                    collectionId: collection.id,
                    type: importCollection.valueType,
                    description: importCollection.valueDesc,
                    accountId: importCollection.accountId,
                    checkId: null,
                    amount: importCollection.amount,
                    userId: req.user.id
                };

                collectionSecurity = await CollectionSecurity.create(collectionSecurity);

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                //Si se esta usando cheque cargado en el sistema, viene de una cuenta de "Cheques a depositar" y por
                //lo tanto ya esta computado el ingreso en la CC y no se debe insertar nuevamente.
                try {
                    const AccountMovement = require('./accountMovements.controller');

                    const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                    const accountMovement = await AccountMovement.addMovement(clientId, collectionSecurity.accountId, collection.periodId, collectionSecurity.amount,
                        accountMovementCategory.eStatus.get('IMPORTACION_COBRANZA').value, collectionSecurity.id, collection.userId)

                } catch (err) {

                    winston.error(`It was not possible to add account movement record for the imported collection (ID: ${collection.id})`);

                    throw new Error("It was not possible to add the imported collection into the account movements table");
                }

                //assing receiptNumber to collection

                let receiptNumber = await db.sequelize.query(`SELECT nextval('${clientId}','C') as "nextval"`, { type: QueryTypes.SELECT });

                receiptNumber = receiptNumber[0].nextval;

                await collection.update({
                    receiptNumber: receiptNumber,
                    statusId: (isUnidentifiedDeposit === false ? CollectionStatus.eStatus.get('processed').value : CollectionStatus.eStatus.get('pending').value)
                });

                //-------------------------------------------------------------
                // DNI --- > add collection to DNI table
                //-------------------------------------------------------------

                if (isUnidentifiedDeposit === true) {

                    UnidentifiedDeposit.create({
                        collectionId: collection.id,
                        comments: null,
                        statusId: UnidentifiedDepositStatus.eStatus.get('pending').value,
                        userId: req.user.id
                    })
                        .then(unidentifiedDeposit => {
                            winston.info(`a DNI (${importProperty}) record was succesfully created for collection id# ${collection.id} `);
                        })
                        .catch(err => {
                            winston.error(`An error ocurred processing unidentified deposit for collection ${collection.id} - ${err}`)
                        })
                }

                importedRows++;
            }

        } catch (err) {
            winston.error(`an error ocurred trying to insert imported collections into db - ${err} `);
        } finally {
            importCtrl.statusId = ImportCollectionStatus.eStatus.get('completed').value;
            await importCtrl.save();
        }

        resolve();
    })
        .then((resolve) => {
            winston.info(`the import process finished for controlId #${controlId}`);

            (new Notifications).warning('collections',
                `el proceso de importacion de cobranzas para el barrio ${client.internalCode} ha finalizado (${importedRows} registros)`,
                req.user.id)

        })
        .catch((err) => {
            winston.error(`An error ocurred processing imported collections - ${err}`)
        });

    res.redirect(`/incomes/collections/import/wait/${clientId}?controlId=${controlId}`);
}


//-----------------------------------------------------------------
// INVOICES & REPORTS
//-----------------------------------------------------------------

module.exports.createInvoice = function (req, res) {

    const { createReport } = require("../reports/collections/manualCollection.report");

    const clientId = req.params.clientId;
    const collectionId = req.params.collectionId;

    Collection.findByPk(collectionId, {
        include: [{ model: Client }, { model: BillingPeriod },
        { model: User, include: [{ model: Model.userSignature }] },
        { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] },
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
            if (collection.Properties.length > 0) {
                createReport(collection, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))
            } else {
                req.flash("warning", "El deposito seleccionado corresponde a un depósito no identificado (DNI)");
                res.redirect('/incomes/collections/client/' + clientId);
            }
        })
        .catch(err => {
            console.error(err);
        })
};


module.exports.collectionsReport = async function (req, res) {

    const { generateExcel } = require("../reports/collections/collectionsExcel.report");

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    const period = await BillingPeriod.findOne({
        where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value },
    });

    if (period === null) {
        req.flash("warning", "No hay ningun período de liquidación activo");
        res.redirect('/incomes/collections/client/' + clientId);
        return;
    }

    Collection.findAll({
        where: {
            clientId: clientId,
            [Op.or]: [{ periodId: period.id }, { updatePeriodId: period.id }]
        },
        include: [{ model: Client }, { model: BillingPeriod },
        { model: User, include: [{ model: Model.userSignature }] },
        { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] },
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
        order: [["receiptDate", "ASC"]] //, ["receiptNumber", "ASC"]]
    })
        .then(collections => {
            if (collections.length > 0) {
                generateExcel(client, collections, period, req.user, res);
            } else {
                req.flash("warning", "El deposito seleccionado corresponde a un depósito no identificado (DNI)");
                res.redirect('/incomes/collections/client/' + clientId);
            }
        })
        .catch(err => {
            console.error(err);
        })
};

//-----------------------------------------------------------------
// AJAX
//-----------------------------------------------------------------

module.exports.checkImportProcess = function (req, res) {

    const controlId = req.params.controlId;

    CollectionImportControl.findByPk(controlId)
        .then((result) => { res.send(result) })
        .catch((err) => { res.sendStatus(400).send(err); })
};
