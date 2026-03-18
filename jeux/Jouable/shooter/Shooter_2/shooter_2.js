import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Configuration & État Global ---
const CONFIG = {
    speed: 15,
    gravity: 30,
    baseEnemySpeed: 8,
    baseSpawnRate: 2000,
    aimTimeLimit: 60, // secondes pour le mode Aim
};

let settings = {
    sensitivity: 1.0
};

// Charger les paramètres
const savedSens = localStorage.getItem('neonFPS_sensitivity');
if (savedSens) {
    settings.sensitivity = parseFloat(savedSens);
    document.getElementById('sens-slider').value = settings.sensitivity;
    document.getElementById('sens-value').innerText = settings.sensitivity;
}

// Variables Jeu
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let enemies = [];
let particles = [];
let score = 0;
let health = 100;
let wave = 1;
let gameMode = 'survival'; // 'survival' ou 'aim'
let gameTime = 0;
let isGameActive = false;
let lastSpawnTime = 0;
let gunMesh;
let gunRecoil = 0;

// DOM Elements
const ui = {
    scoreEl: document.getElementById('score'),
    waveEl: document.getElementById('wave'),
    timeEl: document.getElementById('time'),
    healthFill: document.getElementById('health-fill'),
    healthContainer: document.getElementById('health-bar-container'),
    menuOverlay: document.getElementById('menu-overlay'),
    mainMenu: document.getElementById('main-menu'),
    gameoverMenu: document.getElementById('gameover-menu'),
    titleText: document.getElementById('title-text'),
    subtitleText: document.getElementById('subtitle-text'),
    finalScore: document.getElementById('final-score'),
    damageOverlay: document.getElementById('damage-overlay'),
    settingsModal: document.getElementById('settings-modal'),
    sensSlider: document.getElementById('sens-slider'),
    sensValue: document.getElementById('sens-value'),
    waveDisplay: document.getElementById('wave-display'),
    timeDisplay: document.getElementById('time-display')
};

