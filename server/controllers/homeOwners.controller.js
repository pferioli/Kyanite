const Model = require('../models')
const Client = Model.client;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'homeOwners'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = async function (req, res, next) {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    res.render('homeOwners/homeOwners.ejs', { menu: CURRENT_MENU, data: { client: client } })
};

module.exports.showNewForm = async function (req, res, next) {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    res.render('homeOwners/add.ejs', { menu: CURRENT_MENU, data: { client: client } })
}
