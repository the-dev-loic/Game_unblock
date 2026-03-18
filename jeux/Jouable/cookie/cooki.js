// --- Game Configuration & Data ---

const BUILDINGS_DATA = [
    { id: 'cursor', name: 'Cursor', baseCost: 15, cps: 0.1, iconPos: '0% 25%', desc: 'Autoclicks once every 10 seconds.' },
    { id: 'grandma', name: 'Grandma', baseCost: 100, cps: 1, iconPos: '33% 25%', desc: 'A nice grandma to bake more cookies.' },
    { id: 'farm', name: 'Cookie Farm', baseCost: 1100, cps: 8, iconPos: '66% 25%', desc: 'Growing cookies from cookie seeds.' },
    { id: 'mine', name: 'Sugar Mine', baseCost: 12000, cps: 47, iconPos: '0% 50%', desc: 'Mining deep earth sugar.' },
    { id: 'factory', name: 'Factory', baseCost: 130000, cps: 260, iconPos: '33% 50%', desc: 'Mass production of cookies.' },
    { id: 'bank', name: 'Bank', baseCost: 1400000, cps: 1400, iconPos: '66% 50%', desc: 'Generates cookies from interest.' },
    { id: 'temple', name: 'Temple', baseCost: 20000000, cps: 7800, iconPos: '0% 75%', desc: 'Full of precious chocolate.' },
    { id: 'wizard', name: 'Wizard Tower', baseCost: 330000000, cps: 44000, iconPos: '33% 75%', desc: 'Summons cookies with magic spells.' },
    { id: 'shipment', name: 'Shipment', baseCost: 5100000000, cps: 260000, iconPos: '66% 75%', desc: 'Brings cookies from the cookie planet.' },
    { id: 'alchemy', name: 'Alchemy Lab', baseCost: 75000000000, cps: 1600000, iconPos: '0% 100%', desc: 'Turns gold into cookies.' },
    { id: 'portal', name: 'Portal', baseCost: 1000000000000, cps: 10000000, iconPos: '33% 100%', desc: 'Opens a door to the Cookieverse.' },
    { id: 'timemachine', name: 'Time Machine', baseCost: 14000000000000, cps: 65000000, iconPos: '66% 100%', desc: 'Brings cookies from the past.' }
];

const UPGRADES_DATA = [
    { id: 'u_cursor_1', name: 'Plastic Mouse', cost: 500, trigger: 10, type: 'click', mult: 2, desc: 'Clicking is twice as efficient.', iconPos: '0% 25%' },
    { id: 'u_grandma_1', name: 'Iron Rolling Pin', cost: 1000, trigger: 'grandma', count: 10, type: 'building', target: 'grandma', mult: 2, desc: 'Grandmas are twice as efficient.', iconPos: '33% 25%' },
    { id: 'u_farm_1', name: 'Fertilizer', cost: 11000, trigger: 'farm', count: 10, type: 'building', target: 'farm', mult: 2, desc: 'Farms are twice as efficient.', iconPos: '66% 25%' },
    { id: 'u_click_2', name: 'Carpal Tunnel Prevention', cost: 50000, trigger: 500, type: 'click', mult: 2, desc: 'Clicking is twice as efficient.', iconPos: '0% 50%' },
    { id: 'u_factory_1', name: 'Sturdier Conveyor Belts', cost: 1300000, trigger: 'factory', count: 10, type: 'building', target: 'factory', mult: 2, desc: 'Factories are twice as efficient.', iconPos: '33% 50%' },
    { id: 'u_golden', name: 'Golden Cookie', cost: 1000000, trigger: 10000, type: 'special', mult: 1, desc: 'Golden cookies appear more often.', iconPos: '33% 0%' }
];

// --- Game State ---

let game = {
    cookies: 0,
    totalCookiesEarned: 0,
    starchips: 0,
    buildings: {}, // { cursor: 5, grandma: 2 ... }
    upgrades: [], // ['u_cursor_1', ...]
    startTime: Date.now()
};

// Initialize buildings count to 0
BUILDINGS_DATA.forEach(b => game.buildings[b.id] = 0);

// --- Core Logic ---

