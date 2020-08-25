const Model = require('../models')
const BillingPeriod = Model.billingPeriod;
const User = Model.user;
const Client = Model.client;

const winston = require('../helpers/winston.helper');
const moment = require('moment');

const CURRENT_MENU = 'periods'; module.exports.CURRENT_MENU = CURRENT_MENU;

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

// async function requestData(req, res, next) {
//     const clientId = req.params.id;
//     const client = await Client.findByPk(clientId);
//     res.render('billingPeriods/add', { data: { client } });
// };

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
            statusId: 0,
            lastPeriodId: 0
        }
    )
        .then(period => {
            winston.info(`el usuario #${userId} creo el período de liquidación ${periodName} para el cliente #${clientId} \{id: ${period} - ${startDate} :: ${endDate}\}`);
            res.redirect('/periods/' + clientId);
        })
        .catch(error => {
            winston.error(`ocurrio un error al tratar de crear un periodo de liquidacion ${error}`);
            req.flash("error", "Ocurrio un error grave y no se pudo crear el período de liquidación");
            res.redirect('/periods/' + clientId)

        })

};

module.exports.open = async function (req, res) {
    const clientId = req.body.modalClientId;
    const id = req.body.modalPeriodId;
    const period = await BillingPeriod.findByPk(id);
    period.statusId = 1;
    period.openedAt = new Date();
    await period.save();

    //TODO:falta agregar el saldo del periodo anterior a la CC del barrio...

    res.redirect("/periods/" + clientId);
}

module.exports.close = async function (req, res, next) {
    const clientId = req.body.modalClientId;
    const id = req.body.modalPeriodId;
    const period = await BillingPeriod.findByPk(id);
    period.statusId = 2;
    period.closedAt = new Date();
    await period.save();

    //TODO:falta actualizar el saldo del barrio al cierre del periodo...

    res.redirect("/periods/" + clientId);
}

module.exports.getActive = async function (req, res, next) {
    BillingPeriod.findOne({
        where: { clientId: req.params.id, statusId: 1 }
    }).then(function (periods) {
        res.send(periods)
    });
}
