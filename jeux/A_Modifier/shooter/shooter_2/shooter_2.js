import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const CONFIG = {
    playerSpeed: 10,
    runSpeed: 18,
    gravity: 28,
    jumpForce: 10,
    botSpeed: 3.5,
    botDetectRange: 22,
    botFireRange: 14,
};

let camera, scene, renderer, controls;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

// WASD par touches physiques — on écoute e.key (insensible au layout clavier)
const keys = { w:false, a:false, s:false, d:false, shift:false };

let enemies = [], particles = [], walls = [], wallBoxes = [];
let score = 0, health = 100, wave = 1;
let isGameActive = false;
let gunMesh, gunRecoil = 0;
let canJump = false;

// ===================== CARTE =====================
const levelMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,1,0,0,0,0,1,0,1,0,1,0,0,0,0,1,1],
    [1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,1],
    [1,1,0,0,0,0,1,0,1,0,1,0,0,0,0,1,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const SPAWN_ZONES = [
    [1,1],[1,13],[13,1],[13,13],
    [3,7],[11,7],[7,3],[7,11],
];

const MS = 4; // map scale

// ===================== INIT =====================
scene = new THREE.Scene();
scene.background = new THREE.Color(0x030308);
scene.fog = new THREE.FogExp2(0x030308, 0.035);

camera = new THREE.PerspectiveCamera(80, innerWidth/innerHeight, 0.1, 200);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lumières
scene.add(new THREE.AmbientLight(0x202030, 3));
const dirLight = new THREE.DirectionalLight(0x6688aa, 1.5);
dirLight.position.set(30, 60, 30);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// Quelques points lumineux pour l'ambiance
[[-10,3,-10],[10,3,10],[-10,3,10],[10,3,-10]].forEach(([x,y,z]) => {
    const pl = new THREE.PointLight(0x004400, 2, 15);
    pl.position.set(x,y,z);
    scene.add(pl);
});

// Sol
const floorGeo = new THREE.PlaneGeometry(200, 200, 30, 30);
const floorMat = new THREE.MeshStandardMaterial({ color:0x0a0f0a, roughness:0.9, metalness:0.1 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI/2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.GridHelper(200, 60, 0x003300, 0x001100));

// Murs
const wallMat = new THREE.MeshStandardMaterial({ color:0x1a1a2e, roughness:0.7, metalness:0.3, emissive:0x000822, emissiveIntensity:0.5 });
const wallGeo = new THREE.BoxGeometry(MS, MS*2, MS);

for (let z=0; z<levelMap.length; z++) {
    for (let x=0; x<levelMap[z].length; x++) {
        if (levelMap[z][x] !== 1) continue;
        const px = (x - levelMap[0].length/2) * MS;
        const pz = (z - levelMap.length/2) * MS;
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(px, MS, pz);
        wall.castShadow = true; wall.receiveShadow = true;
        // Bord néon
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(wallGeo), new THREE.LineBasicMaterial({color:0x00ffff, transparent:true, opacity:0.4}));
        wall.add(edge);
        scene.add(wall);
        walls.push(wall);
        const box = new THREE.Box3();
        box.setFromCenterAndSize(wall.position, new THREE.Vector3(MS-0.1, MS*2, MS-0.1));
        wallBoxes.push(box);
    }
}

// Plafond invisible (empêche de sauter par-dessus les murs)
// Pas nécessaire avec gravity

// Contrôles souris
controls = new PointerLockControls(camera, document.body);
controls.addEventListener('lock', () => { isGameActive = true; document.getElementById('menu-overlay').style.display='none'; });
controls.addEventListener('unlock', () => {
    if (health > 0) { isGameActive = false; document.getElementById('menu-overlay').style.display='flex'; }
});
scene.add(controls.getObject());

// Arme
const gunGroup = new THREE.Group();
const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.18,0.55), new THREE.MeshStandardMaterial({color:0x111111,roughness:0.5}));
const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.45,8), new THREE.MeshStandardMaterial({color:0x333333}));
gunBarrel.rotation.x = Math.PI/2; gunBarrel.position.set(0,0.08,-0.45);
const gunStock = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.14,0.2), new THREE.MeshStandardMaterial({color:0x4a2800}));
gunStock.position.set(0,-0.04,0.25);
gunGroup.add(gunBody, gunBarrel, gunStock);
gunMesh = gunGroup;
gunMesh.position.set(0.28, -0.28, -0.48);
camera.add(gunMesh);

