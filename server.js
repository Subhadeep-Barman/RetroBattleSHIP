var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var BattleshipGame = require('./app/game.js');
var GameStatus = require('./app/gameStatus.js');

var port = 8900;

var users = {};
var gameIdCounter = 1;

var rooms = {};
var roomIdCounter = 1; 

app.use(express.static(__dirname + '/public'));

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.on('connection', function(socket) {
  console.log((new Date().toISOString()) + ' ID ' + socket.id + ' connected.');

  // create user object for additional data
  users[socket.id] = {
    inGame: null,
    player: null,
    room: null
  };

  // join lobby
  socket.join('lobby');

  // send current room list to the connected client
  io.to(socket.id).emit('roomList', listRooms());

  /**
   * Handle chat messages
   */
  socket.on('chat', function(msg) {
    if(users[socket.id].inGame !== null && msg) {
      console.log((new Date().toISOString()) + ' Chat message from ' + socket.id + ': ' + msg);
      
      // Send message to opponent
      socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
        name: 'Opponent',
        message: entities.encode(msg),
      });

      // Send message to self
      io.to(socket.id).emit('chat', {
        name: 'Me',
        message: entities.encode(msg),
      });
    }
  });

  /**
   * Handle shot from client
   */
  socket.on('shot', function(position) {
    var game = users[socket.id].inGame, opponent;

    if(game !== null) {
      // Is it this users turn?
      if(game.currentPlayer === users[socket.id].player) {
        opponent = game.currentPlayer === 0 ? 1 : 0;

        if(game.shoot(position)) {
          // Valid shot
          checkGameOver(game);

          // Update game state on both clients.
          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });
  
  /**
   * Handle leave game request
   */
  socket.on('leave', function() {
    if(users[socket.id].inGame !== null) {
      leaveGame(socket);

      socket.join('waiting room');
      joinWaitingPlayers();
    }
  });

  /**
   * Handle client disconnect
   */
  socket.on('disconnect', function() {
    console.log((new Date().toISOString()) + ' ID ' + socket.id + ' disconnected.');
    
    leaveGame(socket);
    leaveRoomBySocket(socket);

    delete users[socket.id];
  });

  // Lobby / Room events
  socket.on('createRoom', function(data, cb) {
    var room = createRoom(data && data.name, data && data.capacity || 2, socket.id, data && data.isPublic);
    socket.join('room' + room.id);
    users[socket.id].room = room.id;
    io.emit('roomUpdate', listRooms());
    if(cb) cb({success:true, room:{id:room.id, name:room.name, players:room.players.slice(), capacity:room.capacity}});
  });

  socket.on('listRooms', function(cb) {
    if(cb) cb(listRooms());
  });

  socket.on('joinRoom', function(roomId, cb) {
    var result = joinRoomById(roomId, socket);
    if(cb) cb(result);
  });

  socket.on('leaveRoom', function(roomId, cb) {
    var result = leaveRoomById(roomId, socket);
    if(cb) cb(result);
  });

  socket.on('startGame', function(roomId, cb) {
    var result = startGameFromRoom(roomId, socket);
    if(cb) cb(result);
  });

  joinWaitingPlayers();
});

/**
 * Create games for players in waiting room
 */
function joinWaitingPlayers() {
  var players = getClientsInRoom('waiting room');
  
  if(players.length >= 2) {
    // 2 player waiting. Create new game!
    var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

    // create new room for this game
    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.id);
    players[1].join('game' + game.id);

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;
    
    io.to('game' + game.id).emit('join', game.id);

    // send initial ship placements
    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

    console.log((new Date().toISOString()) + " " + players[0].id + " and " + players[1].id + " have joined game ID " + game.id);
  }
}

/**
 * Leave user's game
 * @param {type} socket
 */
