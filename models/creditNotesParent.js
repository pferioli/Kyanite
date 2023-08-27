'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class CreditNoteParent extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            CreditNoteParent.belongsTo(models.creditNote, { targetKey: 'id' })
            CreditNoteParent.hasOne(models.paymentOrder, { foreignKey: 'id', sourceKey: 'paymentOrderId' })
        }
    };

    CreditNoteParent.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        creditNoteId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        paymentOrderId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'creditNoteParent',
        tableName: 'credit_notes_parents',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return CreditNoteParent;
};