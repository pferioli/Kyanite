const _ = require('underscore');

const Op = require('sequelize').Op

const Model = require('../models')
const Supplier = Model.supplier;
const TaxCategory = Model.taxCategory;
const Bank = Model.bank;

const AccountingGroup = Model.accountingGroup;
const AccountingImputation = Model.accountingImputation;

const SupplierCategory = Model.supplierCategory;

const Client = Model.client;
const ReceiptType = Model.receiptType;
const PaymentReceipt = Model.paymentReceipt;
const PaymentReceiptImage = Model.paymentReceiptImage;
const PaymentOrder = Model.paymentOrder;
const BillingPeriod = Model.billingPeriod;
const Account = Model.account;
const AccountType = Model.accountType;
const CheckSplitted = Model.checkSplitted;
const Check = Model.check;

const CreditNote = Model.creditNote;
const CreditNoteParent = Model.creditNoteParent;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'suppliers'; module.exports.CURRENT_MENU = CURRENT_MENU;

const PaymentReceiptStatus = require('../utils/statusMessages.util').PaymentReceipt;
const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;
const CreditNoteStatus = require('../utils/statusMessages.util').CreditNote;

module.exports.listAll = function (req, res, next) {
    Supplier.findAll({
        include: [
            { model: TaxCategory }, { model: Bank },
            {
                model: AccountingImputation,
                include: [
                    {
                        model: AccountingGroup,
                        as: 'accountingGroup',
                        attributes: [['name', 'name']],
                        where: { enabled: true }
                    }
                ]
            },
            //{ model: SupplierCategory },
        ]
    }).then(function (suppliers) {
        res.render("suppliers/suppliers.ejs", {
            menu: CURRENT_MENU, data: { suppliers: suppliers },
        });
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const taxCategories = await TaxCategory.findAll();
    const banks = await Bank.findAll({ where: { enabled: true } });
    // const supplierCategories = await SupplierCategory.findAll({ where: { enabled: true } });

    const supplierCategories = await AccountingImputation.findAll(
        {
            where: { enabled: true },
            include: [
                {
                    model: AccountingGroup,
                    as: 'accountingGroup',
                    attributes: [['name', 'name']],
                    where: { enabled: true }
                }
            ]
        });

    res.render("suppliers/add.ejs", { menu: CURRENT_MENU, data: { taxCategories, supplierCategories, banks } });
};

module.exports.addNew = async function (req, res, next) {

    try {
        const existingSupplier = await Supplier.findAll({ where: { cuit: req.body.cuit } });

        if (existingSupplier.length > 0) {
            req.flash("warning", "Ya existe un proveedor registrado con el ese número de C.U.I.T.");
            req.flash("metadata", req.body);
            res.redirect('/suppliers/new');
            return;
        }
        const supplier = {
            name: req.body.name,
            cuit: req.body.cuit,
            taxCategoryId: req.body.taxCategoryId,
            bankId: (req.body.bankId === '') ? null : req.body.bankId,
            bankAccount: (req.body.bankAccount === '') ? null : req.body.bankAccount,
            address: req.body.address,
            city: req.body.city,
            zipCode: req.body.zipCode,
            phone: req.body.phone,
            email: req.body.email,
            comments: req.body.comments,
            categoryId: req.body.categoryId,
            userId: req.user.id
        }

        Supplier.create(supplier)
            .then(function (result) {
                req.flash(
                    "success",
                    "El proveedor fue agregado exitosamente a la base de datos"
                );
                winston.info(`supplier #${result.id} was succesfully added by user #${req.user.id} `);

            })
            .catch(err => {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo agregar al nuevo proveedor en la base de datos"
                );
                winston.error(`an error ocurred when user #${req.user.id} tryed to add a new supplier - ${err}`);

            })
            .finally(() => {
                res.redirect("/suppliers");
            })

    } catch (error) {
        winston.error(`An error ocurred while creating new client ${JSON.stringify(req.body)} - ${err}`);
        req.flash("error", "Ocurrio un error y no se pudo modificar el cliente en la base de datos");
        res.redirect("/suppliers");
    }
};

module.exports.info = async function (req, res) {
    const supplierid = req.params.id;
    const supplier = await Supplier.findByPk(supplierid, {
        include: [
            //{ model: SupplierCategory },
            {
                model: AccountingImputation,
                include: [
                    {
                        model: AccountingGroup,
                        as: 'accountingGroup',
                        attributes: [['name', 'name']],
                        where: { enabled: true }
                    }
                ]
            },
            { model: TaxCategory }, { model: Bank }
        ]
    });

    if (supplier === null) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo eliminar el proveedor de la base de datos"
        );
        return
    }

    res.render("suppliers/info.ejs", { menu: CURRENT_MENU, data: { supplier } });
};

module.exports.delete = async function (req, res, next) {
    const supplierId = req.body.supplierId;
    const supplier = await Supplier.findByPk(supplierId);
    if (supplier) {
        supplier.destroy()
            .then(numAffectedRows => {
                req.flash(
                    "success",
                    "El proveedor fue eliminado exitosamente a la base de datos"
                )
                winston.info(`supplier #${supplierId} was deleted by user #${req.user.id} `);
            })
            .catch(err => {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo eliminar el proveedor de la base de datos"
                )
                winston.error(`an error ocurred when user #${req.user.id} tryed to delete supplier #${supplierId} - ${err}`);
            })
            .finally(function () {
                res.redirect("/suppliers");
            })
    }
};