// ===================== INPUT — utilise e.key pour vrai WASD =====================
document.addEventListener('keydown', e => {
    // On normalise en minuscule pour être insensible à la casse
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = true;
    if (k === 'a') keys.a = true;
    if (k === 's') keys.s = true;
    if (k === 'd') keys.d = true;
    if (e.key === 'Shift') keys.shift = true;
    if (e.key === ' ' || e.key === 'Space') { e.preventDefault(); if (canJump) { velocity.y += CONFIG.jumpForce; canJump = false; } }
});
document.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = false;
    if (k === 'a') keys.a = false;
    if (k === 's') keys.s = false;
    if (k === 'd') keys.d = false;
    if (e.key === 'Shift') keys.shift = false;
});
document.addEventListener('mousedown', shoot);
window.addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ===================== SPAWN =====================
function spawnBot(px, pz, difficulty=1) {
    const geo = new THREE.CapsuleGeometry(0.45, 1.0, 4, 8);
    const hue = 0.0 + (difficulty-1)*0.05;
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue,1,0.4), emissive: new THREE.Color().setHSL(hue,1,0.15), emissiveIntensity:1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, 1.0, pz);
    mesh.castShadow = true;

    // Yeux
    const eyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.08,0.1), new THREE.MeshBasicMaterial({color:0xffff00}));
    eyeMesh.position.set(0, 0.35, -0.42);
    mesh.add(eyeMesh);

    scene.add(mesh);
    enemies.push({
        mesh, health: 2+difficulty, lastShot:0, waitTime:0,
        patrolAngle: Math.random()*Math.PI*2,
        speed: CONFIG.botSpeed * (1 + (difficulty-1)*0.15)
    });
}

function startGame() {
    score=0; health=100; wave=1;
    enemies.forEach(e => scene.remove(e.mesh));
    enemies=[]; particles=[];
    velocity.set(0,0,0);
    document.getElementById('score').textContent='0';
    document.getElementById('health-fill').style.width='100%';
    document.getElementById('wave-num').textContent='1';

    // Position spawn joueur
    for (let z=0; z<levelMap.length; z++) {
        for (let x=0; x<levelMap[z].length; x++) {
            if (levelMap[z][x]===2) {
                controls.getObject().position.set((x-levelMap[0].length/2)*MS, 1.7, (z-levelMap.length/2)*MS);
            }
        }
    }
    spawnWave();
    document.getElementById('menu-overlay').style.display='none';
    controls.lock();
}

function spawnWave() {
    const count = 4 + wave * 2;
    const spawns = [...SPAWN_ZONES].sort(()=>Math.random()-0.5).slice(0, count);
    spawns.forEach(([sz,sx]) => {
        const px = (sx - levelMap[0].length/2)*MS;
        const pz = (sz - levelMap.length/2)*MS;
        spawnBot(px, pz, wave);
    });
    document.getElementById('enemies-left').textContent = enemies.length;
}

// ===================== TIR =====================
function shoot() {
    if (!isGameActive || health<=0) return;
    gunRecoil = 0.25;
    document.getElementById('crosshair').classList.add('expand');
    setTimeout(()=>document.getElementById('crosshair').classList.remove('expand'), 120);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);

    // Distance mur le plus proche
    const wallHits = raycaster.intersectObjects(walls);
    const wallDist = wallHits.length > 0 ? wallHits[0].distance : Infinity;

    // Test ennemis
    const enemyMeshes = enemies.map(e=>e.mesh);
    const hits = raycaster.intersectObjects(enemyMeshes, true);

    if (hits.length>0 && hits[0].distance < wallDist) {
        let obj = hits[0].object;
        while (obj.parent && !enemies.find(e=>e.mesh===obj)) obj = obj.parent;
        const bot = enemies.find(e=>e.mesh===obj);
        if (bot) {
            createExplosion(hits[0].point, 0xff6600, 8);
            bot.health--;
            if (bot.health<=0) {
                createExplosion(bot.mesh.position.clone().add(new THREE.Vector3(0,0.5,0)), 0xff2200, 18);
                scene.remove(bot.mesh);
                enemies = enemies.filter(e=>e!==bot);
                score += 100 * wave;
                document.getElementById('score').textContent = score;
                document.getElementById('enemies-left').textContent = enemies.length;
                addKillFeed();
                if (enemies.length===0) { wave++; document.getElementById('wave-num').textContent=wave; setTimeout(spawnWave, 2500); }
            }
        }
    }

    // Laser visuel
    const start = new THREE.Vector3(); gunMesh.getWorldPosition(start);
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    const end = start.clone().add(dir.multiplyScalar(Math.min(wallDist, 25)));
    const laser = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([start, end]),
        new THREE.LineBasicMaterial({color:0xffff00, transparent:true, opacity:0.8})
    );
    scene.add(laser);
    setTimeout(()=>scene.remove(laser), 60);
}

function addKillFeed() {
    const feed = document.getElementById('kill-feed');
    const msg = document.createElement('div');
    msg.className='kill-msg';
    msg.textContent='▶ ENNEMI ÉLIMINÉ +' + (100*wave);
    feed.appendChild(msg);
    setTimeout(()=>msg.remove(), 2000);
}

// ===================== COLLISIONS =====================
function checkCollision(pos, radius=0.45) {
    const box = new THREE.Box3().setFromCenterAndSize(pos, new THREE.Vector3(radius*2, 1.8, radius*2));
    return wallBoxes.some(wb => box.intersectsBox(wb));
}

// ===================== EXPLOSIONS =====================
function createExplosion(pos, color, count=10) {
    const geo = new THREE.BoxGeometry(0.15,0.15,0.15);
    const mat = new THREE.MeshBasicMaterial({color});
    for (let i=0; i<count; i++) {
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(pos);
        m.userData.vel = new THREE.Vector3((Math.random()-0.5)*12,(Math.random())*8,(Math.random()-0.5)*12);
        m.userData.life = 1;
        scene.add(m); particles.push(m);
    }
}

