import WebSocket from 'ws';

const wsServer = new WebSocket.Server({ port: 8080 });

wsServer.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const msg = JSON.parse(message);

        switch (msg.type) {
            case 'reg':
                const response = {
                    type: 'reg',
                    data: { 
                        name: msg.data.name, 
                        index: 'some_generated_index', 
                        error: false, 
                        errorText: '' 
                    },
                    id: msg.id
                };
                ws.send(JSON.stringify(response));
                break;

            case 'create_room':
               
                break;

            case 'add_ships':
          
                break;

            case 'attack':
        
                break;

            
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

export { wsServer };
