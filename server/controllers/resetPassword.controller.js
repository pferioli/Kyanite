const jwt = require('jwt-simple');
const sendgrid = require('../helpers/sendgrid.helper');
const winston = require('../helpers/winston.helper');

const Model = require('../models')
const User = Model.user;

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
            email: user.email
        };

        const secret = user.password + '-' + user.createdAt.getTime();

        var token = jwt.encode(payload, secret);

        winston.info(`token ${token} encoded with secret ${secret}`);

        sendgrid.sendgridResetPassword(user.email, `http://localhost:3000/password/reset/${payload.id}/${token}`)
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

module.exports.decodeJWT = function (req, res) {

    Users.findOne({ where: { email: req.params.id } }, function (user) {

        if (user === null) {
            req.flash("error", "No se encontró el usuario en la base de datos");
        }

        try {
            const secret = user.password + '-' + user.createdAt.getTime();

            const payload = jwt.decode(req.params.token, secret);

            // TODO: Gracefully handle decoding issues.
            // Create form to reset password.
            res.send('<form action="/password/reset" method="POST">' +
                '<input type="hidden" name="id" value="' + payload.id + '" />' +
                '<input type="hidden" name="token" value="' + req.params.token + '" />' +
                '<input type="password" name="password" value="" placeholder="Enter your new password..." />' +
                '<input type="submit" value="Reset Password" />' +
                '</form>');

        } catch (err) {
            winston.error(`jwt decode failed with error ${err}`);
            res.status(403).send(`jwt decode failed with error ${err}`);
        }
    }
    )
};

module.exports.change = function (req, res) {
    res.send('Your password has been successfully changed to ' + req.body.password);
} 
