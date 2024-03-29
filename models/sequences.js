'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Sequence extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    };

    Sequence.init({
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
        collections: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        payments: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        compensations: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        increment: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
    }, {
        sequelize,
        modelName: 'sequence',
        tableName: 'sequences',
        timestamps: false,
        paranoid: false,
    });
    return Sequence;
};