const socket = io('https://game-catur-production.up.railway.app');
let board = null;
let game = new Chess();
let playerColor = 'w';
let currentRoom = '';
let gameStarted = false;

let whiteTime = 300;
let blackTime = 300;
let timerInterval = null;

const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const lobby = document.getElementById('lobby');
const gameArea = document.getElementById('gameArea');
const statusEl = document.getElementById('status');
const roomDisplay = document.getElementById('roomDisplay');
const moveLog = document.getElementById('moveLog');

joinBtn.addEventListener('click', () => {
  const room = roomInput.value.trim().toUpperCase();
  if (room) {
    currentRoom = room;
    socket.emit('joinRoom', room);
  }
});

socket.on('initGame', (data) => {
  playerColor = data.color;
  roomDisplay.innerText = `Kamar: ${data.roomId} (${playerColor === 'w' ? 'Putih' : 'Hitam'})`;
  lobby.classList.add('hidden');
  gameArea.classList.remove('hidden');
  initBoard();
});

socket.on('startGame', () => {
  gameStarted = true;
  statusEl.innerText = 'Game Dimulai! Giliran Putih.';
  startTimer();
});

socket.on('moveMade', (move) => {
  game.move(move);
  board.position(game.fen());
  appendMoveLog(move);
  updateStatus();
});

socket.on('roomFull', () => alert('Kamar ini sudah penuh!'));
socket.on('playerLeft', () => {
  alert('Lawan keluar dari permainan!');
  clearInterval(timerInterval);
});

function initBoard() {
  const config = {
    draggable: true,
    position: 'start',
    orientation: playerColor === 'w' ? 'white' : 'black',
    onDragStart: (source, piece) => {
      if (!gameStarted || game.game_over()) return false;
      if (game.turn() !== playerColor) return false;
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    },
    onDrop: (source, target) => {
      const move = game.move({ from: source, to: target, promotion: 'q' });
      if (move === null) return 'snapback';

      socket.emit('makeMove', { roomId: currentRoom, move });
      appendMoveLog(move);
      updateStatus();
    },
    onSnapEnd: () => board.position(game.fen())
  };
  board = Chessboard('board', config);
}

function updateStatus() {
  let moveColor = game.turn() === 'b' ? 'Hitam' : 'Putih';
  if (game.in_checkmate()) {
    statusEl.innerText = `SKAKMAT! ${moveColor} Kalah.`;
    clearInterval(timerInterval);
  } else if (game.in_draw()) {
    statusEl.innerText = 'Game Remis (Draw)!';
    clearInterval(timerInterval);
  } else {
    statusEl.innerText = `Giliran: ${moveColor}${game.in_check() ? ' (SKAK!)' : ''}`;
  }
}

function appendMoveLog(move) {
  const logEntry = document.createElement('div');
  logEntry.className = 'log-item';
  logEntry.innerText = `${move.color === 'w' ? '⚪' : '⚫'} ${move.from} → ${move.to}`;
  moveLog.appendChild(logEntry);
  moveLog.scrollTop = moveLog.scrollHeight;
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!gameStarted || game.game_over()) return;

    if (game.turn() === 'w') {
      whiteTime--;
    } else {
      blackTime--;
    }

    updateTimerDisplay();

    if (whiteTime <= 0 || blackTime <= 0) {
      clearInterval(timerInterval);
      statusEl.innerText = whiteTime <= 0 ? 'Waktu Putih Habis!' : 'Waktu Hitam Habis!';
    }
  }, 1000);
}

function updateTimerDisplay() {
  const format = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const pTimer = playerColor === 'w' ? format(whiteTime) : format(blackTime);
  const oTimer = playerColor === 'w' ? format(blackTime) : format(whiteTime);

  document.getElementById('playerTimer').innerText = pTimer;
  document.getElementById('opponentTimer').innerText = oTimer;
}

function initBoard() {
  const config = {
    draggable: true,
    position: 'start',
    // TAMBAHKAN BARIS INI UNTUK MENGAMBIL GAMBAR BIDAK DARI CDN
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    
    orientation: playerColor === 'w' ? 'white' : 'black',
    onDragStart: (source, piece) => {
      if (!gameStarted || game.game_over()) return false;
      if (game.turn() !== playerColor) return false;
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    },
    onDrop: (source, target) => {
      const move = game.move({ from: source, to: target, promotion: 'q' });
      if (move === null) return 'snapback';

      socket.emit('makeMove', { roomId: currentRoom, move });
      appendMoveLog(move);
      updateStatus();
    },
    onSnapEnd: () => board.position(game.fen())
  };
  board = Chessboard('board', config);
}
