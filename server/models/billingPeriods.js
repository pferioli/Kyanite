'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class BillingPeriod extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            BillingPeriod.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };

    BillingPeriod.init({
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
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        startDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        endDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        openedAt: {
            type: DataTypes.DATE
        },
        closedAt: {
            type: DataTypes.DATE
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        lastPeriodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        previousPeriodId: {
            type: DataTypes.INTEGER
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        status: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['statusId']),
            get: function () {
                switch (this.get('statusId')) {
                    case 0: return "Creado";
                    case 1: return "Abierto";
                    case 2: return "Cerrado";
                    case 3: return "Anulado";
                }
                return "ERROR";
            },
        }
    }, {
        sequelize,
        modelName: 'billingPeriod',
        tableName: 'billing_periods',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt'
    });
    return BillingPeriod;
};