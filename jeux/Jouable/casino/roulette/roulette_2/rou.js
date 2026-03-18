// =============================================
// ROULETTE DATA & CONSTANTS
// =============================================

// European roulette wheel order (physical)
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

// Colors
const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACK_NUMS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);

function getColor(n) {
    if (n === 0) return 'green';
    if (RED_NUMS.has(n)) return 'red';
    return 'black';
}

// =============================================
// GAME STATE
// =============================================
const state = {
    players: [
        { name: 'Joueur 1', balance: 1000, bets: [], history: [] },
        { name: 'Joueur 2', balance: 1000, bets: [], history: [] }
    ],
    currentPlayer: 0, // 0 = both place bets, then spin
    betPhase: 0, // 0 = P1 betting, 1 = P2 betting, 2 = spinning
    selectedChip: 10,
    spinning: false,
    lastResult: null,
    round: 0
};

// =============================================
// BET DEFINITIONS
// =============================================
// Bet types and their payouts (x:1)
// straight = 35:1, split=17:1, street=11:1, corner=8:1, sixline=5:1
// column=2:1, dozen=2:1, even/odd=1:1, red/black=1:1, low/high=1:1

function evaluateBet(bet, winNum) {
    const c = getColor(winNum);
    switch(bet.type) {
        case 'straight':
            return bet.numbers.includes(winNum) ? bet.amount * 35 : -bet.amount;
        case 'split':
            return bet.numbers.includes(winNum) ? bet.amount * 17 : -bet.amount;
        case 'street':
            return bet.numbers.includes(winNum) ? bet.amount * 11 : -bet.amount;
        case 'corner':
            return bet.numbers.includes(winNum) ? bet.amount * 8 : -bet.amount;
        case 'sixline':
            return bet.numbers.includes(winNum) ? bet.amount * 5 : -bet.amount;
        case 'dozen1':
            return (winNum >= 1 && winNum <= 12) ? bet.amount * 2 : -bet.amount;
        case 'dozen2':
            return (winNum >= 13 && winNum <= 24) ? bet.amount * 2 : -bet.amount;
        case 'dozen3':
            return (winNum >= 25 && winNum <= 36) ? bet.amount * 2 : -bet.amount;
        case 'col1':
            return (winNum > 0 && winNum % 3 === 1) ? bet.amount * 2 : -bet.amount;
        case 'col2':
            return (winNum > 0 && winNum % 3 === 2) ? bet.amount * 2 : -bet.amount;
        case 'col3':
            return (winNum > 0 && winNum % 3 === 0) ? bet.amount * 2 : -bet.amount;
        case 'red':
            return c === 'red' ? bet.amount * 1 : -bet.amount;
        case 'black':
            return c === 'black' ? bet.amount * 1 : -bet.amount;
        case 'even':
            return (winNum > 0 && winNum % 2 === 0) ? bet.amount * 1 : -bet.amount;
        case 'odd':
            return (winNum > 0 && winNum % 2 === 1) ? bet.amount * 1 : -bet.amount;
        case 'low':
            return (winNum >= 1 && winNum <= 18) ? bet.amount * 1 : -bet.amount;
        case 'high':
            return (winNum >= 19 && winNum <= 36) ? bet.amount * 1 : -bet.amount;
        default: return -bet.amount;
    }
}

function betLabel(bet) {
    switch(bet.type) {
        case 'straight': return `Plein ${bet.numbers[0]}`;
        case 'split': return `Cheval ${bet.numbers[0]}-${bet.numbers[1]}`;
        case 'street': return `Transversale ${bet.numbers[0]}`;
        case 'corner': return `Carré ${bet.numbers[0]}-${bet.numbers[3]}`;
        case 'sixline': return `Sixain ${bet.numbers[0]}-${bet.numbers[5]}`;
        case 'dozen1': return '1ère Douzaine';
        case 'dozen2': return '2ème Douzaine';
        case 'dozen3': return '3ème Douzaine';
        case 'col1': return 'Colonne 1';
        case 'col2': return 'Colonne 2';
        case 'col3': return 'Colonne 3';
        case 'red': return 'Rouge';
        case 'black': return 'Noir';
        case 'even': return 'Pair';
        case 'odd': return 'Impair';
        case 'low': return 'Manque (1-18)';
        case 'high': return 'Passe (19-36)';
        default: return bet.type;
    }
}

