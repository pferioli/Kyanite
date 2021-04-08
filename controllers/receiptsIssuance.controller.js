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
const User = Model.user;
const Check = Model.check;
const CheckSplitted = Model.checkSplitted;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'receiptsIssuance'; module.exports.CURRENT_MENU = CURRENT_MENU;

const CollectionStatus = require('../utils/statusMessages.util').Collection;
const Notifications = require('../utils/notifications.util');

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

    let options = {
        include: [
            { model: HomeOwner }, { model: User },
            {
                model: Collection,
                where: {
                    clientId: clientId,
                    periodId: {
                        [Op.in]: periods
                    },
                    statusId: CollectionStatus.eStatus.get('processed').value
                },
                include: [{ model: Client }, { model: BillingPeriod }, { model: User }]
            }
        ]
    };

    const client = await Client.findByPk(clientId);

    const collections = await CollectionProperty.findAll(options);

    res.render('incomes/receiptsIssuance/propertiesSelection',
        {
            menu: CURRENT_MENU,
            data: { client: client, collections: collections, periods: periods }
        });
};

// Date.prototype.toJSON = function () { return this.toLocaleString(); }

module.exports.printReceipts = async function (req, res) {

    const clientId = req.body.clientId;

    Object.setPrototypeOf(req.body, {});

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

    let options = {
        include: [
            { model: HomeOwner }, { model: User },
            {
                model: Collection,
                where: {
                    clientId: clientId,
                    periodId: {
                        [Op.in]: periods
                    },
                    statusId: CollectionStatus.eStatus.get('processed').value
                },

                include: [
                    { model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
                    { model: CollectionConcept, as: "Concepts", },
                    {
                        model: CollectionSecurity, as: "Securities", include: [
                            {
                                model: CheckSplitted, include: [{ model: Model.check }]
                            },
                            {
                                model: Account, include: [{ model: AccountType }, { model: Model.bank }]
                            }]
                    }]
            }
        ]
    };

    if (req.body.hasOwnProperty('collections') === true) {
        options.where = {
            id: { [Op.in]: req.body.collections }
        }
    }

    const collections = await CollectionProperty.findAll(options);

    const { createReport } = require("../reports/collections/finalCollection.report");

    createReport(collections, res)

    //const response = { result: true };

    //res.status(200).send(response);
}