module.exports.showEditForm = async function (req, res, next) {

    const taxCategories = await TaxCategory.findAll({ where: { enabled: true } });

    // const supplierCategories = await SupplierCategory.findAll({ where: { enabled: true } });

    const supplierCategories = await AccountingImputation.findAll(
        {
            where: { enabled: true },
            include: [
                {
                    model: AccountingGroup,
                    as: 'accountingGroup',
                    attributes: [['name', 'name']],
                    where: { enabled: true }
                }
            ]
        });

    const banks = await Bank.findAll({ where: { enabled: true } });

    const supplierid = req.params.id;

    const supplier = await Supplier.findByPk(supplierid, {
        include: [
            {
                model: AccountingImputation,
                include: [
                    {
                        model: AccountingGroup,
                        as: 'accountingGroup',
                        attributes: [['id', 'id'], ['name', 'name']],
                        where: { enabled: true }
                    }
                ]
            },
            //{ model: SupplierCategory }, 
            { model: TaxCategory }
        ]
    });

    res.render("suppliers/edit.ejs", {
        menu: CURRENT_MENU, data: { supplier, supplierCategories, taxCategories, banks },
    });

};

module.exports.edit = async function (req, res, next) {

    const supplierId = req.params.id;

    try {

        let supplier = await Supplier.findByPk(supplierId);

        if (!supplier) { res.redirect("/suppliers"); return; }

        supplier.name = req.body.name;
        supplier.cuit = req.body.cuit;
        supplier.taxCategoryId = req.body.taxCategoryId;
        supplier.bankId = (req.body.bankId === '') ? null : req.body.bankId;
        supplier.bankAccount = (req.body.bankAccount === '') ? null : req.body.bankAccount;
        supplier.address = req.body.address;
        supplier.city = req.body.city;
        supplier.zipCode = req.body.zipCode;
        supplier.phone = req.body.phone;
        supplier.email = req.body.email;
        supplier.comments = req.body.comments;
        supplier.categoryId = req.body.categoryId;
        supplier.userId = req.user.id;

        supplier.save()
            .then(result => {
                req.flash(
                    "success",
                    "El proveedor fue actualizado exitosamente a la base de datos"
                )
                winston.info(`supplier #${supplierId} was updated by user #${req.user.id} `);
            })
            .catch(err => {
                req.flash(
                    "error",
                    "Ocurrio un error y no se pudo actualizar el proveedor de la base de datos"
                )
                winston.error(`an error ocurred when user #${req.user.id} tryed to update supplier #${supplierId} - ${err}`);
            })
            .finally(() => {
                res.redirect("/suppliers");
            });

    } catch (error) {
        winston.error(`An error ocurred while creating new client ${JSON.stringify(req.body)} - ${err}`);
        req.flash("error", "Ocurrio un error y no se pudo modificar el cliente en la base de datos");
        res.redirect("/suppliers");
    }
}

module.exports.listPayments = async function (req, res, next) {

    const supplierId = req.body.supplierId;
    const clientId = req.body.clientId;

    const supplier = await Supplier.findByPk(supplierId);
    const client = await Client.findByPk(clientId);

    const paymentReceiptStatus = [PaymentReceiptStatus.eStatus.get('pending').value, PaymentReceiptStatus.eStatus.get('inprogress').value, PaymentReceiptStatus.eStatus.get('processed').value]
    const paymentOrdersStatus = [PaymentOrderStatus.eStatus.get('pending').value, PaymentOrderStatus.eStatus.get('inprogress').value, PaymentOrderStatus.eStatus.get('processed').value]

    PaymentReceipt.findAll({
        where: {
            clientId: clientId,
            supplierId: supplierId,
            statusId: { [Op.in]: paymentReceiptStatus }
        },
        include: [
            { model: Supplier },
            { model: Client },
            { model: ReceiptType },
            { model: BillingPeriod },
            {
                model: AccountingImputation,
                include: [
                    {
                        model: AccountingGroup,
                        as: 'accountingGroup',
                        attributes: [['name', 'name']],
                    }
                ]
            },
            {
                model: PaymentOrder,
                include: [
                    { model: CheckSplitted, include: [{ model: Check }] },
                    {
                        model: Account, paranoid: false, include: [{ model: Bank }, { model: AccountType }]
                    }
                ],
                where: {
                    statusId: { [Op.in]: paymentOrdersStatus }
                },
                required: false
            }
        ],
    }).then(function (paymentReceipts) {
        res.render("suppliers/payments/payments.ejs", {
            menu: `${CURRENT_MENU}_payments`, data: { client: client, supplier: supplier, paymentReceipts: paymentReceipts },
        });
    });
};

