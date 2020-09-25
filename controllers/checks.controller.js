const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const Bank = Model.bank;
const Check = Model.check;
const BillingPeriod = Model.billingPeriod;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'checks'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const client = await Client.findByPk(clientId);

    let options = {
        where: { clientId: clientId },
        include: [{ model: User }, { model: Account }, { model: Bank }, { model: BillingPeriod }]
    };

    Check.findAll(options).then(function (checks) {
        res.render('checks/checks', {
            menu: CURRENT_MENU,
            data: { checks: checks, client: client },
        });
    });
};
