const cron = require('node-cron');

const expirationDateReminder = require('../controllers/investments.controller').expirationDateReminder

const winston = require('../helpers/winston.helper');

const cronSchedule = '30 12 * * *'

winston.info(`scheduling cron for investments :: expiration date, cron settings ${cronSchedule}`);

cron.schedule(cronSchedule, () => {
    expirationDateReminder();
}, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
});