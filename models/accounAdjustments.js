'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AccountAdjustments extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AccountAdjustments.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            AccountAdjustments.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            AccountAdjustments.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            AccountAdjustments.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    AccountAdjustments.init({
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
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        comments: {
            allowNull: false,
            type: DataTypes.STRING(512)
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'accountAdjustment',
        tableName: 'account_adjustments',
        timestamps: true,
        paranoid: true,

    });
    return AccountAdjustments;
};