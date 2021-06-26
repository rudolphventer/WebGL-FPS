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
var clients = [];

function handleMessage(message)
{
  broadcast(message);
  var messageJSON = JSON.parse(message);
    switch (messageJSON.action) {
        case "killPlayer":
          leaderBoard[messageJSON.attackerName].points += 1;
          leaderBoard[messageJSON.victimName].deaths += 1;
          var leaderBoardPacket = {leaderBoard}
          leaderBoardPacket.action = "leaderBoardUpdate";
          broadcast(JSON.stringify(leaderBoardPacket));
          break;
        case "connect":
          leaderBoard[messageJSON.playerName] = {name: messageJSON.playerName, points: 0, deaths: 0, heartbeats: 3};
          clients.push()
          break;
        case "isalive":
          leaderBoard[messageJSON.name].heartbeats = 1;
          clients.push()
          break;
        default:
          
      }
}

function broadcast(message)
{
  wss.clients.forEach(function(client) {
    client.send(message);
  });
}
function playerDisconnected() { 
  Object.keys(leaderBoard).map( (e, index)=> {
    if(leaderBoard[e].heartbeats < 1)
    {
      console.log(leaderBoard[e].name + " has disconnected")
      broadcast(JSON.stringify({action: "playerDisconnects", playerName: leaderBoard[e].name}))
      delete leaderBoard[e]
    }
    else
    leaderBoard[e].heartbeats -= 1
  })
  console.log(leaderBoard)
}

wss.on('connection', socket => { 
  socket.on('message', message => {
    handleMessage(message);
  });
  // socket.on('disconnect', e=>
  // {
  //   console.log("disconenct")
  //   broadcast(JSON.stringify({action: "isalive"}))
  //   setTimeout(playerDisconnected, 2000)
  // })
  
  
});

server.listen(process.env.PORT || 8080, () =>
  console.log('Visit http://127.0.0.1:'+(process.env.PORT || 8080))
);
