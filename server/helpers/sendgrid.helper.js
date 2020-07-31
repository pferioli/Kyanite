const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.sendgridExample = async function () {
    await sendgrid.send({
        to: 'pferioli@gmail.com',
        from: 'pablo_ferioli@hotmail.com',
        subject: 'Sendgrid test email from Node.js on Google Cloud Platform',
        text:
            'Well hello! This is a Sendgrid test email from Node.js on Google Cloud Platform.',
    });
}