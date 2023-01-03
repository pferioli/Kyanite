const cron = require('node-cron');

const expirationDateReminder = require('../controllers/investments.controller').expirationDateReminder

const winston = require('../helpers/winston.helper');

winston.info(`scheduling cron for investments :: expiration date, cron settings (0 9 * * *)`);

cron.schedule('0 9 * * *', () => {
    expirationDateReminder();
}, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
});