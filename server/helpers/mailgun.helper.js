const mailgun = require("mailgun-js");

const mailfrom = 'pablo_ferioli@hotmail.com';

const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

module.exports.sendEmailPasswordReset = async function (name, mailto, resetLink) {

    return await mg.messages().send({
        to: mailto,
        from: mailfrom,
        subject: 'Cambio de Clave',
        text: resetLink,
        template: "password_reset",
        inline: ['D:\\Projects\\kyanite\\server\\public\\images\\aaii.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\facebook.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\instagram.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\twitter.png',
            'D:\\Projects\\kyanite\\server\\public\\images\\email.png'],
        'h:X-Mailgun-Variables': `{"name":"${name}", "url":"${resetLink}"}`
    });
}
