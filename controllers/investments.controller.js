const moment = require('moment');

const Sequelize = require('sequelize');
const { QueryTypes, query } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const Client = Model.client;
const BillingPeriod = Model.billingPeriod;
const Account = Model.account;
const AccountMovement = Model.accountMovement;
const AccountType = Model.accountType;
const User = Model.user;
const Investment = Model.investment;
const InvestmentCategory = Model.investmentCategory;
const Bank = Model.bank;

const winston = require('../helpers/winston.helper');

const mailgun = require('../helpers/mailgun.helper');

const CURRENT_MENU = 'investments';

module.exports.CURRENT_MENU = CURRENT_MENU;

const InvestmentsStatus = require('../utils/statusMessages.util').Investments;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

const Notifications = require('../utils/notifications.util');
const { invert } = require('underscore');

module.exports.vencimiento = async function (req, res) {

    const db = require('../models')

    const investments = await db.sequelize.query(
        "SELECT *, DATEDIFF(expirationDate ,NOW()) as expirationDays FROM `investments` where DATEDIFF(expirationDate ,NOW()) between 0 and 5;",
        { type: QueryTypes.SELECT });

    res.send(JSON.stringify(investments))
}

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    let periods = [];

    if (typeof req.query.periodId != 'undefined') {
        periods = req.query.periodId.split(',');
    } else {

        const activePeriod = await BillingPeriod.findOne({
            where: { clientId: clientId, statusId: 1 },
            attributes: ['id']
        });

        if (activePeriod) { periods.push(activePeriod.id) }
    }

    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    //CollectionStatus.eStatus.get('opened').value

    const status = (showAll === true) ? [0, 1, 2, 3, 4, 5] : [1, 2, 3, 4];

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            //statusId: { [Op.in]: status }
        },
        include: [{ model: Client }, { model: BillingPeriod }, { model: User },
        { model: InvestmentCategory, as: "depositType" },
        { model: Account, as: "sourceAccount", include: [{ model: AccountType }] },
        { model: Account, as: "destinationAccount", include: [{ model: AccountType }] },
        ],
    };

    const client = await Client.findByPk(clientId);

    Investment.findAll(options)
        .then(invesments => {
            res.render('investments/investments',
                {
                    menu: CURRENT_MENU,
                    data: { client: client, investment: invesments, periods: periods },
                    params: { showAll: showAll }
                });
        })
        .catch(err => {
            winston.error(`An error ocurred fetching investments for clientId #${clientId} - ${err}`);
            req.flash("error", `Ocurrio un error y no fue posible recuperar las inversiones`);
            res.redirect("/investments"); return;
        });
};

module.exports.showNewForm = async function (req, res) {

    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);

    const Accounts = await Account.findAll(
        { where: { clientId: clientId }, include: [{ model: AccountType }] });

    const period = await BillingPeriod.findOne({
        where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
    });

    const investmentsCategories = await InvestmentCategory.findAll({ where: { enabled: true } });

    res.render("investments/add", { menu: CURRENT_MENU, data: { client, clientAccounts: Accounts, period, categories: investmentsCategories } });
};

