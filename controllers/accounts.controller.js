const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const ClientAccount = Model.clientAccount;
const AccountType = Model.accountType;
const Bank = Model.bank;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accounts'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    ClientAccount.findAll({
        where: { clientId: clientId },
        include: [{ model: User }, { model: Bank }, { model: AccountType }, { model: User }]
    }).then(function (accounts) {
        res.render('accounts/accounts', {
            menu: CURRENT_MENU,
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
};

module.exports.delete = async function (req, res, next) {
};