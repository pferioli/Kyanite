const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Supplier = Model.supplier;
const SupplierCategory = Model.supplierCategory;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;
const PaymentOrder = Model.paymentOrder;
const BillingPeriod = Model.billingPeriod;
const AccountingImputation = Model.accountingImputation;
const AccountingGroup = Model.accountingGroup;
const Account = Model.account;
const AccountType = Model.accountType;
const CheckSplitted = Model.checkSplitted;
const User = Model.user;

const gcs = require('../helpers/gcs.helper'); module.exports = { gcs };

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'paymentReceipts'; module.exports.CURRENT_MENU = CURRENT_MENU;

const PaymentReceiptStatus = require('../utils/statusMessages.util').PaymentReceipt;
const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;
const SplitCheckStatus = require('../utils/statusMessages.util').SplitCheck;
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

    const status = (showAll === true) ? [0, 1, 2, 3, 4, 5] : [1, 2];

    let options = {
        where: {
            clientId: clientId,
            periodId: {
                [Op.in]: periods
            },
            statusId: { [Op.in]: status }
        },
        include: [{ model: Supplier }, { model: ReceiptType }, { model: BillingPeriod }, { model: User },
        {
            model: AccountingImputation, include: [{ model: AccountingGroup }]
        }],
    };

    const client = await Client.findByPk(clientId);

    const paymentReceipts = await PaymentReceipt.findAll(options);

    res.render('expenses/paymentReceipts/receipts',
        {
            menu: CURRENT_MENU,
            data: { client: client, paymentReceipts: paymentReceipts, periods: periods },
            params: { showAll: showAll, autoRefresh: autoRefresh }
        });
};


module.exports.showEditForm = async function (req, res) {

    const receiptId = req.params.receiptId;

    const paymentReceipt = await PaymentReceipt.findByPk(receiptId,
        {
            include: [{ model: Client }, { model: Supplier, include: [{ model: SupplierCategory }] }, { model: BillingPeriod }, { model: ReceiptType },
            { model: AccountingImputation, include: [{ model: AccountingGroup }] }]
        });

    const suppliers = await Supplier.findAll(
        {
            /*include: [{ model: SupplierCategory }],*/
            order: [['name', 'asc']]
        });

    if (paymentReceipt.billingPeriod.statusId === BillingPeriodStatus.eStatus.get('opened').value) {
        res.render('expenses/paymentReceipts/edit', { menu: CURRENT_MENU, data: { client: paymentReceipt.client, paymentReceipt, suppliers } });
    } else {

        req.flash("error", "La factura que quiere modificar pertenece a un período finalizado");

        res.redirect('/expenses/paymentReceipts/client/' + paymentReceipt.client.id);
    }
};


module.exports.info = async function (req, res) {

    const receiptId = req.params.receiptId;

    const paymentReceipt = await Client.findByPk(receiptId);

    res.render('expenses/paymentReceipts/info', { menu: CURRENT_MENU, data: { paymentReceipt } });
};

