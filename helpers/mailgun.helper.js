const mailgun = require("mailgun-js");
const path = require("path");

const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

const resources = path.join(__dirname, "..", "public", "images")

module.exports.sendEmailPasswordReset = async function (name, mailto, url) {

    return await mg.messages().send({
        to: mailto,
        from: process.env.MAILFROM,
        subject: 'Solicitud de cambio de contraseña',
        text: url,
        template: "password_reset",
        inline: [`${resources}/aaii.png`,
        `${resources}/facebook.png`,
        `${resources}/instagram.png`,
        `${resources}/twitter.png`,
        `${resources}/email.png`],
        'h:X-Mailgun-Variables': `{ "name": "${name}", "url": "${url}" }`
    });
}

module.exports.sendEmailPasswordChange = async function (name, mailto, url) {

    return await mg.messages().send({
        to: mailto,
        from: process.env.MAILFROM,
        subject: 'Notificacion de cambio de contraseña',
        template: "password_changed",
        'h:X-Mailgun-Variables': `{ "name": "${name}", "url": "${url}" }`
    });
}
