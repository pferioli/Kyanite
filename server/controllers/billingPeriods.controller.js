const Model = require('../models')
const BillingPeriod = Model.billingPeriod;
const User = Model.user;

//const Client = Model.client; --> //include: [{ model: Client }]

async function listAll(req, res, next) {
    const clientId = req.body.clientId;
    BillingPeriod.findAll({
        where: { clientId: clientId },
        order: [
            ['startDate', 'DESC']
        ],
        include: [{ model: User }]
    }).then(function (periods) {
        res.render('billingPeriods/index', {
            data: { periods: periods, clientId: clientId },
        });
    });
};

module.exports = {
    listAll,
}