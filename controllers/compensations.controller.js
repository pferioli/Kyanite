const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const BillingPeriod = Model.billingPeriod;
const AccountingImputation = Model.accountingImputation;
const AccountingGroup = Model.accountingGroup;
const Account = Model.account;
const AccountType = Model.accountType;
const User = Model.user;
const Compensation = Model.compensation;
const AccountMovement = Model.accountMovement;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'compensations'; module.exports.CURRENT_MENU = CURRENT_MENU;

const CompensationsStatus = require('../utils/statusMessages.util').Compensation;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    let periods = [];

    if (req.query.periodId != undefined) {
        periods = req.query.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }
    }

    const autoRefresh = (req.query.refresh === undefined || req.query.refresh.toLowerCase() === 'false' ? false : true);
    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    const status = (showAll === true) ? [0, 1, 2, 3, 4, 5] : [1, 2, 3];

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            statusId: { [Op.in]: status }
        },
        include: [
            { model: BillingPeriod }, { model: User },
            { model: Account, include: [{ model: AccountType }] },
            { model: AccountingImputation, include: [{ model: AccountingGroup }] }
        ],
        paranoid: !showAll
    };

    const client = await Client.findByPk(clientId);

    const compensations = await Compensation.findAll(options);

    res.render('compensations/compensations',
        {
            menu: CURRENT_MENU,
            data: { client: client, compensations: compensations, periods },
            params: { showAll: showAll, autoRefresh: autoRefresh }
        });

};

