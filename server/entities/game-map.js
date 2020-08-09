module.exports = class GameMap {
    constructor({height = 8, width = 8}) {
        this.players = [];
        this.playerPositions = {};
        this.bombs = {};
        this.stones = {};
        this.fire = {};
        this.boxes = {};
        this.bombRadius = 3;

        this.coordinates = [];
        for (let h = 0; h < height; ++h) {
            for (let w = 0; w < width; ++w) {
                if (typeof this.coordinates[w] === 'undefined') {
                    this.coordinates[w] = Array(height);
                }
                this.coordinates[w][h] = {
                    type: 'empty'
                };
            }
        }

        this.height = height;
        this.width = width;
    }

    generatePlayerPositions(players) {
        for (let index in players) {
            const player = players[index];

            switch (Number(index)) {
                case 0:
                    this.playerPositions[player.conn.id] = [0,0];
                    this.coordinates[0][0] = {
                        type: 'player',
                        id: player.conn.id,
                    };
                    break;
                case 1:
                    this.playerPositions[player.conn.id] = [0, this.height - 1];
                    this.coordinates[0][this.height - 1] = {
                        type: 'player',
                        id: player.conn.id,
                    };
                    break;
                case 2:
                    this.playerPositions[player.conn.id] = [this.width - 1, this.height - 1];
                    this.coordinates[this.width - 1][this.height - 1] = {
                        type: 'player',
                        id: player.conn.id,
                    };
                    break;
                case 3:
                    this.playerPositions[player.conn.id] = [this.width - 1, 0];
                    this.coordinates[this.width - 1][0] = {
                        type: 'player',
                        id: player.conn.id,
                    };
            }
        }
    }

    generateStonesAndBoxes(boxPercentage) {

        for(let w = 0; w < this.width; ++w) {
            for (let h = 0; h < this.height; ++h) {
                if (((h - 1) % 2) === 0 && ((w - 1) % 2) === 0) {
                    this.addStonePosition(w, h);
                } else {
                    if (! this.inPlayerRadius(w, h) && this.isGenerateBox(boxPercentage)) {
                        this.addBoxPosition(w, h);
                    }
                }
            }
        }
    }

    addStonePosition(width, height) {
        this.stones[`${width}x${height}`] = [width, height];
        this.coordinates[width][height] = {
            type: 'stone'
        };
    }

    inPlayerRadius(width, height) {
        if ((width <= 2 || width >= 7) && (height === 0 || height === 8)) {
            return true;
        }

        return true;
    }

    isGenerateBox(percentage) {
        const randomInteger = (min, max) => {
            let rand = min - 0.5 + Math.random() * (max - min + 1);
            return Math.round(rand);
        };

        return randomInteger(1, 100) <= percentage;
    }

    addBoxPosition(width, height) {
        this.boxes[`${width}x${height}`] = [width, height];
        this.coordinates[width][height] = {
            type: 'box'
        }
    }

    movePlayer(player, direction) {
        const [currentWidth, currentHeight] = this.playerPositions[player.conn.id];
        let newWidth = currentWidth;
        let newHeight = currentHeight;

        switch (direction) {
            case 'right':
                newHeight+= 1;
                break;

            case 'left':
                newHeight-= 1;
                break;

            case 'up':
                newWidth-= 1;
                break;

            case 'down':
                newWidth+= 1;
                break;
        }

        // console.log([currentWidth, currentHeight, player.conn.id]);
        // console.log([newWidth, newHeight, direction]);
        // console.log(this.width, this.height);

        if (newWidth < 0 || newWidth > (this.width - 1)) {
            return false;
        }

        if (newHeight < 0 || newHeight > (this.height - 1)) {
            return false;
        }

        const nextPositionItem = this.coordinates[newWidth][newHeight].type;

        if (nextPositionItem !== 'empty') {
            return false;
        }

        this.coordinates[newWidth][newHeight] = {type: 'player', id: player.conn.id};
        this.coordinates[currentWidth][currentHeight] = typeof this.bombs[`${currentWidth}x${currentHeight}`] !== 'undefined'
            ?   {type: 'bomb'}
            :   {type: 'empty'}
        ;
        this.playerPositions[player.conn.id] = [newWidth, newHeight];
    }

    addPlayerBomb(player) {
        const [currentWidth, currentHeight] = this.playerPositions[player.conn.id];
        this.bombs[`${currentWidth}x${currentHeight}`] = [currentWidth, currentHeight];
    }

    addFire(bombPosition) {
        const [width, height] = bombPosition;
        this.fire[`${width}x${height}`] = bombPosition;
        delete this.bombs[`${width}x${height}`];
        this.coordinates[width][height] = {type: 'fire'};

        for (let i = 0; i < this.bombRadius; ++i) {
            let x = width + i;
            if (x >= 0 && x <= (this.width - 1)) {
                if (typeof this.stones[`${x}x${height}`] === 'undefined') {
                    this.fire[`${x}x${height}`] = [x, height];
                    this.coordinates[x][height] = {type: 'fire'};
                }
            }
        }

        for (let i = 0; i < this.bombRadius; ++i) {
            let x = width - i;
            if (x >= 0 && x <= (this.width - 1)) {
                if (typeof this.stones[`${x}x${height}`] === 'undefined') {
                    this.fire[`${x}x${height}`] = [x, height];
                    this.coordinates[x][height] = {type: 'fire'};
                }
            }
        }

        for (let i = 0; i < this.bombRadius; ++i) {
            let y = height + i;
            if (y >= 0 && y <= (this.height - 1)) {
                if (typeof this.stones[`${width}x${y}`] === 'undefined') {
                    this.fire[`${width}x${y}`] = [width, y];
                    this.coordinates[width][y] = {type: 'fire'};
                }
            }
        }

        for (let i = 0; i < this.bombRadius; ++i) {
            let y = height - i;
            if (y >= 0 && y <= (this.height - 1)) {
                if (typeof this.stones[`${width}x${y}`] === 'undefined') {
                    this.fire[`${width}x${y}`] = [width, y];
                    this.coordinates[width][y] = {type: 'fire'};
                }
            }
        }
    }

    clearFires() {
        for (let index in this.coordinates) {
            for (let key in this.coordinates[index]) {
                if (this.coordinates[index][key].type === 'fire') {
                    this.coordinates[index][key].type = 'empty';
                }
            }
        }
    }
};
