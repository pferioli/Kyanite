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
const AccountMovement = Model.accountMovement;
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

async function getExpensesReportRecords(clientId, periods) {

    return PaymentOrder.findAll({
        where: {
            periodId: { [Op.in]: periods },
            statusId: PaymentOrderStatus.eStatus.get('processed').value
        },
        include: [
            { model: CheckSplitted, include: [{ model: Check }] },
            {
                model: PaymentReceipt,
                where: { clientId: clientId },
                include: [{ model: ReceiptType }, { model: Supplier }, { model: AccountingImputation, include: [{ model: AccountingGroup }] }],
            },
            { model: BillingPeriod }, { model: Account, include: [{ model: AccountType }] }
        ],
        order: [
            [{ model: PaymentReceipt }, { model: AccountingImputation }, 'groupId', 'ASC'],
            [{ model: PaymentReceipt }, { model: AccountingImputation }, 'id', 'ASC']
        ]
    })
        .then(paymentOrders => {
            return paymentOrders;
        })
};

module.exports.expensesReport = async function (req, res) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    let periods = [];

    if (req.query.periodId === undefined) {
        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }

    } else {
        periods = req.query.periodId.split(',');
    }

    const paymentOrders = await getExpensesReportRecords(clientId, periods);

    res.render('expenses/paymentOrders/paymentOrdersReport',
        {
            menu: CURRENT_MENU,
            data: { client: client, paymentOrders: paymentOrders, periods },
        });
};

module.exports.downloadExpensesReport = async function (req, res) {

    const clientId = req.params.clientId;

    const reportType = req.query.reportType;

    const client = await Client.findByPk(clientId);

    let periods = []; let periodIds = [];

    if (req.query.periods === undefined) {
        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 }
        });

        if (activePeriod === null) {
            req.flash("warning", "No hay ningún período de liquidación activo"); res.redirect(`/expenses/paymentOrders/client/${clientId}/report`); return;
        }

        periods.push(activePeriod); periodIds.push(activePeriod.id);

    } else {

        periodIds = req.query.periods.split(',');

        periods = await BillingPeriod.findAll({
            where: {
                id: {
                    [Op.in]: periodIds
                }
            }
        });

    }

    // let paymentOrders = [];

    // if (periodIds.length === 1) {
    //     paymentOrders.push(await getExpensesReportRecords(clientId, periodIds));
    // } else {
    //     for (const period of periods) {
    //         paymentOrders.push(await getExpensesReportRecords(clientId, [period.id]));
    //     }
    // }

    const paymentOrders = await getExpensesReportRecords(clientId, periodIds);

    if (reportType.toLowerCase() === 'xls') {

        const { generateExcel } = require("../reports/paymentOrders/expensesExcel.report");

        try {
            generateExcel(client, paymentOrders, periods, req.user, res);
        } catch (error) {
            winston.error(`An error ocurred creating the excel expenses report file - ${error}`);
        }
    }

    if (reportType.toLowerCase() === 'pdf') {

        const { createReport } = require("../reports/paymentOrders/expenses.report");

        try {
            createReport(paymentOrders, client, periods, req.user, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))
        } catch (error) {
            winston.error(`An error ocurred creating the pdf expenses report file - ${error}`);
        }
    }

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
            winston.info(`OPs file report creation on user ${req.user.id} request started for the following ids ${paymentOrderIds.join()}`);
            createMultipleReport(paymentOrder, res);
            winston.info(`OPs file report creation on user ${req.user.id} finished`);

        })
        .catch(err => {
            winston.error(`the OPs pdf file report creation failed - ${err}`);
        })
};

module.exports.createPO = async function (req, res) {

    const clientId = req.params.clientId;
    const receiptId = req.params.receiptId;

    const paymentOrder = {
        clientId: clientId,
        receiptId: receiptId,
        billingPeriodId: req.body.billingPeriodId,
        accountId: req.body.accountId,
        checkId: req.body.checkId,
        paymentDate: req.body.paymentDate,
        paymentOrderAmount: req.body.paymentOrderAmount,
        userId: req.user.id
    }

    this.createPaymentOrder(paymentOrder, function (paymentOrder, error) {
        if (error) {
            req.flash('error', error.message);
        } else {
            req.flash('success', `La OP #${paymentOrder.poNumber} se genero correctamente en la base de datos`);
        }

        res.redirect('/expenses/paymentReceipts/client/' + clientId);
    })
}

