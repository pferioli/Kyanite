const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const AccountMovements = Model.accountMovement;
const BillingPeriod = Model.billingPeriod;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountMovements'; module.exports.CURRENT_MENU = CURRENT_MENU;

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

    accounts = [];

    if (typeof req.body.accountId != 'undefined') {
        accounts = req.body.accountId.split(',');
    }

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            accountId: {
                [Op.in]: accounts
            }
        },
        include: [{ model: User }, { model: Account, include: [{ model: AccountType }] }, { model: User }],
    };

    AccountMovements.findAll(options).then(function (movements) {
        res.render('accountMovements/accountMovements', {
            menu: CURRENT_MENU,
            data: { movements: movements, client: client, periods: periods },
        });
    });
};