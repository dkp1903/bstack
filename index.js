const fs = require('fs'),
    port = 8000,
    express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    os = require('os'),
    buf = new Buffer(4096);

let files = []
server.listen(port);

app.use(express.static(__dirname + '/public'));

app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendfile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});

app.get('/files/:filename', (req, res) => {
    res.sendfile(__dirname + '/public/index.html');
})

process.argv.splice(2).forEach((filename) => {
    'use strict';
    fs.open(filename, 'r', (e, fd) => {
        if(e) {
            console.error('Error in : ', filename);
            return;
        }

        files.push(filename);

        let sockIdentifier = '/files/' + (files.length);
        console.log(sockIdentifier)
        let socket = io.of(sockIdentifier)
                                .on('connection', (socket) => {
                                    socket.emit('files', files);
                                });

        console.log('Listn : ' + sockIdentifier + ':' + filename);
                                
        fs.watchFile(filename, (current, previous) => {
                let lenUpdated = current.size - previous.size;
                let formerSize = previous.size;
                console.log("lenupt: " + lenUpdated)
                if(lenUpdated > 0) {
                    fs.read(fd, buf, 0, lenUpdated, formerSize, (e, bytesRead, buffer) => {
                        if(e) {
                            console.error(e);
                            return;
                        }

                        let message = buffer.toString('utf8', 0, bytesRead);
                        socket.emit('message', message);
                    });
                } else {
                    console.log(current);
                }
        });
    });
});

console.log('Liten :  ' + port);

io.sockets.on(('connection'), (socket) => {
        "use strict";

        socket.emit('files', files);
});