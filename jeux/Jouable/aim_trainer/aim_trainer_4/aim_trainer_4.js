'use strict';
// ════════════════════════════════════════════════════════════════
// WEAPON DATABASE
// ════════════════════════════════════════════════════════════════
const GUNS = {
    r301:    {name:'R-301',   color:'#ff9500', mode:'auto',  dmg:14, hm:1.5, mag:18, rpm:600,  reload:2400, spinup:0,   burst:0, alt:null,
        recoil:[[ 0,-.4],[.1,-1],[-.15,-1.5],[.1,-1.9],[-.25,-2.2],[.15,-2.4],[-.3,-2.5],[.2,-2.6],[-.35,-2.6],[.25,-2.7],[-.3,-2.7],[.15,-2.7],[-.2,-2.65],[.1,-2.6],[0,-2.55],[-.1,-2.5],[0,-2.45],[0,-2.4]]},
    r99:     {name:'R-99',    color:'#00c8ff', mode:'auto',  dmg:11, hm:1.5, mag:18, rpm:1080, reload:1800, spinup:0,   burst:0, alt:null,
        recoil:[[0,-.6],[.2,-1.4],[-.1,-2],[.3,-2.5],[-.2,-2.8],[.4,-3],[-.3,-3.1],[.3,-3.2],[-.4,-3.2],[.35,-3.3],[-.35,-3.3],[.2,-3.3],[-.25,-3.2],[.15,-3.2],[-.1,-3.1],[.1,-3],[-.1,-2.9],[0,-2.8]]},
    flatline: {name:'Flatline',color:'#ff4500', mode:'auto',  dmg:19, hm:1.5, mag:20, rpm:600,  reload:2600, spinup:0,   burst:0, alt:null,
        recoil:[[0,-.5],[.15,-1.2],[-.2,-2],[.1,-2.6],[-.3,-3],[.2,-3.3],[-.4,-3.5],[.3,-3.6],[-.4,-3.7],[.35,-3.7],[-.3,-3.7],[.2,-3.65],[-.25,-3.6],[.15,-3.55],[-.1,-3.5],[.1,-3.4],[-.1,-3.3],[0,-3.2],[-.05,-3.1],[0,-3]]},
    havoc:   {name:'HAVOC',   color:'#9b59ff', mode:'auto',  dmg:18, hm:1.5, mag:24, rpm:672,  reload:2600, spinup:400, burst:0, alt:null,
        recoil:[[0,-.3],[.05,-.8],[-.1,-1.4],[.15,-1.9],[-.2,-2.3],[.2,-2.6],[-.25,-2.8],[.2,-3],[-.3,-3.1],[.25,-3.2],[-.3,-3.2],[.2,-3.2],[-.2,-3.15],[.15,-3.1],[-.1,-3.05],[.1,-3],[-.1,-2.95],[0,-2.9],[-.05,-2.85],[0,-2.8],[.05,-2.75],[-.05,-2.7],[0,-2.65],[0,-2.6]]},
    hemlok:  {name:'Hemlok',  color:'#00ff88', mode:'burst', dmg:22, hm:1.75,mag:18, rpm:198,  reload:2400, spinup:0,   burst:3, alt:'semi',
        recoil:[[0,-.8],[.1,-1.8],[-.15,-2.6],[.1,-1.2],[.05,-2],[-.1,-2.8],[.05,-.9],[.1,-1.7],[-.1,-2.5],[0,-1.1],[.05,-1.9],[-.05,-2.7],[0,-1],[.05,-1.8],[-.05,-2.6],[0,-1.1],[.05,-1.9],[-.05,-2.7]]},
    nemesis: {name:'Nemesis', color:'#ff00cc', mode:'burst', dmg:17, hm:1.5, mag:20, rpm:300,  reload:2500, spinup:0,   burst:4, alt:null,
        recoil:[[0,-.5],[.1,-1.2],[-.1,-1.8],[.15,-1],[.05,-1.7],[-.1,-2.3],[.15,-.9],[.1,-1.6],[-.1,-2.2],[.1,-.8],[.05,-1.5],[-.1,-2.1],[0,-.8],[.05,-1.5],[-.05,-2.1],[0,-.9],[.05,-1.6],[-.05,-2.2],[0,-1],[.05,-1.7]]},
    alternator:{name:'Alternator',color:'#ffdd00',mode:'auto',dmg:13,hm:1.5,mag:19,rpm:600,reload:2300,spinup:0,burst:0,alt:null,
        recoil:[[0,-.5],[-.2,-1],[.2,-1.5],[-.25,-1.9],[.25,-2.2],[-.3,-2.4],[.3,-2.5],[-.3,-2.6],[.3,-2.6],[-.25,-2.7],[.25,-2.65],[-.2,-2.6],[.2,-2.55],[-.15,-2.5],[.15,-2.45],[-.1,-2.4],[.1,-2.35],[-.05,-2.3],[0,-2.25]]},
    prowler:  {name:'Prowler', color:'#44aaff', mode:'burst', dmg:14, hm:1.5, mag:20, rpm:500,  reload:2300, spinup:0,   burst:5, alt:'auto',
        recoil:[[0,-.4],[.1,-1],[-.1,-1.5],[.15,-1.9],[-.1,-1.2],[.1,-1.8],[-.1,-2.3],[.15,-2.6],[-.15,-2.8],[.1,-2.9],[-.15,-2.95],[.1,-2.95],[-.1,-2.9],[.05,-2.85],[-.05,-2.8],[.05,-2.75],[-.05,-2.7],[0,-2.65],[.05,-2.6],[0,-2.55]]},
    car:     {name:'C.A.R.',  color:'#ff6699', mode:'auto',  dmg:13, hm:1.5, mag:20, rpm:1050, reload:1800, spinup:0,   burst:0, alt:null,
        recoil:[[0,-.7],[.15,-1.6],[-.1,-2.2],[.2,-2.7],[-.2,-3],[.3,-3.2],[-.3,-3.3],[.3,-3.35],[-.3,-3.4],[.25,-3.4],[-.25,-3.4],[.2,-3.35],[-.2,-3.3],[.15,-3.25],[-.1,-3.2],[.1,-3.15],[-.1,-3.1],[.05,-3.05],[-.05,-3],[0,-2.95]]}
};