module.exports.addNew = async function (req, res) {

    const clientId = req.body.clientId;

    const investmentCategory = await InvestmentCategory.findByPk(req.body.categoryId);

    if (investmentCategory.hasExpirationDate && req.body.expirationDate === '') {
        req.flash("error", `La categoría de inversión seleccionada requiere fecha de vencimiento`);
        res.redirect("/investments/client/" + clientId); return;
    }

    
    Investment.create({
        clientId: clientId,
        periodId: req.body.billingPeriodId,
        sourceAccountId: req.body.sourceAccountId,
        destinationAccountId: req.body.destinationAccountId,
        amount: parseFloat(req.body.amount.replace(/[^0-9\.-]+/g, "")),
        interests: 0.00,
        categoryId: req.body.categoryId,
        creationDate: req.body.creationDate,
        expirationDate: (req.body.expirationDate === '' ? null : req.body.expirationDate),
        comments: req.body.comments,
        statusId: InvestmentsStatus.eStatus.get('pending').value,
        userId: req.user.id
    })
        .then(async investment => {

            //-----------------------------------------------------------------
            // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
            //-----------------------------------------------------------------

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            const accountMovementSource = await AccountMovement.addMovement(clientId, investment.sourceAccountId, investment.periodId, (-1) * investment.amount,
                accountMovementCategory.eStatus.get('INVERSION').value, investment.id, investment.userId);

            if (accountMovementSource === null) {
                winston.error(`It was not possible to add account movement record for the FTD source account ID: ${investment.sourceAccountId}`);
                throw new Error("It was not possible to add the FTD into the account movements table");
            }

            let accountMovementDestination = await AccountMovement.addMovement(clientId, investment.destinationAccountId, investment.periodId, investment.amount,
                accountMovementCategory.eStatus.get('INVERSION').value, investment.id, investment.userId);

            if (accountMovementDestination === null) {
                winston.error(`It was not possible to add account movement record for the FTD destination account ID: ${investment.destinationAccountId}`);
                throw new Error("It was not possible to add the FTD into the account movements table");
            }

            await investment.update({
                statusId: InvestmentsStatus.eStatus.get('created').value,
            });

            winston.info(`Investment ${investment.id} created succesfully`)
            req.flash("success", `El Plazo Fijo ha sido creado correctamente`)

        })
        .catch(err => {
            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new FTD ${JSON.stringify(req.body)} - ${err} `)
            req.flash("error", "Ocurrio un error y no se pudo agregar el nuevo plazo fijo a la base de datos");
        })
        .finally(() => {
            res.redirect("/investments/client/" + clientId);
        });
};

module.exports.accredit = async function (req, res) {

    const clientId = req.body.clientId;

    const depositId = req.body.depositId;

    const userId = req.user.id;

    Investment.findByPk(depositId, {
        include: [{ model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
        { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'sourceAccount' },
        { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'destinationAccount' },
        { model: InvestmentCategory, as: "depositType" },
        ],
    })
        .then(async investment => {

            let amount = parseFloat(investment.amount) + parseFloat(req.body.interests);

            const activePeriod = await BillingPeriod.findOne({
                where: { clientId: clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value },
                attributes: ['id']
            });

            //si esta en estado "creada" o "expirada", acreditamos los intereses...

            if ((investment.statusId === InvestmentsStatus.eStatus.get('created').value) || (investment.statusId === InvestmentsStatus.eStatus.get('expired').value)) {

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                //en el movimiento saliente de la cuenta de PF, solo se contempla el valor original del mismo sin los intereses

                let accountMovementDestination = await AccountMovement.addMovement(clientId, investment.destinationAccountId, activePeriod.id, (-1) * investment.amount,
                    accountMovementCategory.eStatus.get('INVERSION').value, investment.id, userId);

                if (accountMovementDestination === null) {
                    winston.error(`It was not possible to add account movement record for the investment destination account ID: ${investment.destinationAccountId}`);
                    throw new Error("It was not possible to add the investment into the account movements table");
                }

                const accountMovementSource = await AccountMovement.addMovement(clientId, investment.sourceAccountId, activePeriod.id, amount,
                    accountMovementCategory.eStatus.get('INVERSION').value, investment.id, userId);

                if (accountMovementSource === null) {
                    winston.error(`It was not possible to add account movement record for the investment source account ID: ${investment.sourceAccountId}`);
                    throw new Error("It was not possible to add the investment into the account movements table");
                }

                await investment.update({
                    interests: parseFloat(req.body.interests.replace(/[^0-9\.-]+/g, "")),
                    statusId: InvestmentsStatus.eStatus.get('accredited').value,
                    userId: userId
                });

                winston.info(`Fixed-Term desposit ${investment.id} updated succesfully`)
                req.flash("success", `Los intereses del plazo fijo han sido acreditados correctamente`); return;

            }

            //si la inversion es un PF y esta "acreditada", solo podemos editar los intereses...

            if (investment.statusId === InvestmentsStatus.eStatus.get('accredited').value) {

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                //-------------------------------------------------------------
                // <----- ACTUALIZAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-------------------------------------------------------------

                let accountMovement = await AccountMovement.findOne({
                    where: {
                        clientId: clientId,
                        periodId: activePeriod.id,
                        category: String.fromCharCode(accountMovementCategory.eStatus.get('INVERSION').value),
                        movementId: investment.id,
                        accountId: investment.sourceAccountId,
                    }
                });

                if (accountMovement === null) { throw new Error('cannot find account movement in database'); }

                //Actualizamos el movimiento en la CC...

                accountMovement = await accountMovement.update({
                    amount: amount,
                    userId: req.user.id
                })

                await investment.update({
                    interests: parseFloat(req.body.interests.replace(/[^0-9\.-]+/g, "")),
                    userId: userId
                });

                const sourceAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, activePeriod.id, investment.sourceAccountId);

                winston.info(`balance for account ${investment.sourceAccountId} fixed on user #${req.user.id} investment #${investment.id} update request`);

                winston.info(`Fixed-Term desposit ${investment.id} interests updated succesfully`)
                req.flash("success", `Los intereses del plazo fijo han sido actualizado correctamente`); return;
            }

        })
        .catch(err => {
            winston.error(`An error ocurred while user #${req.user.id} tryed to update a new FTD interests ${JSON.stringify(req.body)} - ${err}`)
            req.flash("error", "Ocurrio un error y no se pudo acreditar los intereses del plazo fijo seleccionado");

        })
        .finally(() => {
            res.redirect("/investments/client/" + clientId);
        })
};

