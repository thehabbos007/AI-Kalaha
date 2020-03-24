(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Board = (function () {
    function Board(game) {
        this.game = game;
        this.current_pits = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
        this.turn_player_1 = true;
    }
    Board.prototype.get_stones = function (pit) {
        return this.current_pits[pit];
    };
    Board.prototype.set_stones = function (pit, stones) {
        this.current_pits[pit] = stones;
    };
    Board.prototype.add_stones = function (pit, stones) {
        this.current_pits[pit] += stones;
    };
    Board.prototype.move_stones = function (pit) {
        pit = this.turn_player_1 ? pit : pit + 7;
        var current_store_idx = this.get_store_index(this.turn_player_1);
        var other_store_idx = this.get_store_index(!this.turn_player_1);
        if (this.get_stones(pit) < 1) {
            return false;
        }
        var stones = this.get_stones(pit);
        this.set_stones(pit, 0);
        this.game.draw_stones(pit);
        while (stones > 0) {
            pit = (pit + 1) % this.current_pits.length;
            if (pit == other_store_idx) {
                pit = (other_store_idx + 1) % this.current_pits.length;
            }
            this.add_stones(pit, 1);
            stones--;
            this.game.draw_stones(pit);
        }
        var inverse = (5 - pit + 7) % this.current_pits.length;
        var is_capturable = this.is_within_player_bounds(pit, this.turn_player_1);
        if (is_capturable && this.current_pits[pit] === 1 && this.current_pits[inverse] > 0) {
            this.current_pits[current_store_idx] += this.current_pits[inverse] + 1;
            this.game.draw_stones(current_store_idx);
            this.current_pits[pit] = 0;
            this.current_pits[inverse] = 0;
            this.game.draw_stones(pit);
            this.game.draw_stones(inverse);
        }
        return pit !== current_store_idx;
    };
    Board.prototype.get_store_index = function (player_turn) {
        var half = (this.current_pits.length / 2) - 1;
        return player_turn ? half : half * 2 + 1;
    };
    Board.prototype.get_store = function (player_turn) {
        var idx = this.get_store_index(player_turn);
        return this.current_pits[idx];
    };
    Board.prototype.get_offset = function (player_turn) {
        var half = (this.current_pits.length / 2) - 1;
        return player_turn ? 0 : half + 1;
    };
    Board.prototype.get_side_length = function () {
        return this.current_pits.length / 2 - 1;
    };
    Board.prototype.get_board_index = function (board) {
        return [0, this.get_side_length(),
            this.get_side_length() + 1, this.current_pits.length - 1];
    };
    Board.prototype.is_within_player_bounds = function (pit, player_1) {
        var _a = this.get_board_index(this.current_pits), p1_lower = _a[0], p1_upper = _a[1], p2_lower = _a[2], p2_upper = _a[3];
        if (player_1) {
            return (pit >= p1_lower && pit < p1_upper);
        }
        else {
            return (pit >= p2_lower && pit < p2_upper);
        }
    };
    Board.prototype.get_board_slice = function (player_turn, board) {
        return player_turn
            ? board.slice(0, this.get_side_length())
            : board.slice(this.get_side_length() + 1, this.current_pits.length - 1);
    };
    Board.prototype.check_winner = function () {
        var _this = this;
        var is_row_empty = function (player) {
            return _this.get_board_slice(player, _this.current_pits)
                .every(function (stones) { return stones === 0; });
        };
        var player_1_out = is_row_empty(true);
        var player_2_out = is_row_empty(false);
        var p1_store_idx = this.get_store_index(true);
        var p2_store_idx = this.get_store_index(false);
        if (!player_1_out && !player_2_out) {
            return -1;
        }
        var pit;
        var _a = this.get_board_index(this.current_pits), p1_lower = _a[0], p1_upper = _a[1], p2_lower = _a[2], p2_upper = _a[3];
        if (player_1_out && !player_2_out) {
            for (pit = p2_lower; pit < p2_upper; pit++) {
                this.current_pits[p2_store_idx] += this.current_pits[pit];
                this.current_pits[pit] = 0;
            }
        }
        else if (player_2_out && !player_1_out) {
            for (pit = p1_lower; pit < p1_upper; pit++) {
                this.current_pits[p1_store_idx] += this.current_pits[pit];
                this.current_pits[pit] = 0;
            }
        }
        this.game.draw_all_stones();
        var p1_store = this.get_store(true);
        var p2_store = this.get_store(false);
        if (p1_store == p2_store)
            return 0;
        return p1_store > p2_store ? 1 : 2;
    };
    ;
    return Board;
}());
exports.Board = Board;
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Board_1 = require("./Board");
var format = function (stones) {
    return stones === 0 ? null : stones + '';
};
var Game = (function () {
    function Game(enable_render) {
        if (enable_render === void 0) { enable_render = true; }
        this.enable_render = enable_render;
        this.current_player_store = document.querySelector('.store.player-one p');
        this.current_player_pits = document.querySelectorAll('.row.player-one .pit p');
        this.other_player_store = document.querySelector('.store.player-two p');
        this.other_player_pits = document.querySelectorAll('.row.player-two .pit p');
        this.board = new Board_1.Board(this);
    }
    Object.defineProperty(Game.prototype, "player_text", {
        get: function () {
            return this.board.turn_player_1 ? 'one' : 'two';
        },
        enumerable: true,
        configurable: true
    });
    Game.prototype.init = function () {
        if (!this.enable_render)
            return;
        this.refresh_queries();
        this.draw_all_stones();
    };
    Game.prototype.get_other_player = function () {
        return !this.board.turn_player_1;
    };
    Game.prototype.refresh_queries = function () {
        this.current_player_pits = document.querySelectorAll('.row.player-one .pit p');
        this.current_player_store = document.querySelector('.store.player-one p');
        this.other_player_pits = document.querySelectorAll('.row.player-two .pit p');
        this.other_player_store = document.querySelector('.store.player-two p');
    };
    Game.prototype.do_player_turn = function (pit) {
        var turn_over = this.board.move_stones(pit);
        if (this.check_game_over()) {
            return true;
        }
        if (turn_over) {
            this.switch_turn();
        }
        return false;
    };
    Game.prototype.switch_turn = function () {
        var _this = this;
        this.board.turn_player_1 = this.get_other_player();
        this.draw_all_stones();
        setTimeout(function () {
            document.body.setAttribute('data-player', _this.player_text);
            var current_player = document.querySelector('.current-player');
            if (current_player) {
                current_player.textContent = _this.player_text;
            }
        }, 200);
    };
    Game.prototype.check_game_over = function () {
        var winner = this.board.check_winner();
        if (winner < 0) {
            return false;
        }
        var status = document.querySelector('.status');
        if (this.enable_render && status) {
            document.body.classList.add('game-over');
            if (1 === winner) {
                status.textContent = 'Player one wins!';
                document.body.setAttribute('data-player', 'one');
            }
            else if (2 === winner) {
                status.textContent = 'Player two wins!';
                document.body.setAttribute('data-player', 'two');
            }
            else {
                document.body.setAttribute('data-player', '');
                status.textContent = 'Draw!';
            }
        }
        this.board.turn_player_1 = true;
        return true;
    };
    Game.prototype.draw_all_stones = function () {
        if (!this.enable_render)
            return;
        var current_store = this.board.get_store(true);
        var other_store = this.board.get_store(false);
        var current_offset = this.board.get_offset(true);
        var other_offset = this.board.get_offset(false);
        if (this.current_player_store)
            this.current_player_store.textContent = format(current_store);
        if (this.other_player_store)
            this.other_player_store.textContent = format(other_store);
        for (var pit = 0; pit < 6; pit++) {
            this.current_player_pits[pit].textContent = format(this.board.current_pits[current_offset + pit]);
            this.other_player_pits[pit].textContent = format(this.board.current_pits[other_offset + pit]);
        }
    };
    Game.prototype.draw_stones = function (pit) {
        if (!this.enable_render)
            return;
        var current_store = this.board.get_store(true);
        var other_store = this.board.get_store(false);
        var current_offset = this.board.get_offset(true);
        var other_offset = this.board.get_offset(false);
        if (pit === 6) {
            if (this.current_player_store)
                this.current_player_store.textContent = format(current_store);
        }
        else if (pit === 13) {
            if (this.other_player_store)
                this.other_player_store.textContent = format(other_store);
        }
        else if (pit < 6) {
            this.current_player_pits[pit].textContent = format(this.board.current_pits[current_offset + pit]);
        }
        else if (pit > 6) {
            pit -= 7;
            this.other_player_pits[pit].textContent = format(this.board.current_pits[other_offset + pit]);
        }
    };
    return Game;
}());
exports.Game = Game;
},{"./Board":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Game_1 = require("./Game");
var game = new Game_1.Game();
game.init();
var waiting_for_move = true;
var init_pits = function (player, row) {
    var onclick = function (e) {
        var _a;
        var target = e.target;
        var player_id = player === 'one';
        if (game.board.turn_player_1 === player_id && waiting_for_move) {
            waiting_for_move = false;
            var pit = parseInt((_a = target.getAttribute('data-pit')) !== null && _a !== void 0 ? _a : '0', 10);
            if (!game.do_player_turn(pit)) {
                waiting_for_move = true;
            }
        }
    };
    for (var pit = 0; pit < row.length; pit++) {
        row[pit].setAttribute('data-pit', pit.toString());
        row[pit].addEventListener('click', onclick);
    }
};
init_pits('one', document.querySelectorAll('.row.player-one .pit'));
init_pits('two', document.querySelectorAll('.row.player-two .pit'));
var newGame = document.querySelector('.new-game');
if (newGame)
    newGame.addEventListener('click', function () {
        window.location.reload();
    });
},{"./Game":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zcmMvc3JjL0JvYXJkLnRzIiwic3JjL3NyYy9zcmMvR2FtZS50cyIsInNyYy9zcmMvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNJQTtJQVNFLGVBQVksSUFBVTtRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBRTlELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFPTSwwQkFBVSxHQUFqQixVQUFrQixHQUFXO1FBQzNCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBT00sMEJBQVUsR0FBakIsVUFBa0IsR0FBVyxFQUFFLE1BQWM7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUE7SUFDakMsQ0FBQztJQU9NLDBCQUFVLEdBQWpCLFVBQWtCLEdBQVcsRUFBRSxNQUFjO1FBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDO0lBQ25DLENBQUM7SUFPTSwyQkFBVyxHQUFsQixVQUFtQixHQUFXO1FBQzVCLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUE7UUFDeEMs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QUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDeEMsR0FBRyxDQUFDLEdBQUcsQ0FBaUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDNUM7QUFDSCxDQUFDLENBQUM7QUFFRixTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7QUFDcEUsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO0FBRXBFLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDcEQsSUFBRyxPQUFPO0lBQ1IsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRTtRQUVoQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHtHYW1lfSBmcm9tICcuL0dhbWUnO1xuLyoqXG4gKiBNYW5hZ2VzIHRoZSBtYW5jYWxhIGJvYXJkXG4gKi9cbmV4cG9ydCBjbGFzcyBCb2FyZCB7XG4gIGdhbWU6IEdhbWVcbiAgY3VycmVudF9waXRzOiBudW1iZXJbXVxuICB0dXJuX3BsYXllcl8xOiBib29sZWFuO1xuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXNlIGNsYXNzXG5cdCAqIEBwYXJhbSB7R2FtZX0gZ2FtZVxuXHQgKi9cbiAgY29uc3RydWN0b3IoZ2FtZTogR2FtZSkge1xuICAgIHRoaXMuZ2FtZSA9IGdhbWVcbiAgICB0aGlzLmN1cnJlbnRfcGl0cyA9IFs0LCA0LCA0LCA0LCA0LCA0LCAwLCA0LCA0LCA0LCA0LCA0LCA0LCAwXVxuICAgIC8vdGhpcy5jdXJyZW50X3BpdHMgPSBbMSwgNCwxLDAsIDQsIDQsIDI1LCAwLCAwLCAwLCAwLCAwLCAxLCAyNV1cbiAgICB0aGlzLnR1cm5fcGxheWVyXzEgPSB0cnVlO1xuICB9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlIHRoZSBhbW91bnQgb2Ygc3RvbmVzIGluIGEgcGl0XG5cdCAqIEBwYXJhbSAge051bWJlcn0gcGl0IFRoZSBwaXQgbnVtYmVyXG5cdCAqIEByZXR1cm4ge051bWJlcn0gICAgIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgZ2V0X3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcGl0c1twaXRdO1xuICB9XG5cblx0LyoqXG5cdCAqIFNldCB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0ge051bWJlcn0gcGl0ICAgIFRoZSBwaXQgbnVtYmVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBzdG9uZXMgVGhlIGFtb3VudCBvZiBzdG9uZXNcblx0ICovXG4gIHB1YmxpYyBzZXRfc3RvbmVzKHBpdDogbnVtYmVyLCBzdG9uZXM6IG51bWJlcikge1xuICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSBzdG9uZXNcbiAgfVxuXG5cdC8qKlxuXHQgKiBBZGp1c3QgdGhlIGFtb3VudCBvZiBzdG9uZXMgaW4gYSBwaXRcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHBpdCAgICBUaGUgcGl0IG51bWJlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gc3RvbmVzIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgYWRkX3N0b25lcyhwaXQ6IG51bWJlciwgc3RvbmVzOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdICs9IHN0b25lcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXN0cmlidXRlIHRoZSBzdG9uZXMgZnJvbSBhIHBpdCBhcm91bmQgdGhlIGJvYXJkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgVGhlIHBpdCB0byBiZWdpbiBpblxuICAgKiBAcmV0dXJuIHtCb29sZWFufSBXaGV0aGVyIHRoZSB1c2VyJ3MgdHVybiBoYXMgZW5kZWRcbiAgICovXG4gIHB1YmxpYyBtb3ZlX3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIHBpdCA9IHRoaXMudHVybl9wbGF5ZXJfMSA/IHBpdCA6IHBpdCArIDdcbiAgICBjb25zdCBjdXJyZW50X3N0b3JlX2lkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KHRoaXMudHVybl9wbGF5ZXJfMSlcbiAgICBjb25zdCBvdGhlcl9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleCghdGhpcy50dXJuX3BsYXllcl8xKVxuICAgIC8vIHJldHVybiBpZiBwaXQgaGFzIG5vIHN0b25lc1xuICAgIGlmICh0aGlzLmdldF9zdG9uZXMocGl0KSA8IDEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyB0YWtlIHN0b25lcyBvdXQgb2YgcGl0XG4gICAgbGV0IHN0b25lcyA9IHRoaXMuZ2V0X3N0b25lcyhwaXQpO1xuICAgIHRoaXMuc2V0X3N0b25lcyhwaXQsIDApO1xuICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhwaXQpO1xuXG4gICAgd2hpbGUgKHN0b25lcyA+IDApIHtcbiAgICAgIHBpdCA9IChwaXQgKyAxKSAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aDtcblxuICAgICAgLy8gd3JhcCBhcm91bmQgdGhlIGJvYXJkIGJlZm9yZSByZWFjaGluZyBvdGhlciBwbGF5ZXIncyBzdG9yZVxuICAgICAgaWYgKHBpdCA9PSBvdGhlcl9zdG9yZV9pZHgpIHtcbiAgICAgICAgcGl0ID0gKG90aGVyX3N0b3JlX2lkeCArIDEpICUgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFkZF9zdG9uZXMocGl0LCAxKTtcbiAgICAgIHN0b25lcy0tO1xuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKHBpdCk7XG4gICAgfVxuXG4gICAgLy8gSW52ZXJ0IHRoZSBwaXQgbnVtYmVyIChudW1iZXIgb2Ygb3Bwb3NpdGUgcGl0IGluIG9wcG9uZW50J3Mgcm93KVxuICAgIGNvbnN0IGludmVyc2UgPSAoNSAtIHBpdCArIDcpICUgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoXG4gICAgY29uc3QgaXNfY2FwdHVyYWJsZSA9IHRoaXMuaXNfd2l0aGluX3BsYXllcl9ib3VuZHMocGl0LCB0aGlzLnR1cm5fcGxheWVyXzEpO1xuICAgIC8vIENoZWNrIGZvciBjYXB0dXJlXG4gICAgaWYgKGlzX2NhcHR1cmFibGUgJiYgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9PT0gMSAmJiB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXSA+IDApIHtcblxuICAgICAgLy8gVHJhbnNmZXIgdGhpcyBwaXQncyBzdG9uZXMgYWxvbmcgd2l0aCBvcHBvc2l0ZSBwaXQncyBzdG9uZXMgdG8gc3RvcmVcbiAgICAgIHRoaXMuY3VycmVudF9waXRzW2N1cnJlbnRfc3RvcmVfaWR4XSArPSB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXSArIDE7XG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMoY3VycmVudF9zdG9yZV9pZHgpO1xuXG4gICAgICAvLyBDbGVhciB0aGUgcGl0c1xuICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9IDA7XG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXSA9IDA7XG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KTtcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhpbnZlcnNlKTtcbiAgICB9XG5cbiAgICAvLyB0aGUgdXNlcidzIHR1cm4gZW5kZWQgaWYgdGhlIHN0b25lcyBkaWQgbm90IGVuZCBpbiB0aGUgc3RvcmFnZSBwaXRcbiAgICByZXR1cm4gcGl0ICE9PSBjdXJyZW50X3N0b3JlX2lkeDtcbiAgfVxuXG4gIHB1YmxpYyBnZXRfc3RvcmVfaW5kZXgocGxheWVyX3R1cm46IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGhhbGYgPSAodGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMikgLSAxXG4gICAgcmV0dXJuIHBsYXllcl90dXJuID8gaGFsZiA6IGhhbGYgKiAyICsgMVxuICB9XG5cbiAgcHVibGljIGdldF9zdG9yZShwbGF5ZXJfdHVybjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgocGxheWVyX3R1cm4pO1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcGl0c1tpZHhdXG4gIH1cblxuICBwdWJsaWMgZ2V0X29mZnNldChwbGF5ZXJfdHVybjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgaGFsZiA9ICh0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGggLyAyKSAtIDFcbiAgICByZXR1cm4gcGxheWVyX3R1cm4gPyAwIDogaGFsZiArIDFcbiAgfVxuXG4gIHB1YmxpYyBnZXRfc2lkZV9sZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aCAvIDIgLSAxXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBib3VuZGluZyBpbmRpY2llcyBmb3IgZWFjaCBwbGF5ZXIncyBib2FyZFxuICAgKi9cbiAgcHVibGljIGdldF9ib2FyZF9pbmRleChib2FyZDogbnVtYmVyW10pOiBudW1iZXJbXSB7XG4gICAgICByZXR1cm4gWzAsIHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCksXG4gICAgICAgICAgICAgdGhpcy5nZXRfc2lkZV9sZW5ndGgoKSsxLCB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGgtMV1cbiAgfVxuXG4gIHB1YmxpYyBpc193aXRoaW5fcGxheWVyX2JvdW5kcyhwaXQ6IG51bWJlciwgcGxheWVyXzE6IGJvb2xlYW4pOiBib29sZWFue1xuICAgIGNvbnN0IFtwMV9sb3dlciwgcDFfdXBwZXIsIHAyX2xvd2VyLCBwMl91cHBlcl0gPSB0aGlzLmdldF9ib2FyZF9pbmRleCh0aGlzLmN1cnJlbnRfcGl0cylcblxuICAgIGlmKHBsYXllcl8xKXtcbiAgICAgIHJldHVybiAocGl0ID49IHAxX2xvd2VyICYmIHBpdCA8IHAxX3VwcGVyKVxuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIChwaXQgPj0gcDJfbG93ZXIgJiYgcGl0IDwgcDJfdXBwZXIpXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGdldF9ib2FyZF9zbGljZShwbGF5ZXJfdHVybjogYm9vbGVhbiwgYm9hcmQ6IG51bWJlcltdKSA6IG51bWJlcltdIHtcbiAgICByZXR1cm4gcGxheWVyX3R1cm5cbiAgICAgID8gYm9hcmQuc2xpY2UoMCwgdGhpcy5nZXRfc2lkZV9sZW5ndGgoKSlcbiAgICAgIDogYm9hcmQuc2xpY2UodGhpcy5nZXRfc2lkZV9sZW5ndGgoKSsxLCB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGgtMSlcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgcGxheWVyIGhhcyB3b25cbiAgICogQHJldHVybiB7TnVtYmVyfSAtMSBmb3Igbm8gd2luLCAwIGZvciBkcmF3LCAxIGZvciBwbGF5ZXIgb25lIHdpbiwgMiBmb3IgcGxheWVyIHR3byB3aW5cbiAgICovXG4gIHB1YmxpYyBjaGVja193aW5uZXIoKSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBhIHJvdyBvbiB0aGUgYm9hcmQgaXMgZW1wdHlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwaXRzIFRoZSBwaXRzIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBhbGwgb2YgdGhlIHBpdHMgY29udGFpbiBubyBzdG9uZXNcbiAgICAgKi9cbiAgICBjb25zdCBpc19yb3dfZW1wdHkgPSAocGxheWVyOiBib29sZWFuKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRfYm9hcmRfc2xpY2UocGxheWVyLCB0aGlzLmN1cnJlbnRfcGl0cylcbiAgICAgICAgICAgICAgICAgLmV2ZXJ5KChzdG9uZXM6IG51bWJlcikgPT4gc3RvbmVzID09PSAwKTtcbiAgICB9O1xuXG4gICAgY29uc3QgcGxheWVyXzFfb3V0ID0gaXNfcm93X2VtcHR5KHRydWUpO1xuICAgIGNvbnN0IHBsYXllcl8yX291dCA9IGlzX3Jvd19lbXB0eShmYWxzZSk7XG4gICAgY29uc3QgcDFfc3RvcmVfaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgodHJ1ZSlcbiAgICBjb25zdCBwMl9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleChmYWxzZSlcblxuXG4gICAgLy8gdGhlIGdhbWUgaXMgbm90IG92ZXIgaWYgbmVpdGhlciBwbGF5ZXIgaGFzIGFuIGVtcHR5IHJvd1xuICAgIGlmICghcGxheWVyXzFfb3V0ICYmICFwbGF5ZXJfMl9vdXQpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICAvLyBNb3ZlIHRoZSBzdG9uZXMgcmVtYWluaW5nIGluIGEgcGxheWVyJ3Mgcm93IGludG8gdGhlaXIgc3RvcmVcbiAgICBsZXQgcGl0O1xuICAgIGNvbnN0IFtwMV9sb3dlciwgcDFfdXBwZXIsIHAyX2xvd2VyLCBwMl91cHBlcl0gPSB0aGlzLmdldF9ib2FyZF9pbmRleCh0aGlzLmN1cnJlbnRfcGl0cylcblxuICAgIGlmIChwbGF5ZXJfMV9vdXQgJiYgIXBsYXllcl8yX291dCkge1xuICAgICAgZm9yIChwaXQgPSBwMl9sb3dlcjsgcGl0IDwgcDJfdXBwZXI7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3AyX3N0b3JlX2lkeF0gKz0gdGhpcy5jdXJyZW50X3BpdHNbcGl0XTtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9IDA7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHBsYXllcl8yX291dCAmJiAhcGxheWVyXzFfb3V0KSB7XG4gICAgICBmb3IgKHBpdCA9IHAxX2xvd2VyOyBwaXQgPCBwMV91cHBlcjsgcGl0KyspIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcDFfc3RvcmVfaWR4XSArPSB0aGlzLmN1cnJlbnRfcGl0c1twaXRdO1xuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmdhbWUuZHJhd19hbGxfc3RvbmVzKCk7XG4gICAgY29uc3QgcDFfc3RvcmUgPSB0aGlzLmdldF9zdG9yZSh0cnVlKVxuICAgIGNvbnN0IHAyX3N0b3JlID0gdGhpcy5nZXRfc3RvcmUoZmFsc2UpXG4gICAgXG4gICAgaWYgKHAxX3N0b3JlID09IHAyX3N0b3JlKVxuICAgICAgICByZXR1cm4gMDtcbiAgICByZXR1cm4gcDFfc3RvcmUgPiBwMl9zdG9yZSA/IDEgOiAyO1xuICB9O1xufVxuIiwiXG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4vQm9hcmQnO1xuXG5jb25zdCBmb3JtYXQgPSAoc3RvbmVzOiBudW1iZXIpID0+IHtcbiAgcmV0dXJuIHN0b25lcyA9PT0gMCA/IG51bGwgOiBzdG9uZXMgKyAnJ1xufVxuXG5leHBvcnQgY2xhc3MgR2FtZSB7XG4gIGJvYXJkOiBCb2FyZFxuICBjdXJyZW50X3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItb25lIHAnKVxuICBjdXJyZW50X3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQgcCcpXG5cbiAgb3RoZXJfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci10d28gcCcpXG4gIG90aGVyX3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQgcCcpXG5cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVuYWJsZV9yZW5kZXI6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgdGhpcy5ib2FyZCA9IG5ldyBCb2FyZCh0aGlzKVxuICB9XG5cbiAgZ2V0IHBsYXllcl90ZXh0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5ib2FyZC50dXJuX3BsYXllcl8xID8gJ29uZScgOiAndHdvJztcbiAgfSBcblxuICAvKipcbiAgICogUmVmcmVzaCB0aGUgcXVlcnkgc2VsZWN0b3JzIGFuZCB1cGRhdGUgcGl0IHN0b25lc1xuICAgKi9cbiAgcHVibGljIGluaXQoKXtcbiAgICBpZighdGhpcy5lbmFibGVfcmVuZGVyKSByZXR1cm47XG4gICAgdGhpcy5yZWZyZXNoX3F1ZXJpZXMoKVxuICAgIHRoaXMuZHJhd19hbGxfc3RvbmVzKClcbiAgfVxuICAvKipcblx0ICAqIFJldHJpZXZlIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbm90IGN1cnJlbnRseSBoYXZpbmcgYSB0dXJuXG5cdCAgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAgKi9cblx0cHVibGljIGdldF9vdGhlcl9wbGF5ZXIoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzFcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW4gdGhlIHF1ZXJ5IHNlbGVjdG9ycyBmb3IgdGhlIHBpdHNcblx0ICovXG5cdHB1YmxpYyByZWZyZXNoX3F1ZXJpZXMoKSB7XG5cdFx0dGhpcy5jdXJyZW50X3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQgcCcpXG4gICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItb25lIHAnKVxuICAgIFxuXHRcdHRoaXMub3RoZXJfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCBwJylcblx0XHR0aGlzLm90aGVyX3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItdHdvIHAnKVxuXHR9XG5cblx0LyoqXG5cdCAqIFBlcmZvcm0gdGhlIG1vdmUgZm9yIGEgcGxheWVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgLSBUaGUgcGl0IG51bWJlciBjaG9zZW5cblx0ICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgdGhlIGdhbWUgaXMgbm93IG92ZXJcblx0ICovXG5cdHB1YmxpYyBkb19wbGF5ZXJfdHVybihwaXQ6IG51bWJlcikge1xuXHRcdC8vIHBlcmZvcm0gdGhlIHBsYXllcidzIGFjdGlvblxuXHRcdGNvbnN0IHR1cm5fb3ZlciA9IHRoaXMuYm9hcmQubW92ZV9zdG9uZXMocGl0KVxuXG5cdFx0Ly8gbWFrZSBzdXJlIHRoYXQgYSBwbGF5ZXIgaGFzbid0IHJ1biBvdXQgb2Ygc3RvbmVzXG5cdFx0aWYgKHRoaXMuY2hlY2tfZ2FtZV9vdmVyKCkpIHtcblx0XHRcdC8vIHRoaXMucmVzZXRfZ2FtZSgpXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblxuXHRcdC8vIGNoYW5nZSB0aGUgcGxheWVyIGlmIHRoZSBjdXJyZW50IHR1cm4gaXMgZW5kZWRcblx0XHRpZiAodHVybl9vdmVyKSB7XG5cdFx0XHR0aGlzLnN3aXRjaF90dXJuKClcblx0XHR9XG5cbiAgICByZXR1cm4gZmFsc2Vcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGFuZ2UgdGhlIHVzZXIgY3VycmVudGx5IGhhdmluZyBhIHR1cm5cblx0ICovXG5cdHB1YmxpYyBzd2l0Y2hfdHVybigpIHtcblx0XHR0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPSB0aGlzLmdldF9vdGhlcl9wbGF5ZXIoKVxuICAgIHRoaXMuZHJhd19hbGxfc3RvbmVzKClcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgdGhpcy5wbGF5ZXJfdGV4dClcbiAgICAgIGNvbnN0IGN1cnJlbnRfcGxheWVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmN1cnJlbnQtcGxheWVyJylcblx0XHRcdGlmKGN1cnJlbnRfcGxheWVyKXtcbiAgICAgICAgY3VycmVudF9wbGF5ZXIudGV4dENvbnRlbnQgPSB0aGlzLnBsYXllcl90ZXh0XG4gICAgICB9XG5cdFx0fSwgMjAwIClcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVjayBpZiB0aGUgZ2FtZSBzaG91bGQgZW5kXG5cdCAqIEByZXR1cm5zIHtCb29sZWFufSBXaGV0aGVyIHRoZSBnYW1lIGlzIG92ZXJcblx0ICovXG5cdHB1YmxpYyBjaGVja19nYW1lX292ZXIoKSB7XG5cdFx0Y29uc3Qgd2lubmVyID0gdGhpcy5ib2FyZC5jaGVja193aW5uZXIoKVxuXG5cdFx0aWYgKHdpbm5lciA8IDApIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblxuXHRcdGNvbnN0IHN0YXR1cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMnKVxuXG4gICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHBsYXllciBob2xkcyB0aGUgbW9zdCBzdG9uZXNcbiAgICBpZiAodGhpcy5lbmFibGVfcmVuZGVyICYmIHN0YXR1cyl7XG4gIFx0XHRkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2dhbWUtb3ZlcicpXG5cbiAgICAgIGlmICgxID09PSB3aW5uZXIpIHtcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ1BsYXllciBvbmUgd2lucyEnXG4gICAgICAgIGRvY3VtZW50LmJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsICdvbmUnKVxuICAgICAgfSBlbHNlIGlmICgyID09PSB3aW5uZXIpIHtcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ1BsYXllciB0d28gd2lucyEnXG4gICAgICAgIGRvY3VtZW50LmJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsICd0d28nKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgJycpXG4gICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdEcmF3ISdcbiAgICAgIH1cbiAgICB9XG5cblx0XHR0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPSB0cnVlXG5cdFx0cmV0dXJuIHRydWVcbiAgfVxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdG9uZXMgb24gdGhlIHBhZ2VcbiAgICovXG4gIHB1YmxpYyBkcmF3X2FsbF9zdG9uZXMoKSB7XG4gICAgaWYoIXRoaXMuZW5hYmxlX3JlbmRlcikgcmV0dXJuO1xuXG4gICAgbGV0IGN1cnJlbnRfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZSh0cnVlKVxuICAgIGxldCBvdGhlcl9zdG9yZSA9IHRoaXMuYm9hcmQuZ2V0X3N0b3JlKGZhbHNlKVxuXG4gICAgbGV0IGN1cnJlbnRfb2Zmc2V0ID0gdGhpcy5ib2FyZC5nZXRfb2Zmc2V0KHRydWUpXG4gICAgbGV0IG90aGVyX29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldChmYWxzZSlcblxuICAgIGlmKHRoaXMuY3VycmVudF9wbGF5ZXJfc3RvcmUpXG4gICAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KGN1cnJlbnRfc3RvcmUpXG5cbiAgICBpZih0aGlzLm90aGVyX3BsYXllcl9zdG9yZSlcbiAgICAgIHRoaXMub3RoZXJfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KG90aGVyX3N0b3JlKVxuXG4gICAgZm9yIChsZXQgcGl0ID0gMDsgcGl0IDwgNjsgcGl0KyspIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9waXRzW3BpdF0udGV4dENvbnRlbnQgPSBmb3JtYXQodGhpcy5ib2FyZC5jdXJyZW50X3BpdHNbY3VycmVudF9vZmZzZXQrcGl0XSlcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW290aGVyX29mZnNldCtwaXRdKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkcmF3X3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIGlmKCF0aGlzLmVuYWJsZV9yZW5kZXIpIHJldHVybjtcbiAgIFxuICAgIGxldCBjdXJyZW50X3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICBsZXQgb3RoZXJfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZShmYWxzZSlcblxuICAgIGxldCBjdXJyZW50X29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldCh0cnVlKVxuICAgIGxldCBvdGhlcl9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQoZmFsc2UpXG5cbiAgICBpZiAocGl0ID09PSA2KSB7XG4gICAgICBpZih0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlKVxuICAgICAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KGN1cnJlbnRfc3RvcmUpXG4gICAgfSBlbHNlIGlmKHBpdCA9PT0gMTMpIHtcbiAgICAgIGlmKHRoaXMub3RoZXJfcGxheWVyX3N0b3JlKVxuICAgICAgICB0aGlzLm90aGVyX3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChvdGhlcl9zdG9yZSlcbiAgICB9IGVsc2UgaWYgKHBpdCA8IDYpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9waXRzW3BpdF0udGV4dENvbnRlbnQgPSBmb3JtYXQodGhpcy5ib2FyZC5jdXJyZW50X3BpdHNbY3VycmVudF9vZmZzZXQrcGl0XSlcbiAgICB9IGVsc2UgaWYgKHBpdCA+IDYpIHtcbiAgICAgICAgcGl0IC09IDdcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW290aGVyX29mZnNldCtwaXRdKVxuICAgIH1cbn1cbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi9HYW1lXCI7XG5cblxuY29uc3QgZ2FtZSA9IG5ldyBHYW1lKCk7XG4vLyBnYW1lLmxvYWRfZ2FtZSgpO1xuZ2FtZS5pbml0KCk7XG5sZXQgd2FpdGluZ19mb3JfbW92ZSA9IHRydWU7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBwaXQgZWxlbWVudHMgYXNcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIHBsYXllciBUaGUgcGxheWVyIHdobyB0aGUgcm93IGJlbG9uZ3MgdG9cbiAqIEBwYXJhbSB7Tm9kZUxpc3R9IHJvdyAgICBUaGUgcGl0IGVsZW1lbnRzIHRvIGluaXRpYWxpemVcbiAqL1xuY29uc3QgaW5pdF9waXRzID0gKHBsYXllcjogc3RyaW5nLCByb3c6IE5vZGVMaXN0KSA9PiB7XG4gIGNvbnN0IG9uY2xpY2sgPSAoZTogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCk7XG4gICAgY29uc3QgcGxheWVyX2lkID0gcGxheWVyID09PSAnb25lJ1xuICAgIGlmIChnYW1lLmJvYXJkLnR1cm5fcGxheWVyXzEgPT09IHBsYXllcl9pZCAmJiB3YWl0aW5nX2Zvcl9tb3ZlKSB7XG4gICAgICB3YWl0aW5nX2Zvcl9tb3ZlID0gZmFsc2U7XG4gICAgICBjb25zdCBwaXQgPSBwYXJzZUludCh0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXBpdCcpPz8gJzAnLCAxMCk7XG4gICAgICBpZiAoIWdhbWUuZG9fcGxheWVyX3R1cm4ocGl0KSkge1xuICAgICAgICB3YWl0aW5nX2Zvcl9tb3ZlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZm9yIChsZXQgcGl0ID0gMDsgcGl0IDwgcm93Lmxlbmd0aDsgcGl0KyspIHtcbiAgICAocm93W3BpdF0gYXMgSFRNTEVsZW1lbnQpLnNldEF0dHJpYnV0ZSgnZGF0YS1waXQnLCBwaXQudG9TdHJpbmcoKSlcbiAgICByb3dbcGl0XS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uY2xpY2spXG4gIH1cbn07XG5cbmluaXRfcGl0cygnb25lJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQnKSk7XG5pbml0X3BpdHMoJ3R3bycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLXR3byAucGl0JykpO1xuXG5jb25zdCBuZXdHYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5ldy1nYW1lJyk7XG5pZihuZXdHYW1lKVxuICBuZXdHYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIC8vIGdhbWUucmVzZXRfZ2FtZSgpO1xuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgfSlcbiJdfQ==