// Mag upgrade table: bonus bullets per tier
const MAG_BONUS = {base:0, white:2, blue:4, purple:6, gold:8};

// Shield tiers — valeurs Apex réelles (EVO shield)
const SHIELDS = {
    0:   {label:'AUCUN',  color:null,      max:0},
    150: {label:'BLANC',  color:'#cccccc', max:150},
    175: {label:'BLEU',   color:'#4488ff', max:175},
    200: {label:'VIOLET', color:'#cc44ff', max:200},
    225: {label:'ROUGE',  color:'#ff3333', max:225},
    250: {label:'OR',     color:'#ffd200', max:250},
};

// Distance scale factor (10m = full size au centre, plus loin = plus petit + plus haut dans l'image)
const DIST_SCALE  = {10:1.0,  25:0.78, 50:0.58, 100:0.38, 200:0.22};
const DIST_YSHIFT = {10:0,    25:0.06, 50:0.12, 100:0.18, 200:0.24}; // fraction de H vers le haut

// Optics — noms Apex réels
const OPTICS = {
    'iron':  {zoom:1,    label:'IRON SIGHTS',  crossType:'iron'},
    '1x':    {zoom:1,    label:'1x HOLO',      crossType:'holo'},
    '1x2x':  {zoom:1.5,  label:'1x-2x',        crossType:'holo2x'},
    '3x':    {zoom:2.5,  label:'3x ACOG',      crossType:'acog'},
    '2x4x':  {zoom:3.5,  label:'2x-4x VARI.',  crossType:'sniper'},
};

// ════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const oCanvas = document.getElementById('opticCanvas');
const oCtx    = oCanvas.getContext('2d');
const cur     = document.getElementById('cur');
const hf      = document.getElementById('hf');

let W=0,H=0,animId,lastT=0,paused=false;

function resize(){
    W = canvas.width  = oCanvas.width  = window.innerWidth;
    H = canvas.height = oCanvas.height = window.innerHeight;
}
window.addEventListener('resize',resize); resize();

// Mouse tracking
let mx=W/2, my=H/2;
document.addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
    cur.style.left=mx+'px'; cur.style.top=my+'px';
});

// ════════════════════════════════════════════════════════════════
// CONFIG STATE (from menu)
// ════════════════════════════════════════════════════════════════
const cfg = {optic:'iron', dist:10, shield:0, mag:'base', weapon:null};

function setCfg(key, btn){
    cfg[key] = btn.dataset.val;
    const group = {optic:'optic-opts', dist:'dist-opts', shield:'shield-opts', mag:'mag-opts'}[key];
    document.getElementById(group).querySelectorAll('.opt').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
// BUILD WEAPON GRID
// ════════════════════════════════════════════════════════════════
(function buildWeaponGrid(){
    const grid = document.getElementById('weapon-grid');
    const modeLabel = {auto:'b-auto', semi:'b-semi', burst:'b-burst'};
    const modeText  = {auto:'AUTO',   semi:'SEMI',   burst:'BURST'};
    Object.entries(GUNS).forEach(([key,g])=>{
        const div=document.createElement('div');
        div.className='card'; div.id='wcard-'+key;
        div.innerHTML=`
      <div class="badge ${modeLabel[g.mode]}">${modeText[g.mode]}${g.alt?' / '+modeText[g.alt.toUpperCase().replace('AUTO','AUTO').replace('semi','SEMI')]:''}</div>
      <h2>${g.name}</h2>
      <div class="sm">DMG <b>${g.dmg}</b> · MAG <b>${g.mag}</b> · RPM <b>${g.rpm}</b>${g.spinup?'<br>SPINUP <b>'+g.spinup+'ms</b>':''}</div>
    `;
        div.onclick=()=>selectWeapon(key, div);
        grid.appendChild(div);
    });
    // Select first by default
    selectWeapon('r301', document.getElementById('wcard-r301'));
})();

function selectWeapon(key, el){
    document.querySelectorAll('#weapon-grid .card').forEach(c=>c.classList.remove('sel'));
    el.classList.add('sel');
    cfg.weapon=key;
}

// ════════════════════════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════════════════════════
const G = {
    mode:null, running:false, score:0, timeLeft:60,
    // classic
    targets:[], particles:[], floats:[], spawnTimer:0, spawnInterval:800, clicks:0, hits:0,
    // apex
    gun:null, ammo:0, maxAmmo:0, recoilX:0, recoilY:0, shotIdx:0,
    isReloading:false, reloadStart:0,
    spinning:false, spinupStart:0,
    mouseHeld:false, lastShot:0,
    burstQ:0, burstLast:0,
    currentMode:'auto',
    // enemy
    enemyHP:100, enemyMaxHP:100,
    shield:0, shieldMax:0,
    kills:0, totalShots:0, totalHits:0,
    // wasd movement simulation
    wasd:{w:false,a:false,s:false,d:false},
    moveX:0, moveY:0, // simulated player velocity affecting recoil
};

// WASD keys
const WASD_KEYS = {w:'w',a:'a',s:'s',d:'d',W:'w',A:'a',S:'s',D:'d'};
document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&G.running) togglePause();
    if(e.key.toLowerCase()==='r'&&G.gun&&!G.isReloading&&G.ammo<G.maxAmmo) startReload();
    if(e.key.toLowerCase()==='b'&&G.gun&&G.gun.alt) toggleFireMode();
    // WASD
    const k=WASD_KEYS[e.key];
    if(k&&G.running&&G.gun){ G.wasd[k]=true; updateWASDui(); }
});
document.addEventListener('keyup',e=>{
    const k=WASD_KEYS[e.key];
    if(k){ G.wasd[k]=false; updateWASDui(); }
});
function updateWASDui(){
    ['w','a','s','d'].forEach(k=>document.getElementById('wk-'+k).classList.toggle('active',G.wasd[k]));
}

