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

    const autoRefresh = (req.query.refresh === undefined || req.query.refresh.toLowerCase() === 'false' ? false : true);
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
            params: { showAll: showAll, autoRefresh: autoRefresh }
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
            ammountConcepts: req.body.ammountConcepts,
            ammountSecurities: req.body.ammountSecurities,
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
                    ammount: parseFloat(tables.concepts[index].ammount.replace(/[^0-9\.-]+/g, "")),
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
                    ammount: parseFloat(tables.values[index].ammount.replace(/[^0-9\.-]+/g, "")),
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

    const { createInvoice } = require("../helpers/invoiceGenerator.helper");

    const invoice = {
        shipping: {
            name: "John Doe",
            address: "1234 Main Street",
            city: "San Francisco",
            state: "CA",
            country: "US",
            postal_code: 94111
        },
        items: [
            {
                item: "TC 100",
                description: "Toner Cartridge",
                quantity: 2,
                amount: 6000
            },
            {
                item: "USB_EXT",
                description: "USB Cable Extender",
                quantity: 1,
                amount: 2000
            }
        ],
        subtotal: 8000,
        paid: 0,
        invoice_nr: 1234
    };
    let promise = new Promise(function (resolve, reject) {
        createInvoice(invoice, path.join(__dirname, "..", "public", "invoice.pdf"))
    })
}