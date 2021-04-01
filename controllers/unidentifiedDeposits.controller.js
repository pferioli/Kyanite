const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const Client = Model.client;
const Collection = Model.collection;
const CollectionProperty = Model.collectionProperty;
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
                        { model: Client }, { model: BillingPeriod },
                        { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] },
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

module.exports.showIdentifyDepositForm = async function (req, res) {

    const unidentifiedDeposit = await UnidentifiedDeposit.findByPk(req.params.depositId,
        { include: [{ model: Collection, include: [{ model: Client }, { model: BillingPeriod }] }] });

    //ofrecer la lista de propiedades para vincular con el deposito

    //deberia ser 1 o mas y vincular cada propiedad con un parcial del importe

    res.render('incomes/unidentifiedDeposits/identify',
        {
            menu: CURRENT_MENU,
            data: { client: unidentifiedDeposit.collection.client, period: unidentifiedDeposit.collection.billingPeriod, unidentifiedDeposit: unidentifiedDeposit }
        });
}

module.exports.identifyDeposit = async function (req, res) {

    const depositId = req.params.depositId;

    const clientId = req.body.clientId;

    //pasar la cobranza a PROCESADO

    //pasar el deposito a PROCESADO


    res.redirect("/incomes/unidentifiedDeposits/client/" + clientId);
}

