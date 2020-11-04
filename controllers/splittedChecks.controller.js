const Sequelize = require('sequelize');
const Op = require('sequelize').Op;
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const Bank = Model.bank;
const Check = Model.check;
const BillingPeriod = Model.billingPeriod;
const CheckSplitted = Model.checkSplitted;

const winston = require('../helpers/winston.helper');

const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;
const CheckStatus = require('../utils/statusMessages.util').Check;

const moment = require('moment');

const CURRENT_MENU = 'splittedChecks'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const checkId = req.params.checkId || req.body.checkId;

    const check = await Check.findByPk(checkId, { include: [{ model: Client }] });

    let options = {
        where: { checkId: checkId },
        include: [
            { model: User },
        ],
        order: [
            ['splitType', 'ASC'], ['id', 'ASC']
        ]
    };

    const splittedChecks = await CheckSplitted.findAll(options);

    res.render('splittedChecks/splittedChecks', {
        menu: CURRENT_MENU, data: { check: check, checks: splittedChecks },
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const checkId = req.params.checkId;
    const check = await Check.findByPk(checkId, { include: [{ model: Client }, { model: Bank }, { model: BillingPeriod }] });
    res.render("splittedChecks/add.ejs", { menu: CURRENT_MENU, data: { check } });
};

module.exports.addNew = async function (req, res, next) {
    res.redirect('/checks')
};

//------------------ AJAX CALLS ------------------//

module.exports.getRemainingBalance = async function (req, res, next) {

    const checkId = req.params.checkId;

    const check = await Check.findByPk(checkId);

    const splittedChecks = await CheckSplitted.findAll({
        where: { checkId: req.params.checkId, splitType: req.query.splitType }
    });

    let totalAmmount = check.ammount, used = 0;

    for (i = 0; i < splittedChecks.length; i++) {
        used += splittedChecks[i].ammount;
    }
    const remainingBalance = totalAmmount - used;

    res.send(JSON.parse(`{ "remainingBalance" : "${remainingBalance}" }`));
}
