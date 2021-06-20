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

const server = http.createServer(app);

const WebSocket = require('ws')
const wss = new WebSocket.Server({ server })


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
  wss.clients.forEach(function(client) {
    client.send(message);
  });
}

wss.on('connection', socket => { 
  socket.on('message', message => {
    
    //console.log(JSON.parse(message))
    //socket.send(`Roger that! ${message}`);
    handleMessage(message);
  });
  
});

server.listen(process.env.PORT || 8080, () =>
  console.log('Visit http://127.0.0.1:'+(process.env.PORT || 8080))
);
