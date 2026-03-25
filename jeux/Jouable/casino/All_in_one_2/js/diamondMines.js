export default {
    methods: {
        startDiamondMines() {
            if (this.dmBet > this.balance) return;

            this.balance -= this.dmBet;
            this.dmGameStarted = true;
        },

        clickTile(i) {
            const tile = this.dmTiles[i];

            if (tile.revealed) return;

            tile.revealed = true;

            if (tile.isDiamond) {
                this.dmMultiplier *= 1.25;
            } else {
                this.dmGameEnded = true;
            }
        }
    }
};