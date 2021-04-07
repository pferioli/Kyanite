const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const Client = Model.client;
const Collection = Model.collection;
const CollectionProperty = Model.collectionProperty;
const CollectionConcept = Model.collectionConcept;
const CollectionSecurity = Model.collectionSecurity;
const BillingPeriod = Model.billingPeriod;
const HomeOwner = Model.homeOwner;
const Account = Model.account;
const AccountType = Model.accountType;
const User = Model.user;
const UnidentifiedDeposit = Model.unidentifiedDeposit;
const UnidentifiedDepositNote = Model.unidentifiedDepositNote;

const db = require('../models/index');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'unidentifiedDeposits'; module.exports.CURRENT_MENU = CURRENT_MENU;

const CollectionStatus = require('../utils/statusMessages.util').Collection;
const UnidentifiedDepositStatus = require('../utils/statusMessages.util').UnidentifiedDeposit;
const Notifications = require('../utils/notifications.util');

module.exports.listAll = async function (req, res) {

    const clientId = req.body.clientId || req.params.clientId;

    const client = await Client.findByPk(clientId);

    const unidentifiedDeposits = await UnidentifiedDeposit.findAll(
        {
            where: { statusId: UnidentifiedDepositStatus.eStatus.get('pending').value },
            include: [
                { model: User },
                {
                    model: Collection,
                    include: [
                        { model: Client }, { model: BillingPeriod },
                        { model: CollectionProperty, as: "Properties", include: [{ model: HomeOwner }] },
                        { model: CollectionConcept, as: "Concepts" },
                        { model: CollectionSecurity, as: "Securities", include: [{ model: Account, include: [{ model: AccountType }] }] }
                    ]
                }
            ]
        });

    res.render('incomes/unidentifiedDeposits/unidentifiedDeposits',
        {
            menu: CURRENT_MENU,
            data: { client: client, unidentifiedDeposits: unidentifiedDeposits }
        });
};

module.exports.showIdentifyDepositForm = async function (req, res) {

    const unidentifiedDeposit = await UnidentifiedDeposit.findByPk(req.params.depositId,
        { include: [{ model: Collection, include: [{ model: Client }, { model: BillingPeriod }] }] });

    //ofrecer la lista de propiedades para vincular con el deposito

    //deberia ser 1 o mas y vincular cada propiedad con un parcial del importe

    res.render('incomes/unidentifiedDeposits/identify',
        {
            menu: CURRENT_MENU,
            data: { client: unidentifiedDeposit.collection.client, period: unidentifiedDeposit.collection.billingPeriod, unidentifiedDeposit: unidentifiedDeposit }
        });
}

module.exports.identifyDeposit = async function (req, res) {

    const depositId = req.params.depositId;

    const clientId = req.body.clientId;

    if (parseFloat(req.body.remainingAmount) != 0) {
        req.flash("error", "El saldo remanente debe ser 0 para completar el proceso de identificación");
        res.redirect("/incomes/unidentifiedDeposits/client/" + clientId);
    }

    try {

        const unidentifiedDeposit = await UnidentifiedDeposit.findByPk(depositId);

        const collection = await Collection.findByPk(unidentifiedDeposit.collectionId);

        const properties = JSON.parse(req.body.tables).properties;

        for (index = 0; index < properties.length; index++) {

            const property = properties[index];

            const collectionProperty = await CollectionProperty.create({
                collectionId: collection.id,
                propertyId: property.propertyId,
                amount: parseFloat(property.amount.replace(/[^0-9\.-]+/g, "")),
                receiptNumber: (index + 1),
                userId: req.user.id
            });

            winston.info(`property #${collectionProperty.propertyId} was associated to collection #${collectionProperty.collectionId} amount:${collectionProperty.amount} receipt: ${collectionProperty.receiptNumber}`);
        }

        //pasar la cobranza a PROCESADO

        await collection.update({
            statusId: CollectionStatus.eStatus.get('processed').value,
        });

        winston.info(`collection #${collection.id} flagged as processed`);

        //pasar el deposito a PROCESADO

        await unidentifiedDeposit.update(
            {
                statusId: UnidentifiedDepositStatus.eStatus.get('assigned').value,
                comments: req.body.comments
            });

        winston.info(`unidentifiedDeposit #${unidentifiedDeposit.id} flagged as assigned`);

        req.flash("success", "El proceso de indentificación del depósito ha finalizado exitosamente");

    } catch (error) {
        req.flash("error", "Ha ocurrido un error y no se pudo completar el proceso de identificacion");

    } finally {
        res.redirect("/incomes/unidentifiedDeposits/client/" + clientId);
    }
}

// AJAX CALLS

module.exports.getNotes = function (req, res) {

    const depositId = req.params.depositId;

    UnidentifiedDepositNote.findAll(
        {
            where: { depositId: depositId },
            order: [['id', 'DESC']],
            include: [{ model: User }]
        })
        .then((notes) => {
            res.send(notes)
        })

}

module.exports.addNotes = function (req, res) {

    const depositId = req.params.depositId || req.body.depositId;

    UnidentifiedDepositNote.create(
        {
            depositId: depositId,
            comments: req.body.modalNewNote,
            userId: req.user.id
        })
        .then((note) => {
            req.flash("success", "La nota fue agregada exitosamente");
            res.redirect("/incomes/unidentifiedDeposits/client/" + req.body.clientId);
        })
}

Date.prototype.toJSON = function () { return this.toLocaleString(); }
