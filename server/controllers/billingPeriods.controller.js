const Model = require('../models')
const BillingPeriod = Model.billingPeriod;
const User = Model.user;
const Client = Model.client;

const winston = require('../helpers/winston.helper');
const moment = require('moment');

async function listAll(req, res, next) {

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
            data: { periods: periods, client: client },
        });
    });
};

// async function requestData(req, res, next) {
//     const clientId = req.params.id;
//     const client = await Client.findByPk(clientId);
//     res.render('billingPeriods/add', { data: { client } });
// };

async function create(req, res, next) {
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

async function open(req, res) {
    const id = req.body.modalPeriodId;
    const clientId = req.body.modalClientId;
    const period = await BillingPeriod.findByPk(id);
    period.statusId = 1;
    period.openedAt = new Date();
    await period.save();
    res.redirect("/periods/" + clientId);
}

async function close(req, res, next) {
    const id = req.body.id;
    const period = await BillingPeriod.findByPk(id);
    period.statusId = 2;
    period.closedAt = new Date();
    await period.save();
    const clientId = req.body.modalClientId;
    res.redirect("/periods/" + clientId);
}

module.exports = {
    listAll,
    create,
    open,
    close,
}