document.addEventListener('mousedown',e=>{
    if(!G.running||paused) return;
    if(G.gun){
        G.mouseHeld=true;
        if(G.gun.spinup){G.spinupStart=Date.now();G.spinning=true;}
        if(G.currentMode==='burst'||G.currentMode==='semi') triggerBurst();
    } else handleClassicClick(e);
});
document.addEventListener('mouseup',()=>{ G.mouseHeld=false; G.spinning=false; });

// ════════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════════
function showTab(t){
    document.getElementById('classic-grid').style.display = t==='classic'?'grid':'none';
    document.getElementById('apex-panel').style.display   = t==='apex'?'flex':'none';
    document.querySelectorAll('.tab').forEach((b,i)=>{
        b.classList.toggle('on',(t==='classic'&&i===0)||(t==='apex'&&i===1));
    });
}

// ════════════════════════════════════════════════════════════════
// START CLASSIC
// ════════════════════════════════════════════════════════════════
function startClassic(mode){
    resetG();
    G.mode=mode; G.running=true;
    G.spawnInterval = mode==='quick'?900:mode==='curve'?1200:800;
    G.gun=null;
    apexHudShow(false);
    apexBarsShow(false);
    document.getElementById('wasd').style.display='none';
    oCanvas.style.display='none';
    document.getElementById('opticCanvas').style.display='none';
    showGameUI();
    startTimer();
    loop();
}

// ════════════════════════════════════════════════════════════════
// START APEX
// ════════════════════════════════════════════════════════════════
function startApexSession(){
    if(!cfg.weapon) return;
    const w = GUNS[cfg.weapon];
    const opt = OPTICS[cfg.optic];
    const dist = parseInt(cfg.dist);
    const shieldTier = parseInt(cfg.shield);
    const magBonus = MAG_BONUS[cfg.mag]||0;

    resetG();
    G.mode='apex'; G.running=true;
    G.gun=w;
    G.maxAmmo = w.mag + magBonus;
    G.ammo    = G.maxAmmo;
    G.currentMode = w.mode;
    G.recoilX=0; G.recoilY=0; G.shotIdx=0;
    G.isReloading=false; G.spinning=false; G.mouseHeld=false;
    G.burstQ=0; G.burstLast=0;
    G.lastShot=0;
    G.kills=0; G.totalShots=0; G.totalHits=0;

    // Enemy setup
    G.enemyMaxHP=100; G.enemyHP=100;
    G.shieldMax=shieldTier; G.shield=shieldTier;
    G.distScale  = DIST_SCALE[dist]||1;
    G.distYShift = DIST_YSHIFT[dist]||0;
    G.optic=opt;

    // Spawn enemy
    spawnEnemy();

    apexHudShow(true);
    apexBarsShow(true);
    document.getElementById('wasd').style.display='flex';

    // Optic
    setupOptic(opt);

    showGameUI();
    updateApexHUD();
    startTimer();
    loop();
}

function setupOptic(opt){
    oCanvas.style.display = (opt.crossType==='sniper') ? 'block' : 'none';
}

function resetG(){
    G.score=0; G.timeLeft=60; G.targets=[]; G.particles=[]; G.floats=[];
    G.spawnTimer=0; G.clicks=0; G.hits=0;
    G.wasd={w:false,a:false,s:false,d:false};
    G.moveX=0; G.moveY=0;
    cancelAnimationFrame(animId);
    paused=false;
}

function showGameUI(){
    ['menu','gameover','pause'].forEach(id=>document.getElementById(id).style.display='none');
    document.getElementById('game-ui').style.display='block';
    updateHUD();
    lastT=Date.now();
}

// ════════════════════════════════════════════════════════════════
// ENEMY
// ════════════════════════════════════════════════════════════════
const enemy = {x:0, y:0, scale:1, hp:100, shield:0};