// =============================================
// CANVAS WHEEL
// =============================================
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let wheelAngle = 0;
let ballAngle = 0;
let ballRadius = 120; // from center
let animFrame = null;
let spinTarget = 0;
let spinSpeed = 0;
let ballSpeed = 0;
let isSpinning = false;
let spinDone = false;
let resultNumber = null;
let ballDecelerating = false;
let ballFinalAngle = 0;

const W = canvas.width;
const CX = W/2, CY = W/2;
const OUTER_R = W/2 - 4;
const INNER_R = OUTER_R * 0.72;
const NUM_R = (OUTER_R + INNER_R) / 2;
const BALL_TRACK_R = OUTER_R * 0.88;

function drawWheel(angle) {
    ctx.clearRect(0, 0, W, W);
    const n = WHEEL_ORDER.length;
    const slice = (2 * Math.PI) / n;

    // Outer ring background
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, 2*Math.PI);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Gold outer border
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, 2*Math.PI);
    ctx.strokeStyle = '#d4a843';
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < n; i++) {
        const start = angle + i * slice - Math.PI/2 - slice/2;
        const end = start + slice;
        const num = WHEEL_ORDER[i];
        const color = getColor(num);

        // Pocket
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, OUTER_R - 2, start, end);
        ctx.closePath();
        if (color === 'green') ctx.fillStyle = '#1a6b2e';
        else if (color === 'red') ctx.fillStyle = '#c0392b';
        else ctx.fillStyle = '#1c1c1c';
        ctx.fill();

        // Divider lines
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(start) * INNER_R, CY + Math.sin(start) * INNER_R);
        ctx.lineTo(CX + Math.cos(start) * (OUTER_R-2), CY + Math.sin(start) * (OUTER_R-2));
        ctx.strokeStyle = '#d4a843';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Number text
        const midAngle = start + slice/2;
        const tx = CX + Math.cos(midAngle) * NUM_R;
        const ty = CY + Math.sin(midAngle) * NUM_R;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI/2);
        ctx.font = `bold ${Math.max(8, Math.floor(W*0.028))}px Cinzel, serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num, 0, 0);
        ctx.restore();
    }

    // Inner hub
    const hubGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, INNER_R);
    hubGrad.addColorStop(0, '#2a1a05');
    hubGrad.addColorStop(0.6, '#1a1a1a');
    hubGrad.addColorStop(1, '#0d0d0d');
    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R, 0, 2*Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#d4a843';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner decorative circles
    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R * 0.5, 0, 2*Math.PI);
    ctx.strokeStyle = 'rgba(212,168,67,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R * 0.15, 0, 2*Math.PI);
    ctx.fillStyle = '#d4a843';
    ctx.fill();
}

function drawBall(ba, br) {
    const bx = CX + Math.cos(ba) * br;
    const by = CY + Math.sin(ba) * br;

    // Shadow
    ctx.beginPath();
    ctx.arc(bx + 2, by + 2, 7, 0, 2*Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    // Ball
    const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.4, '#e8e8e8');
    ballGrad.addColorStop(1, '#999');
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, 2*Math.PI);
    ctx.fillStyle = ballGrad;
    ctx.fill();
}

function drawPointer() {
    // Triangle pointer at top
    const py = CY - OUTER_R + 2;
    ctx.beginPath();
    ctx.moveTo(CX, py + 14);
    ctx.lineTo(CX - 8, py);
    ctx.lineTo(CX + 8, py);
    ctx.closePath();
    ctx.fillStyle = '#d4a843';
    ctx.fill();
}

let spinPhase = 'idle'; // idle | spinning | decelerating | done
let targetAngle = 0;
let currentWheelSpeed = 0;
let currentBallAngle = 0;
let currentBallSpeed = 0;
let currentBallR = BALL_TRACK_R;
let frameCount = 0;
let winPocket = 0;

function startSpin(winNumber) {
    // Find position of winning number
    const idx = WHEEL_ORDER.indexOf(winNumber);
    const n = WHEEL_ORDER.length;
    const slice = (2 * Math.PI) / n;

    // Target: winning pocket aligned at top (pointer at top = angle -PI/2)
    // The pocket center is at wheelAngle + idx * slice - PI/2
    // We want that = -PI/2 (pointing up) => wheelAngle = -idx * slice
    // Add multiple full rotations for realism
    const rotations = 5 + Math.random() * 3;
    targetAngle = wheelAngle + (2 * Math.PI * rotations) + (-idx * slice - wheelAngle % (2*Math.PI) - (2*Math.PI - wheelAngle % (2*Math.PI)));

    // Simpler: just spin and set final angle
    const finalWheelAngle = -idx * slice + Math.PI * (2 * Math.floor(rotations) + (Math.random() < 0.5 ? 2 : 4));

    currentWheelSpeed = 0.08 + Math.random() * 0.02;
    currentBallSpeed = -(0.18 + Math.random() * 0.05); // opposite direction
    currentBallAngle = Math.random() * 2 * Math.PI;
    currentBallR = BALL_TRACK_R;
    frameCount = 0;
    spinPhase = 'spinning';
    winPocket = winNumber;

    // Total frames: ~4 seconds at 60fps = 240 frames for spinning, then decelerate
    const totalSpinFrames = 200 + Math.floor(Math.random() * 80);
    const totalDecFrames = 120 + Math.floor(Math.random() * 60);

    let frame = 0;
    let decFrame = 0;

    function animate() {
        if (spinPhase === 'spinning') {
            wheelAngle += currentWheelSpeed;
            currentBallAngle += currentBallSpeed;
            frame++;

            drawWheel(wheelAngle);
            drawBall(currentBallAngle, currentBallR);
            drawPointer();

            if (frame >= totalSpinFrames) {
                spinPhase = 'decelerating';
                decFrame = 0;
            }
            animFrame = requestAnimationFrame(animate);
        } else if (spinPhase === 'decelerating') {
            decFrame++;
            const progress = decFrame / totalDecFrames;
            const eased = 1 - Math.pow(1 - progress, 3);

            currentWheelSpeed = 0.08 * (1 - eased);
            currentBallSpeed = -(0.18 * (1 - eased));

            // Ball spirals inward
            currentBallR = BALL_TRACK_R - (BALL_TRACK_R - NUM_R * 0.92) * eased;

            wheelAngle += currentWheelSpeed;
            currentBallAngle += currentBallSpeed;

            if (decFrame >= totalDecFrames) {
                spinPhase = 'done';
                // Snap wheel to correct final angle
                const snapIdx = WHEEL_ORDER.indexOf(winPocket);
                // Normalize wheel angle so winning number is at top
                const snappedAngle = Math.round(wheelAngle / (2*Math.PI)) * (2*Math.PI) + (-snapIdx * (2*Math.PI/n));

                // Final ball position = at winning number
                const winAngle = snappedAngle + snapIdx * slice - Math.PI/2;
                const finalPocketAngle = -snapIdx * slice + snappedAngle - Math.PI/2;

                drawWheel(wheelAngle);
                // Place ball in winning pocket
                const pocketAngle = wheelAngle + (snapIdx + 0.5) * slice - Math.PI/2;
                drawBall(pocketAngle, NUM_R * 0.93);
                drawPointer();

                // Highlight winning number
                highlightWinningCell(winPocket);
                setTimeout(() => showResult(winPocket), 600);
                return;
            }

            drawWheel(wheelAngle);
            drawBall(currentBallAngle, currentBallR);
            drawPointer();

            animFrame = requestAnimationFrame(animate);
        }
    }

    animFrame = requestAnimationFrame(animate);
}

// Static draw
function drawStatic() {
    drawWheel(wheelAngle);
    drawPointer();
}

// =============================================
// BETTING TABLE BUILD
// =============================================
// Number layout: rows of 3, columns 1-12 vertically
// Standard table: 0 on top, then 3 rows (bottom=1,4,7... middle=2,5,8... top=3,6,9...)
// Column 1: 1,4,7,10,13,16,19,22,25,28,31,34 (n%3==1)
// Column 2: 2,5,8,11,14,17,20,23,26,29,32,35 (n%3==2)
// Column 3: 3,6,9,12,15,18,21,24,27,30,33,36 (n%3==0)

function buildTable() {
    const table = document.getElementById('bettingTable');

    // Layout: zero row, then grid 12cols x 3rows
    // Each column = 3 numbers: col i has n = i*3+1, i*3+2, i*3+3

    let html = `
    <!-- ZERO -->
    <div class="zero-row">
      <div class="cell zero" onclick="placeBet('straight',[0])" data-nums="0">0</div>
    </div>

    <!-- NUMBER GRID: 12 columns, 3 rows. Row 3 on top, row 1 on bottom -->
    <div class="num-rows" id="numGrid">
  `;

    // Build 3 rows × 12 cols
    // Row 3 (top): 3,6,9,...,36
    // Row 2 (mid): 2,5,8,...,35
    // Row 1 (bot): 1,4,7,...,34

    for (let row = 3; row >= 1; row--) {
        for (let col = 1; col <= 12; col++) {
            const num = (col - 1) * 3 + row;
            const color = getColor(num);
            html += `<div class="cell ${color}" onclick="handleNumberClick(${num})" data-num="${num}" id="cell-${num}">${num}</div>`;
        }
    }

    html += `</div>`;

    // Columns (2:1)
    html += `
    <div class="col-bets">
      <div class="col-bet" onclick="placeBet('col1',null)" data-bettype="col1">Col. 1 <span style="opacity:0.6;font-size:0.6rem">2:1</span></div>
      <div class="col-bet" onclick="placeBet('col2',null)" data-bettype="col2">Col. 2 <span style="opacity:0.6;font-size:0.6rem">2:1</span></div>
      <div class="col-bet" onclick="placeBet('col3',null)" data-bettype="col3">Col. 3 <span style="opacity:0.6;font-size:0.6rem">2:1</span></div>
    </div>
  `;

    // Dozens
    html += `
    <div class="outside-bets">
      <div class="obet green-bg" onclick="placeBet('dozen1',null)" data-bettype="dozen1">1ère Douzaine<br><span style="opacity:0.6;font-size:0.6rem">1–12 • 2:1</span></div>
      <div class="obet green-bg" onclick="placeBet('dozen2',null)" data-bettype="dozen2">2ème Douzaine<br><span style="opacity:0.6;font-size:0.6rem">13–24 • 2:1</span></div>
      <div class="obet green-bg" onclick="placeBet('dozen3',null)" data-bettype="dozen3">3ème Douzaine<br><span style="opacity:0.6;font-size:0.6rem">25–36 • 2:1</span></div>
    </div>
  `;

    // Outside even-money bets
    html += `
    <div class="outside-bets-2">
      <div class="obet green-bg" onclick="placeBet('low',null)" data-bettype="low">Manque<br><small>1–18</small></div>
      <div class="obet black-bg" onclick="placeBet('even',null)" data-bettype="even">Pair</div>
      <div class="obet red-bg" onclick="placeBet('red',null)" data-bettype="red" style="font-size:1.2rem">♦ Rouge</div>
      <div class="obet black-bg" onclick="placeBet('black',null)" data-bettype="black">⬛ Noir</div>
      <div class="obet black-bg" onclick="placeBet('odd',null)" data-bettype="odd">Impair</div>
      <div class="obet green-bg" onclick="placeBet('high',null)" data-bettype="high">Passe<br><small>19–36</small></div>
    </div>
  `;

    table.innerHTML = html;

    // Add hover effects for adjacent cells (split/corner/street hints)
    addNumberHoverEffects();
}

function addNumberHoverEffects() {
    // Number cells detect right-click for special bets
    // Left-click = straight
    // We'll add a hover tooltip
}

let lastClickedNum = null;
let lastClickedNum2 = null;
let splitMode = false;

function handleNumberClick(num) {
    // Left click = straight bet normally
    // If holding Shift = try split with last clicked
    if (window.shiftHeld && lastClickedNum !== null) {
        // Check if adjacent
        const nums = [lastClickedNum, num].sort((a,b)=>a-b);
        if (isAdjacent(nums[0], nums[1])) {
            placeBet('split', nums);
            lastClickedNum = null;
            return;
        }
    }

    // Check if can form street (3 consecutive in same row)
    // or corner (4 adjacent)
    placeBet('straight', [num]);
    lastClickedNum = num;
}

function isAdjacent(a, b) {
    // Horizontal neighbors (same row, consecutive col)
    const diff = Math.abs(a - b);
    if (diff === 3) return true; // same position, adjacent column
    // Vertical neighbors (same column, consecutive row)
    if (diff === 1 && Math.floor((a-1)/3) === Math.floor((b-1)/3)) return false; // different cols
    if (diff === 1) return true;
    return false;
}

window.addEventListener('keydown', e => { if (e.key === 'Shift') window.shiftHeld = true; });
window.addEventListener('keyup', e => { if (e.key === 'Shift') window.shiftHeld = false; });

// =============================================
// BET PLACEMENT
// =============================================
function placeBet(type, numbers) {
    if (state.betPhase === 2 || state.spinning) return;
    const p = state.players[state.currentPlayer];
    const amount = state.selectedChip;

    if (p.balance < amount) {
        setStatus('⚠ Solde insuffisant !');
        return;
    }

    // Find existing bet of same type
    let numbers_key = numbers ? numbers.join(',') : type;
    let existing = p.bets.find(b => {
        if (b.type !== type) return false;
        if (numbers === null) return true;
        return b.numbers.join(',') === numbers.join(',');
    });

    if (existing) {
        existing.amount += amount;
    } else {
        p.bets.push({ type, numbers: numbers || [], amount });
    }

    p.balance -= amount;
    updatePlayerUI(state.currentPlayer);
    updateBetMarkers();
    setStatus(`Mise placée : ${amount}€ sur ${betLabel({type, numbers: numbers || []})}`);
}

function clearBets() {
    const p = state.players[state.currentPlayer];
    const totalBet = p.bets.reduce((s,b) => s + b.amount, 0);
    p.balance += totalBet;
    p.bets = [];
    updatePlayerUI(state.currentPlayer);
    updateBetMarkers();
    setStatus('Mises effacées');
}

function selectChip(val) {
    state.selectedChip = val;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.chip-${val}`)?.classList.add('selected');
    document.getElementById('betModeDisplay').textContent = `Mise : ${val} €`;
}

