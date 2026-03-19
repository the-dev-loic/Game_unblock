const SYM={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'};
let board,turn,sel,legals,hist,capW,capB,ep,cast;

function newGame(){
    board=Array.from({length:8},()=>Array(8).fill(null));
    ['R','N','B','Q','K','B','N','R'].forEach((t,c)=>{board[0][c]='b'+t;board[7][c]='w'+t});
    for(let c=0;c<8;c++){board[1][c]='bP';board[6][c]='wP';}
    turn='w';sel=null;legals=[];hist=[];capW=[];capB=[];ep=null;
    cast={wK:true,wQ:true,bK:true,bQ:true};
    render();setStatus('Les blancs jouent');
}

function setStatus(m){document.getElementById('status').textContent=m}
function ib(r,c){return r>=0&&r<8&&c>=0&&c<8}
function col(p){return p?p[0]:null}

function rawAttacks(r,c,b,t){
    const type=b[r][c][1],mv=[];
    if(type==='P'){const d=t==='w'?-1:1;[-1,1].forEach(dc=>{if(ib(r+d,c+dc))mv.push([r+d,c+dc]);})}
    if(type==='N'){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>{if(ib(r+dr,c+dc))mv.push([r+dr,c+dc]);})}
    if('BQ'.includes(type)){[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>{for(let i=1;i<8;i++){const tr=r+dr*i,tc=c+dc*i;if(!ib(tr,tc))break;mv.push([tr,tc]);if(b[tr][tc])break;}})}
    if('RQ'.includes(type)){[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{for(let i=1;i<8;i++){const tr=r+dr*i,tc=c+dc*i;if(!ib(tr,tc))break;mv.push([tr,tc]);if(b[tr][tc])break;}})}
    if(type==='K'){[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>{if(ib(r+dr,c+dc))mv.push([r+dr,c+dc]);})}
    return mv;
}

function attacked(b,r,c,byCol){
    for(let fr=0;fr<8;fr++)for(let fc=0;fc<8;fc++){
        if(b[fr][fc]&&b[fr][fc][0]===byCol&&rawAttacks(fr,fc,b,byCol).some(([tr,tc])=>tr===r&&tc===c))return true;
    }return false;
}

function findKing(b,t){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]===t+'K')return[r,c];return null}

function simulate(fr,fc,tr,tc,flag,b,t){
    const nb=b.map(r=>[...r]);
    nb[tr][tc]=nb[fr][fc];nb[fr][fc]=null;
    if(flag==='ep'&&ep)nb[fr][ep[1]]=null;
    if(flag==='ck'){const row=t==='w'?7:0;nb[row][5]=t+'R';nb[row][7]=null;}
    if(flag==='cq'){const row=t==='w'?7:0;nb[row][3]=t+'R';nb[row][0]=null;}
    const k=findKing(nb,t);
    return k&&attacked(nb,k[0],k[1],t==='w'?'b':'w');
}

function getLegals(r,c){
    const p=board[r][c];if(!p)return[];
    const t=p[0],type=p[1],mvs=[];
    const try_=(tr,tc,flag='n')=>{if(ib(tr,tc)&&col(board[tr][tc])!==t)mvs.push({r:tr,c:tc,f:flag})};
    if(type==='P'){
        const d=t==='w'?-1:1,sr=t==='w'?6:1;
        if(ib(r+d,c)&&!board[r+d][c]){try_(r+d,c,'n');if(r===sr&&!board[r+2*d][c])try_(r+2*d,c,'dp');}
        [-1,1].forEach(dc=>{
            if(ib(r+d,c+dc)){
                if(board[r+d][c+dc]&&col(board[r+d][c+dc])!==t)try_(r+d,c+dc,'n');
                else if(ep&&ep[0]===r+d&&ep[1]===c+dc)mvs.push({r:r+d,c:c+dc,f:'ep'});
            }
        });
    }
    if(type==='N'){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>try_(r+dr,c+dc))}
    if('BQ'.includes(type)){[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>{for(let i=1;i<8;i++){const tr=r+dr*i,tc=c+dc*i;if(!ib(tr,tc))break;if(board[tr][tc]){if(col(board[tr][tc])!==t)mvs.push({r:tr,c:tc,f:'n'});break;}mvs.push({r:tr,c:tc,f:'n'});}})}
    if('RQ'.includes(type)){[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{for(let i=1;i<8;i++){const tr=r+dr*i,tc=c+dc*i;if(!ib(tr,tc))break;if(board[tr][tc]){if(col(board[tr][tc])!==t)mvs.push({r:tr,c:tc,f:'n'});break;}mvs.push({r:tr,c:tc,f:'n'});}})}
    if(type==='K'){
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>try_(r+dr,c+dc));
        const row=t==='w'?7:0;
        if(cast[t+'K']&&!board[row][5]&&!board[row][6]&&board[row][7]===t+'R'&&!attacked(board,row,4,t==='w'?'b':'w')&&!attacked(board,row,5,t==='w'?'b':'w'))mvs.push({r:row,c:6,f:'ck'});
        if(cast[t+'Q']&&!board[row][3]&&!board[row][2]&&!board[row][1]&&board[row][0]===t+'R'&&!attacked(board,row,4,t==='w'?'b':'w')&&!attacked(board,row,3,t==='w'?'b':'w'))mvs.push({r:row,c:2,f:'cq'});
    }
    return mvs.filter(m=>!simulate(r,c,m.r,m.c,m.f,board,t));
}

