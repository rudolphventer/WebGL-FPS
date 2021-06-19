const express = require('express')
const app = express()
const path = require('path')
const http = require('http');
//var server = http.createServer(app);
//const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/modules/', express.static(path.join(__dirname, 'node_modules')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

// //Whenever someone connects this gets executed
// io.on('connection', function(socket) {
//   console.log('A user connected');

//   //Whenever someone disconnects this piece of code executed
//   socket.on('disconnect', function () {
//      console.log('A user disconnected');
//   });
// });



const WebSocket = require('ws')
const server = new WebSocket.Server({ port: '9000' })

//Game logic
const leaderBoard = {};

function handleMessage(message)
{
  var messageJSON = JSON.parse(message);
    switch (messageJSON.action) {
        case "killPlayer":
          leaderBoard[messageJSON.attackerName].points += 1;
          leaderBoard[messageJSON.victimName].deaths += 1;
          var leaderBoardPacket = {leaderBoard}
          leaderBoardPacket.action = "leaderBoardUpdate";
          broadcast(JSON.stringify(leaderBoardPacket));
          broadcast(message);
          break;
        case "connect":
          broadcast(message);
          leaderBoard[messageJSON.playerName] = {name: messageJSON.playerName, points: 0, deaths: 0};
          break;
        default:
          broadcast(message);
      }
}

function broadcast(message)
{
  server.clients.forEach(function(client) {
    client.send(message);
  });
}

server.on('connection', socket => { 
  socket.on('message', message => {
    
    console.log(JSON.parse(message))
    //socket.send(`Roger that! ${message}`);
    handleMessage(message);
  });
  
});


app.listen(8080, () =>
  console.log('Visit http://127.0.0.1:8080')
);