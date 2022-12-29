const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const BillingPeriod = Model.billingPeriod;
const AccountTransfer = Model.accountTransfer;
const Account = Model.account;
const AccountType = Model.accountType;
const Bank = Model.bank;

const AccountTransferStatus = require('../utils/statusMessages.util').AccountTransfer;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountTransfers'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    let periods = [];

    if (typeof req.query.periodId != 'undefined') {
        periods = req.query.periodId.split(',');
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

        AccountTransfer.create({
            clientId: clientId,
            periodId: req.body.billingPeriodId,
            sourceAccountId: req.body.sourceAccountId,
            destinationAccountId: req.body.destinationAccountId,
            amount: req.body.amount,
            transferDate: req.body.transferDate,
            comments: req.body.comments,
            statusId: AccountTransferStatus.eStatus.get('pending').value,
            userId: req.user.id
        })
            .then(async function (accountTransfer) {

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                const accountMovementOut = await AccountMovement.addMovement(clientId, accountTransfer.sourceAccountId, accountTransfer.periodId, (-1) * accountTransfer.amount,
                    accountMovementCategory.eStatus.get('TRANSFERENCIA').value, accountTransfer.id, accountTransfer.userId)

                const accountMovementIn = await AccountMovement.addMovement(clientId, accountTransfer.destinationAccountId, accountTransfer.periodId, accountTransfer.amount,
                    accountMovementCategory.eStatus.get('TRANSFERENCIA').value, accountTransfer.id, accountTransfer.userId)

                if (accountMovementOut === null || accountMovementIn === null) {
                    winston.error(`It was not possible to add account movement record for the transfer (in/out) (ID: ${accountTransfer.id})  - ${err}`);
                    throw new Error("It was not possible to add the transfer records into the account movements table");
                }

                accountTransfer.update({
                    statusId: AccountTransferStatus.eStatus.get('processed').value
                });

                winston.info(`User #${req.user.id} created succesfully a new account transfer ${JSON.stringify(accountTransfer)} - ${accountTransfer.id}`)

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
                res.redirect("/transfers/client/" + clientId);
            })

    } catch (error) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo crear la transferencia en la base de datos"
        );

        winston.error(`An error ocurred while creating new account transfer ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/transfers/client" + clientId);
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
                res.redirect('/transfers/client/' + clientId); return;
            }

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            await AccountMovement.deleteMovement(accountTransfer.clientId, accountTransfer.sourceAccountId, accountTransfer.periodId,
                accountMovementCategory.eStatus.get('TRANSFERENCIA').value, accountTransfer.id);

            await AccountMovement.deleteMovement(accountTransfer.clientId, accountTransfer.destinationAccountId, accountTransfer.periodId,
                accountMovementCategory.eStatus.get('TRANSFERENCIA').value, accountTransfer.id);

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
        res.redirect("/transfers/client/" + clientId);
    };
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
                data: { accountTransfer: transfer, client: transfer.client },
            });
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
            winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
            res.redirect("/transfers/client" + clientId);
        })
}

module.exports.showEditForm = async function (req, res, next) {

    const clientId = req.params.clientId;
    const transferId = req.params.transferId;

    try {

        const accountTransfer = await AccountTransfer.findByPk(transferId,
            {
                include: [{ model: Client }, { model: BillingPeriod },
                { model: Account, include: [{ model: AccountType }], as: 'sourceAccount' },
                { model: Account, include: [{ model: AccountType }], as: 'destinationAccount' }],
                paranoid: false
            });

        if (accountTransfer === null) {
            req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
            winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
            res.redirect("/transfers/client/" + clientId);
        }

        if ((accountTransfer.statusId != AccountTransferStatus.eStatus.get('pending').value) &&
            (accountTransfer.statusId != AccountTransferStatus.eStatus.get('inprogress').value) &&
            (accountTransfer.statusId != AccountTransferStatus.eStatus.get('processed').value)) {
            req.flash("warning", "El estado actual de la transferencia no permite que sea modificada");
            res.redirect("/transfers/client/" + clientId);
            return;
        }

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value },
            attributes: ['id']
        });

        if ((!activePeriod) || (activePeriod.id != accountTransfer.periodId)) {
            req.flash("warning", "Solo se puede eliminar una transferencia si pertenece al período activo");
            res.redirect('/transfers/client/' + clientId); return;
        }

        const Accounts = await Account.findAll(
            { where: { clientId: clientId }, include: [{ model: AccountType }] });

        res.render('transfers/edit', {
            menu: CURRENT_MENU,
            data: { accountTransfer: accountTransfer, client: accountTransfer.client, clientAccounts: Accounts },
        });

    } catch (err) {
        req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
        winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
        res.redirect("/transfers/client/" + clientId);
    }
};

module.exports.edit = async function (req, res, next) {

    const accountTransferId = req.params.transferId;
    const clientId = req.body.clientId;

    // req.flash("warning", "Esta función no se encuentra implementada aun");

    // res.redirect("/transfers/client/" + clientId); return;

    let originalAccountTransfer = await AccountTransfer.findByPk(accountTransferId,
        {
            include: [{ model: Client }, { model: BillingPeriod },
            { model: Account, include: [{ model: AccountType }], as: 'sourceAccount' },
            { model: Account, include: [{ model: AccountType }], as: 'destinationAccount' }],
        });

    if (originalAccountTransfer === null) {
        req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
        winston.error(`Account transfer not found for showing info ${JSON.stringify(req.body)} - ${err}`);
        res.redirect("/transfers/client/" + clientId);
    }

    originalAccountTransfer.update({
        sourceAccountId: req.body.sourceAccountId,
        destinationAccountId: req.body.destinationAccountId,
        amount: req.body.amount,
        transferDate: req.body.transferDate,
        comments: req.body.comments,
        userId: req.user.id
    })
        .then(async (updatedAccountTransfer) => {

            const sourceAccountChanged = (originalAccountTransfer.sourceAccountId !== updatedAccountTransfer.sourceAccountId);
            const destinationAccountChanged = (originalAccountTransfer.destinationAccountId !== updatedAccountTransfer.destinationAccountId);
            const amountChanged = (originalAccountTransfer.amount !== updatedAccountTransfer.amount);

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            if (sourceAccountChanged || amountChanged) {

                let sourceAccountMovement = await AccountMovement.findOne({
                    where: {
                        clientId: clientId,
                        periodId: originalAccountTransfer.periodId,
                        category: String.fromCharCode(accountMovementCategory.eStatus.get('TRANSFERENCIA').value),
                        movementId: originalAccountTransfer.id,
                        accountId: originalAccountTransfer.sourceAccountId
                    }
                });

                sourceAccountMovement.update({
                    accountId: updatedAccountTransfer.sourceAccountId,
                    amount: updatedAccountTransfer.amount
                }).then(async () => {

                    if (sourceAccountChanged) {
                        await AccountMovement.fixBalanceMovements(clientId, periodId, originalAccountTransfer.sourceAccountId);
                    }

                    await AccountMovement.fixBalanceMovements(clientId, periodId, updatedAccountTransfer.sourceAccountId);
                });

            }

            if (destinationAccountChanged || amountChanged) {

                let destinationAccountMovement = await AccountMovement.findOne({
                    where: {
                        clientId: clientId,
                        periodId: originalAccountTransfer.periodId,
                        category: String.fromCharCode(accountMovementCategory.eStatus.get('TRANSFERENCIA').value),
                        movementId: originalAccountTransfer.id,
                        accountId: originalAccountTransfer.destinationAccountId
                    }
                });

                destinationAccountMovement.update({
                    accountId: updatedAccountTransfer.destinationAccountId,
                    amount: updatedAccountTransfer.amount
                }).then(async () => {
                    if (destinationAccountChanged) {
                        await AccountMovement.fixBalanceMovements(clientId, periodId, originalAccountTransfer.destinationAccountId);
                    }
                    await AccountMovement.fixBalanceMovements(clientId, periodId, updatedAccountTransfer.destinationAccountId);
                });
            }

            winston.info(`user #${req.user.id} update the account transfer ${originalAccountTransfer.id}  - ${originalAccountTransfer}`);

        })

    res.redirect("/transfers/client/" + clientId);
};

module.exports.printReceipt = async function (req, res, next) {

    const accountTransferId = req.params.transferId;
    const clientId = req.params.clientId;

    const { createSingleReport } = require("../reports/accountTransfers/accountTransfer.report");

    AccountTransfer.findByPk(accountTransferId,
        {
            include: [{ model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'sourceAccount' },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'destinationAccount' }],
        })
        .then(originalAccountTransfer => {

            if (originalAccountTransfer === null) {
                throw new Error('not found')
            }

            createSingleReport(originalAccountTransfer, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))

        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se encontro la transferencia seleccionada en la base de datos");
            winston.error(`Account transfer not found for showing info #${accountTransferId} - ${err}`);
            res.redirect("/transfers/client/" + clientId);
        })

};
