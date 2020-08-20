const Op = require('sequelize').Op
const Model = require('../models')
const Notification = Model.notification;

async function findPendings(req, res) {

    const userid = req.params.id;

    const notifications = await Notification.findAll(
        {
            where: {
                enabled: true,
                [Op.or]: [
                    { user: userid }, { user: 0 }
                ]
            }
        });

    res.send(
        notifications
    );
}

module.exports = { findPendings }



