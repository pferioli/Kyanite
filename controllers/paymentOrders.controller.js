const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;
const PaymentOrder = Model.paymentOrder;
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

const CURRENT_MENU = 'paymentOrders'; module.exports.CURRENT_MENU = CURRENT_MENU;

const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;
const PaymentReceiptStatus = require('../utils/statusMessages.util').PaymentReceipt;
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;
const CheckStatus = require('../utils/statusMessages.util').Check;
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

    const status = (showAll === true) ? [0, 1, 2, 3, 4] : [1, 2, 3];

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

module.exports.createInvoice = function (req, res) {

    const { createSingleReport } = require("../reports/paymentOrders/paymentOrder.report");

    const clientId = req.params.clientId;
    const paymentOrderId = req.params.paymentOrderId;

    PaymentOrder.findByPk(paymentOrderId, {
        include: [
            {
                model: PaymentReceipt, include: [{ model: Client }, { model: Supplier }, { model: ReceiptType }, { model: AccountingImputation, include: [{ model: AccountingGroup }] }]
            },
            { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] }, { model: Account, include: [{ model: AccountType }, { model: Bank }] },
            { model: CheckSplitted, include: [{ model: Check }] }
        ]
    })
        .then(paymentOrder => {
            createSingleReport(paymentOrder, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))
        })
        .catch(err => {
            console.error(err);
        })
};

module.exports.printPaymentOrders = function (req, res) {

    const { createMultipleReport } = require("../reports/paymentOrders/paymentOrder.report");

    const paymentOrderIds = req.body.paymentOrders;

    PaymentOrder.findAll(
        {
            where: { id: { [Op.in]: paymentOrderIds } },
            include: [
                {
                    model: PaymentReceipt, include: [{ model: Client }, { model: Supplier }, { model: ReceiptType }, { model: AccountingImputation, include: [{ model: AccountingGroup }] }]
                },
                { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] }, { model: Account, include: [{ model: AccountType }, { model: Bank }] },
                { model: CheckSplitted, include: [{ model: Check }] }
            ]
        })
        .then(paymentOrder => {
            createMultipleReport(paymentOrder, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))
        })
        .catch(err => {
            console.error(err);
        })
};

