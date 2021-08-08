'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class InvestmentCategory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            InvestmentCategory.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    InvestmentCategory.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        description: {
            allowNull: false,
            type: DataTypes.STRING
        },
        hasExpirationDate: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        enabled: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'investmentCategory',
        tableName: 'investments_categories',
        timestamps: false,
        paranoid: false,

    });
    return InvestmentCategory;
};