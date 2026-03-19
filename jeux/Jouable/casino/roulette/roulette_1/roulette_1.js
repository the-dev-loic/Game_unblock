// --- Configuration & Data ---
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Game State
let players = [
    { id: 1, name: "Joueur 1", balance: 1000, bets: [], color: 'var(--p1-color)' },
    { id: 2, name: "Joueur 2", balance: 1000, bets: [], color: 'var(--p2-color)' }
];
let currentPlayerIndex = 0; // 0 for P1, 1 for P2
let selectedChipValue = 10;
let isSpinning = false;
let currentRotation = 0;

// DOM Elements
const wheelEl = document.getElementById('wheel');
const wheelCenterEl = document.getElementById('wheel-center');
const boardEl = document.getElementById('betting-board');
const chipSelectorEl = document.getElementById('chip-selector');
const spinBtn = document.getElementById('btn-spin');
const clearBtn = document.getElementById('btn-clear');
const resultOverlay = document.getElementById('result-overlay');
const resultNumberEl = document.getElementById('result-number');
const resultColorEl = document.getElementById('result-color');
const winnerTextEl = document.getElementById('winner-text');
const nextRoundBtn = document.getElementById('btn-next-round');
const logEl = document.getElementById('game-log');

// --- Initialization ---

function initWheel() {
    const segmentAngle = 360 / 37;
    let html = '';

    WHEEL_NUMBERS.forEach((num, index) => {
        const rotation = index * segmentAngle;
        let color = 'green';
        if (RED_NUMBERS.includes(num)) color = '#b91d1d';
        else if (num !== 0) color = '#1a1a1a';

        // Create wedge using conic-gradient logic via SVG or simple divs rotated
        // Using simple absolute positioned divs for text, background handled by conic gradient on parent for performance
        // Actually, let's draw segments with CSS conic-gradient on the wheel itself for smoothness

        const textRotation = rotation + (segmentAngle / 2);

        html += `
                <div style="position:absolute; top:0; left:0; width:100%; height:100%;
                            transform: rotate(${textRotation}deg);
                            transform-origin: 50% 50%;">
                    <div style="position:absolute; top:10px; left:50%; transform:translateX(-50%);
                                color:white; font-weight:bold; font-size:14px; text-shadow:1px 1px 2px black;">
                        ${num}
                    </div>
                </div>
            `;
    });
    wheelEl.innerHTML = html;

    // Set background colors
    let gradientStr = '';
    WHEEL_NUMBERS.forEach((num, index) => {
        let color = num === 0 ? '#35654d' : (RED_NUMBERS.includes(num) ? '#b91d1d' : '#1a1a1a');
        gradientStr += `${color} ${index * (100/37)}% ${(index + 1) * (100/37)}%,`;
    });
    wheelEl.style.background = `conic-gradient(${gradientStr.slice(0, -1)})`;
}

function initBoard() {
    // Zero
    const zeroCell = createCell(0, 'green', 'cell-0');
    boardEl.appendChild(zeroCell);

    // Numbers 1-36
    // Grid logic: 3 rows.
    // Row 1 (top): 3, 6, 9... (col 1)
    // Row 2 (mid): 2, 5, 8... (col 2)
    // Row 3 (bot): 1, 4, 7... (col 3)
    // But CSS Grid is easier if we map 1-36 sequentially and use grid-column/row

    for (let i = 1; i <= 36; i++) {
        let row = 3 - ((i - 1) % 3); // 1->3, 2->2, 3->1
        let col = Math.ceil(i / 3) + 1; // +1 because col 1 is zero
        let color = RED_NUMBERS.includes(i) ? 'red' : 'black';

        const cell = createCell(i, color);
        cell.style.gridRow = row;
        cell.style.gridColumn = col;
        boardEl.appendChild(cell);
    }

    // Side Bets (Row 5)
    const sideBetsContainer = document.createElement('div');
    sideBetsContainer.className = 'side-bets';

    const sideBetTypes = [
        { label: '1-18', type: 'range', val: [1, 18], payout: 1 },
        { label: 'PAIR', type: 'even', payout: 1 },
        { label: 'ROUGE', type: 'color', val: 'red', payout: 1 },
        { label: 'NOIR', type: 'color', val: 'black', payout: 1 },
        { label: 'IMPAIR', type: 'odd', payout: 1 },
        { label: '19-36', type: 'range', val: [19, 36], payout: 1 }
    ];

    sideBetTypes.forEach(sb => {
        const cell = document.createElement('div');
        cell.className = 'side-bet-cell';
        cell.textContent = sb.label;
        cell.dataset.type = sb.type;
        if(sb.val) cell.dataset.val = JSON.stringify(sb.val);
        cell.dataset.payout = sb.payout;
        cell.addEventListener('click', () => placeBet(cell, sb.label));
        sideBetsContainer.appendChild(cell);
    });

    boardEl.appendChild(sideBetsContainer);
}

