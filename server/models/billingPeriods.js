'use strict';

const moment = require('moment');

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
            type: DataTypes.DATE,
            get() {
                if (this.getDataValue('openedAt'))
                    return moment(this.getDataValue('openedAt')).format('DD/MM/YYYY hh:mm:ss');
                else return this.getDataValue('openedAt')
            }
        },
        closedAt: {
            type: DataTypes.DATE,
            get() {
                if (this.getDataValue('closedAt'))
                    return moment(this.getDataValue('closedAt')).format('DD/MM/YYYY hh:mm:ss');
                else return this.getDataValue('closedAt')
            }
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
            allowNull: true,
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