function spawnEnemy(){
    const sc  = G.distScale||1;
    const ysh = G.distYShift||0;
    enemy.x = W*0.5 + (Math.random()*100-50);
    enemy.y = H*(0.5 - ysh) + (Math.random()*40-20);
    enemy.scale  = sc;
    enemy.hp     = G.enemyMaxHP;
    enemy.shield = G.shieldMax;
    G.enemyHP    = G.enemyMaxHP;
    G.shield     = G.shieldMax;
}

function drawEnemy(ctx, e){
    const s = e.scale*1.4;
    const x=e.x, y=e.y;
    const w=G.gun?G.gun.color:'#ff9500';
    const hpR = Math.max(0,e.hp/G.enemyMaxHP);
    const alive = e.hp>0||e.shield>0;

    ctx.save();
    ctx.shadowBlur = alive?12:0;
    ctx.shadowColor = hpR>0.5?w:'#ff3333';

    // Head
    ctx.beginPath(); ctx.arc(x, y-52*s, 16*s, 0, Math.PI*2);
    ctx.fillStyle = alive?rgba(w,.9):'#2a2a2a'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.stroke();

    // Body
    ctx.beginPath(); ctx.roundRect(x-20*s, y-34*s, 40*s, 50*s, 5*s);
    ctx.fillStyle = alive?rgba(w,.8):'#222'; ctx.fill(); ctx.stroke();

    // Legs
    ctx.fillStyle = alive?rgba(w,.7):'#1a1a1a';
    ctx.beginPath(); ctx.roundRect(x-16*s, y+16*s, 12*s, 28*s, 3*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x+4*s,  y+16*s, 12*s, 28*s, 3*s); ctx.fill();

    // Shield glow if active
    if(e.shield>0){
        const sc2=SHIELDS[G.shieldMax]?.color||'#fff';
        ctx.beginPath();
        ctx.ellipse(x, y, 35*s, 55*s, 0, 0, Math.PI*2);
        ctx.strokeStyle=sc2+'aa'; ctx.lineWidth=2*s;
        ctx.shadowBlur=16; ctx.shadowColor=sc2;
        ctx.stroke();
        ctx.shadowBlur=0;
    }
    ctx.restore();

    // Name / distance tag
    ctx.font=`bold ${Math.max(10,12*s)}px Orbitron,monospace`;
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.textAlign='center';
    const dstr = cfg.dist ? cfg.dist+'m' : '';
    ctx.fillText(dstr, x, y-(72*s));
}

// ════════════════════════════════════════════════════════════════
// APEX FIRING
// ════════════════════════════════════════════════════════════════
function fireBullet(){
    const w=G.gun;
    if(G.isReloading||G.ammo<=0) return false;
    const now=Date.now();
    const interval=60000/w.rpm;
    if(now-G.lastShot<interval) return false;
    G.lastShot=now; G.ammo--; G.totalShots++;

    // Accumulated recoil from pattern
    const idx=Math.min(G.shotIdx, w.recoil.length-1);
    const [rx,ry]=w.recoil[idx];

    // WASD movement adds extra instability
    const moveMag = (G.wasd.w||G.wasd.s||G.wasd.a||G.wasd.d)?1.5:0;
    G.recoilX += rx*4 + (Math.random()-.5)*moveMag;
    G.recoilY += ry*4 - Math.random()*moveMag*0.5;
    G.shotIdx++;

    // Aim point
    const aimX = mx + G.recoilX;
    const aimY = my + G.recoilY;

    checkHit(aimX, aimY);
    updateApexHUD();
    if(G.ammo<=0) startReload();
    return true;
}

function triggerBurst(){
    const w=G.gun;
    if(G.isReloading||G.ammo<=0||G.burstQ>0) return;
    G.burstQ = G.currentMode==='semi'?1:(w.burst||1);
    G.burstLast=0;
}

function processBurst(now){
    if(G.burstQ<=0) return;
    const w=G.gun;
    const bi=60000/(w.burst>1?w.rpm*3:w.rpm);
    if(now-G.burstLast<bi) return;
    G.burstLast=now;
    if(fireBullet()) G.burstQ--;
    else G.burstQ=0;
}

function checkHit(ax,ay){
    const s=enemy.scale*1.4;
    const ex=enemy.x, ey=enemy.y;
    const headDist=Math.hypot(ax-ex, ay-(ey-52*s));
    const bodyDist=Math.hypot(ax-ex, ay-ey);
    const isHead = headDist < 16*s;
    const isBody = !isHead && bodyDist < 44*s;
    if(!isHead&&!isBody) return;

    G.totalHits++; G.hits=G.totalHits;
    const baseDmg = isHead ? Math.round(G.gun.dmg*G.gun.hm) : G.gun.dmg;

    // Apply damage: shield first
    let remaining = baseDmg;
    if(enemy.shield>0){
        const absorbed=Math.min(remaining, enemy.shield);
        enemy.shield-=absorbed; G.shield=enemy.shield;
        remaining-=absorbed;
    }
    if(remaining>0){
        enemy.hp=Math.max(0, enemy.hp-remaining);
        G.enemyHP=enemy.hp;
    }

    // Particles + floats
    for(let i=0;i<8;i++) G.particles.push(new Particle(ax,ay,isHead?'#ffff00':G.gun.color));
    G.floats.push(new FloatTxt(ax,ay, isHead?'⭑'+baseDmg:baseDmg, isHead?'#ffff00':G.gun.color, isHead?20:14));

    // Flash
    hf.style.background=isHead?'rgba(255,255,0,.06)':'rgba(255,149,0,.04)';
    setTimeout(()=>hf.style.background='',55);

    G.score+=baseDmg;
    updateApexHUD();
    updateHUD();

    if(enemy.hp<=0&&enemy.shield<=0){
        G.kills++;
        for(let i=0;i<30;i++) G.particles.push(new Particle(enemy.x,enemy.y,G.gun.color,true));
        G.floats.push(new FloatTxt(W/2,H/2-60,'KILL +500','#0aff0a',22));
        G.score+=500;
        setTimeout(()=>{ spawnEnemy(); updateApexHUD(); },400);
    }
}

