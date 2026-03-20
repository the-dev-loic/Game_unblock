// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('canvas-wrap');

let CELL = 40;        // px per grid cell
let MAP_W = 20;       // grid cols
let MAP_H = 20;       // grid rows
let zoom = 1;
let panX = 0, panY = 0;
let showGrid = true;
let snapToGrid = true;
let viewMode = 'top';  // 'top' | 'iso'
let activeLayer = 0;

// Map data: array of placed objects
// Each: { id, type, gx, gy, layer, height, w, d, bh, rot, color, amp, spd, interval, note }
let mapData = [];
let selectedId = null;
let nextId = 1;
let currentTool = 'floor';
let isPainting = false;
let isDragging = false;
let dragStart = null;
let mousePan = false;
let lastMouseX = 0, lastMouseY = 0;

// ═══════════════════════════════════════════════════════════════
//  OBJECT DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const OBJ_DEFS = {
    floor:         {label:'Sol herbe',   color:'#5a8c38', drawH:0.1, group:'terrain',   defBH:0.3},
    floor_dirt:    {label:'Sol terre',   color:'#8d6440', drawH:0.1, group:'terrain',   defBH:0.3},
    floor_metal:   {label:'Sol métal',   color:'#606878', drawH:0.1, group:'terrain',   defBH:0.3},
    wall:          {label:'Mur béton',   color:'#a09080', drawH:1.0, group:'structure', defBH:8},
    wall_metal:    {label:'Mur métal',   color:'#607080', drawH:1.0, group:'structure', defBH:8},
    wall_wood:     {label:'Mur bois',    color:'#a07840', drawH:1.0, group:'structure', defBH:6},
    platform:      {label:'Plateforme',  color:'#708090', drawH:0.3, group:'structure', defBH:0.4},
    ramp:          {label:'Rampe',       color:'#909080', drawH:0.5, group:'structure', defBH:1},
    pillar:        {label:'Pilier',      color:'#888878', drawH:1.0, group:'structure', defBH:12},
    stairs:        {label:'Escalier',    color:'#909090', drawH:0.8, group:'structure', defBH:8},
    tower:         {label:'Tour',        color:'#888888', drawH:1.0, group:'structure', defBH:24},
    target_static: {label:'Cible fixe',  color:'#dd2222', drawH:0.8, group:'target',    defBH:1},
    target_moving: {label:'Cible mobile',color:'#cc4400', drawH:0.8, group:'target',    defBH:1},
    target_popup:  {label:'Cible popup', color:'#aa5500', drawH:0.8, group:'target',    defBH:1},
    target_armored:{label:'Cible blindée',color:'#448800',drawH:0.8, group:'target',    defBH:1},
    spawn:         {label:'Spawn',       color:'#2255cc', drawH:0.5, group:'special',   defBH:1},
    tree:          {label:'Arbre',       color:'#336622', drawH:0.9, group:'deco',      defBH:1},
    boulder:       {label:'Rocher',      color:'#666666', drawH:0.6, group:'deco',      defBH:2},
    cover:         {label:'Couverture',  color:'#555555', drawH:0.6, group:'deco',      defBH:2},
};

// ═══════════════════════════════════════════════════════════════
//  CANVAS SETUP
// ═══════════════════════════════════════════════════════════════
function resizeCanvas(){
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    // Center map on first load
    if(panX === 0 && panY === 0){
        panX = (canvas.width - MAP_W * CELL * zoom) / 2;
        panY = (canvas.height - MAP_H * CELL * zoom) / 2;
    }
    render();
}
window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════════
function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    const cz = CELL;
    const mw = MAP_W * cz;
    const mh = MAP_H * cz;

    // Map background
    ctx.fillStyle = '#1a1e10';
    ctx.fillRect(0, 0, mw, mh);

    // Draw objects by layer order
    const layerOrder = [...mapData].sort((a,b) => a.layer - b.layer || a.id - b.id);
    for(const obj of layerOrder){
        drawObj(obj, cz);
    }

    // Grid overlay
    if(showGrid){
        ctx.strokeStyle = 'rgba(200,168,75,0.12)';
        ctx.lineWidth = 0.5 / zoom;
        for(let x=0;x<=MAP_W;x++){
            ctx.beginPath(); ctx.moveTo(x*cz,0); ctx.lineTo(x*cz,mh); ctx.stroke();
        }
        for(let y=0;y<=MAP_H;y++){
            ctx.beginPath(); ctx.moveTo(0,y*cz); ctx.lineTo(mw,y*cz); ctx.stroke();
        }
        // Major grid every 5
        ctx.strokeStyle = 'rgba(200,168,75,0.22)';
        ctx.lineWidth = 1 / zoom;
        for(let x=0;x<=MAP_W;x+=5){
            ctx.beginPath(); ctx.moveTo(x*cz,0); ctx.lineTo(x*cz,mh); ctx.stroke();
        }
        for(let y=0;y<=MAP_H;y+=5){
            ctx.beginPath(); ctx.moveTo(0,y*cz); ctx.lineTo(mw,y*cz); ctx.stroke();
        }
    }

    // Map border
    ctx.strokeStyle = 'rgba(200,168,75,0.4)';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(0,0,mw,mh);

    // Axis labels
    ctx.fillStyle = 'rgba(200,168,75,0.3)';
    ctx.font = `${10/zoom}px Share Tech Mono`;
    for(let x=0;x<MAP_W;x+=5){
        ctx.fillText(x, x*cz+3, -4/zoom);
    }
    for(let y=0;y<MAP_H;y+=5){
        ctx.fillText(y, -22/zoom, y*cz+10/zoom);
    }

    ctx.restore();
}

