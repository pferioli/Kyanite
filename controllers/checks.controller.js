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
const AccreditedCheck = Model.accreditedCheck;
const PaymentOrder = Model.paymentOrder;
const Collection = Model.collection;
const CollectionConcept = Model.collectionConcept;
const CollectionSecurity = Model.collectionSecurity;
const CollectionProperty = Model.collectionProperty;

const winston = require('../helpers/winston.helper');

const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;
const CheckStatus = require('../utils/statusMessages.util').Check;
const AccreditedCheckStatus = require('../utils/statusMessages.util').AccreditedCheck;
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;
const CollectionStatus = require('../utils/statusMessages.util').Collection;
const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;

const moment = require('moment');

const CURRENT_MENU = 'checks'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {

    const clientId = req.params.clientId || req.body.clientId;

    const client = await Client.findByPk(clientId);

    let options = {
        subQuery: false,
        where: { clientId: clientId },
        include: [
            { model: User }, { model: Account, include: [{ model: AccountType }] },
            { model: Bank }, { model: BillingPeriod },
            {
                model: CheckSplitted,
                required: false,
                attributes: ['id']
            },
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
            amount: req.body.amount,
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
            then(async function (result) {

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                const accountMovement = await AccountMovement.addMovement(result.clientId, result.accountId, result.periodId, result.amount,
                    accountMovementCategory.eStatus.get('CHEQUE_EN_CARTERA').value, result.id, result.userId)

                if (accountMovement === null) {
                    winston.error(`It was not possible to add account movement record for the PO (ID: ${paymentOrder.id})  - ${err}`);
                    throw new Error("It was not possible to add the collection into the account movements table");
                }

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

module.exports.delete = async function (req, res, next) {

    const checkId = req.body.checkId;
    const clientId = req.body.clientId;

    Check.findByPk(checkId,
        {
            include: [
                {
                    model: CheckSplitted,
                    required: false,
                    where: {
                        statusId:
                            { [Op.eq]: SplitCheckStatus.eStatus.get('assigned').value }
                    }
                }
            ]
        })
        .then(async function (check) {

            if (check.statusId !== CheckStatus.eStatus.get('wallet').value) {
                req.flash("warning", "El cheque solo puede ser eliminado cuando esta EN CARTERA"); return;
            }

            if (check.checkSplitteds.length > 0) {
                req.flash("warning", "Hay cheques parciales previamente asignados, no es posible eliminar el cheque"); return;
            }

            await CheckSplitted.update(
                { statusId: SplitCheckStatus.eStatus.get('deleted').value, userId: req.user.id },
                { where: { checkId: check.id } })

            await check.update({ statusId: CheckStatus.eStatus.get('cancelled').value });

            req.flash("success", "El cheque fue eliminado exitosamente a la base de datos");
            winston.info(`check #${checkId} was deleted by user #${req.user.id} `);
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se pudo eliminar el cheque de la base de datos");
            winston.error(`an error ocurred when user "${req.user.id} tryed to delete check #${checkId} - ${err}`);
        })
        .finally(function () {
            res.redirect("/checks/client/" + clientId);
        })

};

module.exports.updateStatus = async function (req, res, next) {

    const clientId = req.body.clientId;

    try {

        const statusId = parseInt(req.body.statusId);

        const checkId = req.body.checkId;

        let accountId = req.body.accountId;

        const comments = req.body.comments;

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        const periodId = activePeriod.id;

        Check.findByPk(checkId)
            .then(async function (check) {

                if (check.statusId === CheckStatus.eStatus.get('rejected').value) {
                    req.flash("warning", "No es posible cambiar el estado de un cheque que se encuentra en estado RECHAZADO"); return;
                }

                if ((statusId === CheckStatus.eStatus.get('wallet').value) ||
                    (statusId === CheckStatus.eStatus.get('deposited').value) ||
                    (statusId === CheckStatus.eStatus.get('delivered').value)) {

                    if (check.statusId === CheckStatus.eStatus.get('accredited').value) {
                        req.flash("warning", "No es posible volver a un estado previo luego de haber sido acreditado"); return;
                    }
                }

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                if (statusId === CheckStatus.eStatus.get('accredited').value) {

                    const accreditedCheck = await AccreditedCheck.create({
                        clientId: check.clientId,
                        checkId: check.id,
                        accountId: accountId,
                        periodId: periodId,
                        statusId: AccreditedCheckStatus.eStatus.get('accredited').value,
                        userId: req.user.id
                    });

                    if (accreditedCheck !== null) {

                        const accountMovementSource = await AccountMovement.addMovement(clientId, check.accountId, periodId, (-1) * check.amount,
                            accountMovementCategory.eStatus.get('CHEQUE_ACREDITADO').value, check.id, req.user.id);

                        const accountMovementDestination = await AccountMovement.addMovement(clientId, accountId, periodId, check.amount,
                            accountMovementCategory.eStatus.get('CHEQUE_ACREDITADO').value, check.id, req.user.id);

                        if ((accountMovementDestination === null) || (accountMovementSource === null)) {
                            winston.error(`It was not possible to add an accredit account movement record for check #${check.id}`);
                            throw new Error("It was not possible to add an accredit account movement record for check #${check.id}");
                        }

                    }
                };

                if (statusId === CheckStatus.eStatus.get('rejected').value) {

                    if (check.statusId === CheckStatus.eStatus.get('accredited').value) {

                        const accreditedCheck = await AccreditedCheck.findOne({ where: { checkId: check.id } });

                        await accreditedCheck.update({
                            statusId: AccreditedCheckStatus.eStatus.get('rejected').value,
                            comments: comments
                        });

                        accountId = accreditedCheck.accountId;

                    } else {

                        accountId = check.accountId;

                        const accreditedCheck = await AccreditedCheck.create({
                            clientId: check.clientId,
                            checkId: check.id,
                            accountId: accountId,
                            periodId: periodId,
                            statusId: AccreditedCheckStatus.eStatus.get('rejected').value,
                            comments: comments,
                            userId: req.user.id
                        });
                    }

                    const accountMovement = await AccountMovement.addMovement(clientId, accountId, periodId, (-1) * check.amount,
                        accountMovementCategory.eStatus.get('CHEQUE_RECHAZADO').value, check.id, req.user.id);

                    if (accountMovement === null) {
                        winston.error(`It was not possible to add an accredit account movement record for check #${check.id}`);
                        throw new Error("It was not possible to add an accredit account movement record for check #${check.id}");
                    }

                    //hay que buscar para cada tipo de cheque las cobranzas o las OPs y pasarlos a "cancelled"

                    let splittedChecksCollections = await CheckSplitted.findAll({ where: { checkId: checkId, splitType: 'I' } });

                    //para cada UF hay que pasarla a "deleted"

                    for (let splittedCheck of splittedChecksCollections) {

                        try {
                            if (splittedCheck.statusId === SplitCheckStatus.eStatus.get('assigned').value) {

                                const collectionSecurity = await CollectionSecurity.findOne({ where: { checkId: splittedCheck.id } });

                                await Collection.update(
                                    {
                                        statusId: CollectionStatus.eStatus.get('deleted').value,
                                        updatePeriodId: periodId
                                    },
                                    { where: { id: collectionSecurity.collectionId } });
                            }

                            await splittedCheck.update({ statusId: SplitCheckStatus.eStatus.get('deleted').value });

                        } catch (error) {
                            winston.error(`It was not possible to delete the collection #${collectionSecurity.collectionId} associated to splitted check #${splittedCheck.id} from check #${check.id}`);
                        }
                    }

                    //para cada OP hay que pasarla a "deleted"

                    let splittedChecksPaymentOrders = await CheckSplitted.findAll({ where: { checkId: checkId, splitType: 'O' } });

                    for (let splittedCheck of splittedChecksPaymentOrders) {

                        try {

                            if (splittedCheck.statusId === SplitCheckStatus.eStatus.get('assigned').value) {

                                const paymentOrder = await PaymentOrder.findOne({ where: { checkId: splittedCheck.id } })

                                const paymentOrderController = require('./paymentOrders.controller');

                                if (periodId === paymentOrder.periodId) {
                                    paymentOrderController.deletePaymentOrder(clientId, paymentOrder.id);
                                } else {
                                    paymentOrder.update({ statusId: PaymentOrderStatus.eStatus.get('deleted').value })
                                }
                            }

                            await splittedCheck.update({ statusId: SplitCheckStatus.eStatus.get('deleted').value });

                        } catch (error) {
                            winston.error(`It was not possible to delete the payment order #${paymentOrder.id} associated to splitted check #${splittedCheck.id} from check #${check.id}`);
                        };
                    };
                };

                check = await check.update({ statusId: statusId });

                winston.info(`the status of check #${checkId} changed to ${statusId} by userId ${req.user.id} request`);
                req.flash("success", "El estado del cheque fue actualizado exitosamente");
                res.redirect("/checks/client/" + clientId);

            })
            .catch(err => {
                req.flash("error", "Ocurrio un error y no se pudo cambiar el estado del cheque en la base de datos");
                winston.error(`an error ocurred when user "${req.user.id} tryed to update check status #${checkId} - ${err}`);
                res.redirect("/checks/client/" + clientId);
            })

    } catch (err) {
        req.flash("error", "Ocurrio un error y no se pudo cambiar el estado del cheque en la base de datos");
        winston.error(`an error ocurred when user "${req.user.id} tryed to update check status #${checkId} - ${err}`);
        res.redirect("/checks/client/" + clientId);
    }
}
//---------------------------------------------------------------------------//
// REPORTS
//---------------------------------------------------------------------------//

module.exports.walletChecksReport = async function (req, res) {

    const { createReport } = require("../reports/checks/walletChecks.report");

    const clientId = req.params.clientId;

    const client = await Client.findByPk(clientId);

    let options = {
        where: { clientId: clientId, statusId: CheckStatus.eStatus.get('wallet').value},
        include: [
            { model: User }, { model: Account, include: [{ model: AccountType }] },
            { model: Bank }, { model: BillingPeriod },
        ]
    };

    Check.findAll(options)
        .then(function (checks) {
            createReport(checks, client, req.user, res);            
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se pudo generar el reporte de cheques en cartera");
            winston.error(`an error ocurred when user "${req.user.id} requested wallet checks report for customer #${clientId} - ${err}`);
            res.redirect("/checks/client/" + clientId);
        })
};

//---------------------------------------------------------------------------//
// AJAX
//---------------------------------------------------------------------------//

module.exports.getBanks = async function (req, res) {

    Bank.findAll({ where: { enabled: true } })
        .then(banks => {
            res.send(banks);
        })
        .catch(err => { res.send(err).status(500) })
}

//---------------------------------------------------------------------------//
// CRONES
//---------------------------------------------------------------------------//

const schedule = require('node-schedule');

/**
* @function 
* @summary this function is called by a scheduler to find 
* @param {*} fireDate 
* @returns {Array} key-value pair array with mapped field_name / field_id
*/
function searchExpiredChecks(fireDate) {

    winston.info('Executing crontab for searching checks close to due date');
}

const job1 = schedule.scheduleJob('* * 1 * *', function (fireDate) {
    searchExpiredChecks(fireDate);
})