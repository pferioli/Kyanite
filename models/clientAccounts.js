'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ClientAccount extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            ClientAccount.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            ClientAccount.hasOne(models.accountType, { foreignKey: 'id', sourceKey: 'accountTypeId' })
            ClientAccount.hasOne(models.bank, { foreignKey: 'id', sourceKey: 'bankId' })
            ClientAccount.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    ClientAccount.init({
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
        accountTypeId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        bankId: {
            type: DataTypes.INTEGER
        },
        bankBranch: {
            type: DataTypes.STRING
        },
        accountNumber: {
            type: DataTypes.STRING
        },
        accountAlias: {
            type: DataTypes.STRING
        },
        cbu: {
            type: DataTypes.STRING
        },
        comments: {
            type: DataTypes.STRING
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'clientAccount',
        tableName: 'client_accounts',
        timestamps: true,
        paranoid: true,

    });
    return ClientAccount;
};