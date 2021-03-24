const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const BillingPeriod = Model.billingPeriod;
const AccountTransfer = Model.accountTransfer;
const Account = Model.account;
const AccountType = Model.accountType;

const AccountTransferStatus = require('../utils/statusMessages.util').AccountTransfer;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountTransfers'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    let periods = [];

    if (typeof req.body.periodId != 'undefined') {
        periods = req.body.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value },
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
        { model: Account, required: false, include: [{ model: AccountType }], as: 'sourceAccount' },
        { model: Account, required: false, include: [{ model: AccountType }], as: 'destinationAccount' }
        ],
        paranoid: !showAll
    };

    AccountTransfer.findAll(options).then(function (accountTransfers) {
        res.render('transfers/transfers', {
            menu: CURRENT_MENU,
            params: { showAll: showAll },
            data: { accountTransfers: accountTransfers, client: client, periods },
        });
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    const Accounts = await Account.findAll(
        { where: { clientId: clientId }, include: [{ model: AccountType }] });

    const period = await BillingPeriod.findOne({
        where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    });

    res.render("transfers/add.ejs", { menu: CURRENT_MENU, data: { client, clientAccounts: Accounts, period } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    try {

        const accountTransfer = {
            clientId: clientId,
            periodId: req.body.billingPeriodId,
            sourceAccountId: req.body.sourceAccountId,
            destinationAccountId: req.body.destinationAccountId,
            amount: req.body.amount,
            transferDate: req.body.transferDate,
            comments: req.body.comments,
            statusId: AccountTransferStatus.eStatus.get('pending').value,
            userId: req.user.id
        }

        AccountTransfer.create(accountTransfer).
            then(async function (result) {

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                const accountMovementOut = await AccountMovement.addMovement(clientId, result.sourceAccountId, result.periodId, (-1) * result.amount,
                    accountMovementCategory.eStatus.get('TRANSFERENCIA').value, result.id, result.userId)

                const accountMovementIn = await AccountMovement.addMovement(clientId, result.destinationAccountId, result.periodId, result.amount,
                    accountMovementCategory.eStatus.get('TRANSFERENCIA').value, result.id, result.userId)

                if (accountMovementOut === null || accountMovementIn === null) {
                    winston.error(`It was not possible to add account movement record for the transfer (in/out) (ID: ${accountTransfer.id})  - ${err}`);
                    throw new Error("It was not possible to add the transfer records into the account movements table");
                }

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
    const transferId = req.body.transferId;

    try {
        const accountTransfer = await AccountTransfer.findByPk(transferId);

        if (accountTransfer) {

            const activePeriod = await BillingPeriod.findOne({
                where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value },
                attributes: ['id']
            });

            if ((!activePeriod) || (activePeriod.id != accountTransfer.periodId)) {
                req.flash("warning", "Solo se puede eliminar una transferencia si pertenece al período activo");
                res.redirect('/transfers/' + clientId); return;
            }

            accountTransfer.statusId = AccountTransferStatus.eStatus.get('deleted').value;
            accountTransfer.userId = req.user.id;
            await accountTransfer.save();

            const deleteResult = await accountTransfer.destroy();

            if (deleteResult) {
                winston.info(`User #${req.user.id} deleted succesfully the selected account transfer ${JSON.stringify(accountTransfer)} - ${transferId}`);
                req.flash("success", "La transferencia entre cuentras fue eliminada exitosamente a la base de datos");
            } else {
                winston.error(`An error ocurred while deleting account transfer ${JSON.stringify(req.body)} - ${err}`);
                req.flash("error", "Ocurrio un error y no se pudo eliminar la transferencia seleccionada en la base de datos");
            }

        } else {
            req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
            winston.error(`Account transfer not found for deleting ${JSON.stringify(req.body)} - ${err}`);
        }

    } finally {
        res.redirect("/transfers/" + clientId);
    };
};

module.exports.showEditForm = async function (req, res, next) {

    const clientId = req.params.clientId;
    const transferId = req.params.transferId;

    try {

        const transfer = await AccountTransfer.findByPk(transferId,
            {
                include: [{ model: Client }, { model: BillingPeriod },
                { model: Account, include: [{ model: AccountType }], as: 'sourceAccount' },
                { model: Account, include: [{ model: AccountType }], as: 'destinationAccount' }],
                paranoid: false
            });

        if (transfer === null) {
            req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
            winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
            res.redirect("/transfers/" + clientId);
        }

        if ((transfer.statusId != AccountTransferStatus.eStatus.get('pending').value) &&
            (transfer.statusId != AccountTransferStatus.eStatus.get('inprogress').value)) {
            req.flash("warning", "El estado actual de la transferencia no permite que sea modificada");
            res.redirect("/transfers/" + clientId);
            return;
        }

        res.render('transfers/edit', {
            menu: CURRENT_MENU,
            data: { accountTransfer: transfer },
        });

    } catch (err) {
        req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
        winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
        res.redirect("/transfers/" + clientId);
    }
};

module.exports.edit = async function (req, res, next) {

    const accountId = req.body.accountId;
    const clientId = req.body.clientId;

    // let clientAccount = await ClientAccount.findByPk(accountId)

    // if (clientAccount) {

    //     clientAccount.clientId = clientId;
    //     clientAccount.accountTypeId = req.body.accountTypeId;
    //     clientAccount.bankId = req.body.bankId;
    //     clientAccount.bankBranch = req.body.bankBranch;
    //     clientAccount.accountNumber = req.body.accountNumber;
    //     clientAccount.accountAlias = req.body.accountAlias;
    //     clientAccount.cbu = req.body.cbu;
    //     clientAccount.comments = req.body.comments;
    //     clientAccount.userId = req.user.id;

    //     clientAccount.save()
    //         .then(() => {
    //             winston.info(`User #${req.user.id} updated succesfully the selected client account ${JSON.stringify(clientAccount)} - ${accountId}`);
    //             req.flash("success", "La cuenta de cliente fue actualizada exitosamente en la base de datos");
    //         })
    //         .catch(err => {
    //             winston.error(`An error ocurred while updating client account ${JSON.stringify(req.body)} - ${err}`);
    //             req.flash("error", "Ocurrio un error y no se pudo modificar la cuenta seleccionada en la base de datos");
    //         })
    //         .finally(() => { res.redirect("/accounts/" + clientId); })
    // } else {
    //     req.flash("error", "Ocurrio un error y no se encontro la cuenta seleccionada en la base de datos");
    //     winston.error(`Client account not found for updating ${JSON.stringify(req.body)} - ${err}`);
    //     res.redirect("/accounts/" + clientId);
    // }
};

module.exports.info = async function (req, res, next) {

    const clientId = req.params.clientId;
    const transferId = req.params.transferId;

    AccountTransfer.findByPk(transferId,
        {
            include: [{ model: Client }, { model: BillingPeriod },
            { model: Account, include: [{ model: AccountType }], as: 'sourceAccount' },
            { model: Account, include: [{ model: AccountType }], as: 'destinationAccount' }],
            paranoid: false
        })
        .then(transfer => {
            res.render('transfers/info', {
                menu: CURRENT_MENU,
                data: { accountTransfer: transfer },
            });
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
            winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
            res.redirect("/transfers/" + clientId);
        })
}