module.exports.createBalanceReport = async function (req, res) {

    const clientId = req.query.clientId;

    const supplierId = req.params.supplierId;

    // const { dateFrom, dateUntil } = req.query;

    try {

        const client = await Client.findByPk(clientId);

        const supplier = await Supplier.findByPk(supplierId);

        let supplierAccountMovements = [];

        //----- RECIBOS -----

        let paymentReceipts = await PaymentReceipt.findAll({
            include: [{
                model: ReceiptType
            }],
            where: {
                clientId: clientId,
                supplierId: supplierId,
                statusId: {
                    [Op.in]: [
                        PaymentReceiptStatus.eStatus.get('pending').value,
                        PaymentReceiptStatus.eStatus.get('inprogress').value,
                        PaymentReceiptStatus.eStatus.get('processed').value
                    ]
                }
            }
        })

        for (const paymentReceipt of paymentReceipts) {
            supplierAccountMovements.push({
                date: paymentReceipt.emissionDate,
                receiptType: paymentReceipt.receiptType.receiptType,
                receiptNumber: paymentReceipt.receiptNumber,
                type: undefined,
                poNumber: undefined,
                account: undefined,
                amount: paymentReceipt.amount
            })
        };

        paymentReceipts = undefined;    //to free up memory

        //----- ORDENES DE PAGO -----

        let paymentOrders = await PaymentOrder.findAll({
            include: [
                {
                    model: PaymentReceipt,
                    include: { model: ReceiptType },
                    where: {
                        clientId: clientId,
                        supplierId: supplierId,
                    }
                },
                {
                    model: Account, include: [{ model: AccountType }], paranoid: false
                },
                {
                    model: CreditNoteParent,
                    include: [
                        {
                            model: CreditNote, include: [
                                {
                                    model: PaymentOrder,
                                    include: [{ model: Account, include: [{ model: AccountType }] }]
                                }]
                        }]
                },
            ],
            where: {
                amount: {
                    [Op.gte]: 0 //excluimos las OPs negativas que corresponden a NCs
                },
                statusId: {
                    [Op.in]: [
                        PaymentOrderStatus.eStatus.get('pending').value,
                        PaymentOrderStatus.eStatus.get('inprogress').value,
                        PaymentOrderStatus.eStatus.get('processed').value
                    ]
                }
            }
        })

        for (const paymentOrder of paymentOrders) {

            let account = (paymentOrder.account.bankId ?
                `(${paymentOrder.account.accountType.account}) ${paymentOrder.account.accountNumber}` :
                `(${paymentOrder.account.accountType.account}) ${paymentOrder.account.accountType.description}`);

            supplierAccountMovements.push({
                date: paymentOrder.paymentDate,
                receiptType: paymentOrder.paymentReceipt.receiptType.receiptType,
                receiptNumber: paymentOrder.paymentReceipt.receiptNumber,
                type: 'O/P',
                poNumber: paymentOrder.poNumber,
                account: account,
                amount: (paymentOrder.amount * (-1)),
                creditNotes: paymentOrder.creditNoteParents
            })
        };

        paymentOrders = undefined;    //to free up memory

        const supplierAccountMovementsSortedByDate = _.sortBy(supplierAccountMovements, 'date'); supplierAccountMovements = undefined;

        const { createReport } = require("../reports/suppliers/suppliersBalance.report");

        createReport(supplier, client, supplierAccountMovementsSortedByDate, req.user, res); //, path.join(__dirname, "..", "public", "invoice.pdf"))

    } catch (error) {
        winston.error(`An error ocurred on supplier balance report - ${error}`);
        req.flash("error", "Ocurrio un error y no se pudo generar el reporte de cuenta corriente del proveedor");
        res.redirect("/suppliers");
    }
};

//------------------ AJAX CALLS ------------------//

module.exports.newCategory = async function (req, res) {

    SupplierCategory.create({ name: req.body.category, enabled: true })
        .then(supplierCategory => {
            winston.info(`A new supplier category ${supplierCategory.name} was created succesfully on user ${req.user.id} request`);
            req.flash("success", "Se ha creado existosamente una nueva categoría de proveedor");

        })
        .catch(err => {
            winston.error(`An error ocurred while creating new category for supplier ${JSON.stringify(req.body)} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo modificar el cliente en la base de datos");

        })
        .finally(() => {
            res.redirect("/suppliers");
        })

    //res.send(supplierCategory);
};

module.exports.allCategories = async function (req, res) {
    supplierCategories = await SupplierCategory.findAll({ where: { enabled: true } });
    res.send(supplierCategories);
};

module.exports.findCategoryById = async function (req, res) {
    const id = req.params.id
    supplierCategories = await SupplierCategory.findByPk(id, { where: { enabled: true } });
    res.send(supplierCategories);
};

module.exports.findSupplierById = async function (req, res) {
    const id = req.params.id
    supplier = await Supplier.findByPk(id,
        {
            where: { enabled: true },
            include: [{
                // model: SupplierCategory
                model: AccountingImputation,
                include: [
                    {
                        model: AccountingGroup,
                        as: 'accountingGroup',
                        attributes: [['id', 'id'], ['name', 'name']],
                        where: { enabled: true }
                    }
                ]
            }]
        });
    res.send(supplier);
};
