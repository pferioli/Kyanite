const Op = require('Sequelize').Op
const Model = require('../models')
const Notification = Model.notification;

async function findPendings(req, res) {

    const userid = req.params.id;

    const pendingNotifications = await Notification.findAll(
        {
            where: {
                enabled: true,
                [Op.or]: [
                    { user: userid }, { user: 0 }
                ]
            }
        });

    res.send(
        pendingNotifications
    );
}

module.exports = { findPendings }



