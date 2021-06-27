const express = require('express')
const app = express()
const path = require('path')
const http = require('http');
const { Server } = require("socket.io");

//var server = http.createServer(app);
//const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/modules/', express.static(path.join(__dirname, 'node_modules')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

const server = http.createServer(app);

const io = new Server(server);

//const WebSocket = require('ws')
//const wss = new WebSocket.Server({ server })


//Game logic
const leaderBoard = {};
var clients = [];
var leaderBoardPacket;

function sendLeaderboardUpdate()
{
  leaderBoardPacket = {leaderBoard}
  leaderBoardPacket.action = "leaderBoardUpdate";
  broadcast(JSON.stringify(leaderBoardPacket));
}

function handleMessage(message)
{
  broadcast(message);
  var messageJSON = JSON.parse(message);
    switch (messageJSON.action) {
        case "killPlayer":
          leaderBoard[messageJSON.attackerName].points += 1;
          leaderBoard[messageJSON.victimName].deaths += 1;
          sendLeaderboardUpdate();
          break;
        case "connect":
          leaderBoard[messageJSON.playerName] = {name: messageJSON.playerName, points: 0, deaths: 0, heartbeats: 1};
          sendLeaderboardUpdate();
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
  io.emit("message",message)
}
function playerDisconnected() { 
  console.log(leaderBoard)
  Object.keys(leaderBoard).map( (e, index)=> {
    console.log(leaderBoard[e].name + leaderBoard[e].heartbeats)
    if(leaderBoard[e].heartbeats == 0)
    {
      console.log(leaderBoard[e].name + " has disconnected")
      broadcast(JSON.stringify({action: "playerDisconnects", playerName: leaderBoard[e].name}))
      delete leaderBoard[e]
      sendLeaderboardUpdate();
    }
  })
  console.log(leaderBoard)
}

io.on('connection', socket => { 
  socket.onAny((eventName, message) => {
    handleMessage(message);
  });
  socket.on('disconnect', function(){
    // Send isalive
    broadcast(JSON.stringify({action: "isalive"}))
    // Zero everyone's heartbeats
    Object.keys(leaderBoard).map( (e, index)=> {
      leaderBoard[e].heartbeats = 0
    })
    // Wait a time for responses and thencheck who is alive
    setTimeout(playerDisconnected, 1000)
});
  
});

server.listen(process.env.PORT || 8080, () =>
  console.log('Visit http://127.0.0.1:'+(process.env.PORT || 8080))
);
