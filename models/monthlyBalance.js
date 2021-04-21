'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MonthlyBalance extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            MonthlyBalance.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            MonthlyBalance.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            MonthlyBalance.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            // MonthlyBalance.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    MonthlyBalance.init({
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
        movements: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        // userId: {
        //     allowNull: false,
        //     type: DataTypes.INTEGER
        // },       
    }, {
        sequelize,
        modelName: 'monthlyBalance',
        tableName: 'monthly_balance',
        timestamps: true,
        paranoid: true,

    });
    return MonthlyBalance;
};