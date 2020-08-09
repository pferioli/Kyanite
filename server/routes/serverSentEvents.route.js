//const sse = require('../controllers/serverSentEvents.controller');

// response header for sever-sent events
const SSE_RESPONSE_HEADER = {
    'Connection': 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no'
};

var usersStreams = {}

const getUserId = (req, from) => {
    try {
        // console.log(from, req.body, req.params)
        if (!req) return null;
        if (Boolean(req.session) && req.session.passport.user) return req.session.passport.user;
        if (Boolean(req.body) && req.body.userId) return req.body.userId;
        if (Boolean(req.params) && req.params.userId) return req.params.userId;
        return null
    } catch (e) {
        console.log('getUserId error', e)
        return null;
    }
}

module.exports = function (app) {

    // SSE starting endpoint
    app.get('/sse', function (req, res, next) {

        let userId = getUserId(req);

        if (!userId) {
            next({ message: 'stream.no-user' })
            return;
        }

        // Stores this connection
        usersStreams[userId] = { lastInteraction: null };

        // Writes response header.
        res.writeHead(200, SSE_RESPONSE_HEADER);

        // Note: Heatbeat for avoidance of client's request timeout of first time (30 sec)
        const heartbeat = { type: 'heartbeat' }
        res.write(`data: ${JSON.stringify(heartbeat)}\n\n`);
        usersStreams[userId].lastInteraction = Date.now()

        // Interval loop
        const interval = 5000;
        let intervalId = setInterval(function () {
            if (!usersStreams[userId]) return;
            res.write(`data: ${JSON.stringify(heartbeat)}\n\n`);
            usersStreams[userId].lastInteraction = Date.now()
        }, interval);

        req.on("close", function () {
            let userId = getUserId(req);
            console.log(`*** Close. userId: "${userId}"`);
            // Breaks the interval loop on client disconnected
            clearInterval(intervalId);
            // Remove from connections
            delete usersStreams[userId];
        });

        req.on("end", function () {
            let userId = getUserId(req);
            console.log(`*** End. userId: "${userId}"`);
        });
    });
}
