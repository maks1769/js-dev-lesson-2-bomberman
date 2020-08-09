const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const GameStore = require('./entities/game-store');
const gameStore = new GameStore();

server.listen(port, host, () => {
    console.log('Server listening at %s:%d', host, port);
});

app.use(express.static(path.join(__dirname, '../client')));

let users = [];

const getUserInfo = (socket) => {
    return {
        id: socket.conn.id,
        username: socket.handshake.query.username,
        // battery: socket.handshake.query.battery,
        // network: socket.handshake.query.network
    }
};

io.on('connection', (socket) => {
    users.push(socket);

    io.sockets.emit('users-online', users.map(getUserInfo));

    const game = gameStore.getLatestWithFreePlaces();

    game.addPlayer(socket);

    if (game.hasFreePlaces() === false) {
        game.createMap({
            width: 8,
            height: 9,
            boxPercentage: 60
        });
        game.start();
    }


    socket.on('move', (direction) => {
        game.movePlayer(socket, direction);
    });

    socket.on('set-bomb', () => {
         game.setPlayerBomb(socket);
    });

    socket.on('new-message', (payload) => {
        socket.broadcast.emit('new-message', {
            ...getUserInfo(socket),
            payload
        })
    });

    socket.on('user-info-changed', (payload) => {
        socket.broadcast.emit('user-info-changed', {
            ...getUserInfo(socket),
            payload
        });
    });

    socket.on('disconnect', (info) => {
        users = users.filter(user => user.id !== socket.conn.id);

        socket.broadcast.emit('user-disconnected', getUserInfo(socket));
    });
});
