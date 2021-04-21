const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const Bank = Model.bank;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accounts'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const client = await Client.findByPk(clientId);

    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    let options = {
        where: { clientId: clientId },
        include: [{ model: User }, { model: Bank }, { model: AccountType }, { model: User }],
        paranoid: !showAll
    };

    Account.findAll(options).then(function (accounts) {
        res.render('accounts/accounts', {
            menu: CURRENT_MENU,
            params: { showAll: showAll },
            data: { accounts: accounts, client: client },
        });
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);
    const accountTypes = await AccountType.findAll({ where: { enabled: true } });
    const banks = await Bank.findAll({ where: { enabled: true } });
    res.render("accounts/add.ejs", { menu: CURRENT_MENU, data: { client, accountTypes, banks } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    try {

        const clientAccount = {
            clientId: clientId,
            accountTypeId: req.body.accountTypeId,
            bankId: req.body.bankId,
            bankBranch: req.body.bankBranch,
            accountNumber: req.body.accountNumber,
            accountAlias: req.body.accountAlias,
            cbu: req.body.cbu,
            comments: req.body.comments,
            userId: req.user.id
        }

        Account.create(clientAccount).
            then(function (result) {
                winston.info(`User #${req.user.id} created succesfully a new client account ${JSON.stringify(clientAccount)} - ${result.id}`)
                req.flash(
                    "success",
                    "Una nueva cuenta de cliente fue agregada exitosamente a la base de datos"
                )
            })
            .catch(function (err) {
                winston.error(`An error ocurred while user #${req.user.id} tryed to create a new client account ${JSON.stringify(clientAccount)} - ${err}`)
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo agregar la nueva cuente de cliente en la base de datos"
                )
            })
            .finally(() => {
                res.redirect('/accounts/client/' + clientId);
            })

    } catch (error) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo crear la nueva cuenta de cliente en la base de datos"
        );

        winston.error(`An error ocurred while creating new client account ${JSON.stringify(req.body)} - ${err}`);

        res.redirect('/accounts/client/' + clientId);
    }

};

module.exports.delete = async function (req, res, next) {

    const clientId = req.body.clientId;
    const accountId = req.body.accountId;

    try {
        const clientAccount = await Account.findByPk(accountId);

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
        res.redirect('/accounts/client/' + clientId);
    };
};

module.exports.showEditForm = async function (req, res, next) {

    const accountId = req.params.id;

    const clientAccount = await Account.findByPk(accountId);

    const client = await Client.findByPk(clientAccount.clientId);

    const accountTypes = await AccountType.findAll({ where: { enabled: true } });

    const banks = await Bank.findAll({ where: { enabled: true } });

    res.render("accounts/edit.ejs", { menu: CURRENT_MENU, data: { client, clientAccount, accountTypes, banks } });
};

module.exports.edit = async function (req, res, next) {

    const accountId = req.body.accountId;
    const clientId = req.body.clientId;

    let clientAccount = await Account.findByPk(accountId)

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
            .finally(() => { res.redirect('/accounts/client/' + clientId); })
    } else {
        req.flash("error", "Ocurrio un error y no se encontro la cuenta seleccionada en la base de datos");
        winston.error(`Client account not found for updating ${JSON.stringify(req.body)} - ${err}`);
        res.redirect('/accounts/client/' + clientId);
    }
};

module.exports.getCustomerAccounts = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const accountType = req.query.accountType || req.body.accountType;

    let options = {
        where: { clientId: clientId },
        include: [{ model: AccountType }, { model: Bank }, { model: User }]
    };

    if (typeof accountType != 'undefined') {
        options.include[0].where = { account: [accountType.split(",")] }     // where: { account: ['CC$', 'CA$']}
    }

    Account.findAll(options).then(function (accounts) {
        res.send(accounts)
    });
}

module.exports.getCustomerAccountInfoById = async function (req, res, next) {

    const accountId = req.params.id || req.body.id;

    Account.findByPk(accountId, { include: [{ model: User }, { model: Bank }, { model: AccountType }, { model: User }] })
        .then(account => {
            res.send(account)
        });
}

module.exports.newAccountType = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    let account = req.body.account.toUpperCase();
    let description = req.body.description;

    AccountType.findOne({ where: { account: account } })
        .then(accountType => {
            if (accountType) {
                req.flash("warning", "Ya existe en la base de datos una cuenta con el mismo alias"); res.redirect('/accounts/client/' + clientId);
            } else {
                AccountType.create({ account: account, description: description, enabled: true, userId: req.user.id })
                    .then(result => {
                        req.flash("success", "El nuevo tipo de cuenta se agrego existosamente en la base de datos");
                        winston.info(`User #${req.user.id} added a new account type to database ${JSON.stringify(req.body)}`);
                    })
                    .catch(err => {
                        req.flash("error", "Ocurrio un error y no se pudo agregar el nuevo tipo de cuenta la base de datos");
                        winston.error(`New account type could not be added to database ${JSON.stringify(req.body)} - ${err}`);
                    })
                    .finally(() => { res.redirect('/accounts/client/' + clientId); });
            }

        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se pudo agregar el nuevo tipo de cuenta la base de datos");
            winston.error(`New account type could not be added to database ${JSON.stringify(req.body)} - ${err}`);
            res.redirect('/accounts/client/' + clientId);
        })

}

Date.prototype.toJSON = function () { return this.toLocaleString(); }
