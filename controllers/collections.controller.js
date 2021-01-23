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
const CollectionImport = Model.collectionImport

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const path = require("path");

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'collections_manual'; module.exports.CURRENT_MENU = CURRENT_MENU;

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

    res.render("incomes/collections/add.ejs", { menu: CURRENT_MENU, data: { client, clientAccounts: Accounts, period } });
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

module.exports.importCollections = async function (req, res) {

    const gcs = require('../helpers/gcs.helper');

    gcs.readFileFromGCS('collections/ImpoCobranzas.csv')
        .then(async (result) => {

            await CollectionImport.destroy({ truncate: true, cascade: false });

            for (i = 0; i < result.length; i++) {
                try {
                    const item = result[i];
                    let collection = {
                        clientCode: item.Codigo,
                        propertyType: item.Tipo,
                        property: item.Propiedad,
                        accountId: item.Cuenta,
                        conceptDesc: item.Concepto,
                        valueDesc: item.Valores,
                        amount: item.Importe,
                        date: item.Fecha,
                    };
                    collection = await CollectionImport.create(collection);
                } catch (err) {
                    console.error(err);
                }


            }
        })
        .catch((err) => {
            console.log(err)
        })
        .finally(() => {

            const sequelize = require('sequelize');

            let importedRows = 0;

            CollectionImport.count({})
                .then((count) => {
                    importedRows = count; console.log(count)
                })
                .catch((err) => {
                    console.error(err)
                })
                .finally(() => {
                    res.redirect('/incomes/collections/import/finish?rows=' + importedRows);
                })
        })
}