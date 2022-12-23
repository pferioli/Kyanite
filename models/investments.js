'use strict';

const moment = require('moment');

const {
    Model
} = require('sequelize');

const InvestmentsStatus = require('../utils/statusMessages.util').Investments;

module.exports = (sequelize, DataTypes) => {
    class Investments extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Investments.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            Investments.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            Investments.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
            Investments.hasOne(models.investmentCategory, { foreignKey: 'id', sourceKey: 'categoryId', as: 'depositType' })
            Investments.hasOne(models.account, { foreignKey: 'id', sourceKey: 'sourceAccountId', as: 'sourceAccount' })
            Investments.hasOne(models.account, { foreignKey: 'id', sourceKey: 'destinationAccountId', as: 'destinationAccount' })
        }
    };
    Investments.init({
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
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        interests: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        categoryId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        creationDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        expirationDate: {
            allowNull: true,
            type: DataTypes.DATEONLY,
            defaultValue: null
        },
        remainingDays: {
            type: new DataTypes.VIRTUAL(DataTypes.INTEGER, ['expirationDate']),
            get: function () {
                const expirationDate = moment(this.get('expirationDate'));
                const now = moment();
                const diff = expirationDate.diff(now, 'days');
                return diff;
            }
        },
        expired: {
            type: new DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['expirationDate', 'statusId']),
            get: function () {
                const expirationDate = moment(this.get('expirationDate'));
                const now = moment();
                const diff = expirationDate.diff(now, 'days');

                if (((diff < 0) && (this.get('statusId') === InvestmentsStatus.eStatus.get('created').value)) || (this.get('statusId') === InvestmentsStatus.eStatus.get('expired').value)) {
                    return true;
                } else {
                    return false
                }
            }
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
                return InvestmentsStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },

    }, {
        sequelize,
        modelName: 'investment',
        tableName: 'investments',
        timestamps: true,
        paranoid: true,

    });
    return Investments;
};