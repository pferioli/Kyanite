'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Supplier.hasOne(models.taxCategory, { foreignKey: 'id' })
    }
  };

  Supplier.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
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
    bankId: {
      allowNull: true,
      type: DataTypes.INTEGER
    },
    bankAccount: {
      allowNull: true,
      type: DataTypes.STRING
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
    comments: {
      type: DataTypes.STRING
    },
    categoryId: {
      type: DataTypes.STRING
    },
    enabled: {
      allowNull: false,
      type: DataTypes.BOOLEAN
    },
    user: {
      allowNull: false,
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'supplier',
    tableName: 'suppliers',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deletedAt'
  });
  return Supplier;
};