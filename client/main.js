document.addEventListener('DOMContentLoaded', (e) => {

    const render = (coordinates, socket) => {
        let content = '';

        coordinates.forEach(row => {

            content+= '<div class="map-row">';

            row.forEach(item => {
                const active = item.type === 'player' && item.id === socket.id ? 'active' : '';

                content+= `<div class="map-item map-item-${item.type} ${active}"></div>`;
            });

            content+= `</div><div class="clearfix"></div>`;
        });

        document.querySelector('#map').innerHTML = content;
    };

    document.querySelector('#btn-start').addEventListener('click', (e) => {
        e.preventDefault();

        const socket = io();

        document.querySelector('#start').innerHTML = '<h2>Waiting ...</h2>';

        socket.on('players-ready', (players) => {
            document.querySelector('#start').innerHTML = `
                <h2>Waiting ${players} / 4 ...</h2>
            `;
        });

        socket.on('game-started', () => {
            console.log(socket.id);
            document.querySelector('#start').innerHTML = `
                <h2>Game started!</h2>
            `;
        });

        socket.on('bombs-changed', (payload) => {
            document.querySelector('#bombs').innerText = payload.bombs;
        });

        socket.on('map-changed', (payload) => {
            render(payload.coordinates, socket);
        });

        socket.on('player-died', (connection) => {
            if (socket.id === connection) {
                document.querySelector('#start').innerHTML = `
                <h2>Game over!</h2>
            `;

                document.onkeydown = () => {};
            }
        });

        socket.on('won', () => {
            document.querySelector('#start').innerHTML = `
                <h2>Game over!</h2>
            `;

            document.onkeydown = () => {};
        });

        const movePlayerAction = (direction) => {
            socket.emit('move', direction);
        };

        const setBombAction = () => {
            socket.emit('set-bomb');
        };

        document.onkeydown = (e) => {

            switch (e.keyCode) {
                case 38:
                    return movePlayerAction('up');
                case 40:
                    return movePlayerAction('down');
                case 37:
                    return movePlayerAction('left');
                case 39:
                    return movePlayerAction('right');
                case 32:
                    return setBombAction();
            }
        }
    })

    /*chat code */
    const username = prompt('Как вас зовут?');

    const socket = io(`?username=${username}`);

    let users = [];

    const renderUsers = () => {
        const content = users.map(user => `<li>${user.username}</li>`).join('');

        document.querySelector('#users').innerHTML = content;
    };


    const renderMessage = (username, content) => {
        const htmlContent = `<li><strong>${username}</strong>: ${content}</li>`;

        document.querySelector('#messages').innerHTML+= htmlContent;
    };


    socket.on('users-online', (data) => {
        users = data;

        console.log(data);

        renderUsers();
    });

    document.querySelector('#btn-send-message').addEventListener('click', (event) => {
        event.preventDefault();

        const message = document.querySelector('#message').value;

        document.querySelector('#message').value = '';

        socket.emit('new-message', {
            message
        });

        renderMessage(username, message);
    });

    socket.on('new-message', (data) => {
        renderMessage(data.username, data.payload.message);
    })
});
