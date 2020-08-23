const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Supplier = Model.supplier;

async function listAll(req, res) {
    const clientId = req.body.clientId || req.params.id;
    //const bills =
    res.render('expenses/bills/bills', { data: { clientId: req.body.clientId } });
}

async function showNewForm(req, res, next) {
    const clientId = req.params.id;

    const client = await Client.findByPk(clientId);
    const suppliers = await Supplier.findAll({ where: { enabled: true } });

    res.render('expenses/bills/add', { data: { client, suppliers } });
};


module.exports = {
    listAll,
    showNewForm
}