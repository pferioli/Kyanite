const cron = require('node-cron');

const expirationDateReminder = require('../controllers/investments.controller').expirationDateReminder

cron.schedule('0 9 * * 1-5', () => {
    expirationDateReminder();
}, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
});