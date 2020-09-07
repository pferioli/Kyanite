const schedule = require('node-schedule');
const winston = require('../helpers/winston.helper');

// const job_searchPendingNotifications = schedule.scheduleJob('*/10 * * * * *', function (fireDate) {
//     searchPendingNotifications(fireDate);
// })

/**
* @function autoArchiveResolvedIncidentChannels
* @summary this function is called by a scheduler to find 
* @param {*} fireDate 
* @returns {Array} key-value pair array with mapped field_name / field_id
*/
function searchPendingNotifications(fireDate) {

    winston.info('Executing crontab for searching pending notifications');
}