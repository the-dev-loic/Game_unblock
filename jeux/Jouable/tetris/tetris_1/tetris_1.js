// --- Configuration & Constants ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32; // px, used for calculation logic mainly

const SHAPES = {
    I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: 'bg-cyan-500' },
    J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: 'bg-blue-600' },
    L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: 'bg-orange-500' },
    O: { shape: [[1,1], [1,1]], color: 'bg-yellow-400' },
    S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: 'bg-green-500' },
    T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: 'bg-purple-500' },
    Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: 'bg-red-500' }
};

const SHAPE_KEYS = Object.keys(SHAPES);

// --- Game Class ---
class TetrisGame {
    constructor(playerId, boardId, nextId, scoreId, linesId, levelId) {
        this.playerId = playerId;
        this.boardElement = document.getElementById(boardId);
        this.nextElement = document.getElementById(nextId);
        this.scoreElement = document.getElementById(scoreId);
        this.linesElement = document.getElementById(linesId);
        this.levelElement = document.getElementById(levelId);

        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;

        this.currentPiece = null;
        this.nextPieceType = null;

        this.dropInterval = 1000;
        this.lastDropTime = 0;
        this.animationFrameId = null;

        this.initBoard();
        this.reset();
    }

    initBoard() {
        this.boardElement.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.id = `${this.playerId}-cell-${r}-${c}`;
                this.boardElement.appendChild(cell);
            }
        }
    }

    reset() {
        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.updateUI();
        this.nextPieceType = this.getRandomShape();
        this.spawnPiece();
        this.renderNext();
        this.clearBoardVisuals();
    }

    getRandomShape() {
        return SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    }

    spawnPiece() {
        const type = this.nextPieceType;
        this.nextPieceType = this.getRandomShape();
        this.renderNext();

        const shapeData = SHAPES[type];
        this.currentPiece = {
            type: type,
            shape: shapeData.shape,
            color: shapeData.color,
            x: Math.floor(COLS / 2) - Math.ceil(shapeData.shape[0].length / 2),
            y: 0
        };

        if (this.checkCollision(0, 0, this.currentPiece.shape)) {
            this.gameOver = true;
            endGame();
        }
    }

    renderNext() {
        this.nextElement.innerHTML = '';
        const shape = SHAPES[this.nextPieceType].shape;
        const color = SHAPES[this.nextPieceType].color;

        // Center in 4x4 grid
        const offsetX = Math.floor((4 - shape[0].length) / 2);
        const offsetY = Math.floor((4 - shape.length) / 2);

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.createElement('div');
                cell.classList.add('w-full', 'h-full', 'border', 'border-gray-800');

                // Check if part of shape
                const shapeR = r - offsetY;
                const shapeC = c - offsetX;

                if (shapeR >= 0 && shapeR < shape.length &&
                    shapeC >= 0 && shapeC < shape[0].length &&
                    shape[shapeR][shapeC]) {
                    cell.classList.add(color);
                    cell.classList.add('shadow-inner');
                }
                this.nextElement.appendChild(cell);
            }
        }
    }

    checkCollision(offsetX, offsetY, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = this.currentPiece.x + c + offsetX;
                    const newY = this.currentPiece.y + r + offsetY;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                    if (newY >= 0 && this.grid[newY][newX]) return true;
                }
            }
        }
        return false;
    }

    rotate() {
        const newShape = this.currentPiece.shape[0].map((val, index) =>
            this.currentPiece.shape.map(row => row[index]).reverse()
        );

        // Wall kick (basic)
        if (!this.checkCollision(0, 0, newShape)) {
            this.currentPiece.shape = newShape;
        } else if (!this.checkCollision(1, 0, newShape)) {
            this.currentPiece.x += 1;
            this.currentPiece.shape = newShape;
        } else if (!this.checkCollision(-1, 0, newShape)) {
            this.currentPiece.x -= 1;
            this.currentPiece.shape = newShape;
        }
    }

    move(dir) {
        if (!this.checkCollision(dir, 0, this.currentPiece.shape)) {
            this.currentPiece.x += dir;
        }
    }

    drop() {
        if (!this.checkCollision(0, 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
            return true;
        } else {
            this.lockPiece();
            return false;
        }
    }

    lockPiece() {
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
            for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                if (this.currentPiece.shape[r][c]) {
                    const y = this.currentPiece.y + r;
                    const x = this.currentPiece.x + c;
                    if (y >= 0) {
                        this.grid[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== 0)) {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                r++; // Check same row index again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            // Scoring: 100, 300, 500, 800
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;

            // Level up every 10 lines
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

            this.updateUI();
        }
    }

    updateUI() {
        this.scoreElement.innerText = this.score;
        this.linesElement.innerText = this.lines;
        this.levelElement.innerText = this.level;
    }

    clearBoardVisuals() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.getElementById(`${this.playerId}-cell-${r}-${c}`);
                cell.className = 'cell'; // Reset classes
            }
        }
    }

    draw() {
        // Clear board visuals first
        this.clearBoardVisuals();

        // Draw locked pieces
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c]) {
                    const cell = document.getElementById(`${this.playerId}-cell-${r}-${c}`);
                    cell.classList.add(this.grid[r][c], 'border-white', 'border-opacity-20');
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {
                        const y = this.currentPiece.y + r;
                        const x = this.currentPiece.x + c;
                        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                            const cell = document.getElementById(`${this.playerId}-cell-${y}-${x}`);
                            cell.classList.add(this.currentPiece.color, 'border-white', 'border-opacity-40');
                        }
                    }
                }
            }
        }
    }

    update(time) {
        if (this.gameOver || this.paused) return;

        if (time - this.lastDropTime > this.dropInterval) {
            this.drop();
            this.lastDropTime = time;
        }
        this.draw();
    }
}

