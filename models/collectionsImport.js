'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CollectionImport extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            CollectionImport.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })

        }
    };
    CollectionImport.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        controlId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        clientCode: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        propertyType: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        property: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        accountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        conceptType: {
            allowNull: false,
            type: DataTypes.STRING(5)
        },
        conceptDesc: {
            allowNull: false,
            type: DataTypes.STRING(32)
        },
        valueType: {
            allowNull: false,
            type: DataTypes.STRING(5)
        },
        valueDesc: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(18, 2)
        },
        date: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
    }, {
        sequelize,
        modelName: 'collectionImport',
        tableName: 'collections_temp',
        timestamps: true,
        paranoid: false,

    });
    return CollectionImport;
};