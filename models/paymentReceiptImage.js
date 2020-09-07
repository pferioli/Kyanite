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
        static associate(models) { }
    };

    PaymentReceipt.init({
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
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        originalName: {
            allowNull: false,
            type: DataTypes.STRING
        },
        fileSize: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        publicUrl: {
            allowNull: true,
            type: DataTypes.STRING
        },
        authenticatedUrl: {
            allowNull: true,
            type: DataTypes.STRING
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'paymentReceiptImage',
        tableName: 'payment_receipts_images',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return PaymentReceipt;
};