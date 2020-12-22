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
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;

const moment = require('moment');
const CURRENT_MENU = 'splittedChecks'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const checkId = req.params.checkId || req.body.checkId;

    const check = await Check.findByPk(checkId, {
        include: [
            { model: Client },
            { model: Bank, attributes: [['name', 'name']] }
        ]
    });

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

    const checkId = req.params.checkId;

    const clientId = req.body.clientId;

    const splitType = req.body.splitType;

    try {

        const remainingBalance = await calcRemainingBalance(checkId, splitType);

        if (remainingBalance <= 0) {
            req.flash("warning", `al cheque no le queda saldo disponible para la opción seleccionada [$${remainingBalance.toFixed(2)}]`);
            res.redirect("/checks/split/" + checkId);
            return;
        };

        if (remainingBalance < req.body.partialAmmount) {
            req.flash("warning", `el importe ingresado es mayor que el saldo remanente del cheque [$${remainingBalance.toFixed(2)}]`);
            res.redirect("/checks/split/" + checkId);
            return;
        };

        const homeOwnerId = req.body.homeOwnerId === '' ? null : req.body.homeOwnerId;

        if ((req.body.splitType === 'I') && (homeOwnerId === null)) {
            req.flash("warning", 'debe seleccionar una propiedad para asignar el cheque parcial, imposible continuar');
            res.redirect("/checks/split/" + checkId);
            return;
        }

        const check = {
            checkId: checkId,
            periodId: req.body.billingPeriodId,
            splitType: req.body.splitType,
            homeOwnerId: homeOwnerId,
            paymentOrderId: null,
            ammount: req.body.partialAmmount,
            comments: req.body.comments,
            statusId: SplitCheckStatus.eStatus.get('pending').value,
            userId: req.user.id
        }

        CheckSplitted.create(check).
            then(function (result) {
                winston.info(`User #${req.user.id} created succesfully a new split check for check id #${result.checkId} ${JSON.stringify(check)} - ${result.id}`)
                req.flash(
                    "success",
                    "Un nuevo cheque fue agregado exitosamente a la base de datos"
                )
            })
            .catch(function (err) {
                winston.error(`An error ocurred while user #${req.user.id} tryed to create a new check ${JSON.stringify(check)} - ${err}`)
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo agregar el cheque en la base de datos"
                )
            })
            .finally(() => {
                res.redirect("/checks/split/" + checkId);
            })

    } catch (err) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo agregar la subdivisión del cheque a la base de datos"
        );

        winston.error(`An error ocurred while creating new splitted check ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/checks/split/" + checkId);
    }
};

//------------------ AJAX CALLS ------------------//

module.exports.getRemainingBalance = async function (req, res, next) {

    const checkId = req.params.checkId; const splitType = req.query.splitType;

    const remainingBalance = await calcRemainingBalance(checkId, splitType);

    res.send(JSON.parse(`{ "remainingBalance" : "${remainingBalance}" }`));
}

async function calcRemainingBalance(checkId, splitType) {

    const check = await Check.findByPk(checkId);

    const splittedChecks = await CheckSplitted.findAll({
        where: { checkId: checkId, splitType: splitType }
    });

    let totalAmmount = check.ammount, used = 0;

    for (i = 0; i < splittedChecks.length; i++) {
        used += parseFloat(splittedChecks[i].ammount);
    }
    const remainingBalance = totalAmmount - used;

    return remainingBalance;
};

module.exports.getCollectionChecks = async function (req, res, next) {

    const homeOwnerId = req.params.homeOwnerId; const splitType = 'I';

    Account.findByPk(accountId, { include: [{ model: User }, { model: Bank }, { model: AccountType }, { model: User }] })
        .then(account => {
            res.send(account)
        });
    
    
    res.send(JSON.parse(`{ "remainingBalance" : "${remainingBalance}" }`));
}