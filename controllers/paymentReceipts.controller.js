const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Supplier = Model.supplier;
const SupplierCategory = Model.supplierCategory;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;

const gcs = require('../helpers/google.upload.helper');

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'paymentReceipts'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports = { gcs };

module.exports.listAll = async function (req, res) {
    const clientId = req.body.clientId || req.params.id;
    const paymentReceipts = await PaymentReceipt.findAll({
        where: { clientId: clientId },
        include: [{ model: Supplier }],
    });

    res.render('expenses/bills/bills', { menu: CURRENT_MENU, data: { clientId: clientId, paymentReceipts: paymentReceipts } });
};

module.exports.showNewForm = async function (req, res) {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    const suppliers = await Supplier.findAll(
        {
            /*include: [{ model: SupplierCategory }],*/
            order: [['name', 'asc']]
        });
    res.render('expenses/bills/add', { menu: CURRENT_MENU, data: { client, suppliers } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.id;

    PaymentReceipt.save(
        {
            clientId: clientId,
            receiptNumber: req.body.receiptNumber,
            receiptTypeId: req.body.receiptTypeId,
            emissionDate: req.body.emissionDate,
            description: req.body.description,
            accountingImputationId: req.body.accountingImputationId,
            ammount: req.body.ammount,
            supplierId: req.body.supplierId,
            periodId: req.body.billingPeriodId,
            userId: req.user.id,
            statusId: 1,
        }
    )
        .then(paymentReceipt => {

            req.flash("success", "La factura o comprobante se creo exitosamente en la base de datos");

            winston.info(`User #${req.user.id} created succesfully payment receipt #${paymentReceipt.id} ${JSON.stringify(result)}`);
        })

        .then(paymentReceipt => {           //------------ UPLOAD PAYMENT RECEIPT TO GSC ------------//

            if (req.file) {

                const receiptImageName = uuidv4();

                const gcsFileName = `receipts/${receiptImageName}`; //${Date.now()}-${req.file.originalname}

                winston.info(`uploading file ${req.file.originalname} to GSC as ${gcsFileName}`);

                gcs.sendUploadToGCS(req, gcsFileName)
                    .then(result => {

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
                    .catch(error => { winston.error(`An error ocurred while user #${req.user.id} tryed to upload payment receipt file ${req.file.originalname} to GCS - ${error}`); })

            };
        })
        .catch(error => {
            req.flash(
                "error",
                "Ocurrio un error y no se pudo crear el registro en la base de datos"
            );

            winston.error(`An error ocurred while user #${req.user.id} tryed to create a new payment receipt ${JSON.stringify(req.body)} - ${error}`);
        })

        .finally(() => { res.redirect('/expenses/paymentReceipts/' + clientId); });
};

module.exports.receiptTypes = async function (req, res) {
    const receiptTypes = await ReceiptType.findAll({ where: { enabled: true } });
    res.send(receiptTypes)
};

module.exports.receiptTypesByID = async function receiptTypesByID(req, res) {
    const receiptTypeId = req.params.id;
    const receiptTypes = await ReceiptType.findByPk(receiptTypeId);
    res.send(receiptTypes)
};