// ===================== BOUCLE =====================
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - prevTime)/1000, 0.05);
    prevTime = now;

    if (isGameActive) {
        const playerObj = controls.getObject();

        // --- Physique joueur ---
        velocity.x -= velocity.x * 12 * delta;
        velocity.z -= velocity.z * 12 * delta;
        velocity.y -= CONFIG.gravity * delta;

        direction.set(0, 0, 0);
        if (keys.w) direction.z -= 1;
        if (keys.s) direction.z += 1;
        if (keys.a) direction.x -= 1;
        if (keys.d) direction.x += 1;
        if (direction.length() > 0) direction.normalize();

        const spd = keys.shift ? CONFIG.runSpeed : CONFIG.playerSpeed;
        velocity.x += direction.x * spd * 10 * delta;
        velocity.z += direction.z * spd * 10 * delta;

        const old = playerObj.position.clone();

        // Move X
        playerObj.position.x += velocity.x * delta;
        if (checkCollision(playerObj.position)) { playerObj.position.x = old.x; velocity.x = 0; }

        // Move Z
        playerObj.position.z += velocity.z * delta;
        if (checkCollision(playerObj.position)) { playerObj.position.z = old.z; velocity.z = 0; }

        // Move Y (gravité)
        playerObj.position.y += velocity.y * delta;
        if (playerObj.position.y < 1.7) { playerObj.position.y=1.7; velocity.y=0; canJump=true; }

        // Bob arme
        const bobAmt = (keys.w||keys.a||keys.s||keys.d) ? 0.012 : 0;
        if (gunRecoil > 0) gunRecoil -= delta*3;
        gunMesh.position.z = -0.48 + Math.max(0, gunRecoil);
        gunMesh.position.y = -0.28 + Math.sin(now*0.012)*bobAmt;

        // --- IA ennemis ---
        enemies.forEach(bot => {
            const dist = bot.mesh.position.distanceTo(playerObj.position);
            const toPlayer = new THREE.Vector3().subVectors(playerObj.position, bot.mesh.position).normalize();

            // Ligne de vue
            const ray = new THREE.Raycaster(bot.mesh.position.clone().add(new THREE.Vector3(0,0.5,0)), toPlayer, 0, CONFIG.botDetectRange);
            const canSee = ray.intersectObjects(walls).length === 0;

            if (canSee && dist < CONFIG.botFireRange) {
                // Attaque
                bot.mesh.lookAt(playerObj.position.x, 1, playerObj.position.z);
                if (now - bot.lastShot > 1200) {
                    bot.lastShot = now;
                    health -= 8;
                    document.getElementById('health-fill').style.width = Math.max(0,health)+'%';
                    document.getElementById('damage-overlay').style.opacity=0.7;
                    setTimeout(()=>document.getElementById('damage-overlay').style.opacity=0, 200);
                    if (health<=0) { isGameActive=false; controls.unlock(); }
                }
            } else if (canSee && dist < CONFIG.botDetectRange) {
                // Approche joueur
                bot.mesh.lookAt(playerObj.position.x, 1, playerObj.position.z);
                const move = toPlayer.clone().multiplyScalar(bot.speed * delta);
                const nextPos = bot.mesh.position.clone().add(move);
                if (!checkCollision(nextPos, 0.5)) bot.mesh.position.copy(nextPos);
                else {
                    // Contourne le mur
                    bot.mesh.rotation.y += Math.PI/4;
                }
            } else {
                // Patrouille
                bot.patrolAngle += delta * 0.8;
                const pd = new THREE.Vector3(Math.cos(bot.patrolAngle), 0, Math.sin(bot.patrolAngle));
                const np = bot.mesh.position.clone().add(pd.multiplyScalar(bot.speed * 0.6 * delta));
                if (!checkCollision(np, 0.5)) { bot.mesh.position.copy(np); bot.mesh.lookAt(np.add(pd)); }
                else bot.patrolAngle += Math.PI/2;
            }

            // Séparation entre bots
            enemies.forEach(other => {
                if (bot===other) return;
                const d = bot.mesh.position.distanceTo(other.mesh.position);
                if (d < 1.3) {
                    const push = bot.mesh.position.clone().sub(other.mesh.position).normalize().multiplyScalar(0.06);
                    bot.mesh.position.add(push);
                }
            });

            // Garder le bot sur le sold
            bot.mesh.position.y = 1.0;
        });

        // Particules
        for (let i=particles.length-1; i>=0; i--) {
            const p=particles[i];
            p.userData.life -= delta*2;
            p.position.add(p.userData.vel.clone().multiplyScalar(delta));
            p.userData.vel.y -= 20*delta;
            p.scale.setScalar(Math.max(0, p.userData.life));
            if (p.userData.life<=0) { scene.remove(p); particles.splice(i,1); }
        }
    }

    renderer.render(scene, camera);
}

document.getElementById('btn-start').addEventListener('click', startGame);
animate();