// Gestionnaire de jeu
const game = {
    init: () => {
        // Scène
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);
        scene.fog = new THREE.FogExp2(0x050505, 0.02);

        // Caméra
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.y = 1.6;

        // Lumière
        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        scene.add(light);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(0, 20, 10);
        scene.add(dirLight);

        // Sol
        const gridHelper = new THREE.GridHelper(200, 50, 0x00ff00, 0x004400);
        scene.add(gridHelper);
        const floorGeo = new THREE.PlaneGeometry(200, 200);
        const floorMat = new THREE.MeshBasicMaterial({ color: 0x001100, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        scene.add(floor);

        // Contrôles
        controls = new PointerLockControls(camera, document.body);

        controls.addEventListener('lock', () => {
            isGameActive = true;
            ui.menuOverlay.style.display = 'none';
        });
        controls.addEventListener('unlock', () => {
            if (health > 0 && gameMode !== 'aim') {
                isGameActive = false;
                ui.mainMenu.style.display = 'flex';
                ui.gameoverMenu.style.display = 'none';
                ui.titleText.innerText = "PAUSE";
                ui.subtitleText.innerText = "";
                ui.menuOverlay.style.display = 'flex';
            } else if (gameMode === 'aim') {
                game.endGame();
            }
        });

        scene.add(controls.getObject());

        // Inputs Clavier
        const onKeyDown = (e) => {
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': moveForward = true; break;
                case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
                case 'ArrowDown': case 'KeyS': moveBackward = true; break;
                case 'ArrowRight': case 'KeyD': moveRight = true; break;
            }
        };
        const onKeyUp = (e) => {
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': moveForward = false; break;
                case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
                case 'ArrowDown': case 'KeyS': moveBackward = false; break;
                case 'ArrowRight': case 'KeyD': moveRight = false; break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('mousedown', game.shoot);

        // Arme
        const gunGeo = new THREE.BoxGeometry(0.1, 0.1, 0.4);
        const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        gunMesh = new THREE.Mesh(gunGeo, gunMat);
        gunMesh.position.set(0.2, -0.2, -0.3);
        camera.add(gunMesh);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Loop
        requestAnimationFrame(game.animate);
    },

    startMode: (mode) => {
        gameMode = mode;
        game.resetState();

        ui.mainMenu.style.display = 'none';
        ui.gameoverMenu.style.display = 'none';
        ui.menuOverlay.style.display = 'none';

        if (mode === 'survival') {
            ui.healthContainer.style.display = 'block';
            ui.waveDisplay.style.display = 'flex';
            ui.timeDisplay.style.display = 'none';
            ui.subtitleText.innerText = "Survivez aux vagues d'ennemis";
        } else {
            ui.healthContainer.style.display = 'none';
            ui.waveDisplay.style.display = 'none';
            ui.timeDisplay.style.display = 'flex';
            ui.subtitleText.innerText = "Détruisez les cibles avant la fin du temps";
        }

        controls.lock();
    },

    resetState: () => {
        score = 0;
        wave = 1;
        health = 100;
        gameTime = CONFIG.aimTimeLimit;
        enemies.forEach(e => scene.remove(e));
        enemies = [];
        controls.getObject().position.set(0, 1.6, 0);
        velocity.set(0,0,0);
        ui.scoreEl.innerText = '0';
        ui.waveEl.innerText = '1';
        ui.timeEl.innerText = CONFIG.aimTimeLimit;
        ui.healthFill.style.width = '100%';
    },

    endGame: () => {
        isGameActive = false;
        controls.unlock();
        ui.menuOverlay.style.display = 'flex';
        ui.mainMenu.style.display = 'none';
        ui.gameoverMenu.style.display = 'flex';
        ui.finalScore.innerText = score;
        ui.titleText.innerText = "GAME OVER";
        ui.titleText.style.color = "#ff0000";
    },

    showMainMenu: () => {
        ui.menuOverlay.style.display = 'flex';
        ui.mainMenu.style.display = 'flex';
        ui.gameoverMenu.style.display = 'none';
        ui.titleText.innerText = "NEON SHOOTER";
        ui.titleText.style.color = "#fff";
        ui.subtitleText.innerText = "ZQSD pour bouger | SOURIS pour viser";
        camera.rotation.set(0,0,0);
    },

    shoot: () => {
        if (!isGameActive || (gameMode === 'survival' && health <= 0)) return;

        gunRecoil = 0.2;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        const startPos = new THREE.Vector3();
        gunMesh.getWorldPosition(startPos);
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const endPos = new THREE.Vector3().copy(startPos).add(direction.clone().multiplyScalar(100));

        const intersects = raycaster.intersectObjects(enemies);
        let hitPoint = endPos;

        if (intersects.length > 0) {
            const hit = intersects[0];
            hitPoint = hit.point;

            const enemyIndex = enemies.indexOf(hit.object);
            if (enemyIndex > -1) {
                game.createExplosion(hit.object.position, 0xff0000);
                scene.remove(hit.object);
                enemies.splice(enemyIndex, 1);

                score += (gameMode === 'aim' ? 50 : 100);
                ui.scoreEl.innerText = score;

                if (gameMode === 'survival' && score % 500 === 0) {
                    wave++;
                    ui.waveEl.innerText = wave;
                    CONFIG.baseEnemySpeed += 1;
                }
            }
        }

        const points = [startPos, hitPoint];
        const laserGeom = new THREE.BufferGeometry().setFromPoints(points);
        const laserMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        const laserLine = new THREE.Line(laserGeom, laserMat);
        scene.add(laserLine);
        setTimeout(() => scene.remove(laserLine), 50);
    },

    spawnEnemy: () => {
        if (!isGameActive) return;

        const isAimMode = gameMode === 'aim';
        const geo = isAimMode ? new THREE.SphereGeometry(0.5, 16, 16) : new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: isAimMode ? 0x00ffff : 0xff0000,
            emissive: isAimMode ? 0x004444 : 0x550000
        });
        const enemy = new THREE.Mesh(geo, mat);

        const angle = Math.random() * Math.PI * 2;
        const radius = isAimMode ? 10 + Math.random() * 10 : 20 + Math.random() * 10;

        enemy.position.x = controls.getObject().position.x + Math.cos(angle) * radius;
        enemy.position.z = controls.getObject().position.z + Math.sin(angle) * radius;
        enemy.position.y = isAimMode ? 1.0 + Math.random() : 0.5;

        if (isAimMode) {
            enemy.userData.lifeTime = 2.0;
        }

        scene.add(enemy);
        enemies.push(enemy);
    },

    createExplosion: (position, color) => {
        const particleCount = 10;
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            mesh.userData.life = 1.0;
            scene.add(mesh);
            particles.push(mesh);
        }
    },

    animate: () => {
        requestAnimationFrame(game.animate);

        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        prevTime = time;

        if (isGameActive) {
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= CONFIG.gravity * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            if (moveForward || moveBackward) velocity.z -= direction.z * CONFIG.speed * 10.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * CONFIG.speed * 10.0 * delta;

            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
            controls.getObject().position.y += velocity.y * delta;

            if (controls.getObject().position.y < 1.6) {
                velocity.y = 0;
                controls.getObject().position.y = 1.6;
            }

            if (gunRecoil > 0) gunRecoil -= delta * 2;
            const bobOffset = (moveForward || moveBackward || moveLeft || moveRight) ? Math.sin(time * 0.015) * 0.005 : 0;
            gunMesh.position.z = -0.3 + gunRecoil;
            gunMesh.position.y = -0.2 + bobOffset;

            if (gameMode === 'survival') {
                if (time - lastSpawnTime > Math.max(500, CONFIG.baseSpawnRate - (wave * 100))) {
                    game.spawnEnemy();
                    lastSpawnTime = time;
                }

                const playerPos = controls.getObject().position;
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    enemy.lookAt(playerPos.x, 0.5, playerPos.z);
                    const dirToPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
                    enemy.position.add(dirToPlayer.multiplyScalar(CONFIG.baseEnemySpeed * delta));

                    if (enemy.position.distanceTo(playerPos) < 1.0) {
                        health -= 20;
                        ui.healthFill.style.width = `${Math.max(0, health)}%`;
                        ui.damageOverlay.style.opacity = 0.8;
                        setTimeout(() => ui.damageOverlay.style.opacity = 0, 200);

                        enemy.position.sub(dirToPlayer.multiplyScalar(3));

                        if (health <= 0) game.endGame();
                    }
                }
            } else if (gameMode === 'aim') {
                gameTime -= delta;
                ui.timeEl.innerText = Math.ceil(gameTime);
                if (gameTime <= 0) game.endGame();

                if (enemies.length < 3 + Math.floor(score / 500)) {
                    game.spawnEnemy();
                }

                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    enemy.userData.lifeTime -= delta;
                    enemy.rotation.z += delta;
                    enemy.scale.setScalar(1 + Math.sin(time * 0.01) * 0.1);

                    if (enemy.userData.lifeTime <= 0) {
                        scene.remove(enemy);
                        enemies.splice(i, 1);
                    }
                }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.userData.life -= delta * 2;
                p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
                p.scale.multiplyScalar(0.9);
                if (p.userData.life <= 0) {
                    scene.remove(p);
                    particles.splice(i, 1);
                }
            }
        }

        renderer.render(scene, camera);
    }
};

// --- Initialisation des Événements UI (Correction du bug) ---

// Boutons du menu principal
document.getElementById('btn-survival').addEventListener('click', () => game.startMode('survival'));
document.getElementById('btn-aim').addEventListener('click', () => game.startMode('aim'));
document.getElementById('btn-settings').addEventListener('click', () => {
    ui.settingsModal.style.display = 'block';
});

// Bouton retour menu
document.getElementById('btn-back-menu').addEventListener('click', () => game.showMainMenu());

// Bouton fermer paramètres
document.getElementById('btn-close-settings').addEventListener('click', () => {
    ui.settingsModal.style.display = 'none';
    settings.sensitivity = parseFloat(ui.sensSlider.value);
    localStorage.setItem('neonFPS_sensitivity', settings.sensitivity);
});

// Slider de sensibilitéd
ui.sensSlider.addEventListener('input', (e) => {
    ui.sensValue.innerText = e.target.value;
});

// Lancer le jeu
game.init();