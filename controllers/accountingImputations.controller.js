const Op = require('sequelize').Op
const Model = require('../models')
const AccountingGroup = Model.accountingGroup;
const AccountingImputation = Model.accountingImputation;

async function findAll(req, res) {

    const accountingImputations = await AccountingImputation.findAll(
        {
            attributes: [['id', 'id'], ['account', 'account'], ['groupId', 'groupId'], ['name', 'name']],
            include: [
                {
                    model: Model.accountingGroup,
                    as: 'accountingGroup',
                    attributes: [['name', 'name']],
                    where: { enabled: true }
                }
            ]
        });

    res.send(accountingImputations);
};

async function findById(req, res) {

    const id = req.params.id;

    const accountingImputations = await AccountingImputation.findByPk(id,
        {
            attributes: [['id', 'id'], ['account', 'account'], ['groupId', 'groupId'], ['name', 'name']],
            include: [
                {
                    model: Model.accountingGroup,
                    as: 'accountingGroup',
                    attributes: [['name', 'name']],
                    where: { enabled: true }
                }
            ]
        });

    res.send(accountingImputations);
};

async function findByGroupId(req, res) {

    const groupId = req.params.id;

    const accountingImputations = await AccountingImputation.findAll(
        {
            where: { enabled: true, groupId: groupId },
            attributes: [['id', 'id'], ['account', 'account'], ['groupId', 'groupId'], ['name', 'name']],
            include: [
                {
                    model: Model.accountingGroup,
                    as: 'accountingGroup',
                    attributes: [['name', 'name']],
                    where: { enabled: true }
                }
            ]
        });

    res.send(accountingImputations);
};

async function findAllGroups(req, res) {

    const accountingGroups = await AccountingGroup.findAll(
        {
            where: { enabled: true },
        });

    res.send(accountingGroups);
};

async function findGroupById(req, res) {

    const groupId = req.params.id;

    const accountingGroups = await AccountingGroup.findByPk(groupId,
        {
            where: { enabled: true },
            attributes: ['id', 'group', 'name'],

            include: [
                {
                    model: Model.accountingImputation,
                    attributes: ['id', 'account', 'name'],
                    where: { enabled: true }

                }
            ]
        });

    res.send(accountingGroups);
};


module.exports = { findAll, findById, findByGroupId, findAllGroups, findGroupById }
