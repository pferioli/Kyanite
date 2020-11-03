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

    const check = await Check.findByPk(checkId, { include: { model: Client } });

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

    const check = await Check.findByPk(checkId, { include: [{ model: Client }, { model: Bank }] });

    res.render("splittedChecks/add.ejs", { menu: CURRENT_MENU, data: { check } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    try {

        const emissionDate = moment(req.body.emissionDate);
        const paymentDate = moment(req.body.paymentDate);

        const dateDiff = emissionDate - paymentDate;

        if (dateDiff > 0) {
            req.flash("warning", "la fecha de emision es posterior a la fecha de pago");
            res.redirect("/checks/client/" + clientId);
            return;
        };

        const account = await Account.findOne({
            include: [{ model: AccountType }],
            where: {
                clientId: clientId,
                '$accountType.account$': 'VAL'
            },
        });

        if (!account) {
            req.flash("warning", "No hay definida ninguna cuenta de Valores [VAL] para el cliente");
            res.redirect("/checks/client/" + clientId);
            return;
        }

        const check = {
            clientId: clientId,
            periodId: req.body.billingPeriodId,
            accountId: account.id,
            bankId: req.body.bankId,
            number: req.body.checkNumber,
            ammount: req.body.ammount,
            emissionDate: req.body.emissionDate,
            paymentDate: req.body.paymentDate,
            dueDate: moment(req.body.paymentDate).add(30, 'days').format('YYYY-MM-DD'),
            comments: req.body.comments,
            statusId: CheckStatus.eStatus.get('wallet').value,
            userId: req.user.id
        }

        const existingCheck = await Check.findOne({
            where: {
                clientId: check.clientId,
                bankId: check.bankId,
                number: check.number
            },
        });

        if (existingCheck) {
            req.flash("warning", "Ya existe un cheque con el mismo número en la base de datos");
            res.redirect("/checks/client/" + clientId);
            return;
        };

        Check.create(check).
            then(function (result) {
                winston.info(`User #${req.user.id} created succesfully a new check into account #${result.accountId} ${JSON.stringify(check)} - ${result.id}`)
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
                res.redirect("/checks/client/" + clientId);
            })

    } catch (err) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo agregar el cheque a la base de datos"
        );

        winston.error(`An error ocurred while creating new check ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/checks/client/" + clientId);
    }

};