module.exports.createPaymentOrder = async function (paymentOrder, callback) {

    const clientId = paymentOrder.clientId;
    const receiptId = paymentOrder.receiptId;

    PaymentOrder.create(
        {
            paymentReceiptId: receiptId,
            poNumber: 0,
            periodId: paymentOrder.billingPeriodId,
            accountId: paymentOrder.accountId,
            checkId: ((paymentOrder.checkId === undefined) || (paymentOrder.checkId === '') ? null : paymentOrder.checkId),
            paymentDate: paymentOrder.paymentDate,
            amount: paymentOrder.paymentOrderAmount,
            statusId: PaymentOrderStatus.eStatus.get('disabled').value,
            userId: paymentOrder.userId
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

                    const checkId = paymentOrder.checkId;

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
                        .then(async paymentReceipt => {

                            let remainingBalance = await this.calculateRemainingBalance(receiptId);

                            let prStatus = PaymentReceiptStatus.eStatus.get('inprogress').value;

                            //if ((remainingBalance - Number.parseFloat(paymentOrder.amount)) <= 0) {

                            if (remainingBalance <= 0) {
                                prStatus = PaymentReceiptStatus.eStatus.get('processed').value;
                            }

                            winston.info(`PO ${poNumber} (id #${paymentOrder.id}) remaining balance is $${remainingBalance.toFixed(2)}, new status for payment receipt is ${prStatus}`);

                            paymentReceipt.update({ statusId: prStatus })
                                .then(() => {
                                    callback(paymentOrder);
                                })
                                .catch((err) => {
                                    winston.error(`An error ocurred while user #${paymentOrder.userId} tryed to update the PO number for record id #${paymentOrder.id} - ${err}`);
                                    callback(undefined, { message: "Ocurrio un error y no se pudo actualizar el estado del recibo para la OP en la base de datos" });
                                })
                            // .finally(() => {
                            //     res.redirect('/expenses/paymentReceipts/client/' + clientId);
                            // })
                        })
                })
                .catch((err) => {
                    winston.error(`An error ocurred while user #${paymentOrder.userId} tryed to update the PO number for record id #${paymentOrder.id}  - ${err}`);
                    callback(undefined, { message: "Ocurrio un error y no se pudo actualizar el numero de recibo para la OP en la base de datos" });
                })
        })
        .catch((err) => {
            winston.error(`An error ocurred while user #${paymentOrder.userId} tryed to create a new PO ${JSON.stringify(paymentOrder)} - ${err}`);
            callback(undefined, { message: "Ocurrio un error y no se pudo crear el registro de la OP en la base de datos" });
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

    if (remainingBalance <= 0) {
        paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('processed').value;
    } else if (remainingBalance < Number(paymentReceipt.amount)) {
        paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('inprogress').value;
    }

    winston.info(`The payment receipt  id #${paymentReceipt} for PO #${paymentOrderId} has a remaining balance of ${remainingBalance}, changing status to ${paymentReceiptStatusId}`);

    await paymentReceipt.update({ statusId: paymentReceiptStatusId });

    //eliminamos el movimiento de la CC del barrio

    const AccountMovement = require('./accountMovements.controller');

    const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

    const accountMovement = await AccountMovement.deleteMovement(clientId, paymentOrder.accountId, paymentOrder.periodId,
        accountMovementCategory.eStatus.get('PAGO_PROVEEDOR').value, paymentOrder.id);

    return paymentOrder;
};

module.exports.deletePO = async function (req, res) {

    const paymentOrderId = req.body.paymentOrderId;

    const clientId = req.body.clientId;

    try {

        winston.info(`User #${req.user.id} requested to delete PO ${paymentOrderId}`);

        const paymentOrder = await this.deletePaymentOrder(clientId, paymentOrderId);

        winston.info(`PO ${paymentOrderId} delete successfully by user ${req.user.id}`);

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
                amount: { [Op.gte]: 0 },
                statusId: {
                    [Op.in]: [
                        PaymentOrderStatus.eStatus.get('pending').value,
                        PaymentOrderStatus.eStatus.get('inprogress').value,
                        PaymentOrderStatus.eStatus.get('processed').value
                    ]
                }
            }
        });

    const creditNotesTotal = await PaymentOrder.sum('amount',
        {
            where: {
                paymentReceiptId: paymentReceiptId,
                amount: { [Op.lte]: 0 },
                statusId: {
                    [Op.in]: [
                        PaymentOrderStatus.eStatus.get('pending').value,
                        PaymentOrderStatus.eStatus.get('inprogress').value,
                        PaymentOrderStatus.eStatus.get('processed').value
                    ]
                }
            }
        });

    //- Math.abs(creditNotesTotal) //ESTO ES PQ LA OP SE HACE SOBRE EL TOTAL DE LA FC SIN TENER EN CUENTA LAS NCs

    return parseFloat(paymentReceipt.amount - paymentOrdersTotal);
}

