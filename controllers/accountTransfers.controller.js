const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const BillingPeriod = Model.billingPeriod;
const AccountTransfer = Model.accountTransfer;
const ClientAccount = Model.clientAccount;
const AccountType = Model.accountType;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountTransfers'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    let periods = [];

    if (typeof req.body.periodId != 'undefined') {
        periods = req.body.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }
    }

    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    const client = await Client.findByPk(clientId);

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
        },
        include: [{ model: Client }, { model: BillingPeriod }, { model: User },
        { model: ClientAccount, include: [{ model: AccountType }], as: 'sourceAccount' },
        { model: ClientAccount, include: [{ model: AccountType }], as: 'destinationAccount' }],
        paranoid: !showAll
    };

    AccountTransfer.findAll(options).then(function (accountTransfers) {
        res.render('transfers/transfers', {
            menu: CURRENT_MENU,
            params: { showAll: showAll },
            data: { accountTransfers: accountTransfers, client: client },
        });
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);
    const clientAccounts = await ClientAccount.findAll({ include: [{ model: AccountType }] });

    res.render("transfers/add.ejs", { menu: CURRENT_MENU, data: { client, clientAccounts } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    try {

        const accountTransfer = {
            clientId: clientId,
            periodId: req.body.billingPeriodId,
            sourceAccountId: req.body.sourceAccountId,
            destinationAccountId: req.body.destinationAccountId,
            ammount: req.body.ammount,
            transferDate: req.body.transferDate,
            comments: req.body.comments,
            statusId: 1,
            userId: req.user.id
        }

        AccountTransfer.create(accountTransfer).
            then(function (result) {
                winston.info(`User #${req.user.id} created succesfully a new account transfer ${JSON.stringify(accountTransfer)} - ${result.id}`)
                req.flash(
                    "success",
                    "La transferencia fue agregada exitosamente a la base de datos"
                )
            })
            .catch(function (err) {
                winston.error(`An error ocurred while user #${req.user.id} tryed to create a new account transfer ${JSON.stringify(accountTransfer)} - ${err}`)
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo agregar la transferencia en la base de datos"
                )
            })
            .finally(() => {
                res.redirect("/transfers/" + clientId);
            })

    } catch (error) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo crear la transferencia en la base de datos"
        );

        winston.error(`An error ocurred while creating new account transfer ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/transfers/" + clientId);
    }

};

module.exports.delete = async function (req, res, next) {

    const clientId = req.body.clientId;
    const accountId = req.body.accountId;

    try {
        const clientAccount = await ClientAccount.findByPk(accountId);

        if (clientAccount) {

            clientAccount.userId = req.user.id;
            await clientAccount.save();

            const deleteResult = await clientAccount.destroy();

            if (deleteResult) {
                winston.info(`User #${req.user.id} deleted succesfully the selected client account ${JSON.stringify(clientAccount)} - ${accountId}`);
                req.flash("success", "La cuenta de cliente fue eliminada exitosamente a la base de datos");
            } else {
                winston.error(`An error ocurred while deleting client account ${JSON.stringify(req.body)} - ${err}`);
                req.flash("error", "Ocurrio un error y no se pudo eliminar la cuenta seleccionada en la base de datos");
            }

        } else {
            req.flash("error", "Ocurrio un error y no se encontro la cuenta seleccionada en la base de datos");
            winston.error(`Client account not found for deleting ${JSON.stringify(req.body)} - ${err}`);
        }

    } finally {
        res.redirect("/accounts/" + clientId);
    };
};

module.exports.showEditForm = async function (req, res, next) {

    const accountId = req.params.id;

    const clientAccount = await ClientAccount.findByPk(accountId);

    const client = await Client.findByPk(clientAccount.clientId);

    const accountTypes = await AccountType.findAll({ where: { enabled: true } });

    const banks = await Bank.findAll({ where: { enabled: true } });

    res.render("accounts/edit.ejs", { menu: CURRENT_MENU, data: { client, clientAccount, accountTypes, banks } });
};

module.exports.edit = async function (req, res, next) {

    const accountId = req.body.accountId;
    const clientId = req.body.clientId;

    let clientAccount = await ClientAccount.findByPk(accountId)

    if (clientAccount) {

        clientAccount.clientId = clientId;
        clientAccount.accountTypeId = req.body.accountTypeId;
        clientAccount.bankId = req.body.bankId;
        clientAccount.bankBranch = req.body.bankBranch;
        clientAccount.accountNumber = req.body.accountNumber;
        clientAccount.accountAlias = req.body.accountAlias;
        clientAccount.cbu = req.body.cbu;
        clientAccount.comments = req.body.comments;
        clientAccount.userId = req.user.id;

        clientAccount.save()
            .then(() => {
                winston.info(`User #${req.user.id} updated succesfully the selected client account ${JSON.stringify(clientAccount)} - ${accountId}`);
                req.flash("success", "La cuenta de cliente fue actualizada exitosamente en la base de datos");
            })
            .catch(err => {
                winston.error(`An error ocurred while updating client account ${JSON.stringify(req.body)} - ${err}`);
                req.flash("error", "Ocurrio un error y no se pudo modificar la cuenta seleccionada en la base de datos");
            })
            .finally(() => { res.redirect("/accounts/" + clientId); })
    } else {
        req.flash("error", "Ocurrio un error y no se encontro la cuenta seleccionada en la base de datos");
        winston.error(`Client account not found for updating ${JSON.stringify(req.body)} - ${err}`);
        res.redirect("/accounts/" + clientId);
    }
};