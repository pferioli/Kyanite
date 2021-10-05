const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const User = Model.user;
const UserSignature = Model.userSignature;
const UserAvatar = Model.userAvatar;

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'users'; module.exports.CURRENT_MENU = CURRENT_MENU;

module.exports.listAll = function (req, res) {

    const autoRefresh = (req.query.refresh === undefined || req.query.refresh.toLowerCase() === 'false' ? false : true);
    const showAll = (req.query.showAll === undefined || req.query.showAll.toLowerCase() === 'false' ? false : true);

    User.findAll().then(users => {

        res.render('users/users',
            {
                menu: CURRENT_MENU,
                data: { users: users },
                params: { showAll: showAll, autoRefresh: autoRefresh }
            });
    })
}

module.exports.getAvatar = function (req, res) {

    User.findOne({ where: { id: req.user.id }, include: [{ model: Model.userAvatar }] })
        .then(user => {
            if (user.userAvatar)
                res.send(user.userAvatar.image);
            else
                res.send();
        })

}

module.exports.showNewForm = async function (req, res, next) {

    res.render("users/add.ejs", { menu: CURRENT_MENU, data: {} });
};


module.exports.addNew = async function (req, res, next) {

    req.flash("success", "El nuevo usuario fue agregado exitosamente");
    res.redirect('/users/new');
}