'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CollectionImportControl extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            CollectionImportControl.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })

        }
    };
    CollectionImportControl.init({
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
        startedAt: {
            allowNull: true,
            type: DataTypes.DATE
        },
        finishedAt: {
            allowNull: true,
            type: DataTypes.DATE
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        records: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'collectionImportControl',
        tableName: 'collections_temp_ctrl',
        timestamps: true,
        paranoid: false,

    });
    return CollectionImportControl;
};