module.exports.createPO = async function (req, res) {

    const clientId = req.params.clientId;
    const receiptId = req.params.receiptId;

    let remainingBalance = await this.calculateRemainingBalance(receiptId);

    PaymentOrder.create(
        {
            paymentReceiptId: receiptId,
            poNumber: 0,
            periodId: req.body.billingPeriodId,
            accountId: req.body.accountId,
            checkId: ((req.body.checkId === undefined) || (req.body.checkId === '') ? null : req.body.checkId),
            paymentDate: req.body.paymentDate,
            amount: req.body.paymentOrderAmount,
            statusId: PaymentOrderStatus.eStatus.get('disabled').value,
            userId: req.user.id
        })
        .then(async (paymentOrder) => {

            //-----------------------------------------------------------------
            // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
            //-----------------------------------------------------------------

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            const accountMovement = await AccountMovement.addMovement(clientId, paymentOrder.accountId, paymentOrder.periodId, (-1) * paymentOrder.amount,
                accountMovementCategory.eStatus.get('PAGO_PROVEEDOR').value, paymentOrder.id, paymentOrder.userId)

            if (accountMovement === null) {
                winston.error(`It was not possible to add account movement record for the PO (ID: ${paymentOrder.id})  - ${err}`);
                throw new Error("It was not possible to add the PO into the account movements table");
            }

            //Buscamos el PO Number desde la secuencia !

            let poNumber = await db.sequelize.query(`SELECT nextval('${clientId}','P') as "nextval"`, { type: QueryTypes.SELECT });

            poNumber = poNumber[0].nextval;

            paymentOrder.update({
                poNumber: poNumber,
                statusId: PaymentOrderStatus.eStatus.get('processed').value
            })
                .then(async (paymentOrder) => {

                    const checkId = req.body.checkId;

                    if (checkId) {

                        const splittedCheck = await CheckSplitted.findByPk(checkId);

                        splittedCheck.update({ statusId: SplitCheckStatus.eStatus.get('assigned').value })
                            .then((checkUpdate) => {
                                console.log(checkUpdate)
                            })

                        //Si se completo la utilizacion del cheque hay que pasarlo a ENTREGADO_PAGO_PROVEEDORES

                        const calculateCheckRemainingBalance = require('./splittedChecks.controller').calcRemainingBalance;

                        const remainingBalance = await calculateCheckRemainingBalance(checkId, 'O');

                        if (remainingBalance === 0) {
                            Check.findByPk(splittedCheck.checkId).then(check => {
                                check.update({ statusId: CheckStatus.eStatus.get('delivered').value })
                                    .then(() => {
                                        winston.info(`when processing PO ${paymentOrder.id} the check #${checkId} status changed to "Delivered"`);
                                    })
                            });
                        };
                    }

                    PaymentReceipt.findByPk(receiptId)
                        .then((paymentReceipt) => {

                            let prStatus = PaymentReceiptStatus.eStatus.get('inprogress').value;

                            if ((remainingBalance - Number.parseFloat(paymentOrder.amount)) <= 0) {
                                prStatus = PaymentReceiptStatus.eStatus.get('processed').value;
                            }

                            paymentReceipt.update({ statusId: prStatus })
                                .then(() => {
                                    req.flash("success", `La OP #${poNumber} se genero correctamente en la base de datos`);
                                })
                                .catch((err) => {
                                    req.flash("error", "Ocurrio un error y no se pudo actualizar el estado del recibo para la OP en la base de datos");
                                    winston.error(`An error ocurred while user #${req.user.id} tryed to update the PO number for record id #${paymentOrder.id}  - ${err}`);
                                })
                                .finally(() => {
                                    res.redirect('/expenses/paymentReceipts/client/' + clientId);
                                })
                        })
                })
                .catch((err) => {
                    req.flash("error", "Ocurrio un error y no se pudo actualizar el numero de recibo para la OP en la base de datos");
                    winston.error(`An error ocurred while user #${req.user.id} tryed to update the PO number for record id #${paymentOrder.id}  - ${err}`);
                    res.redirect('/expenses/paymentReceipts/client/' + clientId);
                })

        })
        .catch((err) => {
            req.flash("error", "Ocurrio un error y no se pudo crear el registro de la OP en la base de datos");
            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new PO ${JSON.stringify(req.body)} - ${err}`);
            res.redirect('/expenses/paymentReceipts/client/' + clientId);
        })
}

module.exports.deletePaymentOrder = async function (clientId, paymentOrderId) {

    //anulamos la OP

    const paymentOrder = await PaymentOrder.findByPk(paymentOrderId);

    await paymentOrder.update({
        statusId: PaymentOrderStatus.eStatus.get('deleted').value
    });

    //cambiamos el estado del comprobante a pending o inprogress segun el saldo

    const paymentReceipt = await PaymentReceipt.findByPk(paymentOrder.paymentReceiptId);

    const remainingBalance = await this.calculateRemainingBalance(paymentOrder.paymentReceiptId);

    let paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('pending').value;

    if (paymentReceipt.amount > remainingBalance) {
        paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('inprogress').value;
    }

    await paymentReceipt.update({ statusId: paymentReceiptStatusId });

    //eliminamos el movimiento de la CC del barrio

    const AccountMovement = require('./accountMovements.controller');

    const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

    const accountMovement = await AccountMovement.deleteMovement(clientId, paymentOrder.accountId, paymentOrder.periodId,
        accountMovementCategory.eStatus.get('PAGO_PROVEEDOR').value, paymentOrder.id);

};

module.exports.deletePO = async function (req, res) {

    const paymentOrderId = req.body.paymentOrderId;

    const clientId = req.body.clientId;

    try {

        deletePaymentOrder(clientId, paymentOrderId);

        req.flash("success", `La OP #${paymentOrder.poNumber} fue anulada correctamente`);

    } catch (err) {

        req.flash("error", "Ocurrio un error y no se pudo anular correctamente el registro de la OP en la base de datos");

        winston.error(`An error ocurred while user #${req.user.id} deleted the PO ${paymentOrderId}  - ${err}`);

    } finally {
        res.redirect('/expenses/paymentOrders/client/' + clientId);
    }
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
