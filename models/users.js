'use strict';
const {
  Model
} = require('sequelize');

const UserPrivilegeLevel = require('../utils/userPrivilegeLevel.util').UserPrivilegeLevel;

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasOne(models.userSignature, { foreignKey: 'userId', sourceKey: 'id' })
      User.hasOne(models.userAvatar, { foreignKey: 'userId', sourceKey: 'id' })
    }
  };
  User.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    securityLevel: {
      type: DataTypes.CHAR,
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mustChange: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    privilegeName: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['securityLevel']),
      get: function () {
        return (UserPrivilegeLevel.Level[this.get('securityLevel')])
      }
    },
    enabled2fa: {
      type: new DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['secret']),
      get: function () {
        if (this.get('secret')) {
          return true
        } else {
          return false
        }
      },
    },
  }, {
    sequelize,
    modelName: 'user',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deletedAt'
  });
  return User;
};