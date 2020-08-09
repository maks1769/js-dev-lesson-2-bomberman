const { v4: uuidv4 } = require('uuid');
const GameMap = require('./game-map');

module.exports = class Game {

    constructor() {
        this.id = uuidv4();
        this.players = [];
        this.createdAt = new Date();
        this.started = false;
        this.map = false;
        this.bombTimeout = 1.5;
    }

    hasFreePlaces() {
        return this.players.length < 4;
    }

    addPlayer(player) {

        this.players.push(player);

        player.emit('game-id', this.id);

        this.players.forEach(player => {
            player.emit('players-ready', this.players.length);
        });
    }

    createMap({height = 8, width = 9, boxPercentage = 60}) {
        const map = new GameMap({height, width});

        map.generatePlayerPositions(this.players);
        map.generateStonesAndBoxes(boxPercentage);
        this.map = map;

    }

    start() {
        this.started = new Date();

        this.players.forEach(player => {
            player.emit('game-started');
        });

        this.players.forEach(player => {
            player.bombs = 4;
            player.emit('bombs-changed', {bombs: 4});
        });

        this.players.forEach(player => {
            player.emit('map-changed', this.map);
        });
    }

    movePlayer(player, direction) {
        this.map.movePlayer(player, direction);

        this.players.forEach(player => {
            player.emit('map-changed', this.map);
        });
    }

    setPlayerBomb(player) {
        if ((player.bombs - 1) < 0) {
            return false;
        }
        this.map.addPlayerBomb(player);

        player.bombs--;
        player.emit('bombs-changed', {bombs: player.bombs});

        const bombPosition = this.map.playerPositions[player.conn.id];

        setTimeout(() => {

            player.bombs++;
            player.emit('bombs-changed', {bombs: player.bombs});

            this.map.addFire(bombPosition);
            this.players.forEach(player => {
                player.emit('map-changed', this.map);
            });

            for (let index in this.map.fire) {
                const [width, height] = this.map.fire[index];

                for(let connection in this.map.playerPositions) {
                    const [playerWidth, playerHeight] = this.map.playerPositions[connection];

                    if (playerWidth === width && playerHeight === height) {
                        this.killPlayerByConnection(connection);
                    }
                }
            }

            setTimeout(() => {
                this.map.clearFires();
                this.players.forEach(player => {
                    player.emit('map-changed', this.map);
                })
            }, 500);
        },this.bombTimeout * 1000);
    }

    killPlayerByConnection(connection) {
        this.players.forEach(player => {
            player.emit('player-died', connection);
        });

        this.players = this.players.filter(player => {
            if (player.conn.id === connection) {

                return false;
            }

            return true;
        });


        if (this.players.length === 1) {
            this.players.forEach(player => {
                player.emit('won');
            });
        }

    }
};
