const Op = require('sequelize').Op

const Model = require('../models')
const Supplier = Model.supplier;
const TaxCategory = Model.taxCategory;
const SupplierCategory = Model.supplierCategory;
const Bank = Model.bank;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'suppliers'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = function (req, res, next) {
    Supplier.findAll({
        include: [{ model: TaxCategory }, { model: SupplierCategory }, { model: Bank }]
    }).then(function (suppliers) {
        res.render("suppliers/suppliers.ejs", {
            menu: CURRENT_MENU, data: { suppliers: suppliers },
        });
    });
};

module.exports.showNewForm = async function (req, res, next) {
    const taxCategories = await TaxCategory.findAll();
    const supplierCategories = await SupplierCategory.findAll({ where: { enabled: true } });
    const banks = await Bank.findAll({ where: { enabled: true } });
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
        req.flash(
            "error",
            "Ocurrio un error y no se pudo modificar el cliente en la base de datos"
        );

        winston.error(`An error ocurred while creating new client ${JSON.stringify(req.body)} - ${err}`);

        res.redirect("/clients");
    }
};

module.exports.info = async function (req, res) {
    const supplierid = req.params.id;
    const supplier = await Supplier.findByPk(supplierid, {
        include: [
            { model: SupplierCategory }, { model: TaxCategory }, { model: Bank }
        ]
    });

    if (supplier === null) {
        res.send(`el ID #${supplierid} no existe en la base de datos para ningun proveedor registrado, <a href="/suppliers"> volver al listado </a>`);
        return;
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

    const supplierCategories = await SupplierCategory.findAll({ where: { enabled: true } });

    const banks = await Bank.findAll({ where: { enabled: true } });

    const supplierid = req.params.id;

    const supplier = await Supplier.findByPk(supplierid, {
        include: [
            { model: SupplierCategory }, { model: TaxCategory }
        ]
    });

    res.render("suppliers/edit.ejs", {
        menu: CURRENT_MENU, data: { supplier, supplierCategories, taxCategories, banks },
    });

};
module.exports.newCategory = async function (req, res) {
    const supplierCategory = await SupplierCategory.create({ name: req.body.category, enabled: true });
    res.send(supplierCategory);
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
                model: SupplierCategory
            }]
        });
    res.send(supplier);
};
