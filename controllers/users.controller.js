const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const User = Model.user;
const UserSignature = Model.userSignature;
const UserAvatar = Model.userAvatar;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'users'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.getAvatar = function (req, res) {

    User.findOne({ where: { id: req.user.id }, include: [{ model: Model.userAvatar }] })
        .then(user => {
            if (user.userAvatar)
                res.send(user.userAvatar.image);
            else
                res.send();
        })

}