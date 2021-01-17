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

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'collections_manual'; module.exports.CURRENT_MENU = CURRENT_MENU;

const CollectionStatus = require('../utils/statusMessages.util').Collections;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

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

    const clientId = req.params.clientId;

    const tables = JSON.parse(req.body.tables); //console.log(tables);

    const results = await db.sequelize.query(`SELECT nextval('test') as "nextval"`, { type: QueryTypes.SELECT });

    const collection = {
        clientId: clientId,
        periodId: req.body.billingPeriodId,
        propertyId: req.body.homeOwnerId,
        receiptDate: req.body.emissionDate,
        receiptNumber: "0000",
        batchNumber: null,
        ammountConcepts: req.body.ammountConcepts,
        ammountSecurities: req.body.ammountSecurities,
        securityCode: uuidv4(),
        comments: req.body.comments,
        statusId: CollectionStatus.eStatus.get('pending').value,
        userId: req.user.id
    }

    winston.info(`New manual Collection will be added to database ${collection}`)

    let collectionResult = await Collection.create(collection)

    if (collectionResult) {

        winston.info(`the collection was saved succesfully - id: ${collectionResult.id}`)
        winston.info(`now saving ${tables.concepts.length} concepts for collectionId: ${collectionResult.id}`)

        //TABLE CONCEPTS --> CONCEPTS

        for (index = 0; index < tables.concepts.length; index++) {

            const collectionConcepts = {
                collectionId: collectionResult.id,
                type: tables.concepts[index].type,
                description: tables.concepts[index].concept,
                ammount: parseFloat(tables.concepts[index].ammount.replace(/[^0-9\.-]+/g, "")),
                userId: req.user.id
            }

            const collectionConceptResult = await CollectionConcept.create(collectionConcepts)

            if (collectionConceptResult) {
                winston.info(`the collection concept (${collectionConcepts.type}) was saved succesfully - collectionId: ${collectionResult.id} id: ${collectionConceptResult.id}`)
            }
        }

        //TABLE SECURITIES --> SECURITIES

        for (index = 0; index < tables.values.length; index++) {

            const collectionSecurity = {
                collectionId: collectionResult.id,
                type: tables.values[index].type,
                description: tables.values[index].comment,
                accountId: null,
                checkId: null,
                ammount: parseFloat(tables.values[index].ammount.replace(/[^0-9\.-]+/g, "")),
                userId: req.user.id
            };

            if (collectionSecurity.type === "EF") {
                collectionSecurity.accountId = tables.values[index].valueId
            }

            if (collectionSecurity.type === "DC") {
                collectionSecurity.accountId = tables.values[index].valueId
            }

            if (collectionSecurity.type === "CH") {
                const check = await CheckSplitted.findByPk(tables.values[index].valueId, { include: [{ model: Check }] });
                collectionSecurity.accountId = check.check.accountId;
                collectionSecurity.checkId = check.id;
            }

            const collectionSecurityResult = await CollectionSecurity.create(collectionSecurity)

            if (collectionSecurityResult) {
                winston.info(`the collection security (${collectionSecurity.type}) was saved succesfully - collectionId: ${collectionResult.id} id: ${collectionSecurity.id}`)
            }
        }
    }

    res.redirect('/incomes/collections/client/' + clientId);

    // Collection.create(collection).
    //     then(function (result) {

    //         winston.info(`Collection created succesfully - ${result.id}`)
    //         req.flash(
    //             "success",
    //             "La cobranza ha sido registrada correctamente"
    //         )
    //     })
    //     .catch(function (err) {
    //         winston.error(`An error ocurred while user #${req.user.id} tryed to create a new collection ${JSON.stringify(collection)} - ${err}`)
    //         req.flash(
    //             "error",
    //             "Ocurrio un error y no se pudo agregar la nueva cobranza en la base de datos"
    //         )
    //     })
    //     .finally(() => {
    //         res.redirect('/incomes/collections/client/' + clientId);
    //     })

};

// module.exports.receiptTypes = async function (req, res) {
//     const receiptTypes = await ReceiptType.findAll({ where: { enabled: true } });
//     res.send(receiptTypes)
// };

// module.exports.receiptTypesByID = async function receiptTypesByID(req, res) {
//     const receiptTypeId = req.params.id;
//     const receiptTypes = await ReceiptType.findByPk(receiptTypeId);
//     res.send(receiptTypes)
// };
