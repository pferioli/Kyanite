const Sequelize = require('sequelize');
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
const User = Model.user;
const UnidentifiedDeposit = Model.unidentifiedDeposit;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'unidentifiedDeposits'; module.exports.CURRENT_MENU = CURRENT_MENU;

const CollectionStatus = require('../utils/statusMessages.util').Collection;
const UnidentifiedDepositStatus = require('../utils/statusMessages.util').UnidentifiedDepositStatus;
const Notifications = require('../utils/notifications.util');

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    const client = await Client.findByPk(clientId);

    const unidentifiedDeposits = await UnidentifiedDeposit.findAll(
        {
            where: { statusId: UnidentifiedDepositStatus.eStatus.get('pending').value },
            include: [
                { model: User },
                {
                    model: Collection,
                    include: [
                        { model: Client }, { model: BillingPeriod }, { model: HomeOwner },
                        { model: CollectionConcept, as: "Concepts" },
                        { model: CollectionSecurity, as: "Securities", include: [{ model: Account, include: [{ model: AccountType }] }] }
                    ]
                }
            ]
        });

res.render('incomes/unidentifiedDeposits/unidentifiedDeposits',
    {
        menu: CURRENT_MENU,
        data: { client: client, unidentifiedDeposits: unidentifiedDeposits }
    });
};

module.exports.identifyDeposit = async function (req, res) {
}