function createCell(number, colorClass, extraClass = '') {
    const div = document.createElement('div');
    div.className = `cell ${colorClass} ${extraClass}`;
    div.textContent = number;
    div.dataset.number = number;
    div.addEventListener('click', () => placeBet(div, number));
    return div;
}

// --- Game Logic ---

function updateUI() {
    // Update Balances
    document.getElementById('p1-balance').textContent = `${players[0].balance} €`;
    document.getElementById('p2-balance').textContent = `${players[1].balance} €`;

    // Update Current Bets on Board
    const totalP1 = players[0].bets.reduce((sum, b) => sum + b.amount, 0);
    const totalP2 = players[1].bets.reduce((sum, b) => sum + b.amount, 0);

    document.getElementById('p1-current-bet').textContent = totalP1;
    document.getElementById('p2-current-bet').textContent = totalP2;

    // Highlight Active Player
    document.getElementById('p1-stat').classList.toggle('active', currentPlayerIndex === 0 && !isSpinning);
    document.getElementById('p2-stat').classList.toggle('active', currentPlayerIndex === 1 && !isSpinning);

    // Disable controls if spinning
    spinBtn.disabled = isSpinning;
    clearBtn.disabled = isSpinning;
    chipSelectorEl.style.pointerEvents = isSpinning ? 'none' : 'all';
    boardEl.style.pointerEvents = isSpinning ? 'none' : 'all';
}

function placeBet(targetElement, label) {
    if (isSpinning) return;

    const player = players[currentPlayerIndex];
    if (player.balance < selectedChipValue) {
        log(`Fonds insuffisants pour ${player.name}`);
        return;
    }

    // Deduct balance
    player.balance -= selectedChipValue;

    // Add bet
    player.bets.push({
        target: targetElement, // DOM element reference
        label: label,
        amount: selectedChipValue,
        type: targetElement.dataset.type || 'number'
    });

    // Visual Chip
    const chip = document.createElement('div');
    chip.className = `chip-on-board chip-p${player.id}`;
    chip.textContent = selectedChipValue;

    // Random slight offset for realism
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    chip.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    targetElement.appendChild(chip);

    log(`${player.name} mise ${selectedChipValue}€ sur ${label}`);
    updateUI();
}

function clearBets() {
    if (isSpinning) return;
    const player = players[currentPlayerIndex];

    // Refund bets
    player.bets.forEach(bet => {
        player.balance += bet.amount;
        // Remove visual chip (last child usually, but safer to clear all chips of this player)
        const chips = bet.target.querySelectorAll(`.chip-p${player.id}`);
        chips.forEach(c => c.remove());
    });

    player.bets = [];
    log(`${player.name} retire ses mises.`);
    updateUI();
}

function spinWheel() {
    if (isSpinning) return;

    const totalBets = players[0].bets.length + players[1].bets.length;
    if (totalBets === 0) {
        alert("Placez vos mises avant de lancer !");
        return;
    }

    isSpinning = true;
    updateUI();
    log("La roue tourne...");

    // Determine Result
    const winningIndex = Math.floor(Math.random() * 37);
    const winningNumber = WHEEL_NUMBERS[winningIndex];

    // Calculate Rotation
    // Each segment is 360/37 degrees.
    // To land on index i, we need to rotate such that index i is at the top (0deg).
    // Current setup: Index 0 is at 0deg.
    // To bring Index i to top, we rotate: -(i * segmentAngle).
    // Add multiple full spins (e.g., 5 * 360) for effect.

    const segmentAngle = 360 / 37;
    const baseRotation = 360 * 5; // 5 full spins
    const targetRotation = -(winningIndex * segmentAngle);

    // Add some randomness within the segment for realism?
    // No, for functional clarity, landing exactly center is better for debugging,
    // but let's add a tiny random offset +/- 40% of segment width
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);

    const finalRotation = currentRotation + baseRotation + targetRotation + randomOffset;

    // Normalize currentRotation to keep numbers manageable?
    // Actually just adding to previous works fine for CSS transform.
    // But we need to ensure the visual alignment is correct.
    // Since we are adding to currentRotation, we need to calculate the delta.
    // Easier: Just set transform to a huge number.

    // Let's recalculate absolute rotation needed to land on specific index from 0
    // But we want it to spin from current position.
    // Let's just use a large random rotation that ends on the correct angle modulo 360.

    const spins = 5 + Math.floor(Math.random() * 3);
    const totalDegrees = (spins * 360) + (360 - (winningIndex * segmentAngle));

    // Adjust currentRotation to be close to a multiple of 360 before adding?
    // No, let's just accumulate.
    // Wait, if currentRotation is 1000, and we add 2000, it's 3000.
    // The visual result is 3000 % 360.
    // We need (currentRotation + delta) % 360 == targetAngle.

    const currentMod = currentRotation % 360;
    let delta = totalDegrees - currentMod;
    if (delta < 0) delta += 360; // Ensure positive spin

    const newRotation = currentRotation + delta + (360 * 5); // Add extra spins for duration

    wheelEl.style.transform = `rotate(${newRotation}deg)`;
    currentRotation = newRotation;

    // Ball Animation (Simple scale/fade)
    const ball = document.getElementById('ball');
    ball.style.display = 'block';
    ball.style.transition = 'none';
    ball.style.transform = `translate(-50%, -50%) rotate(0deg) translate(180px)`; // Start outer

    setTimeout(() => {
        ball.style.transition = 'transform 4s ease-out';
        // Ball moves slightly inward as wheel slows? Hard to sync perfectly without canvas.
        // Simplified: Ball stays visible, wheel spins.
    }, 100);

    // Wait for animation to finish
    setTimeout(() => {
        resolveSpin(winningNumber);
    }, 5000);
}

