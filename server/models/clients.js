'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Client.hasOne(models.taxCategory, { foreignKey: 'id', sourceKey: 'taxCategoryId' })
    }
  };

  Client.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    internalCode: {
      allowNull: false,
      type: DataTypes.STRING
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    cuit: {
      allowNull: false,
      type: DataTypes.STRING
    },
    taxCategoryId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    address: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    zipCode: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    functionalUnitsCount: {
      type: DataTypes.INTEGER
    },
    lotSize: {
      type: DataTypes.STRING
    },
    comments: {
      type: DataTypes.STRING
    },
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'client',
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deletedAt'
  });
  return Client;
};