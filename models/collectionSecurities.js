'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CollectionSecurity extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            CollectionSecurity.belongsTo(models.collection, { foreignKey: 'id', sourceKey: 'collectionId' })
        }
    };
    CollectionSecurity.init({
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
        type: {
            allowNull: false,
            type: DataTypes.STRING(5)
        },
        description: {
            allowNull: false,
            type: DataTypes.STRING(256)
        },
        accountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        checkId: {
            allowNull: true,
            default: null,
            type: DataTypes.INTEGER
        },
        ammount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'collectionSecurity',
        tableName: 'collections_securities',
        timestamps: true,
        paranoid: true,

    });
    return CollectionSecurity;
};