function leaveGame(socket) {
  if(users[socket.id].inGame !== null) {
    console.log((new Date().toISOString()) + ' ID ' + socket.id + ' left game ID ' + users[socket.id].inGame.id);

    // Notifty opponent
    socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {
      message: 'Opponent has left the game'
    });

    if(users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
      // Game is unfinished, abort it.
      users[socket.id].inGame.abortGame(users[socket.id].player);
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.id);

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

/**
 * Notify players if game over.
 * @param {type} game
 */
function checkGameOver(game) {
  if(game.gameStatus === GameStatus.gameOver) {
    console.log((new Date().toISOString()) + ' Game ID ' + game.id + ' ended.');
    io.to(game.getWinnerId()).emit('gameover', true);
    io.to(game.getLoserId()).emit('gameover', false);
  }
}

/**
 * Find all sockets in a room
 * @param {type} room
 * @returns {Array}
 */
function getClientsInRoom(room) {
  var clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}

/**
 * Room management helpers
 */
function listRooms() {
  var list = [];
  for (var id in rooms) {
    var r = rooms[id];
    list.push({ id: r.id, name: r.name, players: r.players.slice(), playerCount: r.players.length, capacity: r.capacity, isPublic: r.isPublic, hostId: r.hostId });
  }
  return list;
}

function createRoom(name, capacity, hostId, isPublic) {
  var id = roomIdCounter++;
  rooms[id] = {
    id: id,
    name: name || ('Room ' + id),
    players: [hostId],
    capacity: capacity || 2,
    isPublic: isPublic !== false,
    hostId: hostId
  };
  return rooms[id];
}

function joinRoomById(roomId, socket) {
  var room = rooms[roomId];
  if(!room) return {success:false, error:'Room not found'};
  if(room.players.indexOf(socket.id) !== -1) return {success:true, room:room};
  if(room.players.length >= room.capacity) return {success:false, error:'Room is full'};
  room.players.push(socket.id);
  socket.join('room' + roomId);
  users[socket.id].room = roomId;
  io.to('room' + roomId).emit('roomUpdate', {room: {id: room.id, name: room.name, players: room.players.slice(), capacity: room.capacity, hostId: room.hostId}});
  io.emit('roomUpdate', listRooms());

  // Auto-start game when room reaches capacity
  if (room.players.length >= room.capacity) {
    startGameFromRoom(roomId, null, true);
  }

  return {success:true, room:room};
}

function leaveRoomById(roomId, socket) {
  var room = rooms[roomId];
  if(!room) return {success:false, error:'Room not found'};
  var idx = room.players.indexOf(socket.id);
  if(idx !== -1) room.players.splice(idx,1);
  socket.leave('room' + roomId);
  users[socket.id].room = null;
  if(room.players.length === 0) {
    delete rooms[roomId];
    io.emit('roomUpdate', listRooms());
    return {success:true, message:'Room deleted'};
  }
  if(room.hostId === socket.id) {
    room.hostId = room.players[0];
  }
  io.to('room' + roomId).emit('roomUpdate', {room: {id: room.id, name: room.name, players: room.players.slice(), capacity: room.capacity, hostId: room.hostId}});
  io.emit('roomUpdate', listRooms());
  return {success:true, room:room};
}

function leaveRoomBySocket(socket) {
  if(users[socket.id] && users[socket.id].room) {
    leaveRoomById(users[socket.id].room, socket);
  }
}

function startGameFromRoom(roomId, socket, force) {
  var room = rooms[roomId];
  if(!room) return {success:false, error:'Room not found'};
  if(!force && (!socket || room.hostId !== socket.id)) return {success:false, error:'Only host can start the game'};
  if(room.players.length < 2) return {success:false, error:'Not enough players to start'};

  var p1 = room.players[0];
  var p2 = room.players[1];
  var game = new BattleshipGame(gameIdCounter++, p1, p2);

  // move players from room into game room and set user game state
  [p1, p2].forEach(function(pid, idx) {
    var sock = io.sockets.adapter.nsp.connected[pid];
    if(sock) {
      try {
        sock.leave('room' + roomId);
      } catch(e) {}
      try {
        sock.join('game' + game.id);
      } catch(e) {}
    }
    users[pid].player = idx;
    users[pid].inGame = game;
  });

  delete rooms[roomId];
  io.emit('roomUpdate', listRooms());

  io.to('game' + game.id).emit('join', game.id);

  // send initial ship placements
  io.to(p1).emit('update', game.getGameState(0, 0));
  io.to(p2).emit('update', game.getGameState(1, 1));

  console.log((new Date().toISOString()) + " " + p1 + " and " + p2 + " have joined game ID " + game.id);

  return {success:true, gameId:game.id};
}
