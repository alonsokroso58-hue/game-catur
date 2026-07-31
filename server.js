const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// 1. TAMBAHKAN CORS DI SINI
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
  console.log('User terhubung:', socket.id);

  socket.on('joinRoom', (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length >= 2) {
      socket.emit('roomFull');
      return;
    }

    rooms[roomId].push(socket.id);
    socket.join(roomId);

    const color = rooms[roomId].length === 1 ? 'w' : 'b';
    socket.emit('initGame', { color, roomId });

    if (rooms[roomId].length === 2) {
      io.to(roomId).emit('startGame');
    }
  });

  socket.on('makeMove', (data) => {
    socket.to(data.roomId).emit('moveMade', data.move);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('playerLeft');
      }
    }
  });
});

// 2. GUNAKAN process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