module.exports.showNewForm = async function (req, res) {
    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);
    const suppliers = await Supplier.findAll(
        {
            /*include: [{ model: SupplierCategory }],*/
            order: [['name', 'asc']]
        });
    res.render('expenses/paymentReceipts/add', { menu: CURRENT_MENU, data: { client, suppliers } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;

    PaymentReceipt.create(
        {
            clientId: clientId,
            receiptNumber: req.body.receiptNumber,
            receiptTypeId: req.body.receiptTypeId,
            emissionDate: req.body.emissionDate,
            description: req.body.description,
            accountingImputationId: req.body.accountingImputationId,
            amount: req.body.amount,
            supplierId: req.body.supplierId,
            periodId: req.body.billingPeriodId,
            userId: req.user.id,
            statusId: PaymentReceiptStatus.eStatus.get('pending').value
        }
    )
        .then(paymentReceipt => {

            req.flash("success", "La factura o comprobante se creo exitosamente en la base de datos");

            winston.info(`User #${req.user.id} created succesfully payment receipt #${paymentReceipt.id} ${JSON.stringify(paymentReceipt)}`);
        })

        .then(paymentReceipt => {           //------------ UPLOAD PAYMENT RECEIPT TO GSC ------------//

            if (req.file) {

                const receiptImageName = uuidv4();

                const gcsFileName = `receipts/${receiptImageName}`; //${Date.now()}-${req.file.originalname}

                const gcsBucketName = `${process.env.GOOGLE_CLOUD_PROJECT}_bucket`;

                winston.info(`uploading file ${req.file.originalname} to GSC as ${gcsFileName}`);

                gcs.sendUploadToGCS(req, gcsFileName, gcsBucketName)
                    .then(uploadResult => {

                        const paymentReceiptImage = PaymentReceiptImage.build(
                            {
                                paymentReceiptId: paymentReceipt.id,
                                name: req.file.cloudStorageObject,
                                originalName: req.file.originalname,
                                authenticatedUrl: req.file.gcsUrl,
                                fileSize: req.file.size,
                                userId: req.user.id
                            });

                        paymentReceiptImage.save().then(() => {
                            winston.info(`uploading file ${gcsFileName} to GSC is completed, receiptId: ${result.id} - receiptImageId: ${uploadResult.id}`);

                        })
                    })
                    .catch((err) => { winston.error(`An error ocurred while user #${req.user.id} tryed to upload payment receipt file ${req.file.originalname} to GCS - ${err}`); })

            };
        })
        .catch(err => {
            req.flash("error", "Ocurrio un error y no se pudo crear el registro de la factura en la base de datos");
            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new payment receipt ${JSON.stringify(req.body)} - ${err}`);
        })

        .finally(() => { res.redirect('/expenses/paymentReceipts/client/' + clientId); });
};

module.exports.showNewPOForm = async function (req, res) {

    const receiptId = req.params.receiptId;

    const paymentReceipt = await PaymentReceipt.findByPk(receiptId, { include: [{ model: Client }, { model: Supplier }, { model: ReceiptType }] });

    const clientAccounts = await Account.findAll({ include: [{ model: AccountType }], where: { clientId: paymentReceipt.client.id } });

    res.render('expenses/paymentReceipts/createPO', { menu: CURRENT_MENU, data: { client: paymentReceipt.client, paymentReceipt, clientAccounts } });
};

module.exports.createPO = async function (req, res) {

    const clientId = req.params.clientId;
    const receiptId = req.params.receiptId;

    const paymentOrdersController = require('./paymentOrders.controller')

    let remainingBalance = await paymentOrdersController.calculateRemainingBalance(receiptId);

    PaymentOrder.create(
        {
            paymentReceiptId: receiptId,
            poNumber: 0,
            periodId: req.body.billingPeriodId,
            accountId: req.body.accountId,
            checkId: ((req.body.checkId === undefined) || (req.body.checkId === '') ? null : req.body.checkId),
            paymentDate: req.body.paymentDate,
            amount: req.body.paymentOrderAmount,
            statusId: PaymentOrderStatus.eStatus.get('disabled').value,
            userId: req.user.id
        })
        .then(async (paymentOrder) => {

            //PO Number !

            let poNumber = await db.sequelize.query(`SELECT nextval('${clientId}','P') as "nextval"`, { type: QueryTypes.SELECT });

            poNumber = poNumber[0].nextval;

            paymentOrder.update({
                poNumber: poNumber,
                statusId: PaymentOrderStatus.eStatus.get('pending').value
            })
                .then(async (paymentOrder) => {

                    const checkId = req.body.checkId;

                    if (checkId) {

                        CheckSplitted.findByPk(checkId).then((check) => {
                            check.update(
                                { statusId: SplitCheckStatus.eStatus.get('assigned').value })
                                .then((checkUpdate) => {
                                    console.log(checkUpdate)
                                })
                        })
                    }

                    let prStatus = PaymentReceiptStatus.eStatus.get('inprogress').value;

                    if ((remainingBalance - paymentOrder.amount) <= 0) {
                        prStatus = PaymentReceiptStatus.eStatus.get('processed').value;
                    }

                    PaymentReceipt.findByPk(receiptId)
                        .then((paymentReceipt) => {
                            paymentReceipt.update({ statusId: PaymentReceiptStatus.eStatus.get('processed').value })
                                .then(() => {
                                    req.flash("success", `La OP #${poNumber} se genero correctamente en la base de datos`);
                                })
                                .catch((err) => {
                                    req.flash("error", "Ocurrio un error y no se pudo actualizar el estado del recibo para la OP en la base de datos");
                                    winston.error(`An error ocurred while user #${req.user.id} tryed to update the PO number for record id #${paymentOrder.id}  - ${err}`);
                                })
                                .finally(() => {
                                    res.redirect('/expenses/paymentReceipts/client/' + clientId);
                                })
                        })
                })
                .catch((err) => {
                    req.flash("error", "Ocurrio un error y no se pudo actualizar el numero de recibo para la OP en la base de datos");
                    winston.error(`An error ocurred while user #${req.user.id} tryed to update the PO number for record id #${paymentOrder.id}  - ${err}`);
                    res.redirect('/expenses/paymentReceipts/client/' + clientId);
                })

        })
        .catch((err) => {
            req.flash("error", "Ocurrio un error y no se pudo crear el registro de la OP en la base de datos");
            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new PO ${JSON.stringify(req.body)} - ${err}`);
            res.redirect('/expenses/paymentReceipts/client/' + clientId);
        })
};

//------------- AJAX CALLS -------------//

module.exports.receiptTypes = async function (req, res) {
    const receiptTypes = await ReceiptType.findAll({ where: { enabled: true } });
    res.send(receiptTypes)
};

module.exports.receiptTypesByID = async function (req, res) {
    const receiptTypeId = req.params.id;
    const receiptTypes = await ReceiptType.findByPk(receiptTypeId);
    res.send(receiptTypes)
};

module.exports.getPendingSuppliersList = async function (req, res) {

    const clientId = req.params.clientId;
    const checkId = req.query.checkId;

    let supplierIds = []; fixed = false;

    //check into current splitted checks if there is a previous supplier already asigned, if not we can list all suppliers

    if (checkId != undefined) {

        const splittedCheck = await CheckSplitted.findOne(
            {
                where: { checkId: checkId, splitType: 'O' },
                include: [
                    {
                        model: PaymentReceipt,
                        include: [{ model: Supplier }]
                    }]
            })

        if (splittedCheck) {
            supplierIds.push(splittedCheck.paymentReceipt.supplierId); fixed = true;
        }
    }

    if (supplierIds.length === 0) {

        const paymentReceipts = await PaymentReceipt.findAll(
            {
                where: {
                    statusId: {
                        [Op.in]: [PaymentReceiptStatus.eStatus.get('pending').value, PaymentReceiptStatus.eStatus.get('inprogress').value]
                    },
                    clientId: clientId
                },
                attributes: ['supplierId']
            }
        );

        supplierIds = paymentReceipts.map(i => i.supplierId);
    }

    Supplier.findAll({
        where: { id: { [Op.in]: supplierIds } },
        distinct: 'id',
        attributes: ['id', 'name', 'cuit']

    }).then((suppliers) => {
        res.send({ suppliers, isFixed: fixed })
    });
};

module.exports.pendingBySupplierId = async function (req, res) {

    const clientId = req.params.clientId;
    const supplierId = req.params.supplierId;

    PaymentReceipt.findAll(
        {
            where: {
                statusId: {
                    [Op.in]: [PaymentReceiptStatus.eStatus.get('pending').value, PaymentReceiptStatus.eStatus.get('inprogress').value]
                },
                clientId: clientId, supplierId: supplierId
            },
            include: [{ model: ReceiptType, attributes: [['receiptType', 'Type'], 'name'] }]
        }
    ).then((paymentReceipts) => {
        res.send(paymentReceipts);
    });
};