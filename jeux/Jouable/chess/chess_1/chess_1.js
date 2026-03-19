class ChessGame {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.turnDot = document.getElementById('turnDot');
        this.turnText = document.getElementById('turnText');
        this.statusMsg = document.getElementById('statusMsg');
        this.capturedWhiteEl = document.getElementById('capturedWhite');
        this.capturedBlackEl = document.getElementById('capturedBlack');

        this.initialBoard = [
            ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
            ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
            ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
        ];

        this.flipped = false;
        this.reset();
    }

    reset() {
        this.board = JSON.parse(JSON.stringify(this.initialBoard));
        this.turn = 'w'; // 'w' or 'b'
        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null; // {from: [r,c], to: [r,c]}
        this.captured = { w: [], b: [] };
        this.gameOver = false;
        this.castling = {
            w: { k: true, q: true },
            b: { k: true, q: true }
        };
        this.enPassantTarget = null; // [r, c]

        this.updateUI();
        this.renderBoard();
        this.updateStatus("White's Turn");
    }

    flipBoard() {
        this.flipped = !this.flipped;
        this.renderBoard();
    }

    getPiece(r, c) {
        if (r < 0 || r > 7 || c < 0 || c > 7) return null;
        return this.board[r][c];
    }

    isOwnPiece(r, c) {
        const piece = this.getPiece(r, c);
        return piece && piece[0] === this.turn;
    }

    handleSquareClick(r, c) {
        if (this.gameOver) return;

        // If clicking a valid move for selected piece
        const move = this.validMoves.find(m => m.r === r && m.c === c);

        if (this.selectedSquare && move) {
            this.executeMove(this.selectedSquare, {r, c});
            return;
        }

        // Select new piece
        if (this.isOwnPiece(r, c)) {
            this.selectedSquare = {r, c};
            this.validMoves = this.getValidMoves(r, c);
            this.renderBoard();
        } else {
            // Deselect
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }

    executeMove(from, to) {
        const piece = this.board[from.r][from.c];
        const target = this.board[to.r][to.c];

        // Capture logic
        if (target) {
            this.captured[target[0]].push(target);
        }

        // En Passant Capture
        if (piece[1] === 'p' && to.c !== from.c && !target) {
            const captureR = from.r; // The pawn being captured is on the same row as start
            const capturedPawn = this.board[captureR][to.c];
            this.captured[capturedPawn[0]].push(capturedPawn);
            this.board[captureR][to.c] = null;
        }

        // Move piece
        this.board[to.r][to.c] = piece;
        this.board[from.r][from.c] = null;

        // Promotion (Auto Queen)
        if (piece[1] === 'p' && (to.r === 0 || to.r === 7)) {
            this.board[to.r][to.c] = piece[0] + 'q';
        }

        // Castling Move Rook
        if (piece[1] === 'k' && Math.abs(to.c - from.c) === 2) {
            if (to.c > from.c) { // Kingside
                this.board[to.r][5] = this.board[to.r][7];
                this.board[to.r][7] = null;
            } else { // Queenside
                this.board[to.r][3] = this.board[to.r][0];
                this.board[to.r][0] = null;
            }
        }

        // Update Castling Rights
        if (piece[1] === 'k') {
            this.castling[this.turn].k = false;
            this.castling[this.turn].q = false;
        }
        if (piece[1] === 'r') {
            if (from.c === 0) this.castling[this.turn].q = false;
            if (from.c === 7) this.castling[this.turn].k = false;
        }

        // Set En Passant Target
        if (piece[1] === 'p' && Math.abs(to.r - from.r) === 2) {
            this.enPassantTarget = [(from.r + to.r) / 2, from.c];
        } else {
            this.enPassantTarget = null;
        }

        this.lastMove = { from, to };
        this.selectedSquare = null;
        this.validMoves = [];

        // Switch Turn
        this.turn = this.turn === 'w' ? 'b' : 'w';

        // Check Game State
        if (this.isCheckmate()) {
            this.gameOver = true;
            this.updateStatus(`Checkmate! ${this.turn === 'w' ? "Black" : "White"} Wins!`);
        } else if (this.isInCheck(this.turn)) {
            this.updateStatus("Check!");
        } else {
            this.updateStatus(`${this.turn === 'w' ? "White" : "Black"}'s Turn`);
        }

        this.updateUI();
        this.renderBoard();
    }

    getValidMoves(r, c) {
        const piece = this.board[r][c];
        if (!piece) return [];

        const type = piece[1];
        const color = piece[0];
        let moves = [];

        const addMove = (nr, nc) => {
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = this.board[nr][nc];
                if (!target || target[0] !== color) {
                    moves.push({r: nr, c: nc});
                    return !!target; // Return true if hit piece (to stop sliding)
                }
                return true; // Hit own piece, stop
            }
            return true; // Out of bounds, stop
        };

        const directions = {
            'r': [[0,1], [0,-1], [1,0], [-1,0]],
            'b': [[1,1], [1,-1], [-1,1], [-1,-1]],
            'n': [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]],
            'q': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
            'k': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]
        };

        if (type === 'p') {
            const dir = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;

            // Move forward 1
            if (!this.getPiece(r + dir, c)) {
                moves.push({r: r + dir, c: c});
                // Move forward 2
                if (r === startRow && !this.getPiece(r + dir * 2, c)) {
                    moves.push({r: r + dir * 2, c: c});
                }
            }
            // Captures
            [[dir, 1], [dir, -1]].forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                const target = this.getPiece(nr, nc);
                if (target && target[0] !== color) {
                    moves.push({r: nr, c: nc});
                }
                // En Passant
                if (this.enPassantTarget && this.enPassantTarget[0] === nr && this.enPassantTarget[1] === nc) {
                    moves.push({r: nr, c: nc});
                }
            });
        } else if (type === 'n' || type === 'k') {
            directions[type].forEach(([dr, dc]) => addMove(r + dr, c + dc));

            // Castling
            if (type === 'k' && !this.isInCheck(color)) {
                const row = color === 'w' ? 7 : 0;
                if (this.castling[color].k && !this.getPiece(row, 5) && !this.getPiece(row, 6)) {
                    if (!this.isSquareAttacked(row, 5, color) && !this.isSquareAttacked(row, 6, color)) {
                        moves.push({r: row, c: 6});
                    }
                }
                if (this.castling[color].q && !this.getPiece(row, 1) && !this.getPiece(row, 2) && !this.getPiece(row, 3)) {
                    if (!this.isSquareAttacked(row, 3, color) && !this.isSquareAttacked(row, 2, color)) { // d-file and c-file check
                        moves.push({r: row, c: 2});
                    }
                }
            }
        } else {
            // Sliding pieces (R, B, Q)
            directions[type].forEach(([dr, dc]) => {
                let nr = r + dr, nc = c + dc;
                while (!addMove(nr, nc)) {
                    nr += dr;
                    nc += dc;
                }
            });
        }

        // Filter moves that leave king in check
        return moves.filter(m => {
            // Simulate move
            const originalTarget = this.board[m.r][m.c];
            const originalSource = this.board[r][c];

            // Handle En Passant simulation
            let enPassantCapture = null;
            if (type === 'p' && m.c !== c && !originalTarget) {
                enPassantCapture = this.board[r][m.c];
                this.board[r][m.c] = null;
            }

            this.board[m.r][m.c] = originalSource;
            this.board[r][c] = null;

            const inCheck = this.isInCheck(color);

            // Undo simulation
            this.board[r][c] = originalSource;
            this.board[m.r][m.c] = originalTarget;
            if (enPassantCapture) {
                this.board[r][m.c] = enPassantCapture;
            }

            return !inCheck;
        });
    }

    isSquareAttacked(r, c, myColor) {
        const opponent = myColor === 'w' ? 'b' : 'w';
        // Simple reverse check: pretend a piece of each type is at (r,c) and see if it hits an opponent of that type
        // Knights
        const knightMoves = [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]];
        for (let [dr, dc] of knightMoves) {
            const p = this.getPiece(r+dr, c+dc);
            if (p && p === opponent + 'n') return true;
        }
        // Kings
        const kingMoves = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]];
        for (let [dr, dc] of kingMoves) {
            const p = this.getPiece(r+dr, c+dc);
            if (p && p === opponent + 'k') return true;
        }
        // Pawns
        const pawnDir = myColor === 'w' ? -1 : 1; // Opponent pawns come from opposite direction
        if (this.getPiece(r+pawnDir, c-1) === opponent + 'p') return true;
        if (this.getPiece(r+pawnDir, c+1) === opponent + 'p') return true;

        // Sliding (Rook/Queen)
        const straight = [[0,1], [0,-1], [1,0], [-1,0]];
        for (let [dr, dc] of straight) {
            let nr = r+dr, nc = c+dc;
            while (nr>=0 && nr<8 && nc>=0 && nc<8) {
                const p = this.board[nr][nc];
                if (p) {
                    if (p === opponent + 'r' || p === opponent + 'q') return true;
                    break;
                }
                nr+=dr; nc+=dc;
            }
        }
        // Sliding (Bishop/Queen)
        const diag = [[1,1], [1,-1], [-1,1], [-1,-1]];
        for (let [dr, dc] of diag) {
            let nr = r+dr, nc = c+dc;
            while (nr>=0 && nr<8 && nc>=0 && nc<8) {
                const p = this.board[nr][nc];
                if (p) {
                    if (p === opponent + 'b' || p === opponent + 'q') return true;
                    break;
                }
                nr+=dr; nc+=dc;
            }
        }
        return false;
    }

    isInCheck(color) {
        // Find King
        let kR, kC;
        for (let r=0; r<8; r++) {
            for (let c=0; c<8; c++) {
                if (this.board[r][c] === color + 'k') {
                    kR = r; kC = c; break;
                }
            }
        }
        if (kR === undefined) return true; // Should not happen unless king captured (bug)
        return this.isSquareAttacked(kR, kC, color);
    }

    isCheckmate() {
        if (!this.isInCheck(this.turn)) return false;
        // If any move exists, not checkmate
        for (let r=0; r<8; r++) {
            for (let c=0; c<8; c++) {
                if (this.isOwnPiece(r, c)) {
                    if (this.getValidMoves(r, c).length > 0) return false;
                }
            }
        }
        return true;
    }

    updateUI() {
        this.turnDot.className = `turn-dot ${this.turn === 'w' ? '' : 'black'}`;
        this.turnText.innerText = this.turn === 'w' ? "White's Turn" : "Black's Turn";

        this.capturedWhiteEl.innerHTML = '';
        this.capturedBlackEl.innerHTML = '';

        this.captured.w.forEach(p => {
            const el = document.createElement('div');
            el.className = `piece w${p[1]}`;
            this.capturedWhiteEl.appendChild(el);
        });
        this.captured.b.forEach(p => {
            const el = document.createElement('div');
            el.className = `piece b${p[1]}`;
            this.capturedBlackEl.appendChild(el);
        });
    }

    updateStatus(msg) {
        this.statusMsg.innerText = msg;
    }

    renderBoard() {
        this.boardElement.innerHTML = '';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // Handle Flipped Board
                const displayR = this.flipped ? 7 - r : r;
                const displayC = this.flipped ? 7 - c : c;

                const square = document.createElement('div');
                const isLight = (displayR + displayC) % 2 === 0;
                square.className = `square ${isLight ? 'light' : 'dark'}`;

                // Highlight Selected
                if (this.selectedSquare && this.selectedSquare.r === displayR && this.selectedSquare.c === displayC) {
                    square.classList.add('selected');
                }

                // Highlight Last Move
                if (this.lastMove) {
                    if ((this.lastMove.from.r === displayR && this.lastMove.from.c === displayC) ||
                        (this.lastMove.to.r === displayR && this.lastMove.to.c === displayC)) {
                        square.classList.add('last-move');
                    }
                }

                // Highlight Check
                const pieceCode = this.board[displayR][displayC];
                if (pieceCode && pieceCode[1] === 'k' && this.isInCheck(pieceCode[0])) {
                    square.classList.add('check');
                }

                // Render Piece
                if (pieceCode) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece ${pieceCode}`;
                    square.appendChild(pieceEl);
                }

                // Render Valid Move Hints
                const isValid = this.validMoves.some(m => m.r === displayR && m.c === displayC);
                if (isValid) {
                    const hint = document.createElement('div');
                    if (pieceCode) {
                        hint.className = 'hint-ring'; // Capture hint
                    } else {
                        hint.className = 'hint-dot'; // Move hint
                    }
                    square.appendChild(hint);
                }

                square.onclick = () => this.handleSquareClick(displayR, displayC);
                this.boardElement.appendChild(square);
            }
        }
    }
}

const game = new ChessGame();