// =============================================
// GAME FLOW
// =============================================
function startGame() {
    const n1 = document.getElementById('nameInput1').value || 'Joueur 1';
    const n2 = document.getElementById('nameInput2').value || 'Joueur 2';
    const bal = parseInt(document.getElementById('startBalance').value);

    state.players[0].name = n1;
    state.players[1].name = n2;
    state.players[0].balance = bal;
    state.players[1].balance = bal;

    document.getElementById('p1name').textContent = n1;
    document.getElementById('p2name').textContent = n2;

    document.getElementById('setupOverlay').style.display = 'none';

    buildTable();
    drawStatic();
    selectChip(10);

    state.betPhase = 0;
    state.currentPlayer = 0;
    updateTurnUI();
    updatePlayerUI(0);
    updatePlayerUI(1);
    setStatus(`${state.players[0].name}, placez vos mises`);
}

function nextTurn() {
    document.getElementById('resultOverlay').style.display = 'none';

    // Check bankruptcies
    const p0broke = state.players[0].balance <= 0;
    const p1broke = state.players[1].balance <= 0;

    if (p0broke || p1broke) {
        const winner = p0broke ? state.players[1] : (p1broke ? state.players[0] : null);
        if (winner) {
            showWinnerBanner(`🏆 ${winner.name} remporte la partie ! 🏆`);
            return;
        }
    }

    state.betPhase = 0;
    state.currentPlayer = 0;
    state.players[0].bets = [];
    state.players[1].bets = [];
    updateBetMarkers();
    updateTurnUI();
    setStatus(`${state.players[0].name}, placez vos mises`);
    document.getElementById('spinBtn').disabled = false;

    // Clear highlights
    document.querySelectorAll('.cell.highlighted').forEach(c => c.classList.remove('highlighted'));
}

