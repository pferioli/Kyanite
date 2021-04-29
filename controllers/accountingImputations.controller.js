const Op = require('sequelize').Op
const Model = require('../models')
const AccountingGroup = Model.accountingGroup;
const AccountingImputation = Model.accountingImputation;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'accountinhImputations'; module.exports.CURRENT_MENU = CURRENT_MENU;

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
            attributes: [['id', 'id'], ['groupId', 'groupId'], ['name', 'name']],
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
            attributes: [['id', 'id'], ['groupId', 'groupId'], ['name', 'name']],
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

module.exports.showSettings = function (req, res) {

    AccountingGroup.findAll(
        {
            where: { enabled: true },
        })
        .then(accountingGroups => {
            res.render('accountingImputations/settings', {
                menu: CURRENT_MENU,
                data: { groups: accountingGroups, groupId: req.query.groupId },
            });

        })

};

module.exports.addNewGroup = function (req, res) {

    AccountingGroup.create({
        name: req.body.groupName,
        enabled: true
    })
        .then(group => {
            winston.info(`a new account group with id: ${group.id} has been created by user ${req.user.id} succesfully`);
            req.flash("success", "El grupo de cuentas se ha creado exitosamente");
            res.redirect('/accountingImputations/settings?groupId=' + group.id)
        })
        .catch(err => {
            winston.error(`an error ocurred when adding a new group account by user ${req.user.id} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo agregar el nuevo grupo de cuentas");
            res.redirect('/accountingImputations/settings')
        })
};

module.exports.deleteGroup = function (req, res) {

    AccountingGroup.findByPk(req.body.groupId)
        .then(group => {
            group.update({ enabled: false }).then(() => {
                AccountingImputation.update({ enabled: false }, { where: { groupId: req.body.groupId } })
                    .then(() => {
                        winston.info(`the account group with id: ${group.id} has been disabled by user ${req.user.id} succesfully`);
                        req.flash("success", "El grupo de cuentas se ha deshabilitado exitosamente");
                        res.redirect('/accountingImputations/settings')
                    })
            })
        })
        .catch(err => {
            winston.error(`an error ocurred when deleting ${group.id} by user ${req.user.id} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo deshabilitar el grupo de cuentas");
            res.redirect('/accountingImputations/settings')
        })
}

module.exports.editGroup = function (req, res) {

    AccountingGroup.findByPk(req.body.groupId)
        .then(group => {
            group.update({ name: req.body.groupName }).then(() => {
                winston.info(`the account group with id: ${group.id} has been renamed by user ${req.user.id} succesfully`);
                req.flash("success", "El grupo de cuentas se ha renombrado exitosamente");
                res.redirect('/accountingImputations/settings')
            })
        })
        .catch(err => {
            winston.error(`an error ocurred when renaming ${group.id} by user ${req.user.id} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo renombrar el grupo de cuentas");
            res.redirect('/accountingImputations/settings')
        })
}

module.exports.addNewImputationAccount = function (req, res) {

    AccountingGroup.findByPk(req.body.groupId)
        .then(group => {
            AccountingImputation.create({
                groupId: group.id,
                name: req.body.imputationAccountName,
                enabled: true
            })
                .then(imputationAccount => {
                    winston.info(`a new imputation account with id: ${imputationAccount} has been added to group ${group.id} has been created by user ${req.user.id} succesfully`);
                    req.flash("success", "El grupo de cuentas se ha creado exitosamente");
                    res.redirect('/accountingImputations/settings?groupId=' + group.id)
                })
        })
        .catch(err => {
            winston.error(`an error ocurred when adding a new imputation account to group ${req.body.groupId} by user ${req.user.id} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo agregar una nueva imputacion contable al grupo de cuentas");
            res.redirect('/accountingImputations/settings')
        })
};

module.exports.editNewImputationAccount = function (req, res) {

    AccountingImputation.findByPk(req.body.accountingImputationId)
        .then(imputationAccount => {
            imputationAccount.update({ name: req.body.imputationAccountName })
                .then(imputationAccount => {
                    winston.info(`the imputation account id: ${imputationAccount.id} has been renamed by user ${req.user.id} succesfully`);
                    req.flash("success", "La imputacion contable fue renombrada exitosamente");
                    res.redirect('/accountingImputations/settings?groupId=' + imputationAccount.groupId)

                })
        })
        .catch(err => {
            winston.error(`an error ocurred when renaming the imputation account ${req.body.accountingImputationId} by user ${req.user.id} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo renombrar la imputacion contable");
            res.redirect('/accountingImputations/settings')
        })
};


module.exports.deleteNewImputationAccount = function (req, res) {

    AccountingImputation.findByPk(req.body.accountingImputationId)
        .then(imputationAccount => {

            imputationAccount.update({ enabled: false })
                .then(() => {
                    winston.info(`the imputation account id: ${imputationAccount.id} has been disabled by user ${req.user.id} succesfully`);
                    req.flash("success", "La imputacion contable fue deshabilitada exitosamente");
                    res.redirect('/accountingImputations/settings?groupId=' + imputationAccount.groupId)
                })
        })
        .catch(err => {
            winston.error(`an error ocurred when deleting the imputation account ${req.body.accountingImputationId} by user ${req.user.id} - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo deshabilitar la imputacion contable");
            res.redirect('/accountingImputations/settings')
        })
};

module.exports.exportToFile = async function (req, res) {

    const accountingGroups = await AccountingGroup.findAll({ where: { enabled: true }, include: [{ model: AccountingImputation }] })

    var Excel = require('excel4node');

    var workbook = new Excel.Workbook();

    var worksheet = workbook.addWorksheet(`Imputaciones Contables`);

    var defaultStyle = workbook.createStyle({
        font: {
            color: 'black',
            size: 12,
            bold: false,
        },
        alignment: {
            wrapText: true,
            horizontal: 'center',
            vertical: 'center'
        },
    });

    let rowIndex = 1;

    worksheet.column(1).setWidth(50);
    worksheet.cell(rowIndex, 1).string("Grupo de cuentas").style(defaultStyle);

    worksheet.column(2).setWidth(50);
    worksheet.cell(rowIndex, 2).string("Imputacion Contable").style(defaultStyle);

    for (const accountingGroup of accountingGroups) {

        rowIndex += 1;

        worksheet.row(rowIndex).setHeight(20);

        worksheet.cell(rowIndex, 1).string(accountingGroup.name).style(defaultStyle);

        for (const accountingImputation of accountingGroup.accountingImputations) {

            worksheet.cell(rowIndex, 2).string(accountingImputation.name).style(defaultStyle);

            rowIndex += 1;
        }
    };

    workbook.write(`Imputaciones Contables.xlsx`, res);

}