module.exports.listAllRescues = async function (req, res) {

}

module.exports.getCategoryDetailsById = async function (req, res) {
    InvestmentCategory.findByPk(req.params.categoryId)
        .then(investmentCategory => {
            res.send(investmentCategory);
        })
        .catch(err => res.sendStatus(500).send(err));
}

module.exports.expirationDateReminder = async () => {

    winston.info(`executing expiration investments reminder`)

    var startDate = moment();
    startDate = startDate.subtract(2, "days");
    startDate = startDate.format("YYYY-MM-DD");

    var endDate = moment();
    endDate = endDate.add(2, "days");
    endDate = endDate.format("YYYY-MM-DD");

    winston.info(`searching created or expired investments from ${startDate} to ${endDate}`);

    Investment.findAll({
        where: {
            expirationDate: {
                [Op.between]: [startDate, endDate]
            },
            statusId: {
                [Op.or]: [InvestmentsStatus.eStatus.get('created').value, InvestmentsStatus.eStatus.get('expired').value]
            }
        },
        include: [
            { model: Client }
        ]
    }).then(async investments => {

        if (investments.length === 0) return;

        //antes de mandar las notificaciones, pasamos a "expired" todos aquellos PFs que tengan "expired===true"

        for (const investment of investments) {
            if (investment.expired === true) {
                try {
                    await investment.update({
                        statusId: InvestmentsStatus.eStatus.get('expired').value,
                    });

                    winston.info(`Fixed-Term desposit ${investment.id} updated succesfully to expired`)

                } catch (error) {
                    winston.error(`It was not possible to update the status of ${investment.id} to expired - ${error}`);
                }
            }
        }

        // console.log(JSON.stringify(investments));

        // generamos el listado de todos los usuarios habilitados del sistema para enviarles el mail

        //TODO: aca deberiamos buscar de una tabla de config

        const getAllActiveUsers = require('./users.controller').getAllActiveUsers;

        const users = await getAllActiveUsers();

        const emails = users.map(element => element.email)

        mailgun.sendEmailInvestmentExpiration(emails, investments);

        //si hay elementos que ya expiraron, entonces la notificacion del sistema sale CRITICAL...

        const critical = investments.find(element => element.expired === true);

        if (critical) {
            (new Notifications).critical('fixedTermDeposits', `tiene (${investments.length}) inversiones próximas a vencer`)
        } else {
            (new Notifications).warning('fixedTermDeposits', `tiene (${investments.length}) inversiones vencidas o próximas a vencer`)
        }
    })
}

