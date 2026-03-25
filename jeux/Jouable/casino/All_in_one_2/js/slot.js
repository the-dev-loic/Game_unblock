export default {
    methods: {
        spinSlot() {
            if (this.balance < 10) return;

            this.balance -= 10;
            this.isSlotSpinning = true;

            let spins = 0;
            const interval = setInterval(() => {
                this.slotReels = this.slotReels.map(() => ({
                    symbol: this.slotSymbols[Math.floor(Math.random()*this.slotSymbols.length)]
                }));

                if (++spins >= 20) {
                    clearInterval(interval);
                    this.finalizeSlot();
                }
            }, 100);
        },

        finalizeSlot() {
            this.isSlotSpinning = false;

            const [r1, r2, r3] = [1,2,3].map(() =>
                this.slotSymbols[Math.floor(Math.random()*this.slotSymbols.length)]
            );

            this.slotReels = [{symbol:r1},{symbol:r2},{symbol:r3}];

            if (r1 === r2 && r2 === r3) {
                const gain = r1 === '7️⃣' ? 500 : 50;
                this.balance += gain;
            }
        }
    }
};