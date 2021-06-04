
//WEBSOCKETS

const { Server } = require("socket.io");

module.exports = class SocketHelper {

    constructor(httpsServer) {

        this.io = new Server(httpsServer, {});

        console.log("socket.io : " + this.io.httpServer.listening);

        this.io.on('connection', socket => {
            socket.on('hello', msg => {
                io.emit('welcome message', msg);
            });
        });
    }

};
