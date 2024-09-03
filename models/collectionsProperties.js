'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CollectionProperty extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            CollectionProperty.belongsTo(models.collection, { sourceKey: 'collectionId', targetKey: 'id' })
            CollectionProperty.hasOne(models.homeOwner, { foreignKey: 'id', sourceKey: 'propertyId' })
            CollectionProperty.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    CollectionProperty.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        collectionId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        propertyId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(18, 2)
        },
        receiptNumber: {
            allowNull: true,
            type: DataTypes.INTEGER,
            default: null
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'collectionProperty',
        tableName: 'collections_properties',
        timestamps: true,
        paranoid: true,

    });
    return CollectionProperty;
};