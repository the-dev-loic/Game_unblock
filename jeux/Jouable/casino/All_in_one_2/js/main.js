import slots from './slots.js';
import chickenRoad from './chickenRoad.js';
import diamondMines from './diamondMines.js';
import blackjack from './blackjack.js';
import roulette from './roulette.js';
import poker from './poker.js';

const { createApp } = Vue;

// 🔥 fonction pour charger les vues HTML
async function loadView(name) {
    const res = await fetch(`views/${name}.html`);
    return await res.text();
}

createApp({
    data() {
        return {
            currentPage: 'home',
            currentView: '',
            balance: 1000,

            // ⚠️ garde tous tes states ici (slots, poker, etc.)
            slotReels: [{symbol:'🍒'},{symbol:'🍒'},{symbol:'🍒'}],
            slotSymbols:['🍒','🍇','💎','7️⃣','🍋'],
            slotMessage:'',
            slotWin:false,
            slotLastWin:0,

            rlBets: [],
            rlSelectedChip: 10,
            rlResult: null,

            // etc... (reprends tes data ici)
        };
    },

    computed: {
        ...chickenRoad.computed,
        ...blackjack.computed,
        ...roulette.computed,
    },

    methods: {
        ...slots.methods,
        ...chickenRoad.methods,
        ...diamondMines.methods,
        ...blackjack.methods,
        ...roulette.methods,
        ...poker.methods,
    },

    watch: {
        currentPage: {
            immediate: true,
            async handler(page) {
                this.currentView = await loadView(page);
            }
        }
    }
}).mount('#app');