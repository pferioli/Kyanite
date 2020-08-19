
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class accountingImputation extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            //accountingImputation.hasOne(models.accountingGroups, { foreignKey: 'id' })
        }
    };
    accountingImputation.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        account: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        group: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        enabled: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        }
    }, {
        sequelize,
        modelName: 'accountingImputation',
        tableName: 'accounting_imputations',
    });
    return accountingImputation;
};