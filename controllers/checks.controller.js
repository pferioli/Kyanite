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

const CURRENT_MENU = 'checks'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const client = await Client.findByPk(clientId);

    let options = {
        where: { clientId: clientId },
        include: [{ model: User }, { model: Account, include: [{ model: AccountType }] },
        { model: Bank }, { model: BillingPeriod },
        {
            model: CheckSplitted,
            // where: { splitType: 'I' }
        },
            // {
            //     model: CheckSplitted,
            //     where: { splitType: 'O' }
            // }
        ]
    };

    Check.findAll(options).then(function (checks) {
        res.render('checks/checks', {
            menu: CURRENT_MENU,
            data: { checks: checks, client: client },
        });
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);
    const banks = await Bank.findAll({ where: { enabled: true } });

    const period = await BillingPeriod.findOne({
        where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    });

    res.render("checks/add.ejs", { menu: CURRENT_MENU, data: { client, banks, period } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    try {

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
                winston.info(`User #${req.user.id} created succesfully a new check into account #${accountId} ${JSON.stringify(check)} - ${result.id}`)
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