function resolveSpin(number) {
    isSpinning = false;
    wheelCenterEl.textContent = number;

    let color = 'green';
    if (RED_NUMBERS.includes(number)) color = 'red';
    else if (number !== 0) color = 'black';

    log(`Résultat: ${number} (${color.toUpperCase()})`);

    // Calculate Winnings
    let p1Win = 0;
    let p2Win = 0;

    players[0].bets.forEach(bet => {
        if (checkWin(bet, number)) {
            const payout = getBetPayout(bet, number);
            const winAmount = bet.amount * payout;
            p1Win += winAmount + bet.amount; // Return stake + win
            log(`${players[0].name} gagne ${winAmount}€ sur ${bet.label}`);
        }
    });

    players[1].bets.forEach(bet => {
        if (checkWin(bet, number)) {
            const payout = getBetPayout(bet, number);
            const winAmount = bet.amount * payout;
            p2Win += winAmount + bet.amount;
            log(`${players[1].name} gagne ${winAmount}€ sur ${bet.label}`);
        }
    });

    players[0].balance += p1Win;
    players[1].balance += p2Win;

    players[0].bets = [];
    players[1].bets = [];

    // Clear chips from board
    document.querySelectorAll('.chip-on-board').forEach(c => c.remove());

    // Show Result Modal
    resultNumberEl.textContent = number;
    resultNumberEl.style.color = color === 'red' ? 'var(--red)' : (color === 'black' ? '#fff' : 'var(--felt-green)');
    resultColorEl.textContent = color === 'red' ? 'ROUGE' : (color === 'black' ? 'NOIR' : 'ZÉRO');
    resultColorEl.style.color = color === 'red' ? 'var(--red)' : (color === 'black' ? '#ccc' : 'var(--felt-green)');

    let msg = "";
    if (p1Win > 0 && p2Win > 0) msg = "Les deux joueurs gagnent !";
    else if (p1Win > 0) msg = `${players[0].name} Gagne ${p1Win}€ !`;
    else if (p2Win > 0) msg = `${players[1].name} Gagne ${p2Win}€ !`;
    else msg = "La banque gagne.";

    winnerTextEl.textContent = msg;
    resultOverlay.classList.add('active');

    updateUI();
}

function checkWin(bet, number) {
    if (bet.type === 'number') return parseInt(bet.label) === number;
    if (bet.type === 'color') {
        if (number === 0) return false;
        const isRed = RED_NUMBERS.includes(number);
        return (bet.label === 'ROUGE' && isRed) || (bet.label === 'NOIR' && !isRed);
    }
    if (bet.type === 'even') return number !== 0 && number % 2 === 0;
    if (bet.type === 'odd') return number !== 0 && number % 2 !== 0;
    if (bet.type === 'range') {
        const [min, max] = JSON.parse(bet.target.dataset.val);
        return number >= min && number <= max;
    }
    return false;
}

function getBetPayout(bet, number) {
    if (bet.type === 'number') return 35;
    return 1; // 1:1 for all others
}

function nextRound() {
    resultOverlay.classList.remove('active');
    // Switch turn? Or keep simultaneous?
    // Let's keep simultaneous betting but maybe highlight who lost most?
    // For simplicity, just reset focus to P1 or keep current.
    // Let's toggle active player for fairness in UI focus, though both can bet.
    currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    updateUI();
    log("--- Nouveau Tour ---");
}

function log(msg) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (msg.includes('Gagne')) div.classList.add('log-win');
    if (msg.includes('retire') || msg.includes('insuffisants')) div.classList.add('log-loss');
    div.textContent = `> ${msg}`;
    logEl.prepend(div);
}

// --- Event Listeners ---
chipSelectorEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedChipValue = parseInt(e.target.dataset.value);
    }
});

spinBtn.addEventListener('click', spinWheel);
clearBtn.addEventListener('click', clearBets);
nextRoundBtn.addEventListener('click', nextRound);

// Start
initWheel();
initBoard();
updateUI();