
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class AccountingImputation extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AccountingImputation.hasOne(models.accountingGroup, { foreignKey: 'id', sourceKey: 'groupId' })
        }
    };
    AccountingImputation.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        groupId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        account: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        enabled: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        }
    }, {
        sequelize,
        modelName: 'accountingImputation',
        tableName: 'accounting_imputations',
        timestamps: false,
        paranoid: false,
    });
    return AccountingImputation;
};