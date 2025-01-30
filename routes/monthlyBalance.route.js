const express = require("express");
const router = express.Router();

const { closeMonthlyBalance } = require('../controllers/monthlyBalance.controller');

router.get("/fixMonthlyBalance", async function (req, res, next) {
    const clientId = req.query.clientId;
    const periodId = req.query.periodId;
    const accountId = req.query.accountId;

    const monthlyBalance = await closeMonthlyBalance(clientId, periodId, accountId);

    if (monthlyBalance === undefined) {
        winston.error(`an error ocurred when user #${userId} was trying to close the billing period #${id} - check monthly_balance calculation`);
    }

    res.send({ monthlyBalance: monthlyBalance });
})

module.exports = router;

//https://kyanite-aaii.rj.r.appspot.com/monthlyBalance/fixMonthlyBalance?clientId=9&periodId=905&accountId=52
