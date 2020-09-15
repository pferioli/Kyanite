const Model = require('../models')
const BillingPeriod = Model.billingPeriod;
const User = Model.user;
const Client = Model.client;

const Enum = require('enum');
const moment = require('moment');
const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'periods'; module.exports.CURRENT_MENU = CURRENT_MENU;

const eBillingPeriodStatus = new Enum({ 'created': 0, 'opened': 1, 'closed': 2, 'disabled': 3 })

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.id;

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
            statusId: eBillingPeriodStatus.get('created').value,
            lastPeriodId: 0
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
        where: { clientId: clientId, statusId: eBillingPeriodStatus.get('opened').value }
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

    if (period.statusId != eBillingPeriodStatus.get('created').value) {
        req.flash("warning", "Solo se pueden abrir períodos de liquidación que cuyo estado sea \<creado\>");
        res.redirect('/periods/' + clientId);
        return;
    }

    period.statusId = eBillingPeriodStatus.get('opened').value;
    period.openedAt = new Date();

    period.save()
        .then(() => {
            winston.info(`user #${userId} opened period #${id} for customer #${clientId}`);

            //TODO:falta agregar el saldo del periodo anterior a la CC del barrio...
        })
        .catch(error => {
            winston.error(`an error ocurred when user #${userId} was trying to open the billing period #${id} - ${error}`);
            req.flash("error", "Ocurrio un error grave y no se pudo abrir el período de liquidación");

        })
        .finally(() => {
            res.redirect('/periods/' + clientId);
        });
}

module.exports.close = async function (req, res, next) {

    const userId = req.user.id;

    const clientId = req.body.modalClientId;
    const id = req.body.modalPeriodId;
    const period = await BillingPeriod.findByPk(id);

    if (period === null) {
        res.redirect("/periods/" + clientId); return;
    }

    if (period.statusId != eBillingPeriodStatus.get('opened').value) {
        req.flash("warning", "Solo se pueden cerrar períodos de liquidación que esten abiertos");
        res.redirect('/periods/' + clientId);
        return;
    }

    period.statusId = eBillingPeriodStatus.get('closed').value;
    period.closedAt = new Date();

    period.save()
        .then(() => {
            winston.info(`user #${userId} closed period #${id} for customer #${clientId}`);

            //TODO:falta actualizar el saldo del barrio al cierre del periodo...
        })
        .catch(error => {
            winston.error(`an error ocurred when user #${userId} was trying to close the billing period #${id} - ${error}`);
            req.flash("error", "Ocurrio un error grave y no se pudo cerrar el período de liquidación");

        })
        .finally(() => {
            res.redirect('/periods/' + clientId);
        });
}

module.exports.getActive = async function (req, res, next) {
    BillingPeriod.findOne({
        where: { clientId: req.params.id, statusId: eBillingPeriodStatus.get('opened') }
    }).then(function (periods) {
        res.send(periods)
    });
}

module.exports.getAllByClientID = async function (req, res, next) {
    BillingPeriod.findAll({
        where: { clientId: req.params.id }, order: [['name', 'DESC']],
    }).then(function (periods) {
        res.send(periods)
    });
}
