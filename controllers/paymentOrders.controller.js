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

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'paymentOrders'; module.exports.CURRENT_MENU = CURRENT_MENU;

const PaymentReceiptStatus = require('../utils/statusMessages.util').PaymentReceipt;
const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;

module.exports.listAll = async function (req, res) {
}


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