const { authenticator } = require('otplib');
const crypto = require('crypto');
const qrcode = require('qrcode');

module.exports.generateSecret = function () {
    const secret = authenticator.generateSecret(); return secret;
};

module.exports.generateToken = function (secret) {
    return authenticator.generate(secret);
};

module.exports.verify = function (token, secret) {
    return authenticator.verify({ secret, token });
};

module.exports.generateQRCode = async function (user, secret) {

    const otpauth = authenticator.keyuri(user, "AAII Kyanite", secret);

    return new Promise(function (resolve, reject) {
        qrcode.toDataURL(otpauth, function (err, url) {
            if (err) {
                console.log('Could not generate QR code', err); reject(err);
            }
            resolve(url);
        });
    });
}
