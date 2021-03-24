const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const AccountMovements = Model.accountMovement;
const BillingPeriod = Model.billingPeriod;

const Enum = require('enum');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountMovements'; module.exports.CURRENT_MENU = CURRENT_MENU;

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
            'INTERES_PF': "F".charCodeAt(0),
            'NOTA_DE_CREDITO': "N".charCodeAt(0),
            'SALDO_PERIODO_ANTERIOR': "S".charCodeAt(0)
        })
    }
}

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const client = await Client.findByPk(clientId);

    let periods = [];

    if (typeof req.body.periodId != 'undefined') {
        periods = req.body.periodId.split(',');
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
        include: [{ model: BillingPeriod }, {
            model: Account, include: [{ model: AccountType }], include: [{ model: AccountType }]
        }, { model: User }],
    };

    AccountMovements.findAll(options).then(function (movements) {
        res.render('accountMovements/accountMovements', {
            menu: CURRENT_MENU,
            data: { movements: movements, client: client, periods: periods, accountId: accountIds, isFiltered: isFiltered },
        });
    });
};

module.exports.addMovement = async function (clientId, accountId, periodId, amount, category, refId, userId) {

    return AccountMovements.create({
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