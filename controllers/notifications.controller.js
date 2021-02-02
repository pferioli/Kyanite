const Op = require('sequelize').Op
const Model = require('../models')
const Notification = Model.notification;
const sequelize = require('sequelize');

const winston = require('../helpers/winston.helper');

const CURRENT_MENU = 'notifications'; module.exports.CURRENT_MENU = CURRENT_MENU;

//const NotificationEnums = require('../utils/notifications.util').Notifications;

// module.exports.findPendings = async function (req, res) {

//     const notifications = await Notification.findAll(
//         {
//             where: {
//                 enabled: true,
//                 [Op.or]: [
//                     { user: userid }, { user: 0 }
//                 ]
//             }
//         });

//     res.send(
//         notifications
//     );
// }

module.exports.findPendings = function (req, res) {

    const userId = req.params.id;

    Notification.findAll({
        where: {
            enabled: true,
            [Op.or]: [
                { userId: userId }, { userId: 0 }
            ]
        },
        //group: ['severity'],
        attributes: [
            [sequelize.fn('min', sequelize.col('severity')), 'lowestSeverity'],
            [sequelize.fn('count', sequelize.col('severity')), 'sevCount']
        ]
    })
        .then((notifications) => {
            res.send(notifications[0]);
        })
        .catch((err) => { res.sendStatus(500).send(err) })
}

module.exports.notifications = function (req, res) {

    const userId = req.user.id;

    Notification.findAll(
        {
            where: {
                userId: { [Op.in]: [0, userId] },
                enabled: true
            },
            include: [{ model: Model.user }]
        })
        .then((notifications) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.render('notifications/notifications', { menu: CURRENT_MENU, data: { notifications } });
        })
}

module.exports.ackNotification = function (req, res) {

    const alertId = req.body.alertId;

    Notification.findByPk(alertId)
        .then((notification) => {
            notification.update({ ackBy: req.user.id, enabled: false })
                .then(() => {
                    winston.info(`Alert id #${alertId} was acked by user ${req.user.id}`)
                })
                .catch((err) => {
                    winston.error(`Alert id #${alertId} was not acked by user ${req.user.id} - ${err}`)
                    req.flash("error", `No se pudo borrar la alerta, por favor avisar al administrador si aún sigue activa`)
                })
                .finally(() => {
                    res.redirect('/notifications/show');
                })
        })
        .catch((err) => {
            winston.error(`Alert id #${alertId} was not acked by user ${req.user.id} - ${err}`)
            req.flash("error", `No se pudo borrar la alerta, por favor avisar al administrador si aún sigue activa`)
            res.redirect('/notifications/show/' + req.user.id);
        })
}

module.exports.clearNotifications = function (req, res) {

    Notification.update(
        { ackBy: req.user.id, enabled: false },
        {
            where: {
                userId: {
                    [Op.in]: [0, req.user.id]
                }
            }
        }
    )
        .then((results) => {
            winston.info(`${results.length} alerts were cleared by user ${req.user.id}`)
        })
        .catch((err) => {
            winston.error(`Active alerts for user ${req.user.id} could not be cleared - ${err}`)
            req.flash("error", `No se pudieron borrar las alertas activas, por favor avisar al administrador si aún continuan`)
        })
        .finally(() => {
            res.redirect('/notifications/show');
        })
}







