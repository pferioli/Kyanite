'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AccountMovements extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AccountMovements.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            AccountMovements.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            AccountMovements.hasOne(models.account, { foreignKey: 'id', sourceKey: 'accountId' })
            AccountMovements.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
        }
    };
    AccountMovements.init({
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
        periodId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        accountId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        category: {
            allowNull: false,
            type: DataTypes.CHAR(1)
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        balance: {
            allowNull: true,
            type: DataTypes.DECIMAL(10, 2)
        },
        movementId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        categoryName: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['category']),
            get: function () {
                switch (this.get('category')) {
                    case 'P': return ('Pago a Proveedor');
                    case 'C': return ('Cobranza');
                    case 'Q': return ('Cheque');
                    case 'A': return ('Cheque Acreditado');
                    case 'R': return ('Cheque Rechazado');
                    case 'V': return ('Inversión');
                    case 'T': return ('Transferencia');
                    case 'S': return ('Saldo Período Anterior');
                    case 'I': return ('Importación de Cobranza');
                    case 'J': return ('Ajuste de Saldo Manual');
                    case 'N': return ('Nota de Crédito');
                    default: return ('Otro');
                }
            },
        }
    }, {
        sequelize,
        modelName: 'accountMovement',
        tableName: 'account_movements',
        timestamps: true,
        paranoid: true,

    });
    return AccountMovements;
};