const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const Client = Model.client;
const BillingPeriod = Model.billingPeriod;
const Account = Model.account;
const AccountType = Model.accountType;
const User = Model.user;
const FixedTermDeposit = Model.fixedTermDeposit;
const FixedTermDepositsCategory = Model.fixedTermDepositsCategory;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'fixedTermDeposits';

module.exports.CURRENT_MENU = CURRENT_MENU;

const FixedTermDepositStatus = require('../utils/statusMessages.util').FixedTermDeposits;
const BillingPeriodStatus = require('../utils/statusMessages.util').BillingPeriod;

const Notifications = require('../utils/notifications.util');

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

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
        { model: FixedTermDepositsCategory, as: "depositType" },
        { model: Account, as: "sourceAccount", include: [{ model: AccountType }] },
        { model: Account, as: "destinationAccount", include: [{ model: AccountType }] },
        ],
    };

    const client = await Client.findByPk(clientId);

    const fixedTermDeposit = await FixedTermDeposit.findAll(options);

    res.render('fixedTermDeposits/fixedTermDeposits',
        {
            menu: CURRENT_MENU,
            data: { client: client, fixedTermDeposit: fixedTermDeposit, periods: periods },
            params: { showAll: showAll }
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

    const fixedTermDepositsCategories = await FixedTermDepositsCategory.findAll({ where: { enabled: true } });

    res.render("fixedTermDeposits/add", { menu: CURRENT_MENU, data: { client, clientAccounts: Accounts, period, categories: fixedTermDepositsCategories } });
};

module.exports.addNew = async function (req, res) {

    const clientId = req.body.clientId;

    FixedTermDeposit.create({
        clientId: clientId,
        periodId: req.body.billingPeriodId,
        sourceAccountId: req.body.sourceAccountId,
        destinationAccountId: req.body.destinationAccountId,
        amount: parseFloat(req.body.amount.replace(/[^0-9\.-]+/g, "")),
        interests: 0.00,
        categoryId: req.body.categoryId,
        creationDate: req.body.creationDate,
        expirationDate: req.body.expirationDate,
        comments: req.body.comments,
        statusId: FixedTermDepositStatus.eStatus.get('pending').value,
        userId: req.user.id
    })
        .then(async fixedTermDeposit => {

            //-----------------------------------------------------------------
            // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
            //-----------------------------------------------------------------

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            const accountMovementSource = await AccountMovement.addMovement(clientId, fixedTermDeposit.sourceAccountId, fixedTermDeposit.periodId, (-1) * fixedTermDeposit.amount,
                accountMovementCategory.eStatus.get('PLAZO_FIJO').value, fixedTermDeposit.id, fixedTermDeposit.userId);

            if (accountMovementSource === null) {
                winston.error(`It was not possible to add account movement record for the FTD source account ID: ${fixedTermDeposit.sourceAccountId}`);
                throw new Error("It was not possible to add the FTD into the account movements table");
            }

            let accountMovementDestination = await AccountMovement.addMovement(clientId, fixedTermDeposit.destinationAccountId, fixedTermDeposit.periodId, fixedTermDeposit.amount,
                accountMovementCategory.eStatus.get('PLAZO_FIJO').value, fixedTermDeposit.id, fixedTermDeposit.userId);

            if (accountMovementDestination === null) {
                winston.error(`It was not possible to add account movement record for the FTD destination account ID: ${fixedTermDeposit.destinationAccountId}`);
                throw new Error("It was not possible to add the FTD into the account movements table");
            }

            await fixedTermDeposit.update({
                statusId: FixedTermDepositStatus.eStatus.get('created').value,
            });

            winston.info(`Fixed-Term desposit ${fixedTermDeposit.id} created succesfully`)
            req.flash("success", `El Plazo Fijo ha sido creado correctamente`)

        })
        .catch(err => {
            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new FTD ${JSON.stringify(req.body)} - ${err} `)
            req.flash("error", "Ocurrio un error y no se pudo agregar el nuevo plazo fijo a la base de datos");
        })
        .finally(() => {
            res.redirect("/fixedTermDeposits/client/" + clientId);
        });
};


module.exports.accredit = async function (req, res) {

    const clientId = req.body.clientId;

    const depositId = req.body.depositId;

    FixedTermDeposit.findByPk(depositId)
        .then(async fixedTermDeposit => {

            let amount = parseFloat(fixedTermDeposit.amount) + parseFloat(req.body.interests);

            //-----------------------------------------------------------------
            // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
            //-----------------------------------------------------------------

            const AccountMovement = require('./accountMovements.controller');

            const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

            let accountMovementDestination = await AccountMovement.addMovement(clientId, fixedTermDeposit.destinationAccountId, fixedTermDeposit.periodId, (-1) * amount,
                accountMovementCategory.eStatus.get('PLAZO_FIJO').value, fixedTermDeposit.id, fixedTermDeposit.userId);

            if (accountMovementDestination === null) {
                winston.error(`It was not possible to add account movement record for the FTD destination account ID: ${fixedTermDeposit.destinationAccountId}`);
                throw new Error("It was not possible to add the FTD into the account movements table");
            }

            const accountMovementSource = await AccountMovement.addMovement(clientId, fixedTermDeposit.sourceAccountId, fixedTermDeposit.periodId, amount,
                accountMovementCategory.eStatus.get('PLAZO_FIJO').value, fixedTermDeposit.id, fixedTermDeposit.userId);

            if (accountMovementSource === null) {
                winston.error(`It was not possible to add account movement record for the FTD source account ID: ${fixedTermDeposit.sourceAccountId}`);
                throw new Error("It was not possible to add the FTD into the account movements table");
            }

            await fixedTermDeposit.update({
                interests: parseFloat(req.body.interests.replace(/[^0-9\.-]+/g, "")),
                statusId: FixedTermDepositStatus.eStatus.get('accredited').value,
            });

            winston.info(`Fixed-Term desposit ${fixedTermDeposit.id}updated succesfully`)
            req.flash("success", `Los intereses del plazo fijo ha sido acreditados correctamente`)

        })
        .catch(err => {
            winston.error(`An error ocurred while user #${req.user.id} tryed to update a new FTD interests ${JSON.stringify(req.body)} - ${err} `)
            req.flash("error", "Ocurrio un error y no se pudo acreditar los intereses el plazo fijo seleccionado");

        })
        .finally(() => {
            res.redirect("/fixedTermDeposits/client/" + clientId);
        })
};
