'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class FixedTermDepositsCategory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            FixedTermDepositsCategory.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    FixedTermDepositsCategory.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        description: {
            allowNull: false,
            type: DataTypes.STRING
        },
        enabled: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'fixedTermDepositsCategory',
        tableName: 'fixed_term_deposits_categories',
        timestamps: false,
        paranoid: false,

    });
    return FixedTermDepositsCategory;
};