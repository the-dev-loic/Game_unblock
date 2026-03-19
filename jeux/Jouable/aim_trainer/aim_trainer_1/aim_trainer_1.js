const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cursor = document.getElementById('cursor');
const sensInput = document.getElementById('sensitivity');

let width, height;
let animationId;
let lastTime = 0;
let isPaused = false;

let mouseSensitivity = 1.0;

sensInput.addEventListener('input', (e) => {
    mouseSensitivity = parseFloat(e.target.value);
});

// FIX 1 : Le curseur est mis à jour TOUJOURS (pas seulement pendant le jeu)
// FIX 2 : 'py' corrigé en 'px' pour la propriété top
document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';   // ← était 'py', corrigé en 'px'
});

const state = {
    isPlaying: false,
    mode: null,
    score: 0,
    timeLeft: 60,
    clicks: 0,
    hits: 0,
    targets: [],
    particles: [],
    spawnTimer: 0,
    spawnInterval: 800
};

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

document.addEventListener('mousedown', (e) => {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
    if(state.isPlaying && !isPaused) handleInput(e);
});

document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isPlaying) togglePause();
});

class Target {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        this.baseRadius = 35;
        this.radius = this.baseRadius;

        if (type === 'quick') {
            this.color = '#ff3333';
            this.shrinkRate = 0.4;
            this.creationTime = Date.now();
            this.lifespan = 2500;
        } else if (type === 'curve') {
            this.color = '#bc13fe';
            this.angle = 0;
            this.speed = 0.03;
            this.originX = x;
            this.originY = y;
            this.dirX = Math.random() > 0.5 ? 1 : -1;
            this.dirY = Math.random() > 0.5 ? 1 : -1;
        } else {
            this.color = '#00f3ff';
        }
    }

    update(deltaTime) {
        if (this.type === 'curve') {
            this.angle += this.speed;
            this.x = this.originX + Math.sin(this.angle) * 150 * this.dirX;
            this.y = this.originY + Math.cos(this.angle * 0.7) * 80 * this.dirY;
        } else if (this.type === 'quick') {
            const age = Date.now() - this.creationTime;
            const progress = age / this.lifespan;
            if (progress >= 1) {
                this.markedForDeletion = true;
            } else {
                this.radius = this.baseRadius * (1 - (progress * 0.8));
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (this.type === 'quick') {
            const age = Date.now() - this.creationTime;
            const progress = age / this.lifespan;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * (1-progress)));
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = Math.random() * 8 - 4;
        this.speedY = Math.random() * 8 - 4;
        this.life = 1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.04;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function startGame(mode) {
    state.mode = mode;
    state.isPlaying = true;
    isPaused = false;
    state.score = 0;
    state.timeLeft = 60;
    state.clicks = 0;
    state.hits = 0;
    state.targets = [];
    state.particles = [];

    if (mode === 'quick') state.spawnInterval = 900;
    else if (mode === 'curve') state.spawnInterval = 1200;
    else state.spawnInterval = 800;

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';

    updateHUD();
    lastTime = Date.now();
    animate();

    const timerInterval = setInterval(() => {
        if (!state.isPlaying) { clearInterval(timerInterval); return; }
        if (isPaused) return;
        state.timeLeft--;
        updateHUD();
        if (state.timeLeft <= 0) { clearInterval(timerInterval); endGame(); }
    }, 1000);
}

function togglePause() {
    if (!state.isPlaying) return;
    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pause-menu');
    if (isPaused) {
        pauseMenu.style.display = 'flex';
        cancelAnimationFrame(animationId);
    } else {
        pauseMenu.style.display = 'none';
        lastTime = Date.now();
        animate();
    }
}

function spawnTarget() {
    const margin = 100;
    const x = Math.random() * (width - margin * 2) + margin;
    const y = Math.random() * (height - margin * 2) + margin;

    const overlap = state.targets.some(t => {
        const dx = t.x - x;
        const dy = t.y - y;
        return Math.sqrt(dx*dx + dy*dy) < 100;
    });

    if (!overlap) state.targets.push(new Target(x, y, state.mode));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) state.particles.push(new Particle(x, y, color));
}

function handleInput(e) {
    const clickX = e.clientX;
    const clickY = e.clientY;

    state.clicks++;
    let hit = false;

    for (let i = state.targets.length - 1; i >= 0; i--) {
        const t = state.targets[i];
        const dx = clickX - t.x;
        const dy = clickY - t.y;
        if (Math.sqrt(dx*dx + dy*dy) < t.radius) {
            state.score += 100;
            state.hits++;
            createExplosion(t.x, t.y, t.color);
            state.targets.splice(i, 1);
            hit = true;
            break;
        }
    }

    updateHUD();
}

function updateHUD() {
    document.getElementById('score').innerText = state.score;
    document.getElementById('time').innerText = state.timeLeft;
    const acc = state.clicks === 0 ? 100 : Math.round((state.hits / state.clicks) * 100);
    document.getElementById('accuracy').innerText = acc + '%';
}

function endGame() {
    state.isPlaying = false;
    isPaused = false;
    cancelAnimationFrame(animationId);

    document.getElementById('game-ui').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';

    document.getElementById('final-score').innerText = state.score;
    document.getElementById('total-clicks').innerText = state.clicks;
    document.getElementById('missed-clicks').innerText = state.clicks - state.hits;

    const acc = state.clicks === 0 ? 0 : Math.round((state.hits / state.clicks) * 100);
    document.getElementById('final-accuracy').innerText = acc + '%';

    const aps = Math.round((state.hits / 60) * 10) / 10;
    document.getElementById('aps').innerText = aps;
}

function returnToMenu() {
    state.isPlaying = false;
    isPaused = false;
    cancelAnimationFrame(animationId);

    document.getElementById('game-over').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('menu-screen').style.opacity = '1';
    }, 50);
}

function animate() {
    if (!state.isPlaying || isPaused) return;

    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offset = (now / 50) % gridSize;

    for(let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for(let y = offset; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    state.spawnTimer += deltaTime;
    if (state.spawnTimer > state.spawnInterval) {
        spawnTarget();
        state.spawnTimer = 0;
        if(state.spawnInterval > 400) state.spawnInterval -= 5;
    }

    state.targets.forEach(t => { t.update(deltaTime); t.draw(ctx); });
    state.targets = state.targets.filter(t => !t.markedForDeletion);

    state.particles.forEach(p => { p.update(); p.draw(ctx); });
    state.particles = state.particles.filter(p => p.life > 0);

    animationId = requestAnimationFrame(animate);}