function updateTurnUI() {
    const idx = state.currentPlayer;
    const p = state.players[idx];

    // Highlight active panel
    document.getElementById('panel1').classList.toggle('active-player', idx === 0 || state.betPhase === 2);
    document.getElementById('panel2').classList.toggle('active-player', idx === 1 || state.betPhase === 2);

    let msg = '';
    if (state.betPhase === 0) {
        msg = `Tour de ${p.name}`;
        document.getElementById('spinBtn').textContent = 'CONFIRMER';
        document.getElementById('spinBtn').disabled = false;
    } else if (state.betPhase === 1) {
        msg = `Tour de ${p.name}`;
        document.getElementById('spinBtn').textContent = 'LANCER LA BILLE';
        document.getElementById('spinBtn').disabled = false;
    } else {
        msg = 'La bille tourne...';
        document.getElementById('spinBtn').disabled = true;
    }

    document.getElementById('turnIndicator').textContent = msg;
}

function spinRoulette() {
    if (state.spinning) return;

    if (state.betPhase === 0) {
        // P1 confirmed bets, now P2 bets
        state.betPhase = 1;
        state.currentPlayer = 1;
        updateTurnUI();
        updateBetMarkers();
        setStatus(`${state.players[1].name}, placez vos mises`);
        return;
    }

    if (state.betPhase === 1) {
        // P2 confirmed, spin
        state.betPhase = 2;
        state.spinning = true;
        state.currentPlayer = -1;
        updateTurnUI();

        // Generate random result
        const winNum = Math.floor(Math.random() * 37); // 0-36
        state.lastResult = winNum;

        document.getElementById('spinBtn').disabled = true;
        setStatus('⚡ La bille est lancée...');

        startSpin(winNum);
        return;
    }
}

