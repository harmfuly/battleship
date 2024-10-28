import WebSocket from 'ws';

const wsServer = new WebSocket.Server({ port: 8080 });

const rooms = {};
let clientId = 0;

wsServer.on('connection', (ws) => {
    console.log('New client connected');
    const currentClientId = clientId++;

    ws.on('message', (message) => {
        const msg = JSON.parse(message);

        switch (msg.type) {
            case 'reg':
                const response = {
                    type: 'reg',
                    data: { 
                        name: msg.data.name, 
                        index: currentClientId,
                        error: false, 
                        errorText: '' 
                    },
                    id: msg.id
                };
                ws.send(JSON.stringify(response));
                break;

            case 'create_room':
                const roomId = msg.data.roomId;
                if (!rooms[roomId]) {
                    rooms[roomId] = { players: [], state: 'waiting' };
                    const createResponse = {
                        type: 'create_room',
                        data: { roomId, success: true },
                        id: msg.id
                    };
                    ws.send(JSON.stringify(createResponse));
                } else {
                    const createResponse = {
                        type: 'create_room',
                        data: { roomId, success: false, errorText: 'Room already exists' },
                        id: msg.id
                    };
                    ws.send(JSON.stringify(createResponse));
                }
                break;

            case 'add_ships':
                const { roomId: roomForShips, ships } = msg.data; 
                if (rooms[roomForShips]) {
                    const room = rooms[roomForShips];
                    if (room.players.length < 2) { 
                        room.players.push({ clientId: currentClientId, ships });
                        const addResponse = {
                            type: 'add_ships',
                            data: { roomId: roomForShips, success: true },
                            id: msg.id
                        };
                        ws.send(JSON.stringify(addResponse));
                        
                        if (room.players.length === 2) {
                            room.state = 'started';
                            room.players.forEach(player => {
                                wsServer.clients.forEach(client => {
                                    if (client.readyState === WebSocket.OPEN && player.clientId === clientId) {
                                        client.send(JSON.stringify({
                                            type: 'game_started',
                                            data: { roomId: roomForShips },
                                            id: msg.id
                                        }));
                                    }
                                });
                            });
                        }
                    } else {
                        const addResponse = {
                            type: 'add_ships',
                            data: { roomId: roomForShips, success: false, errorText: 'Room is full' },
                            id: msg.id
                        };
                        ws.send(JSON.stringify(addResponse));
                    }
                } else {
                    const addResponse = {
                        type: 'add_ships',
                        data: { roomId: roomForShips, success: false, errorText: 'Room does not exist' },
                        id: msg.id
                    };
                    ws.send(JSON.stringify(addResponse));
                }
                break;

            case 'attack':
                const { targetRoomId, targetPosition } = msg.data; 
                if (rooms[targetRoomId]) {
                    const attackResponse = {
                        type: 'attack',
                        data: { roomId: targetRoomId, success: true, targetPosition },
                        id: msg.id
                    };
                    ws.send(JSON.stringify(attackResponse));
                } else {
                    const attackResponse = {
                        type: 'attack',
                        data: { roomId: targetRoomId, success: false, errorText: 'Room does not exist' },
                        id: msg.id
                    };
                    ws.send(JSON.stringify(attackResponse));
                }
                break;

            default:
                console.error(`Unknown message type: ${msg.type}`);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

export { wsServer };
