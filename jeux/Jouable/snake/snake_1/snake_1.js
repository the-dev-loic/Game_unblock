class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // Size of one tile
        this.tileCount = this.canvas.width / this.gridSize;

        // Assets
        this.sprites = new Image();
        this.sprites.src = 'https://image.qwenlm.ai/public_source/762d6c91-581c-4697-8b31-0487abda3ed8/1228321f9-2231-4cf4-a583-36011af67f5f.png';
        this.spritesLoaded = false;
        this.sprites.onload = () => { this.spritesLoaded = true; };

        // State
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.speed = 7; // Moves per second
        this.lastRenderTime = 0;

        // Entities
        this.snake = [];
        this.velocity = { x: 0, y: 0 };
        this.inputQueue = [];
        this.food = { x: 5, y: 5 };

        // DOM Elements
        this.scoreEl = document.getElementById('scoreEl');
        this.highScoreEl = document.getElementById('highScoreEl');
        this.finalScoreEl = document.getElementById('finalScore');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');

        this.highScoreEl.innerText = this.highScore;

        // Bindings
        this.handleKeydown = this.handleKeydown.bind(this);
        this.gameLoop = this.gameLoop.bind(this);

        // Listeners
        document.addEventListener('keydown', this.handleKeydown);
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());

        this.resetState();
        this.draw(); // Initial draw
    }

    resetState() {
        this.snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        this.velocity = { x: 0, y: -1 };
        this.inputQueue = [];
        this.score = 0;
        this.speed = 7;
        this.placeFood();
        this.updateScore(0);
    }

    startGame() {
        this.resetState();
        this.gameRunning = true;
        this.gamePaused = false;
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        window.requestAnimationFrame(this.gameLoop);
    }

    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.pauseScreen.classList.remove('hidden');
        } else {
            this.pauseScreen.classList.add('hidden');
            this.lastRenderTime = performance.now(); // Reset timer to prevent jump
            window.requestAnimationFrame(this.gameLoop);
        }
    }

    gameOver() {
        this.gameRunning = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.highScoreEl.innerText = this.highScore;
        }
        this.finalScoreEl.innerText = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    handleKeydown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === ' ') {
            this.togglePause();
            return;
        }

        if (!this.gameRunning || this.gamePaused) return;

        this.inputQueue.push(e.key);
    }

    handleInput(key) {
        if (!this.gameRunning || this.gamePaused) return;
        this.inputQueue.push(key);
    }

    processInput() {
        if (this.inputQueue.length === 0) return;

        const key = this.inputQueue.shift();
        const goingUp = this.velocity.y === -1;
        const goingDown = this.velocity.y === 1;
        const goingRight = this.velocity.x === 1;
        const goingLeft = this.velocity.x === -1;

        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (!goingDown) this.velocity = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (!goingUp) this.velocity = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (!goingRight) this.velocity = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (!goingLeft) this.velocity = { x: 1, y: 0 };
                break;
        }
        // Process next input immediately if queue not empty (for quick turns)
        if (this.inputQueue.length > 0) this.processInput();
    }

    update() {
        this.processInput();

        const head = {
            x: this.snake[0].x + this.velocity.x,
            y: this.snake[0].y + this.velocity.y
        };

        // Wall Collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Self Collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore(this.score);
            this.speed = Math.min(20, 7 + Math.floor(this.score / 50)); // Increase speed
            this.placeFood();
        } else {
            this.snake.pop();
        }
    }

    placeFood() {
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
    }

    updateScore(val) {
        this.scoreEl.innerText = val;
    }

    draw() {
        // Clear Canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid (Subtle)
        this.ctx.strokeStyle = '#111';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        if (this.spritesLoaded) {
            // Draw Food (Apple) - Sprite index 2 in row 0
            this.ctx.drawImage(
                this.sprites,
                2 * 32, 0, 32, 32,
                this.food.x * this.gridSize, this.food.y * this.gridSize,
                this.gridSize, this.gridSize
            );

            // Draw Snake
            this.snake.forEach((segment, index) => {
                const isHead = index === 0;
                // Sprite mapping: Head(0), Body(1) in row 0
                const spriteX = isHead ? 0 : 1;

                this.ctx.drawImage(
                    this.sprites,
                    spriteX * 32, 0, 32, 32,
                    segment.x * this.gridSize, segment.y * this.gridSize,
                    this.gridSize, this.gridSize
                );
            });
        } else {
            // Fallback if image fails
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillRect(this.food.x * this.gridSize + 2, this.food.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);

            this.snake.forEach((segment, index) => {
                this.ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
            });
        }
    }

    gameLoop(currentTime) {
        if (!this.gameRunning || this.gamePaused) return;

        window.requestAnimationFrame(this.gameLoop);

        const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / this.speed) return;

        this.lastRenderTime = currentTime;

        this.update();
        this.draw();
    }
}

const game = new SnakeGame();