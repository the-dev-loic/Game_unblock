const{createApp}=Vue;
createApp({
    data(){return{
        currentPage:'home',balance:1000,
        gameCards:[
            {id:'roulette',icon:'🎡',name:'Roulette',color:'#ef4444',desc:'Misez sur rouge, noir, un numéro ou une douzaine. La roue décide !'},
            {id:'poker',icon:'♠️',name:'Poker Texas Hold\'em',color:'#eab308',desc:'2 cartes en main, 5 communes. La meilleure combinaison gagne !'},
            {id:'chicken-road',icon:'🐔',name:'Chicken Road',color:'#f97316',desc:'Aidez la poule à traverser la route. Cash out avant l\'écrasement !'},
            {id:'diamond-mines',icon:'💎',name:'Diamond Mines',color:'#3b82f6',desc:'Trouvez les diamants, évitez les bombes, multipliez vos gains.'},
            {id:'blackjack',icon:'🃏',name:'Blackjack',color:'#22c55e',desc:'Atteignez 21 sans dépasser. Le classique des casinos.'},
        ],
        isSlotSpinning:false,slotReels:[{symbol:'🍒'},{symbol:'🍒'},{symbol:'🍒'}],
        slotSymbols:['🍒','🍇','💎','7️⃣','🍋'],slotMessage:'',slotWin:false,slotLastWin:0,
        crBet:50,crGameStarted:false,crGameEnded:false,crCurrentLane:0,crSquished:false,crWon:false,crDeathLane:-1,crMessage:'',crBestWin:0,crLanes:[],
        dmBet:50,dmGameStarted:false,dmGameEnded:false,dmGameWon:false,dmTiles:[],dmDiamondsFound:0,dmBombsHit:0,dmMultiplier:1.0,dmTotalDiamonds:5,
        bjBetAmount:50,bjCurrentBet:0,bjDeck:[],bjPlayerHand:[],bjDealerHand:[],bjPlayerTurn:true,bjDealerRevealed:false,bjGameMessage:'',bjGameStarted:false,bjGameEnded:false,bjGamesPlayed:0,bjWins:0,bjLosses:0,bjBlackjacks:0,
        rlBets:[],rlSelectedChip:10,rlSpinning:false,rlWheelAngle:0,rlResult:null,rlResultColor:'',rlResultParity:'',rlMessage:'',rlWon:false,rlRounds:0,rlWins:0,rlLosses:0,rlBestWin:0,
        rlChips:[{value:5,bg:'#dc2626',border:'#fca5a5',text:'#fff'},{value:10,bg:'#2563eb',border:'#93c5fd',text:'#fff'},{value:25,bg:'#16a34a',border:'#86efac',text:'#fff'},{value:50,bg:'#7c3aed',border:'#c4b5fd',text:'#fff'},{value:100,bg:'#92400e',border:'#fcd34d',text:'#fcd34d'}],
        rlRedNumbers:[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],
        rlOutsideBets:[{key:'red',label:'🔴 Rouge',bg:'rgba(220,38,38,.4)',color:'#fca5a5',mult:2},{key:'black',label:'⚫ Noir',bg:'rgba(31,41,55,.8)',color:'#d1d5db',mult:2},{key:'even',label:'Pair',bg:'rgba(37,99,235,.3)',color:'#93c5fd',mult:2},{key:'odd',label:'Impair',bg:'rgba(124,58,237,.3)',color:'#c4b5fd',mult:2},{key:'low',label:'1–18',bg:'rgba(22,163,74,.3)',color:'#86efac',mult:2},{key:'high',label:'19–36',bg:'rgba(234,179,8,.3)',color:'#fde68a',mult:2},{key:'dozen1',label:'1ère Douzaine',bg:'rgba(220,38,38,.2)',color:'#fca5a5',mult:3},{key:'dozen2',label:'2ème Douzaine',bg:'rgba(37,99,235,.2)',color:'#93c5fd',mult:3},{key:'dozen3',label:'3ème Douzaine',bg:'rgba(124,58,237,.2)',color:'#c4b5fd',mult:3}],
        pkBetAmount:50,pkCurrentBet:0,pkPot:0,pkPlayerHand:[],pkDealerHand:[],pkCommunity:[],pkDeck:[],pkStage:'',pkGameStarted:false,pkGameEnded:false,pkMessage:'',pkWon:false,pkPlayerRank:'',pkDealerRank:'',pkGamesPlayed:0,pkWins:0,pkLosses:0,pkBestWin:0,
        pkChips:[{value:5,bg:'#dc2626',border:'#fca5a5',text:'#fff'},{value:10,bg:'#2563eb',border:'#93c5fd',text:'#fff'},{value:25,bg:'#16a34a',border:'#86efac',text:'#fff'},{value:50,bg:'#7c3aed',border:'#c4b5fd',text:'#fff'},{value:100,bg:'#92400e',border:'#fcd34d',text:'#fcd34d'}],
    }},
    computed:{
        crMultiplier(){if(!this.crCurrentLane)return 1.0;return parseFloat(Math.pow(1.45,this.crCurrentLane).toFixed(2));},
        crMaxMultiplier(){return parseFloat(Math.pow(1.45,(this.crLanes.length||8)).toFixed(2));},
        crPotentialWin(){return Math.floor(this.crBet*this.crMultiplier);},
        crProgressPercent(){if(!this.crLanes.length)return 0;return Math.min(100,(this.crCurrentLane/this.crLanes.length)*100);},
        crChickenBottom(){return 60+(this.crCurrentLane*56)-10;},
        dealerScore(){if(!this.bjDealerRevealed&&this.bjGameStarted&&!this.bjGameEnded)return this.bjCalcScore([this.bjDealerHand[1]]);return this.bjCalcScore(this.bjDealerHand);},
        playerScore(){return this.bjCalcScore(this.bjPlayerHand);},
        rlTotalBet(){return this.rlBets.reduce((s,b)=>s+b.amount,0);},
    },
    methods:{
        spinSlot(){if(this.balance<10){this.slotMessage='Solde insuffisant!';return;}this.balance-=10;this.isSlotSpinning=true;this.slotMessage='';this.slotWin=false;let s=0;const iv=setInterval(()=>{this.slotReels=this.slotReels.map(()=>({symbol:this.slotSymbols[Math.floor(Math.random()*this.slotSymbols.length)]}));if(++s>=20){clearInterval(iv);this.finalizeSlot();}},100);},
        finalizeSlot(){this.isSlotSpinning=false;const r1=this.slotSymbols[Math.floor(Math.random()*this.slotSymbols.length)],r2=this.slotSymbols[Math.floor(Math.random()*this.slotSymbols.length)],r3=this.slotSymbols[Math.floor(Math.random()*this.slotSymbols.length)];this.slotReels=[{symbol:r1},{symbol:r2},{symbol:r3}];if(r1===r2&&r2===r3){const p=r1==='7️⃣'?500:r1==='💎'?200:50;this.balance+=p;this.slotLastWin=p;this.slotMessage='JACKPOT ! +'+p+'€';this.slotWin=true;}else if(r1===r2||r2===r3||r1===r3){this.balance+=15;this.slotLastWin=15;this.slotMessage='Petit gain ! +15€';this.slotWin=true;}else{this.slotLastWin=0;this.slotMessage='Perdu, réessayez !';this.slotWin=false;}},
        crBuildLanes(){const e=['🚗','🚙','🚕','🚌','🚎','🏎️','🚐','🛻'];this.crLanes=Array.from({length:8},(_,i)=>({multiplier:parseFloat(Math.pow(1.45,i+1).toFixed(2)),cars:Array.from({length:1+Math.floor(i/2)},(_,ci)=>({emoji:e[Math.floor(Math.random()*e.length)],dir:(ci+i)%2===0?'left':'right',speed:1.2+Math.random()*1.5-(i*.08),delay:-(Math.random()*3)}))}));},
        crStart(){if(this.crBet>this.balance||this.crBet<10)return;this.balance-=this.crBet;this.crBuildLanes();this.crGameStarted=true;this.crGameEnded=false;this.crCurrentLane=0;this.crSquished=false;this.crWon=false;this.crDeathLane=-1;this.crMessage='🐔 La poule est prête !';},
        crStep(){if(!this.crGameStarted||this.crGameEnded)return;const li=this.crCurrentLane;if(Math.random()<(0.18+li*.065)){this.crDeathLane=li;this.crSquished=true;this.crGameEnded=true;this.crGameStarted=false;this.crMessage='💥 Écrasée sur la voie '+(li+1)+' !';}else{this.crCurrentLane++;if(this.crCurrentLane>=this.crLanes.length){this.crCashOut(true);}else{this.crMessage='✅ Voie '+this.crCurrentLane+' franchie ! Potentiel: '+Math.floor(this.crBet*this.crMultiplier)+'€';}}},
        crCashOut(auto=false){const w=Math.floor(this.crBet*this.crMultiplier);this.balance+=w;this.crWon=true;this.crGameEnded=true;this.crGameStarted=false;if(w>this.crBestWin)this.crBestWin=w;this.crMessage=auto?'🏆 INCROYABLE ! +'+w+'€ !':'💰 Cash out ! +'+w+'€ (x'+this.crMultiplier.toFixed(2)+')';},
        crReset(){this.crGameStarted=false;this.crGameEnded=false;this.crCurrentLane=0;this.crSquished=false;this.crWon=false;this.crDeathLane=-1;this.crMessage='';this.crLanes=[];},
        dmInitTiles(){const p=Array(25).fill(false);for(let i=0;i<this.dmTotalDiamonds;i++)p[i]=true;for(let i=p.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}this.dmTiles=p.map(d=>({isDiamond:d,revealed:false}));},
        startDiamondMines(){if(this.dmBet>this.balance||this.dmBet<10)return;this.balance-=this.dmBet;this.dmGameStarted=true;this.dmGameEnded=false;this.dmGameWon=false;this.dmDiamondsFound=0;this.dmBombsHit=0;this.dmMultiplier=1.0;this.dmInitTiles();},
        clickTile(i){if(this.dmGameEnded||this.dmTiles[i].revealed)return;this.dmTiles[i].revealed=true;if(this.dmTiles[i].isDiamond){this.dmDiamondsFound++;this.dmMultiplier*=1.25;if(this.dmDiamondsFound===this.dmTotalDiamonds)this.dmCashOut();}else{this.dmBombsHit++;this.dmGameEnded=true;this.dmGameWon=false;this.dmTiles.forEach(t=>t.revealed=true);}},
        dmCashOut(){this.balance+=Math.floor(this.dmBet*this.dmMultiplier);this.dmGameEnded=true;this.dmGameWon=true;this.dmTiles.forEach(t=>t.revealed=true);},
        resetDiamondMines(){this.dmGameStarted=false;this.dmGameEnded=false;this.dmGameWon=false;this.dmDiamondsFound=0;this.dmBombsHit=0;this.dmMultiplier=1.0;},
        bjCreateDeck(){const s=['♠','♥','♦','♣'],v=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];const d=s.flatMap(x=>v.map(y=>({suit:x,value:y})));for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;},
        getCardSymbol(c){return c.value+c.suit;},
        bjCalcScore(h){if(!h||!h.length)return 0;let s=0,a=0;for(const c of h){if(!c)continue;if(['J','Q','K'].includes(c.value))s+=10;else if(c.value==='A'){s+=11;a++;}else s+=parseInt(c.value);}while(s>21&&a>0){s-=10;a--;}return s;},
        startBlackjack(){if(this.bjBetAmount>this.balance||this.bjBetAmount<10)return;this.bjCurrentBet=this.bjBetAmount;this.balance-=this.bjCurrentBet;this.bjDeck=this.bjCreateDeck();this.bjPlayerHand=[this.bjDeck.pop(),this.bjDeck.pop()];this.bjDealerHand=[this.bjDeck.pop(),this.bjDeck.pop()];this.bjPlayerTurn=true;this.bjDealerRevealed=false;this.bjGameMessage='';this.bjGameStarted=true;this.bjGameEnded=false;this.bjGamesPlayed++;if(this.playerScore===21){this.bjBlackjacks++;this.bjWins++;this.balance+=this.bjCurrentBet*2.5;this.bjGameMessage='🎉 BLACKJACK ! +'+(this.bjCurrentBet*2.5)+'€';this.bjGameEnded=true;this.bjDealerRevealed=true;}},
        bjHit(){this.bjPlayerHand.push(this.bjDeck.pop());if(this.playerScore>21){this.bjLosses++;this.bjGameMessage='💥 Perdu ! Dépassé 21';this.bjGameEnded=true;this.bjDealerRevealed=true;}},
        bjStand(){this.bjPlayerTurn=false;this.bjDealerRevealed=true;while(this.dealerScore<17)this.bjDealerHand.push(this.bjDeck.pop());if(this.dealerScore>21){this.bjWins++;this.balance+=this.bjCurrentBet*2;this.bjGameMessage='🎉 Gagné !';}else if(this.playerScore>this.dealerScore){this.bjWins++;this.balance+=this.bjCurrentBet*2;this.bjGameMessage='🎉 Gagné !';}else if(this.playerScore<this.dealerScore){this.bjLosses++;this.bjGameMessage='💥 Perdu !';}else{this.balance+=this.bjCurrentBet;this.bjGameMessage='🤝 Égalité !';}this.bjGameEnded=true;},
        bjDoubleDown(){if(this.balance<this.bjCurrentBet||this.bjPlayerHand.length!==2)return;this.balance-=this.bjCurrentBet;this.bjCurrentBet*=2;this.bjPlayerHand.push(this.bjDeck.pop());if(this.playerScore>21){this.bjLosses++;this.bjGameMessage='💥 Perdu !';this.bjGameEnded=true;this.bjDealerRevealed=true;}else this.bjStand();},
        resetBlackjack(){this.bjGameStarted=false;this.bjGameEnded=false;this.bjPlayerHand=[];this.bjDealerHand=[];this.bjCurrentBet=0;this.bjGameMessage='';this.bjPlayerTurn=true;this.bjDealerRevealed=false;},
        // ROULETTE
        rlPlaceBet(type,value){if(this.rlSpinning)return;const amount=this.rlSelectedChip;if(this.rlTotalBet+amount>this.balance)return;const ex=this.rlBets.find(b=>b.type===type&&b.value===value);if(ex){ex.amount+=amount;}else{this.rlBets.push({type,value,amount});}},
        rlGetBetOnNumber(n){return this.rlBets.find(b=>b.type==='number'&&b.value===n);},
        rlGetBetOnOutside(key){return this.rlBets.find(b=>b.type===key);},
        rlClearBets(){if(!this.rlSpinning){this.rlBets=[];this.rlMessage='';}},
        rlSpin(){
            if(this.rlSpinning||this.rlTotalBet===0||this.rlTotalBet>this.balance)return;
            this.balance-=this.rlTotalBet;this.rlSpinning=true;this.rlMessage='';
            const result=Math.floor(Math.random()*37);
            const spins=5+Math.random()*5;
            this.rlWheelAngle+=360*spins+(result*(360/37));
            setTimeout(()=>{
                this.rlSpinning=false;this.rlResult=result;this.rlRounds++;
                if(result===0){this.rlResultColor='green';this.rlResultParity='';}
                else if(this.rlRedNumbers.includes(result)){this.rlResultColor='red';this.rlResultParity=result%2===0?'Pair':'Impair';}
                else{this.rlResultColor='black';this.rlResultParity=result%2===0?'Pair':'Impair';}
                let totalWin=0;
                for(const bet of this.rlBets){
                    let win=0;
                    if(bet.type==='number'&&bet.value===result)win=bet.amount*36;
                    else if(bet.type==='red'&&this.rlResultColor==='red')win=bet.amount*2;
                    else if(bet.type==='black'&&this.rlResultColor==='black')win=bet.amount*2;
                    else if(bet.type==='even'&&result!==0&&result%2===0)win=bet.amount*2;
                    else if(bet.type==='odd'&&result%2===1)win=bet.amount*2;
                    else if(bet.type==='low'&&result>=1&&result<=18)win=bet.amount*2;
                    else if(bet.type==='high'&&result>=19&&result<=36)win=bet.amount*2;
                    else if(bet.type==='dozen1'&&result>=1&&result<=12)win=bet.amount*3;
                    else if(bet.type==='dozen2'&&result>=13&&result<=24)win=bet.amount*3;
                    else if(bet.type==='dozen3'&&result>=25&&result<=36)win=bet.amount*3;
                    totalWin+=win;
                }
                this.balance+=totalWin;
                if(totalWin>0){this.rlWon=true;this.rlWins++;if(totalWin>this.rlBestWin)this.rlBestWin=totalWin;this.rlMessage='🎉 Sorti: '+result+' ! Vous gagnez '+totalWin+'€ !';}
                else{this.rlWon=false;this.rlLosses++;this.rlMessage='❌ Sorti: '+result+'. Perdu !';}
                this.rlBets=[];
            },4200);
        },
        // POKER
        pkCreateDeck(){const s=['♠','♥','♦','♣'],v=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];const d=s.flatMap(x=>v.map(y=>({suit:x,value:y,hidden:false})));for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;},
        pkCardColor(c){if(!c||c.hidden)return'';return['♥','♦'].includes(c.suit)?'red':'black';},
        pkCardVal(v){if(v==='A')return 14;if(v==='K')return 13;if(v==='Q')return 12;if(v==='J')return 11;return parseInt(v);},
        pkDeal(){
            if(this.pkBetAmount>this.balance||this.pkBetAmount<5)return;
            this.balance-=this.pkBetAmount;this.pkCurrentBet=this.pkBetAmount;this.pkPot=this.pkBetAmount;
            this.pkDeck=this.pkCreateDeck();
            this.pkPlayerHand=[this.pkDeck.pop(),this.pkDeck.pop()];
            this.pkDealerHand=[{...this.pkDeck.pop(),hidden:true},{...this.pkDeck.pop(),hidden:true}];
            this.pkCommunity=[];this.pkGameStarted=true;this.pkGameEnded=false;
            this.pkMessage='';this.pkWon=false;this.pkStage='preflop';this.pkPlayerRank='';this.pkDealerRank='';this.pkGamesPlayed++;
        },
        pkCheck(){this.pkCommunity=[this.pkDeck.pop(),this.pkDeck.pop(),this.pkDeck.pop()];this.pkStage='flop';this.pkUpdateRanks();},
        pkCheckTurn(){this.pkCommunity.push(this.pkDeck.pop());this.pkStage='turn';this.pkUpdateRanks();},
        pkCheckRiver(){this.pkCommunity.push(this.pkDeck.pop());this.pkStage='river';this.pkUpdateRanks();},
        pkRaise(){
            if(this.pkCurrentBet>this.balance)return;
            this.balance-=this.pkCurrentBet;this.pkPot+=this.pkCurrentBet;this.pkCurrentBet=Math.floor(this.pkCurrentBet*1.5);
            if(this.pkStage==='preflop')this.pkCheck();
            else if(this.pkStage==='flop')this.pkCheckTurn();
            else if(this.pkStage==='turn')this.pkCheckRiver();
            else this.pkShowdown();
        },
        pkFold(){this.pkGameEnded=true;this.pkGameStarted=false;this.pkWon=false;this.pkDealerHand=this.pkDealerHand.map(c=>({...c,hidden:false}));this.pkLosses++;this.pkMessage='🏳️ Vous vous couchez.';},
        pkShowdown(){
            this.pkDealerHand=this.pkDealerHand.map(c=>({...c,hidden:false}));
            this.pkGameEnded=true;this.pkGameStarted=false;
            const pScore=this.pkEval([...this.pkPlayerHand,...this.pkCommunity]);
            const dScore=this.pkEval([...this.pkDealerHand,...this.pkCommunity]);
            this.pkPlayerRank=pScore.name;this.pkDealerRank=dScore.name;
            if(pScore.rank>dScore.rank||(pScore.rank===dScore.rank&&pScore.tb>dScore.tb)){
                this.balance+=this.pkPot*2;this.pkWon=true;this.pkWins++;
                if(this.pkPot*2>this.pkBestWin)this.pkBestWin=this.pkPot*2;
                this.pkMessage='🎉 Vous gagnez ! '+pScore.name+' bat '+dScore.name+'. +'+(this.pkPot*2)+'€ !';
            }else if(pScore.rank===dScore.rank&&pScore.tb===dScore.tb){
                this.balance+=this.pkPot;this.pkMessage='🤝 Égalité ! Mise remboursée. '+pScore.name;
            }else{
                this.pkLosses++;this.pkMessage='💥 Perdu ! '+dScore.name+' bat '+pScore.name+'.';
            }
        },
        pkUpdateRanks(){if(this.pkCommunity.length>0)this.pkPlayerRank=this.pkEval([...this.pkPlayerHand,...this.pkCommunity]).name;},
        pkEval(cards){
            const combos=this.pkCombo(cards,Math.min(5,cards.length));
            let best={rank:-1,tb:0,name:'Carte Haute'};
            for(const h of combos){const s=this.pkScore(h);if(s.rank>best.rank||(s.rank===best.rank&&s.tb>best.tb))best=s;}
            return best;
        },
        pkCombo(arr,k){if(k===arr.length)return[arr];if(k===1)return arr.map(x=>[x]);const r=[];for(let i=0;i<=arr.length-k;i++){const rest=this.pkCombo(arr.slice(i+1),k-1);for(const c of rest)r.push([arr[i],...c]);}return r;},
        pkScore(hand){
            const vals=hand.map(c=>this.pkCardVal(c.value)).sort((a,b)=>b-a);
            const suits=hand.map(c=>c.suit);
            const isF=suits.every(s=>s===suits[0]);
            const isS=vals.length>=5&&vals.every((v,i)=>i===0||vals[i-1]-v===1);
            const cnt={};vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);
            const freq=Object.values(cnt).sort((a,b)=>b-a);
            const top=vals[0];
            if(isF&&isS)return{rank:8,tb:top,name:'Quinte Flush'+(top===14?' Royale':'')};
            if(freq[0]===4)return{rank:7,tb:top,name:'Carré'};
            if(freq[0]===3&&freq[1]===2)return{rank:6,tb:top,name:'Full House'};
            if(isF)return{rank:5,tb:top,name:'Couleur'};
            if(isS)return{rank:4,tb:top,name:'Suite'};
            if(freq[0]===3)return{rank:3,tb:top,name:'Brelan'};
            if(freq[0]===2&&freq[1]===2)return{rank:2,tb:top,name:'Double Paire'};
            if(freq[0]===2)return{rank:1,tb:top,name:'Paire'};
            return{rank:0,tb:top,name:'Carte Haute'};
        },
        pkReset(){this.pkGameStarted=false;this.pkGameEnded=false;this.pkPlayerHand=[];this.pkDealerHand=[];this.pkCommunity=[];this.pkPot=0;this.pkCurrentBet=0;this.pkMessage='';this.pkPlayerRank='';this.pkDealerRank='';this.pkStage='';},
    }
}).mount('#app');