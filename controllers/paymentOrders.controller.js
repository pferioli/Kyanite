const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;
const PaymentOrder = Model.paymentOrder;
const BillingPeriod = Model.billingPeriod;
const Account = Model.account;
const AccountType = Model.accountType;
const CheckSplitted = Model.checkSplitted;
const Check = Model.check;
const Supplier = Model.supplier;
const User = Model.user;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'paymentOrders'; module.exports.CURRENT_MENU = CURRENT_MENU;

const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;

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
            periodId: {
                [Op.in]: periods
            },
            statusId: { [Op.in]: status }
        },
        include: [{ model: CheckSplitted, include: [{ model: Check }] },
        {
            model: PaymentReceipt, where: { clientId: clientId }, include: [{ model: ReceiptType }, { model: Supplier }],
        },
        { model: BillingPeriod }, { model: Account, include: [{ model: AccountType }] }, { model: User }],
    };

    const client = await Client.findByPk(clientId);

    const paymentOrders = await PaymentOrder.findAll(options);

    res.render('expenses/paymentOrders/paymentOrders',
        {
            menu: CURRENT_MENU,
            data: { client: client, paymentOrders: paymentOrders, periods: periods },
            params: { showAll: showAll, autoRefresh: autoRefresh }
        });
};

module.exports.calculateRemainingBalance = async function (paymentReceiptId) {

    const paymentReceipt = await PaymentReceipt.findByPk(paymentReceiptId)

    const paymentOrdersTotal = await PaymentOrder.sum('amount',
        {
            where: {
                paymentReceiptId: paymentReceiptId,
                statusId: {
                    [Op.in]: [PaymentOrderStatus.eStatus.get('pending').value, PaymentOrderStatus.eStatus.get('inprogress').value, PaymentOrderStatus.eStatus.get('processed').value]
                }
            }
        });

    return parseFloat(paymentReceipt.amount - paymentOrdersTotal);
}