module.exports.showEditForm = async function (req, res) {

    const clientId = req.params.clientId;

    const paymentOrderId = req.params.paymentOrderId;

    const client = await Client.findByPk(clientId);

    const paymentOrder = await PaymentOrder.findByPk(paymentOrderId, {
        include: [{ model: CheckSplitted, include: [{ model: Check }] },
        {
            model: PaymentReceipt, where: { clientId: clientId }, include: [{ model: ReceiptType }, { model: Supplier }, { model: Client }],
        },
        { model: BillingPeriod }, { model: Account, include: [{ model: AccountType }] }, { model: User }],
    });

    const clientAccounts = await Account.findAll({ include: [{ model: AccountType }], where: { clientId: paymentOrder.paymentReceipt.client.id } });

    if (paymentOrder.billingPeriod.statusId === BillingPeriodStatus.eStatus.get('opened').value) {
        res.render('expenses/paymentOrders/edit', { menu: CURRENT_MENU, data: { client: client, paymentOrder, clientAccounts } });
    } else {

        req.flash("error", "La OP que quiere modificar pertenece a un período finalizado");

        res.redirect('/expenses/paymentOrders/client/' + clientId);
    }
};

module.exports.edit = async function (req, res, next) {

    const clientId = req.body.clientId;

    const paymentOrderId = req.body.paymentOrderId;

    //TODO: si se selecciono para pagar con cheque o la cuenta original era un cheque ?????

    try {

        const amount = Number.parseFloat(req.body.paymentOrderAmount);

        //Busco la Orden de Pago...

        let paymentOrder = await PaymentOrder.findByPk(paymentOrderId);

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod.id !== paymentOrder.periodId) {
            req.flash("warning", "El período de liquidación de la OP no coincide con el período activo");
            res.redirect('/expenses/paymentOrders/client/' + clientId); return;
        }

        const originalAccountId = paymentOrder.accountId;

        //Busco el Movimiento en la CC...

        const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

        let accountMovement = await AccountMovement.findOne({
            where: {
                clientId: clientId,
                periodId: paymentOrder.periodId,
                category: String.fromCharCode(accountMovementCategory.eStatus.get('PAGO_PROVEEDOR').value),
                movementId: paymentOrder.id
            }
        });

        //Actualiamos la OP con los nuevos parametros...

        // checkId: ((paymentOrder.checkId === undefined) || (paymentOrder.checkId === '') ? null : paymentOrder.checkId),

        paymentOrder = await paymentOrder.update({
            accountId: req.body.accountId,
            paymentDate: req.body.paymentDate,
            amount: amount,
            userId: req.user.id
        });

        winston.info(`user #${req.user.id} update the PO ${paymentOrderId}  - ${paymentOrder}`);

        //Actualizamos el movimiento en la CC...

        accountMovement = await accountMovement.update({
            accountId: paymentOrder.accountId,
            amount: (-1) * amount,
            userId: req.user.id
        })

        winston.info(`user #${req.user.id} update the account movement ${accountMovement.id} due to PO #${paymentOrderId} update - ${accountMovement}`);

        if (originalAccountId !== Number(paymentOrder.accountId)) {

            const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, paymentOrder.periodId, originalAccountId);

            const newAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, paymentOrder.periodId, paymentOrder.accountId);

            winston.info(`balance for original account ${originalAccount} and the new account ${newAccount} fixed on user #${req.user.id} PO #${paymentOrderId} update request`);

        } else {

            const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, paymentOrder.periodId, originalAccountId);

            winston.info(`balance for original account ${originalAccount} fixed on user #${req.user.id} PO #${paymentOrderId} update request`);
        }

        //si el saldo remanente de la FC es menor al total, cambiar el estado de la FC a pendiente

        let remainingBalance = await this.calculateRemainingBalance(paymentOrder.paymentReceiptId);

        const paymentReceipt = await PaymentReceipt.findByPk(paymentOrder.paymentReceiptId)

        let paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('pending').value;

        if (remainingBalance <= 0) {
            paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('processed').value;
        } else if (remainingBalance < Number(paymentReceipt.amount)) {
            paymentReceiptStatusId = PaymentReceiptStatus.eStatus.get('inprogress').value;
        }

        // if (remainingBalance <= 0) {
        //     prStatus = PaymentReceiptStatus.eStatus.get('processed').value;
        // }

        await paymentReceipt.update({ statusId: paymentReceiptStatusId });

        winston.info(`The payment receipt  id #${paymentReceipt} for PO #${paymentOrderId} has a remaining balance of ${remainingBalance}, changing status to ${paymentReceiptStatusId}`);

        req.flash("success", `La OP ${paymentOrder.poNumber} fue modificada existosamente`);

    } catch (err) {

        req.flash("error", "Ocurrio un error y no se pudo modificar la OP en la base de datos");

        winston.error(`An error ocurred while user #${req.user.id} tryed to update the PO ${paymentOrderId}  - ${err}`);

    } finally {
        res.redirect('/expenses/paymentOrders/client/' + clientId);
    }

}