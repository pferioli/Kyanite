'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserAvatar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserAvatar.belongsTo(models.user, { foreignKey: 'id', sourceKey: 'userId' });
    }
  };
  UserAvatar.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    image: {
      allowNull: false,
      type: DataTypes.BLOB('long')
    }
  }, {
    sequelize,
    modelName: 'userAvatar',
    tableName: 'users_avatars',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deletedAt'
  });
  return UserAvatar;
};