module.exports.showNewForm = async function (req, res) {

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    const clientAccounts = await Account.findAll({ include: [{ model: AccountType }], where: { clientId: clientId } });

    res.render('compensations/add', { menu: CURRENT_MENU, data: { client, clientAccounts } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    const accountId = req.body.accountId;

    Compensation.create({
        clientId: clientId,
        periodId: req.body.billingPeriodId,
        accountId: accountId,
        amount: req.body.amount,
        comments: req.body.comments,
        emissionDate: req.body.emissionDate,
        accountingImputationId: req.body.accountingImputationId,
        receiptNumber: null,
        statusId: CompensationsStatus.eStatus.get('pending').value,
        userId: req.user.id
    })
        .then(async (compensation) => {

            try {
                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                const movement = await AccountMovement.addMovement(compensation.clientId, compensation.accountId, compensation.periodId, compensation.amount,
                    accountMovementCategory.eStatus.get('COMPENSACION').value, compensation.id, req.user.id)

                let receiptNumber = await db.sequelize.query(`SELECT nextval('${clientId}','M') as "nextval"`, { type: QueryTypes.SELECT });

                receiptNumber = receiptNumber[0].nextval;

                compensation.update({
                    receiptNumber: receiptNumber,
                    statusId: CompensationsStatus.eStatus.get('processed').value
                });

                winston.info(`Compensation ${compensation.id} created succesfully for accountId #${accountId} by userId ${req.user.id}`)

                req.flash("success", `La compensación se registro en la cuenta correctamente`)

            } catch (error) {
                throw error
            }
        })

        .catch((err) => {

            req.flash("error", "Ocurrio un error y no se pudo procesar la compensación");

            winston.error(`An error ocurred adding a compensation - ${err}`);
        })
        .finally(() => {
            res.redirect("/compensations/client/" + clientId);
        })
};

module.exports.delete = async function (req, res) {

    const clientId = req.body.clientId;

    const compensationId = req.body.compensationId;

    Compensation.findByPk(compensationId)
        .then(async (compensation) => {

            const activePeriod = await BillingPeriod.findOne({
                where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value },
                attributes: ['id']
            });

            if ((!activePeriod) || (activePeriod.id != compensation.periodId)) {
                req.flash("warning", "Solo se puede eliminar una compensación si pertenece al período activo");
                res.redirect('/compensations/client/' + clientId); return;
            }

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            await AccountMovement.deleteMovement(compensation.clientId, compensation.accountId, compensation.periodId,
                accountMovementCategory.eStatus.get('COMPENSACION').value, compensation.id);

            compensation.update({
                statusId: CompensationsStatus.eStatus.get('deleted').value,
                userId: req.user.id
            });

            const deleteResult = await compensation.destroy();

            if (deleteResult) {
                winston.info(`User #${req.user.id} deleted succesfully the selected compensation ${JSON.stringify(compensation)} - ${compensationId}`);
                req.flash("success", "La transferencia entre cuentras fue eliminada exitosamente a la base de datos");
            } else {
                winston.error(`An error ocurred while deleting compensation ${JSON.stringify(req.body)} - ${err}`);
                req.flash("error", "Ocurrio un error y no se pudo eliminar la compensación seleccionada en la base de datos");
            }
        })
        .catch((err) => {

            req.flash("error", "Ocurrio un error y no se pudo eliminar la compensación");

            winston.error(`An error ocurred deleting the compensationId #${compensationId} - ${err}`);
        })
        .finally(() => {
            res.redirect("/compensations/client/" + clientId);
        })
}

module.exports.showEditForm = async function (req, res, next) {

    const clientId = req.params.clientId;
    const compensationId = req.params.compensationId;

    try {

        const compensation = await Compensation.findByPk(compensationId,
            {
                include: [
                    { model: Client }, { model: BillingPeriod }, { model: User },
                    { model: Account, include: [{ model: AccountType }] },
                    { model: AccountingImputation, include: [{ model: AccountingGroup }] }
                ],
                paranoid: false
            });

        if (compensation === null) {
            req.flash("error", "Ocurrio un error y no se encontro la compensacion seleccionada en la base de datos");
            winston.error(`Compensation not found for showing info ${JSON.stringify(req.body)} - ${err}`);
            res.redirect("/compensation/client/" + clientId);
        }

        if ((compensation.statusId != CompensationsStatus.eStatus.get('pending').value) &&
            (compensation.statusId != CompensationsStatus.eStatus.get('inprogress').value) &&
            (compensation.statusId != CompensationsStatus.eStatus.get('processed').value)) {
            req.flash("warning", "El estado actual de la compensación no permite que sea modificada");
            res.redirect("/compensation/client/" + clientId);
            return;
        }

        const clientAccounts = await Account.findAll({ include: [{ model: AccountType }], where: { clientId: clientId } });

        res.render('compensations/edit', {
            menu: CURRENT_MENU,
            data: { compensation: compensation, client: compensation.client, clientAccounts },
        });

    } catch (err) {
        req.flash("error", "Ocurrio un error y no se encontro la compensación seleccionada en la base de datos");
        winston.error(`Compensation not found for showing info ${JSON.stringify(req.body)} - ${err}`);
        res.redirect("/compensations/client/" + clientId);
    }
};

module.exports.edit = async function (req, res, next) {

    const clientId = req.body.clientId;
    const compensationId = req.body.compensationId;
    const amount = Number.parseFloat(req.body.amount);
    const accountId = Number(req.body.accountId);

    Compensation.findByPk(compensationId)
        .then(async compensation => {

            const originalAccountId = Number(compensation.accountId), originalAmount = Number.parseFloat(compensation.amount);

            await compensation.update({
                accountId: accountId,
                amount: amount,
                comments: req.body.comments,
                emissionDate: req.body.emissionDate,
                accountingImputationId: req.body.accountingImputationId,
                userId: req.user.id
            });

            if ((originalAccountId !== accountId) || (originalAmount !== amount)) {

                //Busco el Movimiento en la CC...

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                let accountMovement = await AccountMovement.findOne({
                    where: {
                        clientId: clientId,
                        periodId: compensation.periodId,
                        category: String.fromCharCode(accountMovementCategory.eStatus.get('COMPENSACION').value),
                        movementId: compensation.id
                    }
                });

                accountMovement = await accountMovement.update({
                    accountId: compensation.accountId,
                    amount: amount,
                    userId: req.user.id
                })

                winston.info(`user #${req.user.id} update the account movement ${accountMovement.id} due to Compensation #${compensationId} update - ${accountMovement}`);

                if (originalAccountId !== accountId) {

                    const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, compensation.periodId, originalAccountId);

                    const newAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, compensation.periodId, compensation.accountId);

                    winston.info(`balance for original account ${originalAccount} and the new account ${newAccount} fixed on user #${req.user.id} Compensation #${compensationId} update request`);

                } else {

                    const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, compensation.periodId, originalAccountId);

                    winston.info(`balance for original account ${originalAccount} fixed on user #${req.user.id} Compensation #${compensationId} update request`);
                }
            };

            req.flash("success", `La Compensación ${compensation.receiptNumber} fue modificada existosamente`);

        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se encontro la compensación seleccionada en la base de datos");
            winston.error(`Compensation not found for showing info ${JSON.stringify(req.body)} - ${err}`);
        })
        .finally(() => {
            res.redirect("/compensations/client/" + clientId);
        })
};

module.exports.info = async function (req, res, next) {

    const clientId = req.params.clientId;
    const compensationId = req.params.compensationId;

    Compensation.findByPk(compensationId,
        {
            include: [
                { model: Client }, { model: BillingPeriod }, { model: User },
                { model: Account, include: [{ model: AccountType }] },
                { model: AccountingImputation, include: [{ model: AccountingGroup }] }
            ],
            paranoid: false
        })
        .then(compensation => {
            res.render('compensations/info', {
                menu: CURRENT_MENU,
                data: { compensation: compensation, client: compensation.client },
            });
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se encontro la compensación seleccionada en la base de datos");
            winston.error(`Compensation not found for showing info ${JSON.stringify(req.body)} - ${err}`);
            res.redirect("/compensations/client/" + clientId);
        })
}


module.exports.createInvoice = function (req, res) {

    const { createSingleReport } = require("../reports/compensations/compensation.report");

    const clientId = req.params.clientId;
    const compensationId = req.params.compensationId;

    Compensation.findByPk(compensationId, {
        include: [
            { model: Client }, { model: BillingPeriod }, { model: User },
            { model: Account, include: [{ model: AccountType }] },
            { model: AccountingImputation, include: [{ model: AccountingGroup }] }
        ],
        paranoid: false
    })
        .then(compensation => {
            createSingleReport(compensation, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))
        })
        .catch(err => {
            console.error(err);
        })
};