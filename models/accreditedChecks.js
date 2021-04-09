'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AccreditedCheck extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AccreditedCheck.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            AccreditedCheck.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            AccreditedCheck.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            AccreditedCheck.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
            AccreditedCheck.hasOne(models.check, { foreignKey: 'id', sourceKey: 'checkId' })
        }
    };
    AccreditedCheck.init({
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
        checkId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        accountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
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
    return AccreditedCheck;
};