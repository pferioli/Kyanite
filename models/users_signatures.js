'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSignature extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserSignature.belongsTo(models.user, { foreignKey: 'id', sourceKey: 'userId' });
    }
  };
  UserSignature.init({
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
    modelName: 'userSignature',
    tableName: 'users_signatures',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deletedAt'
  });
  return UserSignature;
};