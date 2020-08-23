const Model = require('../models')
const Supplier = Model.supplier;
const TaxCategory = Model.taxCategory;
const SupplierCategory = Model.supplierCategory;
const Banks = Model.bank;

const Op = require('Sequelize').Op

function listAll(req, res, next) {
    Supplier.findAll().then(function (suppliers) {
        res.render("suppliers/index.ejs", {
            data: { suppliers: suppliers },
        });
    });
};

async function showNewForm(req, res, next) {
    const taxCategories = await TaxCategory.findAll({ where: { enabled: true } });
    const supplierCategories = await SupplierCategory.findAll({ where: { enabled: true } });
    const banks = await Banks.findAll({ where: { enabled: true } });
    res.render("suppliers/add.ejs", { data: { taxCategories, supplierCategories, banks } });
};

async function addNew(req, res, next) {

    const existingClient = await Supplier.findAll(
        {
            where: { cuit: req.body.cuit }
        }
    );

    if (existingClient.length > 0) {
        req.flash("warning", "Ya existe un proveedor registrado con el ese número de C.U.I.T.");
        req.flash("metadata", req.body);
        res.redirect('/suppliers/new');
        return;
    }

    const client = {
        internalCode: req.body.internalCode,
        name: req.body.name,
        cuit: req.body.cuit,
        taxCategoryId: req.body.taxCategory,
        address: req.body.address,
        city: req.body.city,
        zipCode: req.body.zipCode,
        phone: req.body.phone,
        email: req.body.email,
        comments: req.body.comments,
        enabled: true,
        user: req.user.id
    }

    try {
        Supplier.create(client).then(function (result) {
            req.flash(
                "success",
                "El proveedor fue agregado exitosamente a la base de datos"
            )
            res.redirect("/suppliers"); return;
        })
    } catch (err) {
        req.flash(
            "error",
            "Ocurrio un error y no se pudo agregar al nuevo proveedor en la base de datos"
        )
        res.redirect("/suppliers"); return;
    }
};

async function getInfo(req, res) {
    const supplierid = req.params.id;
    const supplier = await Supplier.findByPk(supplierid, {});

    if (supplier === null) {
        res.send(`el ID #${supplierid} no existe en la base de datos para ningun proveedor registrado, <a href="/suppliers"> volver al listado </a>`);
        return;
    }

    const taxCategories = await TaxCategory.findAll({ where: { enabled: true } });

    res.render("suppliers/info.ejs", { data: { supplier, taxCategories } });
};

async function newCategory(req, res) {
    const supplierCategories = await SupplierCategory.create({ name: req.body.category, enabled: true });
    res.redirect("/suppliers");
};

module.exports = {
    listAll,
    showNewForm,
    addNew,
    getInfo,
    newCategory
}