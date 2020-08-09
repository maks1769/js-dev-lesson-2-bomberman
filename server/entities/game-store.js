const Game = require('./game');

module.exports = class GameStore {

    constructor() {
        this.games = [];
    }

    getLatestWithFreePlaces() {
        let game = this.games.length > 0 ? this.games[this.games.length - 1] : false;

        if (game && game.hasFreePlaces()) {
            return game;
        }

        this.games.push(game = new Game());

        return game;
    }
}