function applyMove(fr,fc,tr,tc,flag){
    hist.push({board:board.map(r=>[...r]),turn,ep,cast:{...cast},capW:[...capW],capB:[...capB]});
    const p=board[fr][fc];
    if(board[tr][tc]){(turn==='w'?capW:capB).push(board[tr][tc]);}
    if(flag==='ep'&&ep){const cap=board[fr][ep[1]];(turn==='w'?capW:capB).push(cap);board[fr][ep[1]]=null;}
    board[tr][tc]=p;board[fr][fc]=null;ep=null;
    if(flag==='dp')ep=[tr+(turn==='w'?1:-1),tc];
    if(flag==='ck'){const row=turn==='w'?7:0;board[row][5]=turn+'R';board[row][7]=null;}
    if(flag==='cq'){const row=turn==='w'?7:0;board[row][3]=turn+'R';board[row][0]=null;}
    if(p[1]==='K'){cast[turn+'K']=false;cast[turn+'Q']=false;}
    if(p==='wR'&&fr===7){if(fc===0)cast.wQ=false;if(fc===7)cast.wK=false;}
    if(p==='bR'&&fr===0){if(fc===0)cast.bQ=false;if(fc===7)cast.bK=false;}
    if(p==='wP'&&tr===0)board[tr][tc]='wQ';
    if(p==='bP'&&tr===7)board[tr][tc]='bQ';
    turn=turn==='w'?'b':'w';
}

function checkState(){
    const opp=turn,enemy=opp==='w'?'b':'w';
    const k=findKing(board,opp);
    const inCheck=k&&attacked(board,k[0],k[1],enemy);
    let hasMoves=false;
    outer:for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        if(board[r][c]&&board[r][c][0]===opp&&getLegals(r,c).length){hasMoves=true;break outer;}
    }
    if(!hasMoves){
        setStatus(inCheck?(opp==='w'?'Les noirs gagnent':'Les blancs gagnent')+' — Échec et mat ! 🏆':'Pat — Partie nulle 🤝');
    } else {
        const n=opp==='w'?'Blancs':'Noirs';
        setStatus(inCheck?n+' en ÉCHEC !':(opp==='w'?'Les blancs':'Les noirs')+' jouent');
    }
    return inCheck?k:null;
}

let lastFrom=null,lastTo=null;
function click(r,c){
    if(sel){
        const mv=legals.find(m=>m.r===r&&m.c===c);
        if(mv){
            lastFrom=[sel[0],sel[1]];lastTo=[r,c];
            applyMove(sel[0],sel[1],r,c,mv.f);
            sel=null;legals=[];render();checkState();return;
        }
    }
    const p=board[r][c];
    if(p&&p[0]===turn){sel=[r,c];legals=getLegals(r,c);}
    else{sel=null;legals=[];}
    render();
}

function render(){
    const checkK=checkState? null:null;
    const bd=document.getElementById('board');
    bd.innerHTML='';
    const opp=turn,enemy=opp==='w'?'b':'w';
    const k=findKing(board,opp);
    const inCh=k&&attacked(board,k[0],k[1],enemy);
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        const sq=document.createElement('div');
        sq.className='sq '+((r+c)%2===0?'light':'dark');
        if(lastFrom&&lastFrom[0]===r&&lastFrom[1]===c)sq.classList.add('lastmv');
        if(lastTo&&lastTo[0]===r&&lastTo[1]===c)sq.classList.add('lastmv');
        if(sel&&sel[0]===r&&sel[1]===c)sq.classList.add('sel');
        if(inCh&&k[0]===r&&k[1]===c)sq.classList.add('check');
        const p=board[r][c];
        if(p)sq.textContent=SYM[p]||'';
        const isLegal=legals.some(m=>m.r===r&&m.c===c);
        if(isLegal){const d=document.createElement('div');d.className=p?'ring':'dot';sq.appendChild(d);}
        sq.addEventListener('click',()=>click(r,c));
        bd.appendChild(sq);
    }
    document.getElementById('cw').textContent=capW.map(p=>SYM[p]||'').join('');
    document.getElementById('cb').textContent=capB.map(p=>SYM[p]||'').join('');
}

document.getElementById('btn-new').onclick=()=>{lastFrom=null;lastTo=null;newGame()};
document.getElementById('btn-undo').onclick=()=>{
    if(!hist.length)return;
    const s=hist.pop();
    board=s.board.map(r=>[...r]);turn=s.turn;ep=s.ep;cast={...s.cast};capW=[...s.capW];capB=[...s.capB];
    sel=null;legals=[];lastFrom=null;lastTo=null;
    render();setStatus((turn==='w'?'Les blancs':'Les noirs')+' jouent');
};

// Build coords
const rc=document.getElementById('rcoords');
for(let r=0;r<8;r++){const s=document.createElement('span');s.textContent=8-r;rc.appendChild(s);}
const cc=document.getElementById('ccoords');
'abcdefgh'.split('').forEach(l=>{const s=document.createElement('span');s.textContent=l;cc.appendChild(s);});

newGame();