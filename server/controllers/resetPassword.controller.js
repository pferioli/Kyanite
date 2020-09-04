const jwt = require('jwt-simple');
const bcrypt = require("bcrypt");
const mailgun = require('../helpers/mailgun.helper');
const winston = require('../helpers/winston.helper');

const Model = require('../models')
const User = Model.user;

const KYANITE_URL = 'http://localhost:3000'

module.exports.encodeJWT = async function (req, res) {

    if ((req.body.email === undefined) || (req.body.email.length === 0)) {
        req.flash("error", "debe ingresar una direccion de correo electrónica válida")
        res.redirect('/password/forgot');
    }
    else {

        const user = await User.findOne({ where: { email: req.body.email } });

        if (user === null) {
            req.flash("error", "No se encontró el usuario en la base de datos");
        }

        var payload = {
            id: user.id,        // User ID from database
            email: user.email,
            timestamp: Date.now()
        };

        const secret = user.password + '-' + user.createdAt.getTime();

        var token = jwt.encode(payload, secret, "HS256", { expiresIn: 600 });

        winston.info(`token ${token} encoded with secret ${secret}`);

        mailgun.sendEmailPasswordReset(user.name, user.email, `${KYANITE_URL}/password/reset/${user.id}/${token}`)
            .then(mail => {
                winston.info(`se envio correctamente el mail de reset al usuario ${user.email}`);
                req.flash("success", `un correo le ha sido enviado a la direccion ${user.email} para completar el proceso`);
                res.redirect('/password/forgot');

            })
            .catch(err => {
                winston.info(`se envio correctamente el mail de reset al usuario ${user.email}`);
                req.flash("error", `no se pudo enviar el correo a la direccion ${user.email}`);
                res.redirect('/password/forgot');
            })
    };
};

module.exports.decodeJWT = async function (req, res) {

    try {
        const user = await User.findByPk(req.params.id);

        //TODO: agregar un control de expiracion del token
        if (!user) {
            req.flash("error", "No se encontró el usuario en la base de datos");
            res.redirect('/password/forgot');
            return;
        }

        const secret = user.password + '-' + user.createdAt.getTime();

        const payload = jwt.decode(req.params.token, secret);

        res.render('login/password/change', { userId: payload.id, token: req.params.token });

    } catch (err) {
        winston.error(`jwt decode failed with error ${err}`);
        res.status(403).send(`jwt decode failed with error ${err}`);
    }
};

module.exports.change = async function (req, res) {

    const user = await User.findByPk(req.params.id);

    if (!user) res.redirect('/forgot');

    bcrypt.hash(req.body.password, 10, function (err, hash) {

        user.password = hash

        user.save().then(() => {

            winston.info(`The password for user ${user.name} has been successfully changed`); //to ${req.body.password} hash: ${hash}

            mailgun.sendEmailPasswordChange(user.name, user.email, KYANITE_URL)
                .then(() => { winston.info(`an email has been sent to ${user.email} to notify about password changing`); })
                .catch(error => { winston.info(`something went worng sending the password change email to user ${user.name} - ${error}`); })
                .finally(() => {
                    req.flash("success", "La contraseña fue actualizada exitosamente");
                    res.redirect('/login');
                })
        })
            .catch(error => {
                winston.info(`The password for user ${user.name} failed to update - ${error}`);
                req.flash("error", "Ocurrio un error y no se pudo cambiar la contraseña");
                res.redirect('/forgot');
            });
    });


} 
