const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static assets in production mode
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Dots and Boxes Multiplayer Server is running.');
  });
}

// In-memory state
const rooms = new Map(); // roomId -> roomState

// Helper to generate a unique 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused chars like I, O, 0, 1
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Helper to count completed boxes on a move on the server
function checkBoxCompletion(room, type, r, c) {
  const size = room.gridSize;
  const hLines = room.board.hLines;
  const vLines = room.board.vLines;
  const completed = [];

  if (type === 'h') {
    // Box above line
    if (r > 0) {
      const topRow = r - 1;
      if (hLines[topRow][c] && vLines[topRow][c] && vLines[topRow][c + 1]) {
        completed.push({ row: topRow, col: c });
      }
    }
    // Box below line
    if (r < size) {
      const bottomRow = r;
      if (hLines[bottomRow + 1][c] && vLines[bottomRow][c] && vLines[bottomRow][c + 1]) {
        completed.push({ row: bottomRow, col: c });
      }
    }
  } else {
    // Box left of line
    if (c > 0) {
      const leftCol = c - 1;
      if (vLines[r][leftCol] && hLines[r][leftCol] && hLines[r + 1][leftCol]) {
        completed.push({ row: r, col: leftCol });
      }
    }
    // Box right of line
    if (c < size) {
      const rightCol = c;
      if (vLines[r][rightCol + 1] && hLines[r][rightCol] && hLines[r + 1][rightCol]) {
        completed.push({ row: r, col: rightCol });
      }
    }
  }
  return completed;
}

// Helper to check if the board is completely filled
function isBoardComplete(room) {
  const size = room.gridSize;
  const hLines = room.board.hLines;
  const vLines = room.board.vLines;
  
  for (let r = 0; r <= size; r++) {
    for (let c = 0; c < size; c++) {
      if (!hLines[r][c]) return false;
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size; c++) {
      if (!vLines[r][c]) return false;
    }
  }
  return true;
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);



  // Handle Friend Room Creation
  socket.on('create_room', ({ name, color, gridSize }) => {
    const code = generateRoomCode();
    const size = parseInt(gridSize, 10) || 5;

    const roomState = {
      id: code,
      type: 'friend',
      players: [
        { id: socket.id, name: name, color: color }
      ],
      gridSize: size,
      currentPlayer: 0,
      board: {
        hLines: Array(size + 1).fill().map(() => Array(size).fill(false)),
        vLines: Array(size).fill().map(() => Array(size + 1).fill(false)),
        boxes: Array(size).fill().map(() => Array(size).fill(null))
      },
      scores: [0, 0],
      isGameOver: false,
      rematchRequests: new Set()
    };

    rooms.set(code, roomState);
    socket.join(code);
    console.log(`Friend room created: ${code} by ${name}`);

    socket.emit('room_created', {
      roomId: code,
      playerIndex: 0,
      players: roomState.players,
      gridSize: roomState.gridSize
    });
  });

  // Handle Friend Room Joining
  socket.on('join_room', ({ roomId, name, color }) => {
    const code = (roomId || '').toUpperCase().trim();
    const roomState = rooms.get(code);

    if (!roomState) {
      socket.emit('error_message', 'Room not found. Please verify the code.');
      return;
    }

    if (roomState.players.length >= 2) {
      socket.emit('error_message', 'This room is already full.');
      return;
    }

    // Add player
    roomState.players.push({ id: socket.id, name: name, color: color });
    socket.join(code);
    console.log(`Player ${name} joined room ${code}`);

    socket.emit('room_joined', {
      roomId: code,
      playerIndex: 1,
      players: roomState.players,
      gridSize: roomState.gridSize
    });

    // Notify host & start game
    io.to(code).emit('game_start', {
      roomId: code,
      players: roomState.players,
      gridSize: roomState.gridSize,
      currentPlayer: roomState.currentPlayer,
      scores: roomState.scores,
      isMatchmaker: false
    });
  });

  // Handle Line Placements
  socket.on('make_move', ({ roomId, type, r, c }) => {
    const room = rooms.get(roomId);
    if (!room || room.isGameOver) return;

    const currentTurnPlayer = room.players[room.currentPlayer];
    if (!currentTurnPlayer || currentTurnPlayer.id !== socket.id) {
      console.warn(`Unauthorized move attempt by socket ${socket.id} in room ${roomId}`);
      return;
    }

    // Double click check on server side
    if (type === 'h') {
      if (room.board.hLines[r][c]) return;
      room.board.hLines[r][c] = true;
    } else {
      if (room.board.vLines[r][c]) return;
      room.board.vLines[r][c] = true;
    }

    const completedBoxes = checkBoxCompletion(room, type, r, c);
    
    if (completedBoxes.length > 0) {
      // Reward points
      completedBoxes.forEach(box => {
        room.board.boxes[box.row][box.col] = room.currentPlayer;
      });
      room.scores[room.currentPlayer] += completedBoxes.length;

      // Check if board complete
      if (isBoardComplete(room)) {
        room.isGameOver = true;
      }
    } else {
      // Toggle player index
      room.currentPlayer = room.currentPlayer === 0 ? 1 : 0;
    }

    io.to(roomId).emit('move_made', {
      type: type,
      r: r,
      c: c,
      currentPlayer: room.currentPlayer,
      scores: room.scores,
      isGameOver: room.isGameOver,
      boxesCaptured: completedBoxes.map(b => ({ r: b.row, c: b.col }))
    });
  });

  // Handle Rematch Requests
  socket.on('rematch_request', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.rematchRequests.add(socket.id);
    
    // Notify room of rematch request
    socket.to(roomId).emit('rematch_requested', { playerId: socket.id });

    // If both players have opted in, reset board state and restart
    if (room.rematchRequests.size >= 2) {
      const size = room.gridSize;
      room.board = {
        hLines: Array(size + 1).fill().map(() => Array(size).fill(false)),
        vLines: Array(size).fill().map(() => Array(size + 1).fill(false)),
        boxes: Array(size).fill().map(() => Array(size).fill(null))
      };
      room.scores = [0, 0];
      room.currentPlayer = 0;
      room.isGameOver = false;
      room.rematchRequests.clear();

      io.to(roomId).emit('game_start', {
        roomId: roomId,
        players: room.players,
        gridSize: room.gridSize,
        currentPlayer: room.currentPlayer,
        scores: room.scores,
        isMatchmaker: room.type === 'matchmaking'
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    


    // Check all rooms
    for (const [roomId, room] of rooms.entries()) {
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      if (pIndex !== -1) {
        // Player disconnected from this active room. Notify the remaining player.
        socket.to(roomId).emit('opponent_disconnected', {
          msg: `${room.players[pIndex].name} disconnected.`
        });
        // Remove room
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted due to player disconnect.`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
