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

    const attributes = ['id', 'email', 'name', 'securityLevel', 'createdAt', 'updatedAt', 'deletedAt', 'mustChange', 'secret']

    User.findAll({
        attributes: attributes,
        paranoid: false
    }).then(users => {

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

module.exports.enable2fa = async function (req, res, next) {

    const mailgun = require('../helpers/mailgun.helper')

    const userId = Number(req.body.userId);

    if (req.user.id !== userId) { //if it's not the same user, send QR using email to dest user

        if (req.user.securityLevel !== UserPrivilegeLevel.eLevel.get('ADMINISTRATOR').value) {
            req.flash("warning", "Privilegios insuficientes, por favor contacte a un administrador");
            res.redirect('/users');
            return;
        }

        User.findByPk(userId)
            .then(async user => {

                const gen2fa = await require('./auth.controller').generate2fa(user);

                mailgun.sendEmail2faSetup(user.email, gen2fa)
                    .then(async mgResp => {

                        //{id: '<20211229022155.b6857940e9df7ae9@mg.dtronix.com.ar>', message: 'Queued. Thank you.'}

                        if (!gen2fa.user.secret) {

                            await user.update({ secret: gen2fa.key }); //FIXME: el secret que guarda no parece estar ok

                            req.flash("success", "Se envío un correo al usuario con el QR para que registre el token");
                            res.redirect('/users');
                        }
                    })
            })
            .catch(err => {
                req.flash("error", "Ocurrio un error buscando el usuario en la base de datos");
                res.redirect('/users');
            })

    } else {
        res.redirect('/auth/setup2fa'); //for the same user, use QR in the screen
    }
}

module.exports.disable2fa = async function (req, res, next) {

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

module.exports.restoreUser = async function (req, res) {

    const userId = Number(req.body.userId);

    User.findByPk(userId, { paranoid: false })
        .then(async user => {

            await user.restore();

            winston.error(`user ${userId} was successfully reactivated on request of user #${req.user.id}`);
            req.flash("success", "El usuario fue rehabilitado exitosamente");
        })
        .catch(err => {
            winston.error(`It was not possible to reactivate user ${userId} on request of user #${req.user.id} - ${err}`);
            req.flash("error", "No fue posible rehabilitar el usuario en la base de datos");
        })
        .finally(() => {
            res.redirect('/users');
        })
}

module.exports.deleteUser = async function (req, res) {

    const userId = Number(req.body.userId);

    User.findByPk(userId, { paranoid: false })
        .then(async user => {

            await user.destroy();

            winston.error(`user ${userId} was successfully deleted on request of user #${req.user.id}`);
            req.flash("success", "El usuario fue deshabilitado exitosamente");
        })
        .catch(err => {
            winston.error(`It was not possible to delete user ${userId} on request of user #${req.user.id} - ${err}`);
            req.flash("error", "No fue posible deshabilitar el usuario en la base de datos");
        })
        .finally(() => {
            res.redirect('/users');
        })
}

module.exports.getAllActiveUsers = async function () {

    const attributes = ['id', 'email', 'name', 'securityLevel', 'createdAt', 'updatedAt']

    return User.findAll({
        attributes: attributes,
        paranoid: false,
        where: {
            enabled: true
        }
    }).then(users => {
        return users
    })

}