'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CheckSplitted extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            CheckSplitted.hasOne(models.check, { foreignKey: 'id', sourceKey: 'checkId' })
            CheckSplitted.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    CheckSplitted.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        checkId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        splitType: {
            allowNull: false,
            type: DataTypes.CHAR
        },
        ammount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        comments: {
            allowNull: false,
            type: DataTypes.STRING
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'checkSplitted',
        tableName: 'checks_splitted',
        timestamps: true,
        paranoid: true,

    });
    return CheckSplitted;
};