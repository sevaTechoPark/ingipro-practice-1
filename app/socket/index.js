const store = require('../store');

module.exports = function (server) {
    const io = require('socket.io').listen(server, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    io.sockets.on('connection', (socket) => {

        socket
            .on('main', ({type, payload}) => {

                if (!(/^[a-zA-Z]:[a-zA-Z]*$/.test(type))) {
                    throw new Error('Wrong type');
                }

                switch (type) {
                    case 'user:join':
                        const data = store.userAdd(payload.name);
                        socket.id = data.userList[data.userList.length - 1].userId;
                        socket.emit('main', {
                            type: 'conference:sync',
                            payload: data,
                        });
                        socket.broadcast.emit('main', {
                            type: 'conference:join',
                            payload: data.userList[data.userList.length - 1],
                        });
                        break;
                    case 'canvas:lock':
                        if (store.lock(payload.userId)) {
                            socket.emit('main', {type: 'lock:accept'});
                        } else {
                            socket.emit('main', {type: 'lock:denied'});
                        }
                        io.emit('main', {
                            type: 'conference:lock',
                            payload: store.getUser(payload.userId),
                        });
                        break;
                    case 'canvas:unlock':
                        store.unlock(payload.userId);
                        io.emit('main', {
                            type: 'conference:unlock',
                        });
                        break;
                    default:
                        if (store.addData(type, payload)) {
                            socket.broadcast.emit('main', {type: payload});
                        } else {
                            socket.emit('main', {type: 'access:denied'});
                        }
                }
            })
            .on('disconnect', () => {
                const user = store.userDel(socket.id);
                socket.broadcast.emit('main', {
                    type: 'conference:leave',
                    payload: user,
                });
            })
            .on('error', (eror) => {
                socket.emit('server:error', eror);
            });
    });

    return io;
};