// --- Global State & Control ---
let game1 = null;
let game2 = null;
let isRunning = false;
let animationFrameId = null;

function startGame(players) {
    document.getElementById('menu-overlay').classList.add('hidden');

    // Setup UI based on mode
    const p2Area = document.getElementById('p2-area');
    const p1Area = document.getElementById('p1-area');

    if (players === 2) {
        p2Area.classList.remove('hidden');
        p2Area.classList.add('flex');
        // Adjust layout for 2 players on smaller screens if needed,
        // but flex-row in parent handles most.
    } else {
        p2Area.classList.add('hidden');
        p2Area.classList.remove('flex');
    }

    // Initialize Games
    game1 = new TetrisGame('p1', 'p1-board', 'p1-next', 'p1-score', 'p1-lines', 'p1-level');

    if (players === 2) {
        game2 = new TetrisGame('p2', 'p2-board', 'p2-next', 'p2-score', 'p2-lines', 'p2-level');
    }

    isRunning = true;
    gameLoop(0);
}

function gameLoop(time) {
    if (!isRunning) return;

    if (game1) game1.update(time);
    if (game2) game2.update(time);

    if (!game1.gameOver && (!game2 || !game2.gameOver)) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);

    const modal = document.getElementById('game-over-modal');
    const scoresDiv = document.getElementById('final-scores');

    let html = `<p class="text-xl text-white">Joueur 1: ${game1.score}</p>`;
    if (game2) {
        html += `<p class="text-xl text-white">Joueur 2: ${game2.score}</p>`;

        // Determine winner
        if (game1.score > game2.score) {
            html += `<p class="text-green-400 mt-4">VAINQUEUR: JOUEUR 1</p>`;
        } else if (game2.score > game1.score) {
            html += `<p class="text-green-400 mt-4">VAINQUEUR: JOUEUR 2</p>`;
        } else {
            html += `<p class="text-yellow-400 mt-4">ÉGALITÉ !</p>`;
        }
    }

    scoresDiv.innerHTML = html;
    modal.classList.remove('hidden');
}

// --- Input Handling ---
document.addEventListener('keydown', (e) => {
    if (!isRunning) return;

    // Player 1 Controls (Arrows)
    if (game1 && !game1.gameOver) {
        switch(e.key) {
            case 'ArrowLeft': game1.move(-1); break;
            case 'ArrowRight': game1.move(1); break;
            case 'ArrowDown': game1.drop(); game1.lastDropTime = performance.now(); break;
            case 'ArrowUp': game1.rotate(); break;
        }
        game1.draw(); // Immediate redraw for responsiveness
    }

    // Player 2 Controls (WASD)
    if (game2 && !game2.gameOver) {
        switch(e.key.toLowerCase()) {
            case 'a': game2.move(-1); break;
            case 'd': game2.move(1); break;
            case 's': game2.drop(); game2.lastDropTime = performance.now(); break;
            case 'w': game2.rotate(); break;
        }
        game2.draw(); // Immediate redraw for responsiveness
    }
});
