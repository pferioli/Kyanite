'use strict';
const {
    Model
} = require('sequelize');
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
        ammount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
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