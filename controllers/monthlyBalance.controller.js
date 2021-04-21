const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')
const User = Model.user;
const Client = Model.client;
const Account = Model.account;
const AccountType = Model.accountType;
const BillingPeriod = Model.billingPeriod;
const AccountMovement = Model.accountMovement;
const MonthlyBalance = Model.monthlyBalance;

const _ = require('underscore');

const winston = require('../helpers/winston.helper');

async function calculateMonthlyBalance(clientId, periodId) {

    return AccountMovement.findAll(
        {
            where: { clientId: clientId, periodId: periodId },
            attributes: ['accountId', [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'], [Sequelize.fn('COUNT', Sequelize.col('id')), 'movements']],
            group: ['accountId'],
            raw: true,
            order: [['accountId', 'DESC']]
        })
        .then(balance => {
            return balance;
        });
};

module.exports.openMonthlyBalance = async function (clientId, periodId, previousPeriodId, userId) {

    try {

        let totalAmount = 0.00; let totalMovements = 0;

        const accounts = await Account.findAll({ where: { clientId: clientId } /*, attributes: [['id']] */ })

        accountIds = []; for (const account of accounts) { accountIds.push(account.id); };

        if (previousPeriodId !== null) {

            //buscamos los saldos del periodo anterior

            const monthlyBalance = await MonthlyBalance.findAll(
                {
                    where: { clientId: clientId, periodId: previousPeriodId, accountId: { [Op.in]: accountIds } },
                }
            );

            for (const accountId of accountIds) {

                let amount = 0.00;

                const index = _.findIndex(monthlyBalance, { accountId: accountId });

                if (index >= 0) {
                    amount = Number.parseFloat(monthlyBalance[index].amount);
                }

                //-----------------------------------------------------------------
                // <----- REGISTRAMOS EL MOVIMIENTO EN LA CC DEL BARRIO ----->
                //-----------------------------------------------------------------

                const AccountMovement = require('./accountMovements.controller');

                const accountMovementCategory = require('./accountMovements.controller').AccountMovementsCategories;

                const accountMovement = await AccountMovement.addMovement(clientId, accountId, periodId, amount,
                    accountMovementCategory.eStatus.get('SALDO_PERIODO_ANTERIOR').value, monthlyBalance[index].id, userId)

                if (accountMovement === null) {
                    winston.error(`It was not possible to add account movement record for the initial monthly balance - ${err}`);
                    throw new Error("It was not possible to add the initial monthly balance into the account movements table");
                }

                totalAmount += amount; totalMovements += 1;
            }
        }

        return { totalAmount: totalAmount, totalMovements: totalMovements, totalAccounts: accountIds.length };

    } catch (error) {
        winston.error(`An error ocurred opening monthly balance for client #${clientId} (period #${periodId}) - ${error}`); return undefined;
    }
};

module.exports.closeMonthlyBalance = async function (clientId, periodId) {

    let totalAmount = 0.00; let totalMovements = 0;

    try {

        const accounts = await Account.findAll({ where: { clientId: clientId } /*, attributes: [['id']] */ })

        accountIds = [];

        for (const account of accounts) {
            accountIds.push(account.id);
        };

        const monthlyBalance = await AccountMovement.findAll(
            {
                where: { clientId: clientId, periodId: periodId, accountId: { [Op.in]: accountIds } },
                attributes: ['accountId', [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'], [Sequelize.fn('COUNT', Sequelize.col('id')), 'movements']],
                group: ['accountId'],
                raw: true,
                order: [['accountId', 'DESC']]
            });

        for (const accountId of accountIds) {

            const mBalance = {
                clientId: clientId,
                periodId: periodId,
                accountId: accountId,
                amount: 0,
                movements: 0
            };

            const index = _.findIndex(monthlyBalance, { accountId: accountId });

            if (index >= 0) {
                mBalance.amount = monthlyBalance[index].totalAmount;
                mBalance.movements = monthlyBalance[index].movements;
            }

            let temp = await MonthlyBalance.findOne({ where: { clientId: clientId, periodId: periodId, accountId: accountId } })

            if (temp === null) {
                await MonthlyBalance.create(mBalance);
            } else {
                await temp.update(mBalance)
            };

            totalAmount += Number.parseFloat(mBalance.amount); totalMovements += mBalance.movements;
        }

        return { totalMovements: totalMovements, totalAmount: totalAmount, totalAccounts: accountIds.length };

    } catch (error) {
        winston.error(`An error ocurred closing monthly balance for client #${clientId} (period #${periodId}) - ${error}`); return undefined;
    }
}