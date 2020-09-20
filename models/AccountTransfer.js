'use strict';
const {
    Model
} = require('sequelize');

const status = ["Deshabilitada", "Pendiente", "En Proceso", "Procesada", "Anulada"];

module.exports = (sequelize, DataTypes) => {
    class AccountTransfer extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AccountTransfer.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            AccountTransfer.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            AccountTransfer.hasOne(models.clientAccount, { as: 'sourceAccount', foreignKey: 'id', sourceKey: 'sourceAccountId' })
            AccountTransfer.hasOne(models.clientAccount, { as: 'destinationAccount', foreignKey: 'id', sourceKey: 'destinationAccountId' })
            AccountTransfer.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    AccountTransfer.init({
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
        ammount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        transferDate: {
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
                return status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'accountTransfer',
        tableName: 'account_transfers',
        timestamps: true,
        paranoid: true,

    });
    return AccountTransfer;
};