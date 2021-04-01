'use strict';
const {
    Model
} = require('sequelize');

const CollectionStatus = require('../utils/statusMessages.util').Collection;

module.exports = (sequelize, DataTypes) => {
    class Collection extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Collection.hasOne(models.client, { foreignKey: 'id', sourceKey: 'clientId' })
            Collection.hasOne(models.billingPeriod, { foreignKey: 'id', sourceKey: 'periodId' })
            Collection.hasOne(models.user, { foreignKey: 'id', sourceKey: 'userId' })
            Collection.hasMany(models.collectionConcept, { foreignKey: 'collectionId', sourceKey: 'id', as: "Concepts" })
            Collection.hasMany(models.collectionSecurity, { foreignKey: 'collectionId', sourceKey: 'id', as: "Securities" })
            Collection.hasMany(models.collectionProperty, { foreignKey: 'collectionId', sourceKey: 'id', as: "Properties" })
        }
    };
    Collection.init({
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
        receiptDate: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        receiptNumber: {
            allowNull: false,
            type: DataTypes.STRING(32)
        },
        batchNumber: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        amountConcepts: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        amountSecurities: {
            allowNull: false,
            type: DataTypes.DECIMAL(10, 2)
        },
        balance: {
            type: new DataTypes.VIRTUAL(DataTypes.DECIMAL(10, 2)),
            get: function () {
                return this.get('amountConcepts') - this.get('amountSecurities');
            }
        },
        securityCode: {
            allowNull: false,
            type: DataTypes.STRING(32)
        },
        comments: {
            allowNull: false,
            type: DataTypes.TEXT('long')
        },
        statusId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        status: {
            type: new DataTypes.VIRTUAL(DataTypes.STRING, ['statusId']),
            get: function () {
                return CollectionStatus.Status[this.get('statusId')];
            }
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        sequelize,
        modelName: 'collection',
        tableName: 'collections',
        timestamps: true,
        paranoid: true,

    });
    return Collection;
};