const express = require("express");
const router = express.Router();

const sse = require('../controllers/serverSentEvents.controller');

router.get('/', sse.notify);    // SSE starting endpoint

module.exports = router;
