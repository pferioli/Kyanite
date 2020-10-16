const Op = require('sequelize').Op
const Model = require('../models')
const Notification = Model.notification;
const sequelize = require('sequelize');

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

module.exports.findPendings = async function (req, res) {

    const userid = req.params.id;

    const notifications = await Notification.findAll({
        //group: ['severity'],
        attributes: [
            [sequelize.fn('min', sequelize.col('severity')), 'lowestSeverity'],
            [sequelize.fn('count', sequelize.col('severity')), 'sevCount']
        ]
    });
    res.send(
        notifications[0]
    );
}