function startReload(){
    if(G.isReloading||G.ammo>=G.maxAmmo) return;
    G.isReloading=true; G.reloadStart=Date.now();
    G.mouseHeld=false; G.recoilX=0; G.recoilY=0; G.shotIdx=0; G.burstQ=0;
    document.getElementById('reload-wrap').style.display='block';
}

function updateReloadBar(now){
    if(!G.isReloading) return;
    const p=Math.min(1,(now-G.reloadStart)/G.gun.reload);
    document.getElementById('rl-bar').style.width=(p*100)+'%';
    if(p>=1){
        G.isReloading=false; G.ammo=G.maxAmmo; G.shotIdx=0;
        document.getElementById('reload-wrap').style.display='none';
        updateApexHUD();
    }
}

function toggleFireMode(){
    const w=G.gun;
    G.currentMode=G.currentMode===w.mode?w.alt:w.mode;
    updateFirePill();
}

// ════════════════════════════════════════════════════════════════
// HUD
// ════════════════════════════════════════════════════════════════
function apexHudShow(on){
    document.getElementById('apex-hud').style.display=on?'flex':'none';
    document.getElementById('sb-score').className='sbox'+(on?' ':'');
    document.getElementById('sb-time').className='sbox'+(on?' ':'');
    document.getElementById('sb-acc').className='sbox'+(on?' ':'');
}
function apexBarsShow(on){
    document.getElementById('bars').style.display=on?'flex':'none';
}

function updateApexHUD(){
    const w=G.gun; if(!w) return;
    document.getElementById('wpn-name').innerText=w.name;
    document.getElementById('ammo-cur').innerText=G.ammo;
    document.getElementById('ammo-max').innerText=G.maxAmmo;
    // Mag dots
    const dots=document.getElementById('mag-dots');
    dots.innerHTML='';
    for(let i=0;i<G.maxAmmo;i++){const d=document.createElement('div');d.className='md'+(i>=G.ammo?' e':'');dots.appendChild(d);}
    // HP bars
    const shieldWrap=document.getElementById('shield-wrap');
    if(G.shieldMax>0){
        shieldWrap.style.display='block';
        const sd=SHIELDS[G.shieldMax];
        document.getElementById('shield-lbl').innerText='BOUCLIER '+(sd?.label||'');
        document.getElementById('shield-val').innerText=Math.max(0,Math.round(G.shield));
        document.getElementById('shield-fill').style.width=(G.shield/G.shieldMax*100)+'%';
        document.getElementById('shield-fill').style.background=sd?.color||'#fff';
    } else {
        shieldWrap.style.display='none';
    }
    document.getElementById('hp-val').innerText=Math.max(0,Math.round(G.enemyHP));
    document.getElementById('hp-fill').style.width=(G.enemyHP/G.enemyMaxHP*100)+'%';
    updateFirePill();
}

function updateFirePill(){
    const pill=document.getElementById('fire-pill');
    const m=G.currentMode;
    pill.className='fire-pill '+(m==='auto'?'fp-auto':m==='burst'?'fp-burst':'fp-semi');
    pill.innerText=m==='auto'?'AUTO':m==='burst'?'BURST':'SEMI';
    const hint=document.getElementById('key-h');
    hint.innerText=G.gun?.alt?'[B] changer mode · [R] recharger':'[R] recharger';
}

function updateHUD(){
    document.getElementById('hud-score').innerText=G.score;
    document.getElementById('hud-time').innerText=G.timeLeft;
    const shots=G.gun?G.totalShots:G.clicks;
    const hits=G.gun?G.totalHits:G.hits;
    const acc=shots===0?100:Math.round(hits/shots*100);
    document.getElementById('hud-acc').innerText=acc+'%';
}

