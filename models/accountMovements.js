'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AccountMovements extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AccountMovements.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            AccountMovements.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            AccountMovements.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            AccountMovements.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    AccountMovements.init({
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
        accountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        category: {
            allowNull: false,
            type: DataTypes.CHAR(1)
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'accountMovement',
        tableName: 'account_movements',
        timestamps: true,
        paranoid: true,

    });
    return AccountMovements;
};