function getCPS() {
    let cps = 0;
    BUILDINGS_DATA.forEach(b => {
        let count = game.buildings[b.id];
        let multiplier = 1;

        // Apply building-specific upgrades
        UPGRADES_DATA.forEach(u => {
            if (u.type === 'building' && u.target === b.id && game.upgrades.includes(u.id)) {
                multiplier *= u.mult;
            }
        });

        cps += count * b.cps * multiplier;
    });

    // Apply Global Starchip Multiplier
    const globalMult = 1 + (game.starchips * 0.10);
    return cps * globalMult;
}

function getClickPower() {
    let power = 1;
    // Base click power scales slightly with CPS to prevent clicking from becoming useless
    power += getCPS() * 0.05;

    UPGRADES_DATA.forEach(u => {
        if (u.type === 'click' && game.upgrades.includes(u.id)) {
            power *= u.mult;
        }
    });

    const globalMult = 1 + (game.starchips * 0.10);
    return power * globalMult;
}

function getBuildingCost(id) {
    const base = BUILDINGS_DATA.find(b => b.id === id).baseCost;
    const count = game.buildings[id];
    return Math.floor(base * Math.pow(1.15, count));
}

function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return Math.floor(num).toLocaleString();
}

// --- Actions ---

function clickCookie(e) {
    const power = getClickPower();
    addCookies(power);

    // Visuals
    createFloatingText(e.clientX, e.clientY, `+${formatNumber(power)}`);

    // Animation reset
    const btn = document.getElementById('bigCookieBtn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 50);
}

function addCookies(amount) {
    game.cookies += amount;
    game.totalCookiesEarned += amount;
    updateUI();
}

function buyBuilding(id) {
    const cost = getBuildingCost(id);
    if (game.cookies >= cost) {
        game.cookies -= cost;
        game.buildings[id]++;
        updateUI();
        renderBuildings(); // Re-render to update costs
    }
}

function buyUpgrade(id) {
    const upgrade = UPGRADES_DATA.find(u => u.id === id);
    if (game.cookies >= upgrade.cost && !game.upgrades.includes(id)) {
        game.cookies -= upgrade.cost;
        game.upgrades.push(id);
        updateUI();
        renderUpgrades();
        renderBuildings(); // Costs might change if upgrades affect display logic (not here but good practice)
    }
}

// --- Rebirth System ---

function calculateStarchipsGain() {
    // Formula: 1 Starchip per 1 Trillion lifetime cookies, scaled exponentially
    // Simplified: sqrt(lifetimeCookies / 1e12)
    if (game.totalCookiesEarned < 1e12) return 0;
    return Math.floor(Math.sqrt(game.totalCookiesEarned / 1e12));
}

function openRebirthModal() {
    const gain = calculateStarchipsGain();
    if (gain <= 0) {
        alert("You need at least 1 Trillion lifetime cookies to ascend!");
        return;
    }

    document.getElementById('modalCurrentCookies').innerText = formatNumber(game.totalCookiesEarned);
    document.getElementById('modalStarchipsGain').innerText = formatNumber(gain);
    document.getElementById('rebirthModal').classList.remove('hidden');
}

function confirmRebirth() {
    const gain = calculateStarchipsGain();

    // Reset Game but keep Starchips
    game.cookies = 0;
    game.totalCookiesEarned = 0;
    game.starchips += gain;
    game.upgrades = [];
    BUILDINGS_DATA.forEach(b => game.buildings[b.id] = 0);

    saveGame();
    location.reload(); // Simple reload to refresh state cleanly
}

function closeRebirthModal() {
    document.getElementById('rebirthModal').classList.add('hidden');
}

// --- UI Rendering ---

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-number';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (tabName === 'buildings') {
        document.getElementById('buildingsList').classList.remove('hidden');
        document.getElementById('upgradesList').classList.add('hidden');
    } else {
        document.getElementById('buildingsList').classList.add('hidden');
        document.getElementById('upgradesList').classList.remove('hidden');
        renderUpgrades();
    }
}

