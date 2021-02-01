'use strict';
const {
  Model
} = require('sequelize');

const notification = require('../utils/notifications.util').notifications;

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Notification.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    typeMessage: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['type']),
      get: function () {
        return notification.Type[this.get('type')];
      }
    },
    severity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    severityMessage: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['severity']),
      get: function () {
        return notification.Severity[this.get('severity')];
      }
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT('tiny'),
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    ackBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'notification',
    tableName: 'notifications',
    timestamps: true
  });
  return Notification;
};