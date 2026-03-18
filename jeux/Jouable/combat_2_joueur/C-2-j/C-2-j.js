let playerClasses = {
    player1: 'tank',
    player2: 'tank'
};

function selectClass(playerNum, classType) {
    playerClasses[`player${playerNum}`] = classType;

    // Mettre à jour les boutons
    ['tank', 'ninja', 'mage', 'sniper'].forEach(type => {
        const btn = document.getElementById(`p${playerNum}-${type}`);
        if (btn) {
            if (type === classType) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        }
    });

    // Mettre à jour les contrôles affichés
    const controlsDiv = document.getElementById(`p${playerNum}-controls`);
    const moveKeys = playerNum === 1 ? 'Q / D' : '← / →';
    const jumpKey = playerNum === 1 ? 'W' : '↑';
    const descendKey = playerNum === 1 ? 'S' : '↓';
    const attackKey = playerNum === 1 ? 'E' : 'K';
    const specialKey = playerNum === 1 ? 'R' : 'L';

    controlsDiv.innerHTML = `
                <strong>${moveKeys}</strong> - Déplacer<br>
                <strong>${jumpKey}</strong> - Sauter | <strong>${descendKey}</strong> - Descendre<br>
                <strong>${attackKey}</strong> - Tir<br>
                <strong>${specialKey}</strong> - Rafale
            `;
}

function startGame() {
    document.getElementById('startMenu').classList.add('hidden');

    // Appliquer les stats selon la classe
    applyClassStats(game.player1, playerClasses.player1, 1);
    applyClassStats(game.player2, playerClasses.player2, 2);

    // Afficher le compte à rebours
    showCountdown();
}

function applyClassStats(player, classType, playerNum) {
    switch(classType) {
        case 'tank':
            player.health = 200; // +HP
            player.maxHealth = 200;
            player.speed = 4; // Lent
            break;
        case 'ninja':
            player.health = 100; // -HP
            player.maxHealth = 100;
            player.speed = 9; // Rapide
            player.canDoubleJump = true;
            player.hasDoubleJumped = false;
            break;
        case 'mage':
            player.health = 150;
            player.maxHealth = 150;
            player.speed = 6;
            player.projectileSize = 'large'; // Gros projectiles
            break;
        case 'sniper':
            player.health = 150;
            player.maxHealth = 150;
            player.speed = 6;
            player.sniperMode = true; // Tir lent mais puissant
            break;
    }
    updateHealth(playerNum, player.health);
}

