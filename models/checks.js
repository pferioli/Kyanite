'use strict';
const {
    Model
} = require('sequelize');

const CheckStatus = require('../utils/statusMessages.util').Check;

module.exports = (sequelize, DataTypes) => {
    class Check extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Check.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            Check.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            Check.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            Check.hasOne(models.bank, { foreignKey: 'id', sourceKey: 'bankId' })
            Check.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    Check.init({
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
        bankId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        number: {
            allowNull: false,
            type: DataTypes.STRING
        },
        ammount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        emissionDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        paymentDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        dueDate: {
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
                return CheckStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'check',
        tableName: 'checks',
        timestamps: true,
        paranoid: true,

    });
    return Check;
};