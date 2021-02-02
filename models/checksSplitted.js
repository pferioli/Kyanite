'use strict';
const {
    Model
} = require('sequelize');

const CheckStatus = require('../utils/statusMessages.util').SplitCheck;

module.exports = (sequelize, DataTypes) => {
    class CheckSplitted extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            CheckSplitted.hasOne(models.check, { foreignKey: 'id', sourceKey: 'checkId' })
            CheckSplitted.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    CheckSplitted.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        checkId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        splitType: {
            allowNull: false,
            type: DataTypes.CHAR
        },
        homeOwnerId: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        supplierId: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
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
        modelName: 'checkSplitted',
        tableName: 'checks_splitted',
        timestamps: true,
        paranoid: true,

    });
    return CheckSplitted;
};