const Model = require('../models')
const BillingPeriod = Model.billingPeriod;
const User = Model.user;
const Client = Model.client;

const moment = require('moment');
const winston = require('../helpers/winston.helper');

const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

const CURRENT_MENU = 'periods'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    BillingPeriod.findAll({
        where: { clientId: clientId },
        order: [
            ['startDate', 'DESC']
        ],
        include: [{ model: User }]
    }).then(function (periods) {
        res.render('billingPeriods/periods', {
            menu: CURRENT_MENU,
            data: { periods: periods, client: client },
        });
    });
};

module.exports.create = async function (req, res, next) {

    const clientId = req.body.clientId;
    const userId = req.user.id;
    const yearValue = req.body.yearValue;
    const monthValue = req.body.monthValue;

    const startDate = moment([yearValue, monthValue - 1]);
    const endDate = moment([yearValue, monthValue - 1]).endOf('month');

    const periodName = ("0" + monthValue + yearValue).substr(-6);

    BillingPeriod.create(
        {
            clientId: clientId,
            name: periodName,
            startDate: startDate,
            endDate: endDate,
            userId: userId,
            statusId: BillingPeriodStatus.eStatus.get('created').value,
            lastPeriod: false
        }
    )
        .then(period => {
            winston.info(`el usuario #${userId} creo el período de liquidación ${periodName} para el cliente #${clientId} \{id: ${period} - ${startDate} :: ${endDate}\}`);
            res.redirect('/periods/' + clientId);
        })
        .catch(error => {
            winston.error(`an error ocurred trying to create a new billing period - ${error}`);
            req.flash("error", "Ocurrio un error grave y no se pudo crear el período de liquidación");
            res.redirect('/periods/' + clientId)
        })

};

module.exports.open = async function (req, res) {

    const userId = req.user.id;
    const clientId = req.body.modalClientId;
    const id = req.body.modalPeriodId;

    let period = await BillingPeriod.findOne({
        where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    })

    if (period) {
        req.flash("warning", "No se puede habilitar un período de liquidación mientras haya otro activo");
        res.redirect('/periods/' + clientId);
        return;
    }

    period = await BillingPeriod.findByPk(id);

    if (period === null) {
        res.redirect("/periods/" + clientId); return;
    }

    if (period.statusId != BillingPeriodStatus.eStatus.get('created').value) {
        req.flash("warning", "Solo se pueden abrir períodos de liquidación que cuyo estado sea \<creado\>");
        res.redirect('/periods/' + clientId);
        return;
    }

    try {

        //buscamos el periodo de liquidacion anterior

        let previousPeriod = await BillingPeriod.findOne({ where: { clientId: clientId, lastPeriod: true } });

        //Actualizamos los saldos de cada una de las cuentas...

        const { openMonthlyBalance } = require('./monthlyBalance.controller');

        const monthlyBalance = await openMonthlyBalance(clientId, period.id, previousPeriod !== null ? previousPeriod.id : null, userId);

        if (monthlyBalance === undefined) {
            winston.error(`an error ocurred when user #${userId} was trying to close the billing period #${id} - check monthly_balance calculation`);
            req.flash("error", "Ocurrio un error grave al calcular el saldo de las cuentas, no se pudo cerrar el período de liquidación");
            res.redirect('/periods/' + clientId); return;
        }

        winston.info(`period #${id} total balance for customer #${clientId} is ${monthlyBalance}`);

        if (previousPeriod) {
            previousPeriod.update({ lastPeriod: false });
        };

        period.statusId = BillingPeriodStatus.eStatus.get('opened').value;
        period.openedAt = new Date();
        period.previousPeriodId = previousPeriod !== null ? previousPeriod.id : null;

        const openedPeriod = await period.save()

        winston.info(`user #${userId} opened period #${id} for customer #${clientId}`);

    } catch (error) {
        winston.error(`an error ocurred when user #${userId} was trying to open the billing period #${id} - ${error}`);
        req.flash("error", "Ocurrio un error grave y no se pudo abrir el período de liquidación");
    } finally {
        res.redirect('/periods/' + clientId);
    }
};

module.exports.close = async function (req, res, next) {

    const userId = req.user.id;

    const clientId = req.body.modalClientId;
    const id = req.body.modalPeriodId;
    const period = await BillingPeriod.findByPk(id);

    if (period === null) {
        res.redirect("/periods/" + clientId); return;
    }

    if (period.statusId != BillingPeriodStatus.eStatus.get('opened').value) {
        req.flash("warning", "Solo se pueden cerrar períodos de liquidación que esten abiertos");
        res.redirect('/periods/' + clientId);
        return;
    }

    //Actualizamos los saldos de cada una de las cuentas...

    const { closeMonthlyBalance } = require('./monthlyBalance.controller');

    const monthlyBalance = await closeMonthlyBalance(clientId, period.id);

    if (monthlyBalance === undefined) {
        winston.error(`an error ocurred when user #${userId} was trying to close the billing period #${id} - check monthly_balance calculation`);
        req.flash("error", "Ocurrio un error grave al calcular el saldo de las cuentas, no se pudo cerrar el período de liquidación");
        res.redirect('/periods/' + clientId); return;
    }

    winston.info(`period #${id} total balance for customer #${clientId} is ${monthlyBalance}`);

    //Pasamos el periodo a Closed, marcamos el flag de que fue el ultimo periodo cursado...

    period.statusId = BillingPeriodStatus.eStatus.get('closed').value;
    period.closedAt = new Date();
    period.lastPeriod = true;

    period.save()
        .then(() => {
            winston.info(`user #${userId} closed period #${id} for customer #${clientId}`);
        })
        .catch(error => {
            winston.error(`an error ocurred when user #${userId} was trying to close the billing period #${id} - ${error}`);
            req.flash("error", "Ocurrio un error grave y no se pudo cerrar el período de liquidación");

        })
        .finally(() => {
            res.redirect('/periods/' + clientId);
        });
};

//------------------ AJAX CALLS ------------------//

module.exports.getActive = async function (req, res, next) {
    BillingPeriod.findOne({
        where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    }).then(function (periods) {
        res.send(periods)
    });
}

module.exports.getAllByClientID = async function (req, res, next) {
    BillingPeriod.findAll({
        where: { clientId: req.params.clientId }, order: [['id', 'DESC']],
    }).then(function (periods) {
        res.send(periods)
    });
}

module.exports.getPeriodById = async function (req, res, next) {
    BillingPeriod.findByPk(req.params.periodId).then(function (period) {
        res.send(period)
    });
}