function drawObj(obj, cz){
    const def = OBJ_DEFS[obj.type];
    if(!def) return;

    const x = obj.gx * cz;
    const y = obj.gy * cz;
    const w = (obj.w || 1) * cz;
    const d = (obj.d || 1) * cz;
    const color = obj.color || def.color;

    const isSelected = obj.id === selectedId;
    const isCurrentLayer = obj.layer === activeLayer;
    const alpha = isCurrentLayer ? 1 : 0.35;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + w/2, y + d/2);
    ctx.rotate((obj.rot || 0) * Math.PI / 180);

    // Main fill
    ctx.fillStyle = color;
    ctx.beginPath();
    roundRect(ctx, -w/2, -d/2, w, d, 2/zoom);
    ctx.fill();

    // Darker border
    ctx.strokeStyle = shadeColor(color, -40);
    ctx.lineWidth = 1.5/zoom;
    ctx.stroke();

    // Height indicator (vertical bar on right)
    const bh = obj.bh || def.defBH || 1;
    const maxBH = 30;
    const barW = Math.max(3/zoom, w * 0.06);
    const barFrac = Math.min(bh / maxBH, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(w/2 - barW - 1/zoom, -d/2 + d*(1-barFrac), barW, d * barFrac);

    // Icon / label
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.min(10, cz*0.25)/zoom}px Rajdhani`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icons = {
        floor:'G', floor_dirt:'D', floor_metal:'M',
        wall:'W', wall_metal:'WM', wall_wood:'WW',
        platform:'P', ramp:'R', pillar:'||', stairs:'ST', tower:'T',
        target_static:'◎', target_moving:'⇌◎', target_popup:'↑◎', target_armored:'⛨◎',
        spawn:'⊕', tree:'♣', boulder:'◉', cover:'▪',
    };
    const label = icons[obj.type] || '?';
    ctx.fillText(label, 0, 0);

    // Note label
    if(obj.note){
        ctx.font = `${Math.min(8,cz*0.18)/zoom}px Share Tech Mono`;
        ctx.fillStyle = 'rgba(255,255,200,0.7)';
        ctx.fillText(obj.note.slice(0,8), 0, d/2 - 5/zoom);
    }

    // Height text
    if(bh > 1){
        ctx.font = `${Math.min(7,cz*0.16)/zoom}px Share Tech Mono`;
        ctx.fillStyle = 'rgba(200,168,75,0.8)';
        ctx.textAlign = 'right';
        ctx.fillText(`h${bh}`, w/2 - barW - 2/zoom, d/2 - 4/zoom);
    }

    ctx.restore();

    // Selection ring
    if(isSelected){
        ctx.save();
        ctx.translate(x + w/2, y + d/2);
        ctx.rotate((obj.rot || 0) * Math.PI / 180);
        ctx.strokeStyle = '#f0d080';
        ctx.lineWidth = 2/zoom;
        ctx.setLineDash([4/zoom, 3/zoom]);
        ctx.strokeRect(-w/2 - 3/zoom, -d/2 - 3/zoom, w + 6/zoom, d + 6/zoom);
        ctx.setLineDash([]);
        // Resize handle
        ctx.fillStyle = '#f0d080';
        ctx.fillRect(w/2 - 4/zoom, d/2 - 4/zoom, 8/zoom, 8/zoom);
        ctx.restore();
    }

    // Layer indicator dot
    if(obj.layer > 0){
        ctx.save();
        ctx.fillStyle = ['#aaa','#4af','#fa4','#4fa','#f4a'][obj.layer % 5];
        ctx.beginPath();
        ctx.arc(x + 5/zoom, y + 5/zoom, 3/zoom, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

function roundRect(ctx, x, y, w, h, r){
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
}

function shadeColor(hex, pct){
    const n = parseInt(hex.replace('#',''),16);
    const r = Math.max(0,Math.min(255,((n>>16)&0xff)+pct));
    const g = Math.max(0,Math.min(255,((n>>8)&0xff)+pct));
    const b = Math.max(0,Math.min(255,(n&0xff)+pct));
    return `rgb(${r},${g},${b})`;
}

// ═══════════════════════════════════════════════════════════════
//  MOUSE INPUT
// ═══════════════════════════════════════════════════════════════
function canvasToGrid(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (clientX - rect.left) * scaleX;
    const cy = (clientY - rect.top) * scaleY;
    const wx = (cx - panX) / zoom;
    const wy = (cy - panY) / zoom;
    return { wx, wy, gx: Math.floor(wx / CELL), gy: Math.floor(wy / CELL) };
}

canvas.addEventListener('mousedown', e => {
    if(e.button === 1 || (e.button === 0 && e.altKey)){
        mousePan = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        lastMouseX = (e.clientX - rect.left) * scaleX;
        lastMouseY = (e.clientY - rect.top) * scaleY;
        e.preventDefault(); return;
    }
    if(e.button === 2){
        // Right click = erase
        const {gx,gy} = canvasToGrid(e.clientX, e.clientY);
        eraseAt(gx, gy); render(); return;
    }
    if(e.button === 0){
        const {gx,gy,wx,wy} = canvasToGrid(e.clientX, e.clientY);

        if(currentTool === 'select_tool'){
            // Try to select object at this position
            const obj = getObjAt(gx, gy);
            selectObj(obj ? obj.id : null);
            if(obj){ isDragging = true; dragStart = {gx, gy, ox: obj.gx, oy: obj.gy}; }
            render(); return;
        }
        if(currentTool === 'eraser'){
            eraseAt(gx, gy); render(); return;
        }
        isPainting = true;
        placeAt(gx, gy);
        render();
    }
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    if(mousePan){
        panX += cx - lastMouseX;
        panY += cy - lastMouseY;
        lastMouseX = cx; lastMouseY = cy;
        render(); return;
    }

    const {gx,gy} = canvasToGrid(e.clientX, e.clientY);
    document.getElementById('coords').textContent = `X: ${gx}  Y: ${gy}`;

    if(isDragging && dragStart){
        const dx = gx - dragStart.gx;
        const dy = gy - dragStart.gy;
        const obj = mapData.find(o=>o.id===selectedId);
        if(obj){ obj.gx = dragStart.ox+dx; obj.gy = dragStart.oy+dy; }
        render(); return;
    }
    if(isPainting && currentTool !== 'select_tool'){
        if(currentTool === 'eraser') eraseAt(gx,gy);
        else placeAt(gx,gy);
        render();
    }
});

canvas.addEventListener('mouseup', e => {
    mousePan = false; isPainting = false; isDragging = false; dragStart = null;
});
canvas.addEventListener('mouseleave', e => {
    mousePan = false; isPainting = false; isDragging = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    // Zoom toward mouse: keep world point under cursor fixed
    const worldX = (mouseX - panX) / zoom;
    const worldY = (mouseY - panY) / zoom;
    zoom = Math.max(0.2, Math.min(4, zoom * factor));
    panX = mouseX - worldX * zoom;
    panY = mouseY - worldY * zoom;
    document.getElementById('zoom-val').textContent = zoom.toFixed(1)+'×';
    document.getElementById('zoom-ind').textContent = `ZOOM ${zoom.toFixed(1)}×`;
    document.getElementById('zoom-range').value = zoom;
    render();
}, {passive:false});

// ═══════════════════════════════════════════════════════════════
//  PLACE / ERASE
// ═══════════════════════════════════════════════════════════════
function placeAt(gx, gy){
    if(gx < 0 || gy < 0 || gx >= MAP_W || gy >= MAP_H) return;
    if(currentTool === 'eraser'){ eraseAt(gx,gy); return; }
    if(currentTool === 'select_tool') return;

    // Don't duplicate floor-type objects at same pos+layer
    const existing = mapData.find(o=>o.gx===gx&&o.gy===gy&&o.layer===activeLayer&&o.type===currentTool);
    if(existing) return;

    const def = OBJ_DEFS[currentTool] || {};
    const obj = {
        id: nextId++,
        type: currentTool,
        gx, gy,
        layer: activeLayer,
        height: 0,
        w: 1, d: 1,
        bh: def.defBH || 3,
        rot: 0,
        color: def.color || '#888888',
        amp: 3, spd: 0.8, interval: 2.5,
        note: ''
    };
    mapData.push(obj);
    selectedId = obj.id;
    selectObj(obj.id);
    setStatus('Objet placé', 'ok');
}

function eraseAt(gx, gy){
    // Remove topmost object at this cell on active layer
    for(let i = mapData.length-1; i >= 0; i--){
        const o = mapData[i];
        if(o.layer === activeLayer && o.gx === gx && o.gy === gy){
            mapData.splice(i,1);
            if(selectedId === o.id) selectObj(null);
            setStatus('Supprimé', 'ok');
            return;
        }
    }
}

function getObjAt(gx, gy){
    // Return topmost on active layer
    for(let i = mapData.length-1; i >= 0; i--){
        const o = mapData[i];
        if(o.layer === activeLayer && gx >= o.gx && gx < o.gx + (o.w||1) && gy >= o.gy && gy < o.gy + (o.d||1)){
            return o;
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
//  SELECTION
// ═══════════════════════════════════════════════════════════════
function selectObj(id){
    selectedId = id;
    const obj = mapData.find(o=>o.id===id);
    const info = document.getElementById('sel-info');
    const delBtn = document.getElementById('del-sel');
    const targetOpts = document.getElementById('target-opts');
    const targetSpdRow = document.getElementById('target-spd-row');
    const popupOpts = document.getElementById('popup-opts');

    if(obj){
        const def = OBJ_DEFS[obj.type] || {};
        info.innerHTML = `<b style="color:var(--gold2)">${def.label||obj.type}</b><br>
      Pos: (${obj.gx}, ${obj.gy})<br>Couche: ${obj.layer}<br>ID: ${obj.id}`;
        document.getElementById('prop-height').value = obj.height ?? 0;
        document.getElementById('prop-w').value = obj.w ?? 1;
        document.getElementById('prop-d').value = obj.d ?? 1;
        document.getElementById('prop-bh').value = obj.bh ?? def.defBH ?? 3;
        document.getElementById('prop-rot').value = obj.rot ?? 0;
        document.getElementById('prop-color').value = obj.color || def.color || '#888888';
        document.getElementById('prop-amp').value = obj.amp ?? 3;
        document.getElementById('prop-spd').value = obj.spd ?? 0.8;
        document.getElementById('prop-interval').value = obj.interval ?? 2.5;
        document.getElementById('prop-note').value = obj.note || '';
        delBtn.style.display = 'block';
        targetOpts.style.display = obj.type==='target_moving'?'block':'none';
        targetSpdRow.style.display = (obj.type==='target_moving')?'block':'none';
        popupOpts.style.display = obj.type==='target_popup'?'block':'none';
    } else {
        info.textContent = 'Aucune sélection';
        delBtn.style.display = 'none';
        targetOpts.style.display = 'none';
        targetSpdRow.style.display = 'none';
        popupOpts.style.display = 'none';
    }
}

function updateSelProp(prop, val){
    const obj = mapData.find(o=>o.id===selectedId);
    if(!obj) return;
    const num = parseFloat(val);
    if(['height','w','d','bh','rot','amp','spd','interval'].includes(prop)){
        obj[prop] = isNaN(num) ? 0 : num;
    } else {
        obj[prop] = val;
    }
    // Ne pas rappeler selectObj (évite boucle) — juste mettre à jour l'info
    const info = document.getElementById('sel-info');
    const def = OBJ_DEFS[obj.type] || {};
    info.innerHTML = `<b style="color:var(--gold2)">${def.label||obj.type}</b><br>
    Pos: (${obj.gx}, ${obj.gy})<br>Couche: ${obj.layer}<br>ID: ${obj.id}<br>
    <span style="color:var(--teal)">h:${obj.bh} w:${obj.w} d:${obj.d} y:${obj.height}</span>`;
    render();
}

function deleteSelected(){
    mapData = mapData.filter(o=>o.id!==selectedId);
    selectObj(null); render();
}

// ═══════════════════════════════════════════════════════════════
//  TOOLS
// ═══════════════════════════════════════════════════════════════
function selectTool(el){
    document.querySelectorAll('.obj-item').forEach(e=>e.classList.remove('selected'));
    el.classList.add('selected');
    currentTool = el.dataset.type;
}

function setActiveLayer(n){
    activeLayer = n;
    document.getElementById('layer-input').value = n;
    document.querySelectorAll('.lbtn').forEach((b,i)=>b.classList.toggle('active',i===n));
    render();
}

function updateGrid(){
    CELL = parseInt(document.getElementById('grid-size').value) || 40;
    render();
}

function setZoom(v){
    zoom = parseFloat(v);
    document.getElementById('zoom-val').textContent = zoom.toFixed(1)+'×';
    document.getElementById('zoom-ind').textContent = `ZOOM ${zoom.toFixed(1)}×`;
    render();
}

function toggleGrid(){
    showGrid = !showGrid;
    document.getElementById('tgrid-btn').textContent = showGrid ? 'GRILLE ✓' : 'GRILLE ✗';
    render();
}

function toggleSnap(){
    snapToGrid = !snapToGrid;
    document.getElementById('snap-btn').textContent = snapToGrid ? 'SNAP ✓' : 'SNAP ✗';
}

function setView(v){
    viewMode = v;
    document.getElementById('vbtn-top').classList.toggle('active', v==='top');
    document.getElementById('vbtn-iso').classList.toggle('active', v==='3d');
    const is3d = v==='3d';
    document.getElementById('grid-canvas').style.display = is3d ? 'none' : 'block';
    document.getElementById('canvas3d').style.display = is3d ? 'block' : 'none';
    document.getElementById('view3d-hint').style.display = is3d ? 'block' : 'none';
    document.getElementById('zoom-ind').style.display = is3d ? 'none' : 'block';
    if(is3d){
        // Attendre que Three.js soit chargé puis construire
        init3D().then(()=>{ resize3D(); rebuild3D(); start3DLoop(); });
    } else {
        stop3DLoop(); render();
    }
}

function updateMapSize(){
    MAP_W = parseInt(document.getElementById('map-w').value)||20;
    MAP_H = parseInt(document.getElementById('map-h').value)||20;
    render();
}

// ═══════════════════════════════════════════════════════════════
//  SAVE / LOAD / EXPORT
// ═══════════════════════════════════════════════════════════════
function getMapJSON(){
    return JSON.stringify({
        name: document.getElementById('map-name-input').value || 'Map',
        mapW: MAP_W, mapH: MAP_H,
        cell: CELL,
        objects: mapData,
        meta: { created: new Date().toISOString(), version: '1.0' }
    }, null, 2);
}

function saveMap(){
    const json = getMapJSON();
    const name = document.getElementById('map-name-input').value || 'map';
    const blob = new Blob([json], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name.replace(/\s+/g,'_').toLowerCase() + '.sentinel.json';
    a.click();
    setStatus('Map sauvegardée !', 'ok');
}

function loadMap(){
    openModal('CHARGER UNE MAP', 'Collez le JSON de votre map ici :', '', 'load');
}

function newMap(){
    if(mapData.length > 0 && !confirm('Créer une nouvelle map ? Les changements non sauvegardés seront perdus.')) return;
    mapData = []; nextId = 1; selectedId = null; selectObj(null);
    setStatus('Nouvelle map', 'ok'); render();
}

function clearMap(){
    if(!confirm('Vider la map ?')) return;
    mapData = []; selectedId = null; selectObj(null);
    setStatus('Map vidée', 'ok'); render();
}

function exportToGame(){
    // Sauvegarde le JSON + instructions claires
    const json = getMapJSON();
    const name = document.getElementById('map-name-input').value || 'map';
    const blob = new Blob([json], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name.replace(/\s+/g,'_').toLowerCase() + '.sentinel.json';
    a.click();
    navigator.clipboard.writeText(json).catch(()=>{});
    setStatus('JSON téléchargé ! Chargez-le dans sentinel.html via "Charger une map"', 'ok');
    setTimeout(()=>{
        alert('Map sauvegardée !\n\nPour jouer :\n1. Ouvrez sentinel.html\n2. Cliquez "Charger une map"\n3. Sélectionnez le fichier .sentinel.json téléchargé\n4. Cliquez "Jouer (map chargée)"');
    }, 200);
}

// Modal
let modalMode = '';
function openModal(title, desc, content, mode){
    modalMode = mode;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-desc').textContent = desc;
    document.getElementById('modal-ta').value = content;
    document.getElementById('modal-bg').classList.add('show');
}
function closeModal(){ document.getElementById('modal-bg').classList.remove('show'); }
function copyModalText(){
    navigator.clipboard.writeText(document.getElementById('modal-ta').value);
    setStatus('Copié !', 'ok');
}
function confirmModal(){
    if(modalMode === 'load'){
        try{
            const data = JSON.parse(document.getElementById('modal-ta').value);
            loadFromJSON(data);
            closeModal();
        } catch(e){ setStatus('JSON invalide !', 'err'); }
    } else { closeModal(); }
}

function loadFromJSON(data){
    mapData = data.objects || [];
    nextId = mapData.reduce((m,o)=>Math.max(m,o.id),0) + 1;
    MAP_W = data.mapW || 20; MAP_H = data.mapH || 20;
    document.getElementById('map-w').value = MAP_W;
    document.getElementById('map-h').value = MAP_H;
    document.getElementById('map-name-input').value = data.name || 'Map';
    selectedId = null; selectObj(null);
    setStatus('Map chargée !', 'ok'); render();
}

// Drag-and-drop JSON file
wrap.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
wrap.addEventListener('drop', e=>{
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try { loadFromJSON(JSON.parse(ev.target.result)); }
        catch(e){ setStatus('Fichier invalide', 'err'); }
    };
    reader.readAsText(file);
});

function setStatus(msg, cls=''){
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.className = cls;
    setTimeout(()=>{ el.textContent='Prêt'; el.className=''; }, 2500);
}

// Keyboard shortcuts
document.addEventListener('keydown', e=>{
    if(document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if(e.code==='KeyE') { document.querySelector('[data-type=eraser]').click(); }
    if(e.code==='KeyS' && e.ctrlKey){ e.preventDefault(); saveMap(); }
    if(e.code==='Delete'||e.code==='Backspace') deleteSelected();
    if(e.code==='KeyZ' && e.ctrlKey){ /* undo TODO */ }
    if(e.code==='Escape') selectObj(null);
});

// ─── INIT ───
resizeCanvas();
setStatus('Map Editor prêt', 'ok');

// ═══════════════════════════════════════════════════════════════
//  3D PREVIEW — Three.js
// ═══════════════════════════════════════════════════════════════
let r3, s3, c3, animId3=null;
let orbitTheta=0.6, orbitPhi=1.0, orbitDist=60;
let orbitTarget={x:0,y:0,z:0};
let mouse3={x:0,y:0,btn:-1};
let THREE3=null;

const CELL_3D = 4; // 1 editor cell = 4 world units

async function init3D(){
    if(THREE3) return;
    // Dynamic import Three.js
    THREE3 = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
    const c = document.getElementById('canvas3d');
    r3 = new THREE3.WebGLRenderer({canvas:c, antialias:true});
    r3.shadowMap.enabled=true;
    r3.shadowMap.type=THREE3.PCFSoftShadowMap;
    r3.toneMapping=THREE3.ACESFilmicToneMapping;
    r3.toneMappingExposure=1.05;

    s3 = new THREE3.Scene();
    s3.background = new THREE3.Color(0x87ceeb);
    s3.fog = new THREE3.FogExp2(0xc9e8f8, 0.007);

    const wrap=document.getElementById('canvas-wrap');
    const initW=wrap.clientWidth||800, initH=wrap.clientHeight||600;
    r3.setSize(initW, initH, false);
    c3 = new THREE3.PerspectiveCamera(60, initW/initH, 0.1, 1000);

    // Lights
    s3.add(new THREE3.AmbientLight(0xfff5e8, 1.0));
    const sun = new THREE3.DirectionalLight(0xfff8e0, 2.0);
    sun.position.set(40,80,30); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=sun.shadow.camera.bottom=-80;
    sun.shadow.camera.right=sun.shadow.camera.top=80;
    s3.add(sun);
    s3.add(new THREE3.HemisphereLight(0x87ceeb,0x8fa060,0.5));

    // Mouse orbit controls
    const cv = document.getElementById('canvas3d');
    cv.addEventListener('mousedown', e=>{ mouse3.btn=e.button; mouse3.x=e.clientX; mouse3.y=e.clientY; e.preventDefault(); });
    cv.addEventListener('mousemove', e=>{
        const dx=e.clientX-mouse3.x, dy=e.clientY-mouse3.y;
        mouse3.x=e.clientX; mouse3.y=e.clientY;
        if(mouse3.btn===0){ orbitTheta-=dx*0.008; orbitPhi=Math.max(.1,Math.min(Math.PI*.48,orbitPhi+dy*0.008)); }
        if(mouse3.btn===2){
            const right=new THREE3.Vector3(Math.cos(orbitTheta),0,-Math.sin(orbitTheta));
            const up=new THREE3.Vector3(0,1,0);
            orbitTarget.x-=right.x*dx*orbitDist*0.0015;
            orbitTarget.z-=right.z*dx*orbitDist*0.0015;
            orbitTarget.y+=dy*orbitDist*0.0015;
        }
    });
    cv.addEventListener('mouseup', ()=>mouse3.btn=-1);
    cv.addEventListener('wheel', e=>{ orbitDist=Math.max(4,Math.min(200,orbitDist*(1+e.deltaY*0.001))); e.preventDefault(); },{passive:false});
    cv.addEventListener('contextmenu',e=>e.preventDefault());

    window.addEventListener('resize', resize3D);
    resize3D();
}

function resize3D(){
    if(!r3||!c3) return;
    const c=document.getElementById('canvas3d');
    const wrap=document.getElementById('canvas-wrap');
    // Utiliser le conteneur parent car canvas3d peut être display:none
    const w=wrap.clientWidth||c.clientWidth||800;
    const h=wrap.clientHeight||c.clientHeight||600;
    r3.setSize(w,h,false);
    c3.aspect=w/h; c3.updateProjectionMatrix();
}

const MAT3 = {
    grass: ()=>new THREE3.MeshStandardMaterial({color:0x7db550,roughness:.9}),
    dirt:  ()=>new THREE3.MeshStandardMaterial({color:0x8d6440,roughness:.9}),
    metal: ()=>new THREE3.MeshStandardMaterial({color:0x7a8090,roughness:.4,metalness:.6}),
    conc:  ()=>new THREE3.MeshStandardMaterial({color:0xb0a898,roughness:.85}),
    wood:  ()=>new THREE3.MeshStandardMaterial({color:0xa0784a,roughness:.9}),
    red:   ()=>new THREE3.MeshStandardMaterial({color:0xdd2222,roughness:.6}),
    target:()=>new THREE3.MeshStandardMaterial({color:0xdd2222,roughness:.6,emissive:0x330000,emissiveIntensity:.3}),
    spawn: ()=>new THREE3.MeshStandardMaterial({color:0x3366ff,roughness:.5,emissive:0x001133,emissiveIntensity:.5}),
};

function typeToMat3(type, color){
    if(color && color!=='#888888') return new THREE3.MeshStandardMaterial({color:new THREE3.Color(color),roughness:.8});
    const m={
        floor:MAT3.grass, floor_dirt:MAT3.dirt, floor_metal:MAT3.metal,
        wall:MAT3.conc, wall_metal:MAT3.metal, wall_wood:MAT3.wood,
        platform:MAT3.metal, ramp:MAT3.conc, pillar:MAT3.conc,
        stairs:MAT3.conc, tower:MAT3.conc, cover:MAT3.conc, boulder:MAT3.conc,
        target_static:MAT3.target, target_moving:MAT3.target,
        target_popup:MAT3.target, target_armored:MAT3.target,
        spawn:MAT3.spawn, tree:MAT3.grass,
    };
    return (m[type]||MAT3.conc)();
}

function rebuild3D(){
    if(!s3) return;
    // Clear existing map objects (keep lights)
    const toRemove=[];
    s3.traverse(o=>{ if(o.isMesh||o.isGroup) toRemove.push(o); });
    toRemove.forEach(o=>s3.remove(o));

    const mw=MAP_W*CELL_3D, mh=MAP_H*CELL_3D;

    // Ground plane
    const gm=new THREE3.Mesh(new THREE3.BoxGeometry(mw+20,1,mh+20),MAT3.grass());
    gm.position.set(0,-0.5,0); gm.receiveShadow=true; s3.add(gm);

    // Grid lines on ground
    const gridMat=new THREE3.MeshBasicMaterial({color:0x8aba60,transparent:true,opacity:.25});
    for(let x=0;x<=MAP_W;x++){
        const wx=x*CELL_3D-mw/2;
        const lm=new THREE3.Mesh(new THREE3.BoxGeometry(.05,0.02,mh),gridMat);
        lm.position.set(wx,0.01,0); s3.add(lm);
    }
    for(let z=0;z<=MAP_H;z++){
        const wz=z*CELL_3D-mh/2;
        const lm=new THREE3.Mesh(new THREE3.BoxGeometry(mw,0.02,.05),gridMat);
        lm.position.set(0,0.01,wz); s3.add(lm);
    }

    // Place objects
    for(const obj of mapData){
        const wx=(obj.gx+.5)*CELL_3D - mw/2;
        const wz=(obj.gy+.5)*CELL_3D - mh/2;
        const bh=obj.bh||3;
        const w=(obj.w||1)*CELL_3D;
        const d=(obj.d||1)*CELL_3D;
        const wy=(obj.height||0)+bh/2;

        const mat=typeToMat3(obj.type, obj.color);

        if(obj.type==='tree'){
            const trunk=new THREE3.Mesh(new THREE3.CylinderGeometry(.4,.5,5,8),MAT3.wood());
            trunk.position.set(wx,2.5,wz); trunk.castShadow=true; s3.add(trunk);
            const leaves=new THREE3.Mesh(new THREE3.SphereGeometry(3,8,6),MAT3.grass());
            leaves.position.set(wx,7,wz); leaves.castShadow=true; s3.add(leaves);
        } else if(obj.type==='boulder'){
            const b=new THREE3.Mesh(new THREE3.SphereGeometry(1.5,8,7),MAT3.conc());
            b.position.set(wx,.8+obj.height||0,wz); b.castShadow=true; s3.add(b);
        } else if(obj.type==='pillar'){
            const pm=new THREE3.Mesh(new THREE3.CylinderGeometry(w*.3,w*.3,bh,12),mat);
            pm.position.set(wx,wy,wz); pm.castShadow=true; s3.add(pm);
        } else if(obj.type==='ramp'){
            const rm=new THREE3.Mesh(new THREE3.BoxGeometry(w,.4,d),mat);
            rm.position.set(wx,wy,wz); rm.rotation.x=-.35;
            rm.castShadow=true; rm.receiveShadow=true; s3.add(rm);
        } else if(obj.type==='spawn'){
            // Spawn marker: glowing pillar
            const sm=new THREE3.Mesh(new THREE3.CylinderGeometry(.3,.3,3,8),mat);
            sm.position.set(wx,1.5+obj.height||0,wz); s3.add(sm);
            const sc=new THREE3.Mesh(new THREE3.CircleGeometry(1.5,16),
                new THREE3.MeshBasicMaterial({color:0x3366ff,transparent:true,opacity:.4,side:THREE3.DoubleSide}));
            sc.rotation.x=-Math.PI/2; sc.position.set(wx,.05,wz); s3.add(sc);
        } else if(obj.type.startsWith('target_')){
            // Target: red silhouette
            const tm=new THREE3.Mesh(new THREE3.BoxGeometry(w*.7,1.1,.15),mat);
            tm.position.set(wx,(obj.height||0)+1.5,wz); tm.castShadow=true; s3.add(tm);
            const th=new THREE3.Mesh(new THREE3.SphereGeometry(.35,8,8),
                new THREE3.MeshStandardMaterial({color:0xff8888,roughness:.5}));
            th.position.set(wx,(obj.height||0)+2.35,wz); s3.add(th);
            const pole=new THREE3.Mesh(new THREE3.CylinderGeometry(.06,.06,.8,6),MAT3.metal());
            pole.position.set(wx,(obj.height||0)+.5,wz); s3.add(pole);
        } else {
            // Box generic
            const bm=new THREE3.Mesh(new THREE3.BoxGeometry(w,bh,d),mat);
            bm.position.set(wx,wy,wz);
            bm.rotation.y=(obj.rot||0)*Math.PI/180;
            bm.castShadow=true; bm.receiveShadow=true; s3.add(bm);
            // Thin top edge highlight
            if(bh>1){
                const em=new THREE3.Mesh(new THREE3.BoxGeometry(w+.04,.08,d+.04),
                    new THREE3.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12}));
                em.position.set(wx,wy+bh/2+.04,wz); s3.add(em);
            }
        }

        // Selection highlight
        if(obj.id===selectedId){
            const sel=new THREE3.Mesh(new THREE3.BoxGeometry(w+.2,bh+.2,d+.2),
                new THREE3.MeshBasicMaterial({color:0xf0d080,wireframe:true}));
            sel.position.set(wx,wy,wz); s3.add(sel);
        }
    }

    // Center orbit target on map
    orbitTarget={x:0, y:4, z:0};
}

function update3DCamera(){
    if(!c3) return;
    const x=orbitTarget.x+orbitDist*Math.sin(orbitPhi)*Math.sin(orbitTheta);
    const y=orbitTarget.y+orbitDist*Math.cos(orbitPhi);
    const z=orbitTarget.z+orbitDist*Math.sin(orbitPhi)*Math.cos(orbitTheta);
    c3.position.set(x,y,z);
    c3.lookAt(orbitTarget.x,orbitTarget.y,orbitTarget.z);
}

function start3DLoop(){
    if(animId3!==null) return;
    function loop(){
        animId3=requestAnimationFrame(loop);
        update3DCamera();
        if(r3&&s3&&c3) r3.render(s3,c3);
    }
    loop();
}
function stop3DLoop(){
    if(animId3!==null){ cancelAnimationFrame(animId3); animId3=null; }
}

// Hook into render to auto-refresh 3D view when map changes
const _origRender=render;
window.render=function(){
    _origRender();
    // Seulement si la vue 3D est active ET Three.js est initialisé
    if(viewMode==='3d' && THREE3 && r3 && s3 && c3) rebuild3D();
};

