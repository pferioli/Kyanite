'use strict';

const moment = require('moment');

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Account extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Account.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            Account.hasOne(models.accountType, { foreignKey: 'id', sourceKey: 'accountTypeId' })
            Account.hasOne(models.bank, { foreignKey: 'id', sourceKey: 'bankId' })
            Account.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    Account.init({
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
        },
        isDeleted: {
            type: new DataTypes.VIRTUAL(DataTypes.DATE, ['deletedAt']),
            get() {
                if (this.getDataValue('deletedAt'))
                    return moment(this.getDataValue('deletedAt')).format('DD/MM/YYYY hh:mm:ss');
                else return null;
            }
        }
    }, {
        sequelize,
        modelName: 'account',
        tableName: 'accounts',
        timestamps: true,
        paranoid: true,

    });
    return Account;
};