module.exports.printReceipt = async function (req, res, next) {

    const investmentId = req.params.id;
    const clientId = req.params.clientId;

    const { createSingleReport } = require("../reports/investments/investments.report");

    Investment.findByPk(investmentId,
        {
            include: [{ model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'sourceAccount' },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'destinationAccount' },
            { model: InvestmentCategory, as: "depositType" },
            ],
        })
        .then(investment => {

            if (investment === null) {
                throw new Error('not found')
            }

            createSingleReport(investment, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))

        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se encontro la inversión seleccionada en la base de datos");
            winston.error(`Investment not found for showing info #${investmentId} - ${err}`);
            res.redirect("/investments/client/" + clientId);
        })

};

module.exports.showEditForm = async function (req, res) {

    const clientId = req.params.clientId;

    const investmentId = req.params.investmentId;

    try {
        const client = await Client.findByPk(clientId);

        const Accounts = await Account.findAll(
            { where: { clientId: clientId }, include: [{ model: AccountType }] });

        // const period = await BillingPeriod.findOne({
        //     where: { clientId: req.params.clientId, statusId: BillingPeriodStatus.eStatus.get('opened').value }
        // });

        const investmentsCategories = await InvestmentCategory.findAll({ where: { enabled: true } });

        const investment = await Investment.findByPk(investmentId, {
            include: [{ model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'sourceAccount' },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'destinationAccount' },
            { model: InvestmentCategory, as: "depositType" },
            ],
        });

        //solo permitimos editar inversiones en un periodo de facturacion abierto
        if (investment.billingPeriod.statusId !== BillingPeriodStatus.eStatus.get('opened').value) {
            req.flash("warning", "La inversión que quiere modificar pertenece a un período finalizado");
            res.redirect("/investments/client/" + clientId); return;
        }

        //si la inversion es un PF y esta "acreditada", solo podemos editar los intereses
        if (investment.statusId === InvestmentsStatus.eStatus.get('accredited').value) {
            req.flash("warning", "La edicion de inversiones acreditadas no está permitida");
            res.redirect("/investments/client/" + clientId); return;
        }

        //si esta en estado "creada" o "expirada", cargamos el form de edicion con los campos permitidos
        if ((investment.statusId === InvestmentsStatus.eStatus.get('created').value) || (investment.statusId === InvestmentsStatus.eStatus.get('expired').value)) {
            res.render('investments/edit', { menu: CURRENT_MENU, data: { client: client, clientAccounts: Accounts, categories: investmentsCategories, investment } }); return;
        }

        //si esta en eun estado diferente a los anteriores, no se puede editar
        req.flash("warning", "La edicion de inversiones no esta permitida para el estado actual");
        res.redirect("/investments/client/" + clientId); return;

    } catch (error) {
        req.flash("error", "Ocurrio un error y no se puede modificar la inversion en la base de datos");
        winston.error(`An error ocurred while user #${req.user.id} tryed to update the Investment #${investmentId} - ${err}`);
        res.redirect("/investments/client/" + clientId);
    }
};

