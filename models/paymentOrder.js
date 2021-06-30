'use strict';
const {
    Model
} = require('sequelize');

const PaymentOrderStatus = require('../utils/statusMessages.util').PaymentOrder;

module.exports = (sequelize, DataTypes) => {

    class PaymentOrder extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            PaymentOrder.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            PaymentOrder.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            PaymentOrder.hasOne(models.paymentReceipt, { foreignKey: 'id', sourceKey: 'paymentReceiptId' })
            PaymentOrder.hasOne(models.checkSplitted, { foreignKey: 'id', sourceKey: 'checkId' })
            PaymentOrder.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };

    PaymentOrder.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        paymentReceiptId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        poNumber: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        poNumberFormatted: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['poNumber']),
            get: function () {
                return new String("00000000" + this.get('poNumber')).slice(-8);
            }
        },
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        accountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        checkId: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        paymentDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        status: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['statusId']),
            get: function () {
                return PaymentOrderStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'paymentOrder',
        tableName: 'payment_orders',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return PaymentOrder;
};