function showCountdown() {
    const countdownDiv = document.createElement('div');
    countdownDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 8em;
                font-weight: bold;
                color: #ffd93d;
                text-shadow: 0 0 30px rgba(255, 217, 61, 0.8);
                z-index: 1000;
                animation: pulse 0.5s ease-in-out;
            `;
    document.body.appendChild(countdownDiv);

    let count = 3;
    countdownDiv.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDiv.textContent = count;
        } else if (count === 0) {
            countdownDiv.textContent = 'COMBAT !';
            countdownDiv.style.color = '#ff6b6b';
        } else {
            clearInterval(interval);
            countdownDiv.remove();
            game.started = true;
        }
    }, 1000);
}

function endGame(winner) {
    document.getElementById('winnerText').textContent = `Joueur ${winner} gagne !`;
    document.getElementById('gameOver').classList.add('show');

    // Mettre à jour le score dans sessionStorage
    let scores = JSON.parse(sessionStorage.getItem('combatScores') || '{"player1": 0, "player2": 0}');
    scores[`player${winner}`]++;
    sessionStorage.setItem('combatScores', JSON.stringify(scores));

    // Afficher les scores
    updateScoreDisplay();
}

function updateScoreDisplay() {
    let scores = JSON.parse(sessionStorage.getItem('combatScores') || '{"player1": 0, "player2": 0}');
    document.getElementById('score1').textContent = scores.player1;
    document.getElementById('score2').textContent = scores.player2;
}

const game = {
    player1: {
        element: document.getElementById('player1'),
        health: 150,
        energy: 100,
        x: 100,
        speed: 6,
        isJumping: false,
        attackCooldown: 0,
        specialCooldown: 0,
        facingRight: true
    },
    player2: {
        element: document.getElementById('player2'),
        health: 150,
        energy: 100,
        x: window.innerWidth - 180,
        speed: 6,
        isJumping: false,
        attackCooldown: 0,
        specialCooldown: 0,
        facingRight: false
    },
    projectiles: [],
    keys: {},
    started: false
};

document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;

    // Bloquer les actions pendant le compte à rebours
    if (!game.started) return;

    // Actions immédiates
    if (e.key.toLowerCase() === 'w' && !game.player1.isJumping) {
        jump(game.player1);
    }
    if (e.key.toLowerCase() === 's') {
        dropThroughPlatform(game.player1);
    }
    if (e.key === 'ArrowUp' && !game.player2.isJumping) {
        jump(game.player2);
    }
    if (e.key === 'ArrowDown') {
        dropThroughPlatform(game.player2);
    }
    if (e.key.toLowerCase() === 'e' && game.player1.attackCooldown === 0) {
        attack(game.player1, 1);
    }
    if (e.key.toLowerCase() === 'k' && game.player2.attackCooldown === 0) {
        attack(game.player2, 2);
    }
    if (e.key.toLowerCase() === 'r' && game.player1.specialCooldown === 0 && game.player1.energy >= 40) {
        specialAttack(game.player1, 1);
    }
    if (e.key.toLowerCase() === 'l' && game.player2.specialCooldown === 0 && game.player2.energy >= 40) {
        specialAttack(game.player2, 2);
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

function getPlayerHeight(player) {
    // Définir les 5 plateformes
    const platforms = [
        { left: (window.innerWidth / 2) - 100, right: (window.innerWidth / 2) + 100, bottom: 200 }, // Centre
        { left: (window.innerWidth * 0.2) - 100, right: (window.innerWidth * 0.2) + 100, bottom: 150 }, // Gauche
        { left: (window.innerWidth * 0.8) - 100, right: (window.innerWidth * 0.8) + 100, bottom: 150 }, // Droite
        { left: (window.innerWidth * 0.35) - 75, right: (window.innerWidth * 0.35) + 75, bottom: 300 }, // Haut gauche
        { left: (window.innerWidth * 0.65) - 75, right: (window.innerWidth * 0.65) + 75, bottom: 300 }  // Haut droite
    ];

    if (!player.isJumping && !player.isDropping) {
        // Vérifier si le joueur est sur une plateforme (de la plus haute à la plus basse)
        const sortedPlatforms = [...platforms].sort((a, b) => b.bottom - a.bottom);
        for (const platform of sortedPlatforms) {
            if (player.x + 40 > platform.left && player.x + 40 < platform.right) {
                return platform.bottom + 20;
            }
        }
        return 80; // Au sol
    }

    // Si en train de descendre, ne pas atterrir sur les plateformes temporairement
    if (player.isDropping) {
        // Tomber vers le sol ou la prochaine plateforme en dessous
        const currentTime = Date.now();
        const dropProgress = Math.min((currentTime - player.dropStartTime) / 500, 1);

        // Trouver la plateforme de départ
        let startHeight = 80;
        for (const platform of platforms) {
            if (player.x + 40 > platform.left && player.x + 40 < platform.right) {
                if (!player.ignorePlatformUntil || currentTime < player.ignorePlatformUntil) {
                    continue; // Ignorer cette plateforme
                }
                startHeight = platform.bottom + 20;
                break;
            }
        }

        // Descendre progressivement
        const targetHeight = 80; // Aller au sol
        return startHeight - (startHeight - targetHeight) * dropProgress;
    }

    const elapsed = Date.now() - player.jumpStartTime;
    const progress = Math.min(elapsed / 1000, 1);

    // Calculer la hauteur de base du saut
    let baseHeight = 80;

    // Vérifier si le joueur était sur une plateforme au début du saut
    for (const platform of platforms) {
        if (player.jumpStartX + 40 > platform.left && player.jumpStartX + 40 < platform.right) {
            baseHeight = platform.bottom + 20;
            break;
        }
    }

    let height;
    if (progress < 0.3) {
        const upProgress = progress / 0.3;
        height = baseHeight + (270 * upProgress);
    } else {
        const downProgress = (progress - 0.3) / 0.7;
        height = baseHeight + 270 - (270 * downProgress);
    }

    // Vérifier collision avec les plateformes UNIQUEMENT en descendant (progress > 0.3)
    if (progress > 0.3) {
        const sortedPlatforms = [...platforms].sort((a, b) => b.bottom - a.bottom);
        for (const platform of sortedPlatforms) {
            if (height <= platform.bottom + 20 && height >= platform.bottom - 10) {
                if (player.x + 40 > platform.left && player.x + 40 < platform.right) {
                    if (baseHeight > platform.bottom + 20 || (baseHeight + 270) > platform.bottom + 20) {
                        return platform.bottom + 20;
                    }
                }
            }
        }
    }

    return Math.max(height, 80);
}

function jump(player) {
    // Vérifier si c'est un Ninja qui peut double jump
    if (player.canDoubleJump && player.isJumping && !player.hasDoubleJumped) {
        // Double jump! Réinitialiser le saut
        player.hasDoubleJumped = true;
        player.jumpStartTime = Date.now();
        player.jumpStartX = player.x;

        // Animation visuelle du double saut
        player.element.style.transform = 'scale(3.3)';
        setTimeout(() => {
            player.element.style.transform = '';
        }, 100);
        return;
    }

    if (player.isJumping) return; // Pas de saut si déjà en train de sauter

    player.isJumping = true;
    player.jumpStartTime = Date.now();
    player.jumpStartX = player.x;
    player.hasDoubleJumped = false; // Reset pour le Ninja
    player.element.classList.add('jump-animation');

    if (player.jumpInterval) clearInterval(player.jumpInterval);
    player.jumpInterval = setInterval(() => {
        if (Date.now() - player.jumpStartTime >= 1000) {
            player.isJumping = false;
            player.hasDoubleJumped = false;
            player.element.classList.remove('jump-animation');
            clearInterval(player.jumpInterval);
        }
    }, 16);
}

function dropThroughPlatform(player) {
    if (player.isJumping || player.isDropping) return; // Ne pas descendre pendant un saut ou drop

    const currentHeight = getPlayerHeight(player);

    // Si on est sur une plateforme (pas au sol)
    if (currentHeight > 80) {
        // Marquer comme en train de descendre
        player.isDropping = true;
        player.dropStartTime = Date.now();

        // Placer le joueur juste en dessous de la plateforme actuelle
        // pour qu'il tombe naturellement
        const platforms = [
            { left: (window.innerWidth / 2) - 100, right: (window.innerWidth / 2) + 100, bottom: 200 },
            { left: (window.innerWidth * 0.2) - 100, right: (window.innerWidth * 0.2) + 100, bottom: 150 },
            { left: (window.innerWidth * 0.8) - 100, right: (window.innerWidth * 0.8) + 100, bottom: 150 },
            { left: (window.innerWidth * 0.35) - 75, right: (window.innerWidth * 0.35) + 75, bottom: 300 },
            { left: (window.innerWidth * 0.65) - 75, right: (window.innerWidth * 0.65) + 75, bottom: 300 }
        ];

        // Trouver la plateforme actuelle
        for (const platform of platforms) {
            if (player.x + 40 > platform.left && player.x + 40 < platform.right &&
                currentHeight >= platform.bottom + 15 && currentHeight <= platform.bottom + 25) {
                // On est sur cette plateforme, ignorer sa collision pendant 500ms
                player.ignorePlatformUntil = Date.now() + 500;
                break;
            }
        }

        setTimeout(() => {
            player.isDropping = false;
        }, 500);
    }
}

function attack(player, playerNum) {
    const classType = playerClasses[`player${playerNum}`];

    // Déterminer le cooldown selon la classe
    let cooldown = 25;
    let damage = 10;
    let projectileSpeed = 10;

    if (player.sniperMode) {
        cooldown = 50; // Tir lent
        damage = 25; // Puissant
    }

    player.attackCooldown = cooldown;
    player.element.querySelector('.arm.right').classList.add('attack-animation');

    const playerHeight = getPlayerHeight(player);
    const direction = player.facingRight ? 1 : -1;

    const projectile = {
        element: document.createElement('div'),
        x: player.x + 40,
        y: playerHeight + 90,
        speed: direction * projectileSpeed,
        player: playerNum,
        damage: damage
    };

    projectile.element.className = `projectile player${playerNum}`;

    // Appliquer la taille selon la classe
    if (player.projectileSize === 'large') {
        projectile.element.style.width = '50px';
        projectile.element.style.height = '30px';
    }

    projectile.element.style.left = projectile.x + 'px';
    projectile.element.style.bottom = projectile.y + 'px';
    document.querySelector('.game-container').appendChild(projectile.element);
    game.projectiles.push(projectile);

    setTimeout(() => {
        player.element.querySelector('.arm.right').classList.remove('attack-animation');
    }, 200);
}

function specialAttack(player, playerNum) {
    player.specialCooldown = 80;
    player.energy -= 40;
    updateEnergy(playerNum, player.energy);

    const playerHeight = getPlayerHeight(player);
    const direction = player.facingRight ? 1 : -1;

    const effect = document.createElement('div');
    effect.className = 'special-effect';
    effect.style.left = player.x + 'px';
    effect.style.bottom = (playerHeight + 70) + 'px';
    effect.style.background = playerNum === 1 ?
        'radial-gradient(circle, #ff6b6b 0%, transparent 70%)' :
        'radial-gradient(circle, #4ecdc4 0%, transparent 70%)';
    document.querySelector('.game-container').appendChild(effect);

    // Rafale de 3 projectiles en éventail
    for (let i = -1; i <= 1; i++) {
        setTimeout(() => {
            const projectile = {
                element: document.createElement('div'),
                x: player.x + 40,
                y: playerHeight + 90 + (i * 30),
                speed: direction * 12,
                player: playerNum,
                damage: 15
            };

            projectile.element.className = `projectile player${playerNum}`;

            // Appliquer la taille selon la classe
            if (player.projectileSize === 'large') {
                projectile.element.style.width = '50px';
                projectile.element.style.height = '30px';
            }

            projectile.element.style.left = projectile.x + 'px';
            projectile.element.style.bottom = projectile.y + 'px';
            document.querySelector('.game-container').appendChild(projectile.element);
            game.projectiles.push(projectile);
        }, Math.abs(i) * 100);
    }

    setTimeout(() => effect.remove(), 500);
}

function updateHealth(playerNum, health) {
    const healthBar = document.getElementById(`health${playerNum}`);
    const player = playerNum === 1 ? game.player1 : game.player2;
    const maxHealth = player.maxHealth || 150;

    health = Math.max(0, health);
    const percentage = (health / maxHealth) * 100;
    healthBar.style.width = percentage + '%';
    healthBar.textContent = Math.floor(health);

    if (health <= 0) {
        endGame(playerNum === 1 ? 2 : 1);
    }
}

function updateEnergy(playerNum, energy) {
    const energyBar = document.getElementById(`energy${playerNum}`);
    energyBar.style.width = energy + '%';
}

function showDamage(x, y, damage) {
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.textContent = '-' + damage;
    damageText.style.left = x + 'px';
    damageText.style.bottom = y + 'px';
    document.querySelector('.game-container').appendChild(damageText);
    setTimeout(() => damageText.remove(), 1000);
}

function createHitEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.style.left = x + 'px';
    effect.style.bottom = y + 'px';
    document.querySelector('.game-container').appendChild(effect);
    setTimeout(() => effect.remove(), 300);
}

function checkCollision(proj, player, playerNum) {
    const playerHeight = getPlayerHeight(player);

    const projRect = {
        left: proj.x,
        right: proj.x + 20,
        bottom: proj.y,
        top: proj.y + 20
    };

    const playerRect = {
        left: player.x,
        right: player.x + 80,
        bottom: playerHeight,
        top: playerHeight + 120
    };

    if (projRect.right > playerRect.left &&
        projRect.left < playerRect.right &&
        projRect.bottom < playerRect.top &&
        projRect.top > playerRect.bottom) {

        const damage = proj.damage || 10;
        player.health -= damage;
        updateHealth(playerNum, player.health);
        showDamage(player.x + 40, playerHeight + 60, damage);
        createHitEffect(proj.x, proj.y);
        return true;
    }
    return false;
}

function endGame(winner) {
    document.getElementById('winnerText').textContent = `Joueur ${winner} gagne !`;
    document.getElementById('gameOver').classList.add('show');
}

function restartGame() {
    game.player1.health = 150;
    game.player1.energy = 100;
    game.player1.x = 100;
    game.player2.health = 150;
    game.player2.energy = 100;
    game.player2.x = window.innerWidth - 180;
    game.started = false;

    updateHealth(1, 150);
    updateHealth(2, 150);
    updateEnergy(1, 100);
    updateEnergy(2, 100);

    game.projectiles.forEach(p => p.element.remove());
    game.projectiles = [];

    document.getElementById('gameOver').classList.remove('show');
    document.getElementById('startMenu').classList.remove('hidden');
}

function gameLoop() {
    // Bloquer les mouvements pendant le compte à rebours
    if (game.started) {
        // Mouvements
        if (game.keys['q'] || game.keys['a']) {
            game.player1.x = Math.max(0, game.player1.x - game.player1.speed);
            game.player1.facingRight = false;
        }
        if (game.keys['d']) {
            game.player1.x = Math.min(window.innerWidth - 80, game.player1.x + game.player1.speed);
            game.player1.facingRight = true;
        }
        if (game.keys['arrowleft']) {
            game.player2.x = Math.max(0, game.player2.x - game.player2.speed);
            game.player2.facingRight = false;
        }
        if (game.keys['arrowright']) {
            game.player2.x = Math.min(window.innerWidth - 80, game.player2.x + game.player2.speed);
            game.player2.facingRight = true;
        }
    }

    // Mettre à jour la position et l'orientation
    game.player1.element.style.left = game.player1.x + 'px';
    game.player2.element.style.left = game.player2.x + 'px';

    // Mettre à jour la hauteur visuelle des joueurs
    const p1Height = getPlayerHeight(game.player1);
    const p2Height = getPlayerHeight(game.player2);
    game.player1.element.style.bottom = p1Height + 'px';
    game.player2.element.style.bottom = p2Height + 'px';

    // Appliquer le retournement visuel
    if (game.player1.facingRight) {
        game.player1.element.classList.remove('flipped');
    } else {
        game.player1.element.classList.add('flipped');
    }

    if (game.player2.facingRight) {
        game.player2.element.classList.remove('flipped');
    } else {
        game.player2.element.classList.add('flipped');
    }

    // Cooldowns
    if (game.player1.attackCooldown > 0) game.player1.attackCooldown--;
    if (game.player2.attackCooldown > 0) game.player2.attackCooldown--;
    if (game.player1.specialCooldown > 0) game.player1.specialCooldown--;
    if (game.player2.specialCooldown > 0) game.player2.specialCooldown--;

    // Régénération d'énergie
    if (game.player1.energy < 100) {
        game.player1.energy = Math.min(100, game.player1.energy + 0.4);
        updateEnergy(1, game.player1.energy);
    }
    if (game.player2.energy < 100) {
        game.player2.energy = Math.min(100, game.player2.energy + 0.4);
        updateEnergy(2, game.player2.energy);
    }

    // Projectiles
    game.projectiles = game.projectiles.filter(proj => {
        proj.x += proj.speed;
        proj.element.style.left = proj.x + 'px';

        if (proj.x < -50 || proj.x > window.innerWidth + 50) {
            proj.element.remove();
            return false;
        }

        if (proj.player === 1 && checkCollision(proj, game.player2, 2)) {
            proj.element.remove();
            return false;
        }
        if (proj.player === 2 && checkCollision(proj, game.player1, 1)) {
            proj.element.remove();
            return false;
        }

        return true;
    });

    requestAnimationFrame(gameLoop);
}

gameLoop();

// Afficher les scores au chargement
updateScoreDisplay();