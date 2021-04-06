const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');
const base32 = require('thirty-two');

const mailgun = require('../helpers/mailgun.helper');
const winston = require('../helpers/winston.helper');

const Model = require('../models')
const User = Model.user;

module.exports.hashPassword = function (req, res) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
        res.send(`hash: ${hash}`);
    });
}

module.exports.encodeJWT = async function (req, res) {

    if ((req.body.email === undefined) || (req.body.email.length === 0)) {
        req.flash("error", "debe ingresar una direccion de correo electrónica válida")
        res.redirect('/auth/password/forgot');
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

        mailgun.sendEmailPasswordReset(user.name, user.email, `${process.env.KYANITE_URL}/auth/password/reset/${user.id}/${token}`)
            .then(mail => {
                winston.info(`se envio correctamente el mail de reset al usuario ${user.email}`);
                req.flash("success", `un correo le ha sido enviado a la direccion ${user.email} para completar el proceso`);
                res.redirect('/auth/login');

            })
            .catch(err => {
                winston.info(`se envio correctamente el mail de reset al usuario ${user.email}`);
                req.flash("error", `no se pudo enviar el correo a la direccion ${user.email}`);
                res.redirect('/auth/password/forgot');
            })
    };
};

module.exports.decodeJWT = async function (req, res) {

    const user = await User.findByPk(req.params.id);

    if (!user) {
        req.flash("error", "No se encontró el usuario en la base de datos");
        res.redirect('/auth/password/forgot');
        return;
    }

    const secret = user.password + '-' + user.createdAt.getTime();

    try {
        const payload = jwt.decode(req.params.token, secret);

        if (payload.email != user.email) {
            winston.error(`the email for req.params.id doesn't match with the email in JWT payload`);
            res.status(401).send(`el usuario indicado en el JWT no coincide con el que esta tratando de cambiar`);
        }
        bcrypt.hash(req.body.password, 10, function (err, hash) {

            user.password = hash

            user.save().then(() => {

                winston.info(`The password for user ${user.name} has been successfully changed`); //to ${req.body.password} hash: ${hash}

                mailgun.sendEmailPasswordChange(user.name, user.email, process.env.KYANITE_URL)
                    .then(() => { winston.info(`an email has been sent to ${user.email} to notify about password changing`); })
                    .catch(error => { winston.info(`something went worng sending the password change email to user ${user.name} - ${error}`); })
                    .finally(() => {
                        req.flash("success", "La contraseña fue actualizada exitosamente");
                        res.redirect('/auth/login');
                    })
            })
                .catch(error => {
                    winston.info(`The password for user ${user.name} failed to update - ${error}`);
                    req.flash("error", "Ocurrio un error y no se pudo cambiar la contraseña");
                    res.redirect('/auth/password/forgot');
                });
        });


    } catch (error) {
        winston.error(`jwt decode failed with error ${error}`);
        res.status(403).send(`Ocurrio un error al tratar de decodificar el el JWT - ${error}`);
    }

}

//---------------------------------------------------------------------------//
// TWO-FACTOR AUTHENTICATION -- GOOGLE AUTHENTICATOR
//---------------------------------------------------------------------------//

module.exports.setup2fa = async function (req, res) {

    var key = randomKey(10);

    if (req.user.secret) {
        key = req.user.secret;
    }

    var encodedKey = base32.encode(key);

    // generate QR code for scanning into Google Authenticator
    // reference: https://code.google.com/p/google-authenticator/wiki/KeyUriFormat
    var otpUrl = 'otpauth://totp/' + req.user.email
        + '?secret=' + encodedKey + '&period=30' + `&issuer=${encodeURIComponent('AAII Kyanite')}`;

    var qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);

    if (!req.user.secret) {
        let user = await User.findByPk(req.user.id);
        user.secret = key;
        await user.save();
    }

    res.render('login/totp/setup.ejs', { user: req.user, key: encodedKey, qrImage: qrImage });
};

function randomKey(len) {
    var buf = []
        , chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }

    return buf.join('');
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}