const mailgun = require("mailgun-js");

const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

module.exports.sendEmailPasswordReset = async function (name, mailto, url) {

    return await mg.messages().send({
        to: mailto,
        from: process.env.MAILFROM,
        subject: 'Solicitud de cambio de contraseña',
        text: url,
        template: "password_reset",
        inline: ['D:\\Projects\\kyanite\\server\\public\\images\\aaii.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\facebook.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\instagram.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\twitter.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\email.png'],
        'h:X-Mailgun-Variables': `{"name":"${name}", "url":"${url}"}`
    });
}

module.exports.sendEmailPasswordChange = async function (name, mailto, url) {

    return await mg.messages().send({
        to: mailto,
        from: process.env.MAILFROM,
        subject: 'Notificacion de cambio de contraseña',
        template: "password_changed",
        'h:X-Mailgun-Variables': `{"name":"${name}", "url":"${url}"}`
    });
}