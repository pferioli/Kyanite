const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const AccountMovement = Model.accountMovement;
const AccountAdjustment = Model.accountAdjustment;
const BillingPeriod = Model.billingPeriod;

const Enum = require('enum');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountMovements'; module.exports.CURRENT_MENU = CURRENT_MENU;

const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

module.exports.AccountMovementsCategories = class {

    constructor() { }

    static get Status() {
        return ["Deshabilitada", "Pendiente", "En Proceso", "Procesada", "Anulada"];
    }

    static get eStatus() {
        return new Enum({
            'INGRESO_COBRANZA': "C".charCodeAt(0),
            'IMPORTACION_COBRANZA': "I".charCodeAt(0),
            'CHEQUE_ACREDITADO': "A".charCodeAt(0),
            'CHEQUE_EN_CARTERA': "Q".charCodeAt(0),
            'CHEQUE_RECHAZADO': "R".charCodeAt(0),
            'TRANSFERENCIA': "T".charCodeAt(0),
            'PAGO_PROVEEDOR': "P".charCodeAt(0),
            'AJUSTE_SALDO': "J".charCodeAt(0),
            'PLAZO_FIJO': "F".charCodeAt(0),
            'NOTA_DE_CREDITO': "N".charCodeAt(0),
            'SALDO_PERIODO_ANTERIOR': "S".charCodeAt(0)
        })
    }
}

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const client = await Client.findByPk(clientId);

    let periods = [];

    if (req.query.periodId != undefined) {
        periods = req.query.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }
    };

    accountIds = []; let isFiltered = false;

    if (typeof req.body.accountId != 'undefined')
        accountIds = req.body.accountId.split(',');

    if (typeof req.query.accountId != 'undefined')
        accountIds = req.query.accountId.split(',');

    if (accountIds.length === 0) {

        const accounts = await Account.findAll({ where: { clientId: clientId } })

        for (index = 0; index < accounts.length; index++) {
            accountIds.push(accounts[index].id);
        }
    } else {
        isFiltered = true;
    }

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            accountId: {
                [Op.in]: accountIds
            }
        },
        include: [{ model: BillingPeriod }, { model: Account, include: [{ model: AccountType }] }, { model: User }],
        paranoid: false
    };

    AccountMovement.findAll(options).then(function (movements) {
        res.render('accountMovements/accountMovements', {
            menu: CURRENT_MENU,
            data: { movements: movements, client: client, periods: periods, accountId: accountIds, isFiltered: isFiltered },
        });
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

    res.render("accountMovements/add", { menu: CURRENT_MENU, data: { client, clientAccounts: Accounts, period } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.body.clientId;

    const accountId = req.body.accountId;

    let amount = 0;

    if (req.body.radioType.toUpperCase() === 'I') {
        amount = req.body.amount;
    } else if (req.body.radioType.toUpperCase() === 'O') {
        amount = (-1) * req.body.amount;
    } else {

        winston.error(`An error ocurred while user #${req.user.id} tryed to add a new movement adjustmen, the type is invalid ${req.body.radioType}`)

        req.flash("error", "Ocurrio un error y no se pudo procesar el ajuste de saldo, tipo incorrecto");

        res.redirect("/movements/client/" + clientId); return;
    }

    AccountAdjustment.create({
        clientId: clientId,
        periodId: req.body.billingPeriodId,
        accountId: accountId,
        amount: amount,
        comments: req.body.comments,
        userId: req.user.id
    })
        .then(async (accountAdjustment) => {

            try {
                const movement = await this.addMovement(clientId, accountId, req.body.billingPeriodId, amount,
                    this.AccountMovementsCategories.eStatus.get('AJUSTE_SALDO').value, accountAdjustment.id, req.user.id)

                winston.info(`Account Adjustment ${accountAdjustment.id} created succesfully`)

                req.flash("success", `El ajuste de saldo se registro en la cuenta correctamente`)

            } catch (error) {
                throw error
            }
        })
        .catch((err) => {

            req.flash("error", "Ocurrio un error y no se pudo procesar el ajuste de saldo");

            winston.error(`An error ocurred adding an account adjustment - ${err}`);
        })
        .finally(() => {

            let redirectUrl = "/movements/client/" + clientId;

            if (accountId != undefined) {
                redirectUrl += "?accountId=" + accountId
            }

            res.redirect(redirectUrl);
        })
};


module.exports.addMovement = async function (clientId, accountId, periodId, amount, category, refId, userId) {

    return AccountMovement.create({
        clientId: clientId,
        periodId: periodId,
        accountId: accountId,
        category: String.fromCharCode(category),
        amount: amount,
        movementId: refId,
        userId: userId
    })
        .then((result) => {
            return result
        });

    // .catch ((err) => {
    //     winston.error(`An error ocurred adding a new record into account movements table - ${err}`);
    //     throw err;
    // });
}

module.exports.deleteMovement = async function (clientId, accountId, periodId, category, refId) {

    return AccountMovement.findOne(
        {
            where: {
                clientId: clientId,
                periodId: periodId,
                accountId: accountId,
                category: String.fromCharCode(category),
                movementId: refId
            }
        })
        .then((accountMovement) => {
            return accountMovement.destroy()
                .then((result) => { return result })
        })

}
