export default {
    computed: {
        crMultiplier() {
            return this.crCurrentLane
                ? Math.pow(1.45, this.crCurrentLane)
                : 1;
        }
    },

    methods: {
        crStart() {
            if (this.crBet > this.balance) return;

            this.balance -= this.crBet;
            this.crGameStarted = true;
            this.crCurrentLane = 0;
        },

        crStep() {
            if (Math.random() < 0.2) {
                this.crGameEnded = true;
            } else {
                this.crCurrentLane++;
            }
        },

        crCashOut() {
            const win = Math.floor(this.crBet * this.crMultiplier);
            this.balance += win;
        }
    }
};