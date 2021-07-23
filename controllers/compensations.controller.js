const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Supplier = Model.supplier;
const SupplierCategory = Model.supplierCategory;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;
const PaymentOrder = Model.paymentOrder;
const BillingPeriod = Model.billingPeriod;
const AccountingImputation = Model.accountingImputation;
const AccountingGroup = Model.accountingGroup;
const Account = Model.account;
const AccountType = Model.accountType;
const CheckSplitted = Model.checkSplitted;
const User = Model.user;
const Compensation = Model.compensation;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'compensations'; module.exports.CURRENT_MENU = CURRENT_MENU;

const CompensationsStatus = require('../utils/statusMessages.util').Compensation;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    let periods = [];

    if (req.query.periodId != undefined) {
        periods = req.query.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }
    }

    const autoRefresh = (req.query.refresh === undefined || req.query.refresh.toLowerCase() === 'false' ? false : true);
    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    const status = (showAll === true) ? [0, 1, 2, 3, 4, 5] : [1, 2];

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            statusId: { [Op.in]: status }
        },
        include: [
            { model: BillingPeriod }, { model: User },
            { model: Account, include: [{ model: AccountType }] },
            { model: AccountingImputation, include: [{ model: AccountingGroup }] }
        ],
    };

    const client = await Client.findByPk(clientId);

    const compensations = await Compensation.findAll(options);

    res.render('compensations/compensations',
        {
            menu: CURRENT_MENU,
            data: { client: client, compensations: compensations },
            params: { showAll: showAll, autoRefresh: autoRefresh }
        });

};

module.exports.showNewForm = async function (req, res) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    const clientAccounts = await Account.findAll({ include: [{ model: AccountType }], where: { clientId: clientId } });

    res.render('compensations/add', { menu: CURRENT_MENU, data: { client, clientAccounts } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;


};
