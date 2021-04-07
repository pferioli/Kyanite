'use strict';

const {
    Model
} = require('sequelize');

const UnidentifiedDepositStatus = require('../utils/statusMessages.util').UnidentifiedDeposit;

module.exports = (sequelize, DataTypes) => {
    class UnidentifiedDeposit extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            UnidentifiedDeposit.hasOne(models.collection, { foreignKey: 'id', sourceKey: 'collectionId' })
            UnidentifiedDeposit.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
            UnidentifiedDeposit.hasMany(models.unidentifiedDepositNote, { foreignKey: 'depositId', sourceKey: 'id' })
        }
    };
    UnidentifiedDeposit.init({
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
        comments: {
            type: DataTypes.STRING
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        status: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['statusId']),
            get: function () {
                return UnidentifiedDepositStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },

    }, {
        sequelize,
        modelName: 'unidentifiedDeposit',
        tableName: 'unidentified_deposits',
        timestamps: true,
        paranoid: true,

    });
    return UnidentifiedDeposit;
};