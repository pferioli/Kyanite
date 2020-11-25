const Op = require('sequelize').Op
const Model = require('../models')
const Client = Model.client;
const Collection = Model.collection;
const BillingPeriod = Model.billingPeriod;
const HomeOwner = Model.homeOwner;
const User = Model.user;

const winston = require('../helpers/winston.helper');

const { v4: uuidv4 } = require('uuid');

const CURRENT_MENU = 'paymentReceipts'; module.exports.CURRENT_MENU = CURRENT_MENU;

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
        include: [{ model: HomeOwner }, { model: BillingPeriod }, { model: User }],
    };

    const client = await Client.findByPk(clientId);

    const collections = await Collection.findAll(options);

    res.render('incomes/collections/collections',
        {
            menu: CURRENT_MENU,
            data: { client: client, collections: collections, periods: periods },
            params: { showAll: showAll, autoRefresh: autoRefresh }
        });
};

module.exports.showNewForm = async function (req, res) {
    const clientId = req.params.clientId;
    const client = await Client.findByPk(clientId);
    const suppliers = await Supplier.findAll(
        {
            /*include: [{ model: SupplierCategory }],*/
            order: [['name', 'asc']]
        });
    res.render('expenses/bills/add', { menu: CURRENT_MENU, data: { client, suppliers } });
};

module.exports.addNew = async function (req, res, next) {

    const clientId = req.params.clientId;


};

// module.exports.receiptTypes = async function (req, res) {
//     const receiptTypes = await ReceiptType.findAll({ where: { enabled: true } });
//     res.send(receiptTypes)
// };

// module.exports.receiptTypesByID = async function receiptTypesByID(req, res) {
//     const receiptTypeId = req.params.id;
//     const receiptTypes = await ReceiptType.findByPk(receiptTypeId);
//     res.send(receiptTypes)
// };