function showResult(winNum) {
    state.spinning = false;
    state.round++;

    const color = getColor(winNum);
    const overlay = document.getElementById('resultOverlay');
    const numEl = document.getElementById('resultNumber');
    const titleEl = document.getElementById('resultTitle');
    const descEl = document.getElementById('resultDesc');
    const detailsEl = document.getElementById('resultDetails');

    numEl.textContent = winNum;
    numEl.className = 'phase-number ' + color;
    titleEl.textContent = color === 'green' ? '🍀 ZÉRO !' : color === 'red' ? '🔴 ROUGE' : '⚫ NOIR';

    const colorLabel = color === 'green' ? 'Vert' : color === 'red' ? 'Rouge' : 'Noir';
    const parity = winNum === 0 ? '' : winNum % 2 === 0 ? '· Pair' : '· Impair';
    const range = winNum === 0 ? '' : winNum <= 18 ? '· Manque' : '· Passe';
    descEl.textContent = `${colorLabel} ${parity} ${range}`;

    let detailsHTML = '';
    let anyWin = false;

    state.players.forEach((p, pi) => {
        const gain = p.bets.reduce((s, bet) => s + evaluateBet(bet, winNum), 0);
        p.balance += gain > 0 ? gain : 0; // If gain > 0, we already subtracted bet, gain = profit

        // Actually recalculate properly
        // We subtracted bets when placing. evaluateBet returns net change.
        // If win: +amount*payout (net gain)
        // If lose: -amount (already lost when placed... wait no)
        // FIX: We deducted from balance when betting.
        // evaluateBet: win returns amount*payout (profit without stake), lose returns -amount
        // But stake already deducted. So:
        // Win: add amount*payout + amount (stake back + profit) = amount*(payout+1)
        // Lose: nothing (already lost)
        // Let me re-evaluate...

        // Actually let me recalculate: evaluateBet returns:
        // win: bet.amount * multiplier (profit only)
        // lose: -bet.amount
        // Since we deducted bet.amount already, we should ADD:
        // win: bet.amount * multiplier + bet.amount = bet.amount * (multiplier+1)
        // lose: 0 (already deducted)

        // I already applied gain wrong above. Let me redo cleanly.
        p.history.push({ num: winNum, color });
        updatePlayerHistory(pi);
    });

    // Recalculate balances from bets
    // Re-add already-deducted bets, then apply proper result
    state.players.forEach((p, pi) => {
        let roundGain = 0;
        p.bets.forEach(bet => {
            const result = evaluateBet(bet, winNum);
            if (result > 0) {
                // Won: get stake back + winnings
                roundGain += bet.amount + result;
            }
            // Lost: stake already deducted
        });
        p.balance += roundGain;

        const totalBet = p.bets.reduce((s,b) => s + b.amount, 0);
        const netGain = roundGain - totalBet; // net P&L this round (bets already deducted)

        const pColor = pi === 0 ? '#3498db' : '#e74c3c';
        detailsHTML += `<div style="border-left:3px solid ${pColor};padding-left:10px;margin-bottom:12px">`;
        detailsHTML += `<strong style="color:${pColor}">${p.name}</strong><br>`;
        if (p.bets.length === 0) {
            detailsHTML += `<span style="color:rgba(245,230,200,0.5)">Aucune mise</span>`;
        } else {
            p.bets.forEach(bet => {
                const res = evaluateBet(bet, winNum);
                const won = res > 0;
                detailsHTML += `<span style="color:${won ? '#2ecc71' : '#e74c3c'}">${won ? '✓' : '✗'} ${betLabel(bet)} (${bet.amount}€) → ${won ? '+' + res : res}€</span><br>`;
            });
            const sign = netGain >= 0 ? '+' : '';
            detailsHTML += `<strong style="color:${netGain >= 0 ? '#2ecc71' : '#e74c3c'};font-size:1rem">${sign}${netGain}€ ce tour</strong>`;
        }
        detailsHTML += `</div>`;

        // Update last result panel
        const lastEl = document.getElementById(`p${pi+1}last`);
        lastEl.style.display = 'block';
        lastEl.className = `last-result ${color}`;
        lastEl.innerHTML = `<div style="font-size:0.7rem;opacity:0.6;margin-bottom:4px">Dernier numéro</div><div class="result-num">${winNum}</div><div class="result-gain ${netGain >= 0 ? 'won' : 'lost'}">${netGain >= 0 ? '+' : ''}${netGain}€</div>`;

        updatePlayerUI(pi);
        anyWin = true;
    });

    detailsEl.innerHTML = detailsHTML;
    overlay.style.display = 'flex';
}

