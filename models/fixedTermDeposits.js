'use strict';

const {
    Model
} = require('sequelize');

const FixedTermDepositsStatus = require('../utils/statusMessages.util').FixedTermDeposits;

module.exports = (sequelize, DataTypes) => {
    class FixedTermDeposit extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            FixedTermDeposit.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            FixedTermDeposit.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            FixedTermDeposit.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
            FixedTermDeposit.hasOne(models.fixedTermDepositsCategory, { foreignKey: 'id', sourceKey: 'categoryId', as: 'depositType' })
            FixedTermDeposit.hasOne(models.account, { foreignKey: 'id', sourceKey: 'sourceAccountId', as: 'sourceAccount' })
            FixedTermDeposit.hasOne(models.account, { foreignKey: 'id', sourceKey: 'destinationAccountId', as: 'destinationAccount' })
        }
    };
    FixedTermDeposit.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        clientId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        sourceAccountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        destinationAccountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        interests: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        categoryId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        creationDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        expirationDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        comments: {
            allowNull: false,
            type: DataTypes.STRING
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        status: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['statusId']),
            get: function () {
                return FixedTermDepositsStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },

    }, {
        sequelize,
        modelName: 'fixedTermDeposit',
        tableName: 'fixed_term_deposits',
        timestamps: true,
        paranoid: true,

    });
    return FixedTermDeposit;
};