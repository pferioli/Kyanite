'use strict';
const {
    Model
} = require('sequelize');

const CreditNoteStatus = require('../utils/statusMessages.util').PaymentOrder;

module.exports = (sequelize, DataTypes) => {

    class CreditNote extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            CreditNote.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            CreditNote.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            CreditNote.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            CreditNote.hasOne(models.paymentReceipt, { foreignKey: 'id', sourceKey: 'paymentReceiptId' })
            CreditNote.hasOne(models.paymentOrder, { foreignKey: 'id', sourceKey: 'paymentOrderId' })
            CreditNote.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };

    CreditNote.init({
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
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        paymentReceiptId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        paymentOrderId: {
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
        emissionDate: {
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
                return CreditNoteStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'creditNote',
        tableName: 'credit_notes',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return CreditNote;
};