module.exports.edit = async function (req, res, next) {

    const clientId = req.params.clientId;

    const investmentId = req.params.investmentId;

    try {

        const investment = await Investment.findByPk(investmentId,
            {
                include: [{ model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
                { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'sourceAccount' },
                { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'destinationAccount' },
                { model: InvestmentCategory, as: "depositType" },
                ],
            });

        if (investment === null) {
            req.flash("error", "La inversión que quiere modificar no se encuentra en la base de datos");
            res.redirect("/investments/client/" + clientId); return;
        }

        if (investment.billingPeriod.statusId !== BillingPeriodStatus.eStatus.get('opened').value) {
            req.flash("warning", "La inversión que quiere modificar pertenece a un período finalizado");
            res.redirect("/investments/client/" + clientId); return;
        };

        if ((investment.statusId === InvestmentsStatus.eStatus.get('created').value) || (investment.statusId === InvestmentsStatus.eStatus.get('expired').value)) {

            //validamos si difiere el importe o algunas de las cuentas, origen o destino...

            let updateMovSource = false, updateMovDestination = false;

            const amount = parseFloat(req.body.amount.replace(/[^0-9\.-]+/g, ""));

            if (parseFloat(investment.amount) !== amount) {
                updateMovSource = true; updateMovDestination = true;
            }

            if (investment.sourceAccountId !== req.body.sourceAccountId) { updateMovSource = true; }
            if (investment.destinationAccountId !== req.body.destinationAccountId) { updateMovDestination = true; }

            const originalSourceAccountId = investment.sourceAccountId;
            const originalDestinationAccountId = investment.destinationAccountId;

            if (updateMovSource === true) {     // CTA. ORIGEN

                //Busco el Movimiento en la CC...

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                let accountMovement = await AccountMovement.findOne({
                    where: {
                        clientId: clientId,
                        periodId: investment.periodId,
                        category: String.fromCharCode(accountMovementCategory.eStatus.get('INVERSION').value),
                        movementId: investment.id,
                        accountId: investment.sourceAccountId,
                    }
                });

                if (accountMovement === null) { throw new Error('cannot find account movement in database'); }

                //Actualizamos el movimiento en la CC...

                accountMovement = await accountMovement.update({
                    accountId: req.body.sourceAccountId,
                    amount: (-1) * amount,
                    userId: req.user.id
                })

                if (originalSourceAccountId !== Number(req.body.sourceAccountId)) {

                    const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, investment.periodId, originalSourceAccountId);

                    const newAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, investment.periodId, req.body.sourceAccountId);

                    winston.info(`balance for original account ${originalAccount} and the new account ${newAccount} fixed on user #${req.user.id} investment #${investmentId} update request`);

                } else {

                    const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, investment.periodId, originalSourceAccountId);

                    winston.info(`balance for original account ${originalAccount} fixed on user #${req.user.id} investment #${investmentId} update request`);
                }
            }

            if (updateMovDestination === true) {    // CTA. DESTINO

                //Busco el Movimiento en la CC...

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                let accountMovement = await AccountMovement.findOne({
                    where: {
                        clientId: clientId,
                        periodId: investment.periodId,
                        category: String.fromCharCode(accountMovementCategory.eStatus.get('INVERSION').value),
                        movementId: investment.id,
                        accountId: investment.destinationAccountId,
                    }
                });

                if (accountMovement === null) { throw new Error('cannot find account movement in database'); }

                //Actualizamos el movimiento en la CC...

                accountMovement = await accountMovement.update({
                    accountId: req.body.destinationAccountId,
                    amount: amount,
                    userId: req.user.id
                })

                if (originalDestinationAccountId !== Number(req.body.destinationAccountId)) {

                    const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, investment.periodId, originalDestinationAccountId);

                    const newAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, investment.periodId, req.body.destinationAccountId);

                    winston.info(`balance for original account ${originalAccount} and the new account ${newAccount} fixed on user #${req.user.id} investment #${investmentId} update request`);

                } else {

                    const originalAccount = await require('./accountMovements.controller').fixBalanceMovements(clientId, investment.periodId, originalDestinationAccountId);

                    winston.info(`balance for original account ${originalAccount} fixed on user #${req.user.id} investment #${investmentId} update request`);
                }
            }

            await investment.update({
                sourceAccountId: req.body.sourceAccountId,
                destinationAccountId: req.body.destinationAccountId,
                amount: amount,
                categoryId: req.body.categoryId,
                creationDate: req.body.creationDate,
                expirationDate: (req.body.expirationDate === '' ? null : req.body.expirationDate),
                comments: req.body.comments,
                userId: req.user.id
            });
        }

        winston.info(`Investment ${investment.id} updated succesfully`)
        req.flash("success", `La inversión fue actualizada correctamente`)

    } catch (err) {
        req.flash("error", "Ocurrio un error y no se pudo modificar la inversion en la base de datos");
        winston.error(`An error ocurred while user #${req.user.id} tryed to update the Investment #${investmentId} - ${err}`);
    } finally {
        res.redirect("/investments/client/" + clientId);
    }
}

