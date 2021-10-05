'use strict';
const {
    Model
} = require('sequelize');

const PaymentReceiptStatus = require('../utils/statusMessages.util').PaymentReceipt;

module.exports = (sequelize, DataTypes) => {

    class PaymentReceipt extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            PaymentReceipt.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            PaymentReceipt.hasOne(models.supplier, { foreignKey: 'id', sourceKey: 'supplierId' })
            PaymentReceipt.hasOne(models.receiptType, { foreignKey: 'id', sourceKey: 'receiptTypeId' })
            PaymentReceipt.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            PaymentReceipt.hasOne(models.accountingImputation, { foreignKey: 'id', sourceKey: 'accountingImputationId' })
            PaymentReceipt.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
            PaymentReceipt.hasOne(models.paymentReceiptImage, { foreignKey: 'paymentReceiptId', sourceKey: 'id' })
            PaymentReceipt.hasMany(models.paymentOrder, { sourceKey: 'id', foreignKey: 'paymentReceiptId'})
        }
    };

    PaymentReceipt.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        clientId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        supplierId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        receiptNumber: {
            allowNull: false,
            type: DataTypes.STRING
        },
        receiptTypeId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        emissionDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        description: {
            allowNull: false,
            type: DataTypes.STRING
        },
        accountingImputationId: {
            allowNull: false,
            type: DataTypes.INTEGER
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
                return PaymentReceiptStatus.Status[this.get('statusId')];
            }
        },
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'paymentReceipt',
        tableName: 'payment_receipts',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return PaymentReceipt;
};