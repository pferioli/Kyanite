
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class supplierCategory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    supplierCategory.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
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
        modelName: 'supplierCategory',
        tableName: 'suppliers_categories'
    });
    return supplierCategory;
};