// ════════════════════════════════════════════════════════════════
// CLASSIC TARGETS
// ════════════════════════════════════════════════════════════════
class Target{
    constructor(x,y,type){
        this.x=x;this.y=y;this.type=type;this.gone=false;
        this.r=35; this.br=35;
        if(type==='quick'){this.color='#ff3333';this.born=Date.now();this.life=2500;}
        else if(type==='curve'){this.color='#bc13fe';this.angle=0;this.spd=0.03;this.ox=x;this.oy=y;this.dx=Math.random()>.5?1:-1;this.dy=Math.random()>.5?1:-1;}
        else this.color='#00f3ff';
    }
    update(){
        if(this.type==='curve'){this.angle+=this.spd;this.x=this.ox+Math.sin(this.angle)*130*this.dx;this.y=this.oy+Math.cos(this.angle*.7)*65*this.dy;}
        else if(this.type==='quick'){const p=(Date.now()-this.born)/this.life;if(p>=1)this.gone=true;else this.r=this.br*(1-p*.8);}
    }
    draw(c){
        c.beginPath();c.arc(this.x,this.y,this.r,0,Math.PI*2);
        c.fillStyle=this.color;c.shadowBlur=16;c.shadowColor=this.color;c.fill();c.shadowBlur=0;
        c.beginPath();c.arc(this.x,this.y,this.r*.45,0,Math.PI*2);c.strokeStyle='#fff';c.lineWidth=2;c.stroke();
        if(this.type==='quick'){const p=(Date.now()-this.born)/this.life;c.beginPath();c.arc(this.x,this.y,this.r+4,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p));c.strokeStyle='rgba(255,50,50,.5)';c.lineWidth=3;c.stroke();}
    }
}
class Particle{
    constructor(x,y,col,big=false){this.x=x;this.y=y;this.col=col;this.sz=(big?Math.random()*5+3:Math.random()*3+1.5);this.vx=(Math.random()*7-3.5);this.vy=(Math.random()*7-3.5);this.l=1;}
    update(){this.x+=this.vx;this.y+=this.vy;this.vx*=.88;this.vy*=.88;this.l-=.04;}
    draw(c){c.globalAlpha=this.l;c.fillStyle=this.col;c.beginPath();c.arc(this.x,this.y,this.sz,0,Math.PI*2);c.fill();c.globalAlpha=1;}
}
class FloatTxt{
    constructor(x,y,txt,col,sz=15){this.x=x+(Math.random()*20-10);this.y=y;this.txt=txt;this.col=col;this.sz=sz;this.l=1;this.vy=-2;}
    update(){this.y+=this.vy;this.vy*=.91;this.l-=.022;}
    draw(c){c.globalAlpha=this.l;c.font=`bold ${this.sz}px Orbitron,monospace`;c.fillStyle=this.col;c.textAlign='center';c.fillText(this.txt,this.x,this.y);c.globalAlpha=1;}
}

function handleClassicClick(e){
    G.clicks++;
    for(let i=G.targets.length-1;i>=0;i--){
        const t=G.targets[i];
        if(Math.hypot(e.clientX-t.x,e.clientY-t.y)<t.r){G.score+=100;G.hits++;for(let j=0;j<12;j++)G.particles.push(new Particle(t.x,t.y,t.color));G.targets.splice(i,1);break;}
    }
    updateHUD();
}

function spawnClassicTarget(){
    if(G.mode==='apex') return;
    const m=100,x=Math.random()*(W-m*2)+m,y=Math.random()*(H-m*2)+m;
    const ok=!G.targets.some(t=>Math.hypot(t.x-x,t.y-y)<100);
    if(ok) G.targets.push(new Target(x,y,G.mode));
}

// ════════════════════════════════════════════════════════════════
// CROSSHAIR DRAW
// Principe Apex : le cercle/anneau reste fixe à la souris (= centre de visée naturel)
// Seule la CROIX (point d'impact réel) se décale avec le recul accumulé
// ════════════════════════════════════════════════════════════════
function drawCrosshair(cx, cy, rx, ry, col, opticType){
    // ax/ay = là où vont VRAIMENT les balles (souris + recul)
    const ax = cx + rx, ay = cy + ry;
    // spread visuel basé sur la magnitude du recul
    const mag    = Math.sqrt(rx*rx + ry*ry);
    const spread = mag * 0.12;

    ctx.save();

    // ── 1. ANNEAU / CERCLE FIXE À LA SOURIS (ne bouge pas) ──
    if(opticType==='iron'||opticType==='holo'||opticType==='holo2x'){
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI*2);
        ctx.stroke();
        // point central fixe
        ctx.fillStyle='rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(cx,cy,1.5,0,Math.PI*2); ctx.fill();
    }

    // ── 2. CROIX DÉCALÉE PAR LE RECUL ──
    ctx.strokeStyle = col;
    ctx.fillStyle   = col;
    ctx.shadowBlur  = 4;
    ctx.shadowColor = col;

    if(opticType==='iron'){
        // Iron sights : croix simple avec gap central
        const gap=5, len=10+spread;
        ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(ax-gap-len,ay);ctx.lineTo(ax-gap,ay);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax+gap,ay);    ctx.lineTo(ax+gap+len,ay);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax,ay-gap-len);ctx.lineTo(ax,ay-gap);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax,ay+gap);    ctx.lineTo(ax,ay+gap+len);ctx.stroke();
        // dot central rouge = impact réel
        ctx.fillStyle='#ff4400';ctx.shadowColor='#ff4400';
        ctx.beginPath();ctx.arc(ax,ay,2,0,Math.PI*2);ctx.fill();

    } else if(opticType==='holo'){
        // 1x Holo : croix fine + petit cercle interne
        const gap=4, len=8+spread;
        ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(ax-gap-len,ay);ctx.lineTo(ax-gap,ay);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax+gap,ay);    ctx.lineTo(ax+gap+len,ay);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax,ay-gap-len);ctx.lineTo(ax,ay-gap);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax,ay+gap);    ctx.lineTo(ax,ay+gap+len);ctx.stroke();
        ctx.lineWidth=1;ctx.globalAlpha=.5;
        ctx.beginPath();ctx.arc(ax,ay,5+spread*.3,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=1;
        ctx.beginPath();ctx.arc(ax,ay,1.5,0,Math.PI*2);ctx.fill();

    } else if(opticType==='holo2x'){
        // 1x-2x : point + chevron bas (style Apex)
        ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(ax,ay,2,0,Math.PI*2);ctx.fill();
        // petit chevron en dessous du point
        const ch=5+spread*.2;
        ctx.beginPath();ctx.moveTo(ax-ch,ay+ch*1.2);ctx.lineTo(ax,ay+ch*.4);ctx.lineTo(ax+ch,ay+ch*1.2);ctx.stroke();
        // lignes horizontales courtes
        const hl=6+spread*.15;
        ctx.beginPath();ctx.moveTo(ax-hl-3,ay);ctx.lineTo(ax-3,ay);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax+3,ay);ctx.lineTo(ax+hl+3,ay);ctx.stroke();

    } else if(opticType==='acog'){
        // 3x ACOG : réticule rouge chevron Apex
        ctx.lineWidth=1.8;ctx.strokeStyle='#ff2200';ctx.fillStyle='#ff2200';ctx.shadowColor='#ff2200';
        const size=7+spread*.2;
        // Chevron principal
        ctx.beginPath();ctx.moveTo(ax-size,ay+size*.6);ctx.lineTo(ax,ay-size*.2);ctx.lineTo(ax+size,ay+size*.6);ctx.stroke();
        // Tick central bas
        ctx.beginPath();ctx.moveTo(ax,ay+size*.6);ctx.lineTo(ax,ay+size*1.4);ctx.stroke();
        // Barres de graduation horizontales
        const markW=size*2.5, markY=ay+size*1.8;
        for(let i=-3;i<=3;i++){
            const mx2=ax+i*(markW/6);
            const mh=i===0?size*.5:size*.25;
            ctx.beginPath();ctx.moveTo(mx2,markY-mh);ctx.lineTo(mx2,markY+mh);ctx.lineWidth=i===0?2:1;ctx.stroke();
        }
        ctx.lineWidth=1;

    } else if(opticType==='sniper'){
        // Dessiné sur oCanvas — ici on dessine juste le dot central
        ctx.fillStyle='#ff0000';ctx.shadowColor='#ff0000';ctx.shadowBlur=6;
        ctx.beginPath();ctx.arc(ax,ay,2,0,Math.PI*2);ctx.fill();
    }

    ctx.restore();
}

