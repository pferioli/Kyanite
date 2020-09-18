const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const ClientAccount = Model.clientAccount;
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

    ClientAccount.findAll(options).then(function (accounts) {
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

        ClientAccount.create(clientAccount).
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
                res.redirect("/accounts/" + clientId);
            })

    } catch (error) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo crear la nueva cuenta de cliente en la base de datos"
        );

        winston.error(`An error ocurred while creating new client account ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/accounts/" + clientId);
    }

};

module.exports.delete = async function (req, res, next) {
    const clientId = req.body.clientId;
    const accountId = req.body.accountId;

    ClientAccount.findByPk(accountId)
        .then(clientAccount => {

            clientAccount.destroy()
                .then(() => {
                    winston.info(`User #${req.user.id} deleted succesfully the selected client account ${JSON.stringify(clientAccount)} - ${accountId}`)
                    req.flash(
                        "success",
                        "La cuenta de cliente fue eliminada exitosamente a la base de datos"
                    )
                })
                .catch(err => {
                    req.flash(
                        "error",
                        "Ocurrio un error y no se encontro la cuenta seleccionada en la base de datos"
                    );
                    winston.error(`An error ocurred while deleting client account ${JSON.stringify(req.body)} - ${err}`);
                })
                .finally(() => {
                    res.redirect("/accounts/" + clientId);
                });

        })
        .catch(err => {
            req.flash(
                "error",
                "Ocurrio un error y no se encontro la cuenta seleccionada en la base de datos"
            );
            winston.error(`An error ocurred while deleting client account ${JSON.stringify(req.body)} - ${err}`);
        })
};

module.exports.showEditForm = async function (req, res, next) {

    const accountId = req.params.id;

    let clientAccount = await ClientAccount.findByPk(accountId)

    const clientId = clientAccount.clientId;

    res.redirect("/accounts/" + clientId);
};