const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Supplier = Model.supplier;
const ReceiptType = Model.receiptType;

module.exports.listAll = async function (req, res) {
    const clientId = req.body.clientId || req.params.id;
    //const bills =
    res.render('expenses/bills/bills', { data: { clientId: req.body.clientId } });
}

module.exports.showNewForm = async function (req, res, next) {
    const clientId = req.params.id;

    const client = await Client.findByPk(clientId);
    const suppliers = await Supplier.findAll({ where: { enabled: true } });

    res.render('expenses/bills/add', { data: { client, suppliers } });
};

module.exports.receiptTypes = async function (req, res, next) {
    const receiptTypes = await ReceiptType.findAll({ where: { enabled: true } });
    res.send(receiptTypes)
};

module.exports.receiptTypesByID = async function receiptTypesByID(req, res, next) {
    const receiptTypeId = req.params.id;
    const receiptTypes = await ReceiptType.findByPk(receiptTypeId);
    res.send(receiptTypes)
};