function drawSniperOptic(cx,cy,rx,ry){
    oCtx.clearRect(0,0,W,H);
    // Le scope est centré sur la SOURIS (cx,cy), le point d'impact (ax,ay) dérive avec le recul
    const scopeR = Math.min(W,H)*0.22;
    // Fond sombre partout sauf dans le cercle du scope
    oCtx.fillStyle='rgba(0,0,0,0.92)';
    oCtx.fillRect(0,0,W,H);
    // Découpe circulaire (scope)
    oCtx.save();
    oCtx.globalCompositeOperation='destination-out';
    oCtx.beginPath();oCtx.arc(cx,cy,scopeR,0,Math.PI*2);oCtx.fill();
    oCtx.restore();
    // Réticule mil-dot centré sur la souris (fixe)
    oCtx.save();
    oCtx.strokeStyle='rgba(180,180,180,0.85)';oCtx.lineWidth=1;
    oCtx.beginPath();oCtx.moveTo(cx-scopeR,cy);oCtx.lineTo(cx+scopeR,cy);oCtx.stroke();
    oCtx.beginPath();oCtx.moveTo(cx,cy-scopeR);oCtx.lineTo(cx,cy+scopeR);oCtx.stroke();
    // Mil-dots
    for(let i=-4;i<=4;i++){if(i===0)continue;
        const d=scopeR/4.5*i;
        oCtx.beginPath();oCtx.arc(cx+d,cy,2.5,0,Math.PI*2);oCtx.fillStyle='rgba(180,180,180,0.8)';oCtx.fill();
        oCtx.beginPath();oCtx.arc(cx,cy+d,2.5,0,Math.PI*2);oCtx.fill();
    }
    // Bordure du scope
    oCtx.strokeStyle='rgba(80,80,80,0.8)';oCtx.lineWidth=3;
    oCtx.beginPath();oCtx.arc(cx,cy,scopeR,0,Math.PI*2);oCtx.stroke();
    oCtx.restore();
}

// ════════════════════════════════════════════════════════════════
// WASD MOVEMENT SIMULATION
// ════════════════════════════════════════════════════════════════
function updateWASDMovement(dt){
    // Simulate player movement adding bullet deviation
    const spd=0.0012;
    let tx=0,ty=0;
    if(G.wasd.a)tx-=1; if(G.wasd.d)tx+=1;
    if(G.wasd.w)ty-=1; if(G.wasd.s)ty+=1;
    G.moveX+=(tx*spd-G.moveX*.08)*dt;
    G.moveY+=(ty*spd-G.moveY*.08)*dt;
}

// ════════════════════════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════════════════════════
function startTimer(){
    const iv=setInterval(()=>{
        if(!G.running){clearInterval(iv);return;}
        if(paused) return;
        G.timeLeft--;
        updateHUD();
        if(G.timeLeft<=0){clearInterval(iv);endGame();}
    },1000);
}

// ════════════════════════════════════════════════════════════════
// PAUSE / END
// ════════════════════════════════════════════════════════════════
function togglePause(){
    if(!G.running) return;
    paused=!paused;
    document.getElementById('pause').style.display=paused?'flex':'none';
    if(paused){ cancelAnimationFrame(animId); G.mouseHeld=false; }
    else{ lastT=Date.now(); loop(); }
}

