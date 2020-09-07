'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class HomeOwners extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            HomeOwners.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
        }
    };

    HomeOwners.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        clientId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        property: {
            allowNull: false,
            type: DataTypes.STRING
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        cuil: {
            type: DataTypes.STRING
        },
        comments: {
            type: DataTypes.STRING
        },
        coefficient: {
            type: DataTypes.DECIMAL(10, 4)
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'homeOwner',
        tableName: 'home_owners',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return HomeOwners;
};