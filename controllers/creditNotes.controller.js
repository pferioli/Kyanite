const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;
const PaymentOrder = Model.paymentOrder;
const CreditNote = Model.creditNote;
const BillingPeriod = Model.billingPeriod;
const Bank = Model.bank;
const Account = Model.account;
const AccountType = Model.accountType;
const AccountingImputation = Model.accountingImputation;
const AccountingGroup = Model.accountingGroup;
const CheckSplitted = Model.checkSplitted;
const Check = Model.check;
const Supplier = Model.supplier;
const User = Model.user;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const _ = require('underscore');

const CURRENT_MENU = 'creditNotes'; module.exports.CURRENT_MENU = CURRENT_MENU;

const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;
const PaymentReceiptStatus = require('../utils/statusMessages.util').PaymentReceipt;
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;
const CheckStatus = require('../utils/statusMessages.util').Check;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;
const CreditNoteStatus = require('../utils/statusMessages.util').CreditNote;

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

    const status = (showAll === true) ? [0, 1, 2, 3, 4] : [1, 2, 3]; //CreditNoteStatus

    let options = {
        where: {
            periodId: {
                [Op.in]: periods
            },
            statusId: { [Op.in]: status }
        },
        include: [
            {
                model: PaymentReceipt, where: { clientId: clientId }, include: [{ model: ReceiptType }, { model: Supplier }],
            },
            { model: PaymentOrder }, { model: BillingPeriod }, { model: Account, include: [{ model: AccountType }] }, { model: User }
        ],
    };

    const client = await Client.findByPk(clientId);

    const creditNotes = await CreditNote.findAll(options);

    res.render('creditNotes/creditNotes',
        {
            menu: CURRENT_MENU,
            data: { client: client, creditNotes: creditNotes, periods: periods },
            params: { showAll: showAll, autoRefresh: autoRefresh }
        });
};

module.exports.showNewForm = async function (req, res) {

    const clientId = req.params.clientId;
    const paymentReceipts = await PaymentReceipt.findAll({
        where: {
            clientId: clientId,
            statusId: {
                [Op.in]: [
                    PaymentReceiptStatus.eStatus.get('pending').value,
                    PaymentReceiptStatus.eStatus.get('inprogress').value,
                    PaymentReceiptStatus.eStatus.get('processed').value
                ]
            }
        },
        include: [{ model: Supplier }],
        attributes: ['id']
    });

    if (paymentReceipts.length === 0) {
        req.flash("warning", "No se encontraron facturas en estado pendiente, en progreso o procesada, imposible continuar");
        res.redirect(`/creditNotes/client/${clientId}`); return;
    }

    const client = await Client.findByPk(clientId);

    let supplierIds = [];

    for (const paymentReceipt of paymentReceipts) {
        supplierIds.push(paymentReceipt.supplier.id)
    }

    supplierIds = _.uniq(supplierIds);  //eliminamos si hay proveedores duplicados

    const suppliers = await Supplier.findAll({
        where: { id: { [Op.in]: supplierIds } }
    })

    const accounts = await Account.findAll({ include: [{ model: AccountType }], where: { clientId: clientId } });

    res.render('creditNotes/add', { menu: CURRENT_MENU, data: { client, suppliers, accounts } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    CreditNote.create({
        clientId: clientId,
        periodId: req.body.billingPeriodId,
        paymentReceiptId: req.body.receiptId,
        paymentOrderId: 0,
        accountId: req.body.accountId,
        amount: req.body.creditNoteAmount,
        emissionDate: req.body.emissionDate,
        comments: req.body.comments,
        statusId: CreditNoteStatus.eStatus.get('pending').value,
        userId: req.user.id,
    })
        .then(creditNote => {

            const paymentOrder = {
                clientId: clientId,
                receiptId: creditNote.paymentReceiptId,
                billingPeriodId: creditNote.periodId,
                accountId: creditNote.accountId,
                checkId: undefined,
                paymentDate: creditNote.emissionDate,
                paymentOrderAmount: (-1) * Number.parseFloat(creditNote.amount),
                userId: creditNote.userId
            }

            const paymentOrdersController = require('./paymentOrders.controller')

            paymentOrdersController.createPaymentOrder(paymentOrder, function (paymentOrder, error) {

                if (error) {
                    req.flash("error", "Ocurrio un error y no se pudo crear la nota de crédito");
                    winston.error(`An error ocurred while user #${req.user.id} tryed to create a new credit note ${JSON.stringify(req.body)} - ${error.message}`);
                } else {

                    creditNote.update({
                        paymentOrderId: paymentOrder.id,
                        statusId: CreditNoteStatus.eStatus.get('processed').value,
                    })
                        .then(creditNote => {
                            req.flash("success", "Nota de crédito agregada exitosamente");
                            winston.info(`User #${req.user.id} created succesfully a credit note #${creditNote.id} ${JSON.stringify(creditNote)}`);
                        })
                        .catch(err => {
                            req.flash("error", "Ocurrio un error y no se pudo crear la nota de crédito");
                            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new credit note ${JSON.stringify(req.body)} - ${err}`);
                        })
                        .finally(() => {
                            res.redirect('/creditNotes/client/' + clientId);
                        })
                }
            })
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se pudo crear la nota de crédito");
            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new credit note ${JSON.stringify(req.body)} - ${err}`);
            res.redirect(`/creditNotes/client/${clientId}`);
        })
}