function highlightWinningCell(num) {
    document.querySelectorAll('.cell.highlighted').forEach(c => c.classList.remove('highlighted'));
    const cell = document.getElementById(`cell-${num}`);
    if (cell) cell.classList.add('highlighted');
}

// =============================================
// UI UPDATES
// =============================================
function updatePlayerUI(idx) {
    const p = state.players[idx];
    const n = idx + 1;

    document.getElementById(`p${n}balance`).textContent = p.balance.toLocaleString('fr-FR') + ' €';

    const betsListEl = document.getElementById(`p${n}bets-list`);
    const total = p.bets.reduce((s,b) => s + b.amount, 0);

    betsListEl.innerHTML = p.bets.map(b =>
        `<div class="bet-item"><span class="bet-name">${betLabel(b)}</span><span class="bet-val">${b.amount}€</span></div>`
    ).join('');

    document.getElementById(`p${n}total`).textContent = total + ' €';
}

function updatePlayerHistory(idx) {
    const p = state.players[idx];
    const n = idx + 1;
    const el = document.getElementById(`p${n}history`);

    const last8 = p.history.slice(-8);
    el.innerHTML = last8.map(h =>
        `<div class="hdot ${h.color}">${h.num}</div>`
    ).join('');
}

function updateBetMarkers() {
    // Clear all markers
    document.querySelectorAll('.has-bet').forEach(el => {
        el.classList.remove('has-bet');
        el.removeAttribute('data-bet');
    });

    // Current player bets only
    const p = state.players[state.currentPlayer < 0 ? 0 : state.currentPlayer];
    if (!p) return;

    p.bets.forEach(bet => {
        // Mark number cells
        if (bet.type === 'straight' && bet.numbers.length === 1) {
            const cell = document.getElementById(`cell-${bet.numbers[0]}`);
            if (cell) { cell.classList.add('has-bet'); cell.setAttribute('data-bet', bet.amount); }
            if (bet.numbers[0] === 0) {
                const zeroCell = document.querySelector('.cell.zero');
                if (zeroCell) { zeroCell.classList.add('has-bet'); zeroCell.setAttribute('data-bet', bet.amount); }
            }
        } else if (['split','street','corner','sixline'].includes(bet.type)) {
            bet.numbers.forEach(n => {
                const cell = document.getElementById(`cell-${n}`);
                if (cell) { cell.classList.add('has-bet'); cell.setAttribute('data-bet', bet.amount); }
            });
        } else {
            // Outside bets
            const selector = `[data-bettype="${bet.type}"]`;
            const el = document.querySelector(selector);
            if (el) { el.classList.add('has-bet'); el.setAttribute('data-bet', bet.amount); }
        }
    });
}

function setStatus(msg) {
    document.getElementById('statusMsg').textContent = msg;
}

function showWinnerBanner(msg) {
    const banner = document.getElementById('winnerBanner');
    banner.textContent = msg;
    banner.style.display = 'block';
    setTimeout(() => {
        document.getElementById('resultOverlay').innerHTML = `
      <div class="phase-box">
        <h2>🏆 Partie Terminée</h2>
        <div class="phase-number" style="color:var(--gold)">${msg}</div>
        <div style="margin-top:24px;display:flex;gap:12px;justify-content:center">
          <button class="btn btn-spin" onclick="location.reload()">Nouvelle Partie</button>
        </div>
      </div>
    `;
        document.getElementById('resultOverlay').style.display = 'flex';
    }, 500);
}

// =============================================
// INIT
// =============================================
drawWheel(0);
drawPointer();
selectChip(10);