function endGame(){
    G.running=false; paused=false;
    cancelAnimationFrame(animId);
    document.getElementById('game-ui').style.display='none';
    oCanvas.style.display='none';
    document.getElementById('gameover').style.display='flex';
    if(G.mode==='apex'){
        document.getElementById('go-title').innerText='Session '+G.gun.name;
        document.getElementById('go-lbl4').innerText='KILLS';
        document.getElementById('go-val4').innerText=G.kills;
        document.getElementById('go-shots').innerText=G.totalShots;
        document.getElementById('go-miss').innerText=G.totalShots-G.totalHits;
        document.getElementById('go-acc').innerText=(G.totalShots===0?0:Math.round(G.totalHits/G.totalShots*100))+'%';
    } else {
        document.getElementById('go-title').innerText='Session Terminée';
        document.getElementById('go-lbl4').innerText='CIBLES/SEC';
        document.getElementById('go-val4').innerText=Math.round(G.hits/60*10)/10;
        document.getElementById('go-shots').innerText=G.clicks;
        document.getElementById('go-miss').innerText=G.clicks-G.hits;
        document.getElementById('go-acc').innerText=(G.clicks===0?0:Math.round(G.hits/G.clicks*100))+'%';
    }
    document.getElementById('go-score').innerText=G.score;
}

function returnMenu(){
    G.running=false; paused=false;
    cancelAnimationFrame(animId);
    G.gun=null; G.mouseHeld=false;
    oCanvas.style.display='none';
    document.getElementById('wasd').style.display='none';
    ['gameover','pause','game-ui'].forEach(id=>document.getElementById(id).style.display='none');
    document.getElementById('menu').style.display='flex';
    apexHudShow(false); apexBarsShow(false);
}

// ════════════════════════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════════════════════════
function loop(){
    if(!G.running||paused) return;
    const now=Date.now(), dt=now-lastT; lastT=now;

    ctx.clearRect(0,0,W,H);

    // Grid BG
    const gc=G.gun?`rgba(${hr(G.gun.color)},.04)`:'rgba(0,243,255,.04)';
    ctx.strokeStyle=gc; ctx.lineWidth=1;
    const gs=50,off=(now/50)%gs;
    for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=off;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    if(G.gun){
        // ── APEX ──
        updateWASDMovement(dt);

        const w=G.gun;
        const canFire=!w.spinup||(G.spinning&&now-G.spinupStart>w.spinup);

        if(G.currentMode==='auto'&&G.mouseHeld&&!G.isReloading&&canFire) fireBullet();
        if((G.currentMode==='burst'||G.currentMode==='semi')&&G.burstQ>0) processBurst(now);

        // Recoil decay
        const decay=G.mouseHeld&&G.currentMode==='auto'?.012:.09;
        G.recoilX*=(1-decay); G.recoilY*=(1-decay);
        if(Math.abs(G.recoilX)<.05)G.recoilX=0;
        if(Math.abs(G.recoilY)<.05)G.recoilY=0;

        updateReloadBar(now);

        // Spinup ring HAVOC
        if(w.spinup&&G.spinning){
            const p=Math.min(1,(now-G.spinupStart)/w.spinup);
            ctx.beginPath();ctx.arc(mx,my,22,0,Math.PI*2*p);
            ctx.strokeStyle=`rgba(${hr(w.color)},.6)`;ctx.lineWidth=3;ctx.stroke();
        }

        // Draw enemy
        drawEnemy(ctx, enemy);

        // Crosshair
        const ot=G.optic?.crossType||'iron';
        if(ot==='sniper'){ drawSniperOptic(mx,my,G.recoilX,G.recoilY); }
        drawCrosshair(mx,my,G.recoilX,G.recoilY,w.color,ot);

        // Recoil path trace (faint trail showing bullet impact drift)
        if(G.recoilX!==0||G.recoilY!==0){
            ctx.save();
            ctx.strokeStyle=`rgba(${hr(w.color)},.15)`;
            ctx.lineWidth=1;ctx.setLineDash([2,4]);
            ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+G.recoilX,my+G.recoilY);ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

    } else {
        // ── CLASSIC ──
        G.spawnTimer+=dt;
        if(G.spawnTimer>G.spawnInterval){ spawnClassicTarget(); G.spawnTimer=0; if(G.spawnInterval>400)G.spawnInterval-=5; }
        G.targets.forEach(t=>t.update()); G.targets=G.targets.filter(t=>!t.gone);
        G.targets.forEach(t=>t.draw(ctx));

        // Simple crosshair
        ctx.save();
        ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=1.5;
        const s=8;
        ctx.beginPath();ctx.moveTo(mx-s,my);ctx.lineTo(mx+s,my);ctx.stroke();
        ctx.beginPath();ctx.moveTo(mx,my-s);ctx.lineTo(mx,my+s);ctx.stroke();
        ctx.restore();
    }

    // Shared particles + floats
    G.particles.forEach(p=>{p.update();p.draw(ctx);}); G.particles=G.particles.filter(p=>p.l>0);
    G.floats.forEach(f=>{f.update();f.draw(ctx);}); G.floats=G.floats.filter(f=>f.l>0);

    animId=requestAnimationFrame(loop);
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════
function hr(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `${r},${g},${b}`;}
function rgba(hex,a){return `rgba(${hr(hex)},${a})`;}