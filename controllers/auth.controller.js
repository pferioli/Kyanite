const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');
const base32 = require('thirty-two');

// const speakeasy = require("speakeasy");
const QRCode = require('qrcode');

const mailgun = require('../helpers/mailgun.helper');
const winston = require('../helpers/winston.helper');

const Model = require('../models')
const User = Model.user;

module.exports.hashPassword = function (req, res) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
        res.send(`hash: ${hash}`);
    });
}

const path = require("path");

const resources = path.join(__dirname, "..", "public", "images")

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
                winston.info(`reset mail succesfully sent to user ${user.email}`);
                req.flash("success", `un correo le ha sido enviado a la direccion ${user.email} para completar el proceso`);
                res.redirect('/auth/login');

            })
            .catch(err => {
                winston.info(`it was not possible to send the mail for password reset to user ${user.email} - ${err}`);
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
            user.mustChange = false

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

module.exports.generate2fa = async function (user) {

    // const secret = speakeasy.generateSecret({ length: 10 });

    // const otpUrl = speakeasy.otpauthURL({
    //     secret: (user.secret ? base32.encode(user.secret) : secret.base32), label: user.email, algorithm: 'sha512', issuer: "AAII Kyanite", period: 30
    // });

    var key = randomKey(10);

    if (user.secret) {
        key = user.secret;
    }

    var encodedKey = base32.encode(key);

    var otpUrl = 'otpauth://totp/' + user.email + '?secret=' + encodedKey + '&period=30' + `&issuer=${encodeURIComponent('AAII Kyanite')}`;

    try {
        const qrFile = `qr${user.id}.png`;

        const _qrFile = await QRCode.toFile(`${resources}/QRs/${qrFile}`, otpUrl)

        const dataUrl = await QRCode.toDataURL(otpUrl)

        console.debug(dataUrl);

        return { user: user, key: key, encodedKey: encodedKey, qrImage: dataUrl, qrFile: qrFile };

    } catch (error) {
        return { user: user, key: key, encodedKey: encodedKey, qrImage: null, qrFile: null };
    }
}

module.exports.setup2fa = async function (req, res) {

    this.generate2fa(req.user)
        .then(async response => {

            User.findByPk(req.user.id).then(user => {

                if (user.secret) {
                    req.flash("warning", "Ya tiene establecido un token, primero debe deshabilitarlo para generar uno nuevo");
                    res.redirect('/users');
                    return
                }

                user.secret = response.key;

                user.save().then(() => {
                    res.render('login/totp/setup.ejs', { user: req.user, key: response.encodedKey, qrImage: response.qrImage });
                }).catch(err => {
                    req.flash("error", "Ocurrio un error y no se pudo cambiar establecer un nuevo token");
                    res.redirect('/');
                })
            }).catch(() => {
                req.flash("error", "Ocurrio un error y no se pudo cambiar establecer un nuevo token");
                res.redirect('/');
            })
        })
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