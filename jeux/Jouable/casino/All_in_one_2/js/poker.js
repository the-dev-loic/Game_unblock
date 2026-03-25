export default {
    methods: {
        pkDeal() {
            if (this.pkBetAmount > this.balance) return;

            this.balance -= this.pkBetAmount;
            this.pkDeck = this.pkCreateDeck();
        },

        pkFold() {
            this.pkGameEnded = true;
        }
    }
};