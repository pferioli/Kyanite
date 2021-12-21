const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const User = Model.user;
const UserSignature = Model.userSignature;
const UserAvatar = Model.userAvatar;

const bcrypt = require('bcrypt');

const winston = require('../helpers/winston.helper');

const UserPrivilegeLevel = require('../utils/userPrivilegeLevel.util').UserPrivilegeLevel;

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

    const existingUser = await User.findOne({ where: { email: req.body.email } });

    if (existingUser) {
        req.flash("warning", "El usuario ya existe en la base de datos");
        res.redirect('/users');
        return;

    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        securityLevel: req.body.securityLevel,
        enabled: true,
        secret: null,
        mustChange: true
    })
        .then(newUser => {
            winston.info(`a new user ${newUser.email} added to database by userId ${req.user.id}`);
            req.flash("success", "El nuevo usuario fue agregado exitosamente");
            res.redirect('/users');
        })
        .catch(err => {
            winston.error(`It was not possible to add a new user - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo agregar el usuario");
            res.redirect('/users');

        })

}


module.exports.manage2fa = async function (req, res, next) {

    const userId = Number(req.body.userId);

    if (req.user.id !== userId) {

        if (req.user.securityLevel !== UserPrivilegeLevel.eLevel.get('ADMINISTRATOR').value) {
            req.flash("warning", "Privilegios insuficientes, por favor contacte a un administrador");
            res.redirect('/users');
            return;
        }
    }

    User.findByPk(userId)
        .then(user => {

            if (user.secret) {

                user.secret = null;

                user.save().then(() => {
                    req.flash("success", "El segundo factor de autenticacion se eliminó exitosamente");
                    res.redirect('/users');
                })

            } else {
                res.redirect('/auth/setup2fa');
            }
        })
}