module.exports.delete = async function (req, res) {

    const clientId = req.body.clientId;

    const investmentId = req.body.investmentId;

    try {

        winston.info(`User #${req.user.id} requested to delete investment ${investmentId}`);

        const investment = await Investment.findByPk(investmentId, {
            include: [{ model: Client }, { model: BillingPeriod }, { model: User, include: [{ model: Model.userSignature }] },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'sourceAccount' },
            { model: Account, paranoid: false, include: [{ model: AccountType }, { model: Bank }], as: 'destinationAccount' },
            { model: InvestmentCategory, as: "depositType" },
            ],
        });

        if (investment.billingPeriod.statusId !== BillingPeriodStatus.eStatus.get('opened').value) {
            req.flash("error", "La inversión que quiere modificar pertenece a un período finalizado");
            res.redirect("/investments/client/" + clientId); return;
        }

        if ((investment.statusId !== InvestmentsStatus.eStatus.get('pending').value) && (investment.statusId !== InvestmentsStatus.eStatus.get('created').value)) {
            req.flash("error", "Solo se pueden eliminar inversiones que se encuentren en estado pendiente o creado");
            res.redirect("/investments/client/" + clientId); return;
        }

        //------------------------------------------------------------------------
        // eliminamos el movimiento de la CC del barrio - cuenta Origen & Destino
        //------------------------------------------------------------------------

        const AccountMovement = require('./accountMovements.controller');

        const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

        const accountMovementSource = await AccountMovement.deleteMovement(clientId, investment.sourceAccountId, investment.periodId,
            accountMovementCategory.eStatus.get('INVERSION').value, investment.id);

        if (accountMovementSource === null) {
            winston.error(`It was not possible to delente the account movement record for the source account ID: ${investment.sourceAccountId}`);
            throw new Error("It was not possible to add the FTD into the account movements table");
        }

        const accountMovementDestination = await AccountMovement.deleteMovement(clientId, investment.destinationAccountId, investment.periodId,
            accountMovementCategory.eStatus.get('INVERSION').value, investment.id);

        if (accountMovementDestination === null) {
            winston.error(`It was not possible to delente the account movement record for the source account ID: ${investment.destinationAccountId}`);
            throw new Error("It was not possible to add the FTD into the account movements table");
        }
        // Finalmente pasamos la inversion como eliminada

        await investment.update({
            statusId: InvestmentsStatus.eStatus.get('cancelled').value,
        });

        //---------------------------------------------------------------------

        winston.info(`Investment ${investmentId} deleted successfully by user ${req.user.id}`);

        req.flash("success", `La inversion #${investment.id} fue anulada correctamente`);

    } catch (err) {

        req.flash("error", "Ocurrio un error y no se pudo anular correctamente el registro de la inversión en la base de datos");

        winston.error(`An error ocurred while user #${req.user.id} deleted the investment ${investmentId} - ${err}`);

    } finally {
        res.redirect("/investments/client/" + clientId);
    }
}