function renderBuildings() {
    const container = document.getElementById('buildingsList');
    container.innerHTML = '';

    BUILDINGS_DATA.forEach(b => {
        const count = game.buildings[b.id];
        const cost = getBuildingCost(b.id);
        const affordable = game.cookies >= cost;

        const div = document.createElement('div');
        div.className = `item-card ${affordable ? 'affordable' : ''}`;
        div.onclick = () => buyBuilding(b.id);

        div.innerHTML = `
            <div class="item-icon" style="background-position: ${b.iconPos}"></div>
            <div class="item-info">
                <div class="item-name">${b.name}</div>
                <div class="item-cost">🍪 ${formatNumber(cost)}</div>
                <div class="item-desc">+${formatNumber(b.cps)} CPS</div>
            </div>
            <div class="item-count">${count}</div>
        `;
        container.appendChild(div);
    });
}

function renderUpgrades() {
    const container = document.getElementById('upgradesList');
    container.innerHTML = '';

    UPGRADES_DATA.forEach(u => {
        // Check if already bought
        if (game.upgrades.includes(u.id)) return;

        // Check visibility trigger
        let visible = false;
        if (typeof u.trigger === 'number') {
            if (game.totalCookiesEarned >= u.trigger) visible = true;
        } else if (typeof u.trigger === 'string') {
            if (game.buildings[u.trigger] >= u.count) visible = true;
        }

        if (visible) {
            const affordable = game.cookies >= u.cost;
            const div = document.createElement('div');
            div.className = `item-card ${affordable ? 'affordable' : ''}`;
            div.onclick = () => buyUpgrade(u.id);

            div.innerHTML = `
                <div class="item-icon" style="background-position: ${u.iconPos}"></div>
                <div class="item-info">
                    <div class="item-name">${u.name}</div>
                    <div class="item-cost">🍪 ${formatNumber(u.cost)}</div>
                    <div class="item-desc">${u.desc}</div>
                </div>
            `;
            container.appendChild(div);
        }
    });

    if (container.innerHTML === '') {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#555;">No upgrades available yet.</div>';
    }
}

function updateUI() {
    document.getElementById('cookieCount').innerText = formatNumber(game.cookies);
    document.getElementById('cpsDisplay').innerText = formatNumber(getCPS());
    document.getElementById('starchipsEl').innerText = formatNumber(game.starchips);
    document.getElementById('multiplierEl').innerText = (1 + game.starchips * 0.10).toFixed(1);

    // Update Building Affordability Styles without full re-render
    const buildingCards = document.getElementById('buildingsList').children;
    BUILDINGS_DATA.forEach((b, index) => {
        if (buildingCards[index]) {
            const cost = getBuildingCost(b.id);
            if (game.cookies >= cost) buildingCards[index].classList.add('affordable');
            else buildingCards[index].classList.remove('affordable');
        }
    });

    // Show Rebirth Button if eligible
    const rebirthBtn = document.getElementById('rebirthBtn');
    if (calculateStarchipsGain() > 0) {
        rebirthBtn.classList.remove('hidden');
    } else {
        rebirthBtn.classList.add('hidden');
    }
}

// --- Game Loop & Save System ---

let lastTime = Date.now();
let saveTimer = 0;

function gameLoop() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (!document.hidden) {
        const cps = getCPS();
        if (cps > 0) {
            addCookies(cps * dt);
        }
    }

    // Auto-save every 30s
    saveTimer += dt;
    if (saveTimer > 30) {
        saveGame();
        saveTimer = 0;
    }

    requestAnimationFrame(gameLoop);
}

function saveGame() {
    localStorage.setItem('cosmicCookieSave', JSON.stringify(game));
}

function loadGame() {
    const saved = localStorage.getItem('cosmicCookieSave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge save with default game structure to handle updates
            game = { ...game, ...parsed };
            // Ensure buildings object exists for new buildings if version changed
            BUILDINGS_DATA.forEach(b => {
                if (typeof game.buildings[b.id] === 'undefined') {
                    game.buildings[b.id] = 0;
                }
            });
        } catch (e) {
            console.error("Save file corrupted");
        }
    }
}

// --- Initialization ---

document.getElementById('bigCookieBtn').addEventListener('mousedown', clickCookie);
document.getElementById('rebirthBtn').addEventListener('click', openRebirthModal);
document.getElementById('confirmRebirthBtn').addEventListener('click', confirmRebirth);

loadGame();
renderBuildings();
updateUI();
gameLoop();