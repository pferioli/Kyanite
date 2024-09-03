'use strict';

const {
    Model
} = require('sequelize');

const CompensationStatus = require('../utils/statusMessages.util').Compensation;

module.exports = (sequelize, DataTypes) => {
    class Compensation extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Compensation.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            Compensation.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            Compensation.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            Compensation.hasOne(models.accountingImputation, { foreignKey: 'id', sourceKey: 'accountingImputationId' })
            Compensation.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    Compensation.init({
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
            type: DataTypes.DECIMAL(18, 2)
        },
        accountingImputationId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        emissionDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        receiptNumber: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        receiptNumberFormatted: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['receiptNumber']),
            get: function () {
                return new String("00000000" + this.get('receiptNumber')).slice(-8);
            }
        },
        comments: {
            allowNull: false,
            type: DataTypes.STRING(512)
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        status: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['statusId']),
            get: function () {
                return CompensationStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'compensation',
        tableName: 'compensations',
        timestamps: true,
        paranoid: true,

    });
    return Compensation;
};