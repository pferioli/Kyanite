const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = require('sequelize').Op
const Model = require('../models')

const User = Model.user;
const UserSignature = Model.userSignature;
const UserAvatar = Model.userAvatar;

const bcrypt = require('bcrypt');
const path = require('path');

const winston = require('../helpers/winston.helper');
const { hashPassword } = require('./auth.controller');
const { readFileSync } = require('fs');

const UserPrivilegeLevel = require('../utils/userPrivilegeLevel.util').UserPrivilegeLevel;

const ADMINISTRATOR = UserPrivilegeLevel.eLevel.get('ADMINISTRATOR').value;

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

    if (req.user.securityLevel !== ADMINISTRATOR) {
        req.flash("warning", "No tiene permisos suficientes para agregar usuarios");
        res.redirect('/users');
        return;
    }

    res.render("users/add.ejs", { menu: CURRENT_MENU, data: {} });
};


module.exports.addNew = async function (req, res, next) {

    if (req.user.securityLevel !== ADMINISTRATOR) {
        req.flash("warning", "No tiene permisos suficientes para agregar usuarios");
        res.redirect('/users');
        return;
    }

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
        .then(async newUser => {

            if (req.file) {
                await UserSignature.create({
                    userId: newUser.id,
                    image: req.file.buffer
                })
            }

            winston.info(`a new user ${newUser.email} added to database by userId ${req.user.id}`);
            req.flash("success", "El nuevo usuario fue agregado exitosamente");
        })
        .catch(err => {
            winston.error(`It was not possible to add a new user - ${err}`);
            req.flash("error", "Ocurrio un error y no se pudo agregar el usuario");
        }).finally(() => {
            res.redirect('/users');
        })
}

module.exports.showEditForm = async function (req, res, next) {

    const userId = Number(req.params.userId);

    if (req.user.id !== userId && req.user.securityLevel !== ADMINISTRATOR) {
        req.flash("warning", "No tiene permisos suficientes para modificar usuarios");
        res.redirect('/users');
        return;
    }

    const user = await User.findByPk(userId, {
        include: [{ model: Model.userSignature }]
    });

    if (user === null) {
        req.flash("error", "El usuario no existe en la base de datos");
        res.redirect('/users');
        return;
    }

    let signatureImage = undefined;

    if (user.userSignature) {
        signatureImage = "data:image/png;base64," + user.userSignature.image.toString("base64");
    } else {
        const noSignaturaImage = path.join(__dirname, "..", "public", "images", "no-signature.png");
        signatureImage = "data:image/png;base64," + readFileSync(noSignaturaImage).toString('base64');
    }

    res.render("users/edit.ejs", { menu: CURRENT_MENU, data: { user, signature: signatureImage } });
}

module.exports.edit = async function (req, res, next) {

    const userId = Number(req.body.userId); let isAdmin = false;

    if (!userId) {
        req.flash("error", "El identificador del usuario es invalido");
        res.redirect('/users');
        return;

    }
    // si el usuario no es administrador solo puede cambiar sus propio usuario...

    if (req.user.securityLevel !== ADMINISTRATOR) {

        if (req.user.id !== userId) {
            req.flash("warning", "No tiene permisos suficientes para modificar usuarios");
            res.redirect('/users');
            return;
        }
    } else {    //ADMIN
        isAdmin = true;
    }

    User.findByPk(userId)
        .then(async user => {

            if (user === null) {
                req.flash("error", "No existe ningun usuario en la base de datos con ese ID");
                res.redirect('/users');
                return;
            }

            let updatedUser = {
                name: req.body.name,
                email: req.body.email,
            }

            if (req.body.clearSignature?.toLowerCase() === 'on') {
                await UserSignature.destroy({ where: { userId: user.id } });
            } else {

                if (req.file) {

                    const signature = await UserSignature.findOne({ where: { userId: user.id } });

                    if (signature !== null) {
                        await UserSignature.update({
                            userId: user.id,
                            image: req.file.buffer
                        })
                    } else {
                        await UserSignature.create({
                            userId: user.id,
                            image: req.file.buffer
                        })
                    }
                }
            }

            if (isAdmin) {
                updatedUser.securityLevel = req.body.securityLevel;
            }

            if (req.body.password) {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                updatedUser.password = hashedPassword;
            }

            try {
                await user.update(updatedUser);
                req.flash("success", "El nuevo usuario fue agregado exitosamente");
            } catch (error) {
                throw error
            }
        })
        .catch(err => {
            winston.error(`It was not possible to edit the user #${userId} - ${err}`);
            req.flash("error", "Ocurrio un error editando el usuario en la base de datos");
        })
        .finally(() => {
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