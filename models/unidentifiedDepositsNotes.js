'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UnidentifiedDepositNote extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            UnidentifiedDepositNote.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    UnidentifiedDepositNote.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        depositId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        comments: {
            type: DataTypes.STRING
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },

    }, {
        sequelize,
        modelName: 'unidentifiedDepositNote',
        tableName: 'unidentified_deposits_notes',
        timestamps: true,
        paranoid: false,

    });
    return UnidentifiedDepositNote;
};