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
        if (this.get_stones(pit) < 1) {
            return false;
        }
        var stones = this.get_stones(pit);
        this.set_stones(pit, 0);
        this.game.draw_stones(pit);
        while (stones > 0) {
            ++pit;
            if (pit > 13) {
                pit = 0;
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
        var player_1_out = is_row_empty(this.turn_player_1);
        var player_2_out = is_row_empty(!this.turn_player_1);
        if (!player_1_out && !player_2_out) {
            return -1;
        }
        var pit;
        var _a = this.get_board_index(this.current_pits), p1_lower = _a[0], p1_upper = _a[1], p2_lower = _a[2], p2_upper = _a[3];
        if (player_1_out && !player_2_out) {
            for (pit = p1_lower; pit <= p1_upper; pit++) {
                var inverse = pit + 7 % this.current_pits.length;
                this.current_pits[p1_upper + 1] += this.current_pits[inverse];
                this.current_pits[pit] = 0;
            }
        }
        else if (player_2_out && !player_1_out) {
            for (pit = p2_lower; pit <= p2_upper; pit++) {
                var inverse = pit + 7 % this.current_pits.length;
                this.current_pits[p2_upper + 1] += this.current_pits[inverse];
                this.current_pits[pit] = 0;
            }
        }
        this.game.draw_all_stones();
        var p1_store = this.get_store(true);
        var p2_store = this.get_store(false);
        if (p1_store > p2_store) {
            return this.turn_player_1 ? 1 : 2;
        }
        else {
            return 0;
        }
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
    function Game() {
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
        debugger;
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
        }, 400);
    };
    Game.prototype.check_game_over = function () {
        var winner = this.board.check_winner();
        if (winner < 0) {
            return false;
        }
        document.body.classList.add('game-over');
        var status = document.querySelector('.status');
        if (status) {
            if (1 === winner) {
                status.textContent = 'Player one wins!';
            }
            else if (2 === winner) {
                status.textContent = 'Player two wins!';
            }
            else {
                status.textContent = 'Draw!';
            }
        }
        this.board.turn_player_1 = true;
        return true;
    };
    Game.prototype.draw_all_stones = function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2hvbWUvYWhtYWQvLmFzZGYvaW5zdGFsbHMvbm9kZWpzLzEwLjEzLjAvLm5wbS9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zcmMvc3JjL0JvYXJkLnRzIiwic3JjL3NyYy9zcmMvR2FtZS50cyIsInNyYy9zcmMvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNJQTtJQVNFLGVBQVksSUFBVTtRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzlELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFPTSwwQkFBVSxHQUFqQixVQUFrQixHQUFXO1FBQzNCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBT00sMEJBQVUsR0FBakIsVUFBa0IsR0FBVyxFQUFFLE1BQWM7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUE7SUFDakMsQ0FBQztJQU9NLDBCQUFVLEdBQWpCLFVBQWtCLEdBQVcsRUFBRSxNQUFjO1FBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDO0lBQ25DLENBQUM7SUFPTSwyQkFBVyxHQUFsQixVQUFtQixHQUFXO1FBQzVCLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxH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Q0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwRCxJQUFHLE9BQU87SUFDUixPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFO1FBRWhDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDM0IsQ0FBQyxDQUFDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQge0dhbWV9IGZyb20gJy4vR2FtZSc7XG4vKipcbiAqIE1hbmFnZXMgdGhlIG1hbmNhbGEgYm9hcmRcbiAqL1xuZXhwb3J0IGNsYXNzIEJvYXJkIHtcbiAgZ2FtZTogR2FtZVxuICBjdXJyZW50X3BpdHM6IG51bWJlcltdXG4gIHR1cm5fcGxheWVyXzE6IGJvb2xlYW47XG5cblx0LyoqXG5cdCAqIEluaXRpYWxpc2UgY2xhc3Ncblx0ICogQHBhcmFtIHtHYW1lfSBnYW1lXG5cdCAqL1xuICBjb25zdHJ1Y3RvcihnYW1lOiBHYW1lKSB7XG4gICAgdGhpcy5nYW1lID0gZ2FtZVxuICAgIHRoaXMuY3VycmVudF9waXRzID0gWzQsIDQsIDQsIDQsIDQsIDQsIDAsIDQsIDQsIDQsIDQsIDQsIDQsIDBdXG4gICAgdGhpcy50dXJuX3BsYXllcl8xID0gdHJ1ZTtcbiAgfVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZSB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHBpdCBUaGUgcGl0IG51bWJlclxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICBUaGUgYW1vdW50IG9mIHN0b25lc1xuXHQgKi9cbiAgcHVibGljIGdldF9zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHNbcGl0XTtcbiAgfVxuXG5cdC8qKlxuXHQgKiBTZXQgdGhlIGFtb3VudCBvZiBzdG9uZXMgaW4gYSBwaXRcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHBpdCAgICBUaGUgcGl0IG51bWJlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gc3RvbmVzIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgc2V0X3N0b25lcyhwaXQ6IG51bWJlciwgc3RvbmVzOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gc3RvbmVzXG4gIH1cblxuXHQvKipcblx0ICogQWRqdXN0IHRoZSBhbW91bnQgb2Ygc3RvbmVzIGluIGEgcGl0XG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgICAgVGhlIHBpdCBudW1iZXJcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHN0b25lcyBUaGUgYW1vdW50IG9mIHN0b25lc1xuXHQgKi9cbiAgcHVibGljIGFkZF9zdG9uZXMocGl0OiBudW1iZXIsIHN0b25lczogbnVtYmVyKSB7XG4gICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSArPSBzdG9uZXM7XG4gIH1cblxuICAvKipcbiAgICogRGlzdHJpYnV0ZSB0aGUgc3RvbmVzIGZyb20gYSBwaXQgYXJvdW5kIHRoZSBib2FyZFxuICAgKiBAcGFyYW0ge051bWJlcn0gcGl0IFRoZSBwaXQgdG8gYmVnaW4gaW5cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgdXNlcidzIHR1cm4gaGFzIGVuZGVkXG4gICAqL1xuICBwdWJsaWMgbW92ZV9zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICBwaXQgPSB0aGlzLnR1cm5fcGxheWVyXzEgPyBwaXQgOiBwaXQgKyA3XG4gICAgY29uc3QgY3VycmVudF9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleCh0aGlzLnR1cm5fcGxheWVyXzEpXG4gICAgLy8gcmV0dXJuIGlmIHBpdCBoYXMgbm8gc3RvbmVzXG4gICAgaWYgKHRoaXMuZ2V0X3N0b25lcyhwaXQpIDwgMSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHRha2Ugc3RvbmVzIG91dCBvZiBwaXRcbiAgICBsZXQgc3RvbmVzID0gdGhpcy5nZXRfc3RvbmVzKHBpdCk7XG4gICAgdGhpcy5zZXRfc3RvbmVzKHBpdCwgMCk7XG4gICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKHBpdCk7XG5cbiAgICB3aGlsZSAoc3RvbmVzID4gMCkge1xuICAgICAgKytwaXQ7XG5cbiAgICAgIFxuICAgICAgLy8gd3JhcCBhcm91bmQgdGhlIGJvYXJkIGJlZm9yZSByZWFjaGluZyBvdGhlciBwbGF5ZXIncyBzdG9yZVxuICAgICAgaWYgKHBpdCA+IDEzKSB7XG4gICAgICAgIHBpdCA9IDA7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkX3N0b25lcyhwaXQsIDEpO1xuICAgICAgc3RvbmVzLS07XG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KTtcbiAgICB9XG5cbiAgICAvLyBJbnZlcnQgdGhlIHBpdCBudW1iZXIgKG51bWJlciBvZiBvcHBvc2l0ZSBwaXQgaW4gb3Bwb25lbnQncyByb3cpXG4gICAgY29uc3QgaW52ZXJzZSA9ICg1IC0gcGl0ICsgNykgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGhcbiAgICBjb25zdCBpc19jYXB0dXJhYmxlID0gdGhpcy5pc193aXRoaW5fcGxheWVyX2JvdW5kcyhwaXQsIHRoaXMudHVybl9wbGF5ZXJfMSk7XG4gICAgLy8gQ2hlY2sgZm9yIGNhcHR1cmVcbiAgICBpZiAoaXNfY2FwdHVyYWJsZSAmJiB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID09PSAxICYmIHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdID4gMCkge1xuXG4gICAgICAvLyBUcmFuc2ZlciB0aGlzIHBpdCdzIHN0b25lcyBhbG9uZyB3aXRoIG9wcG9zaXRlIHBpdCdzIHN0b25lcyB0byBzdG9yZVxuICAgICAgdGhpcy5jdXJyZW50X3BpdHNbY3VycmVudF9zdG9yZV9pZHhdICs9IHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdICsgMTtcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhjdXJyZW50X3N0b3JlX2lkeCk7XG5cbiAgICAgIC8vIENsZWFyIHRoZSBwaXRzXG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMDtcbiAgICAgIHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdID0gMDtcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhwaXQpO1xuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKGludmVyc2UpO1xuICAgIH1cblxuICAgIC8vIHRoZSB1c2VyJ3MgdHVybiBlbmRlZCBpZiB0aGUgc3RvbmVzIGRpZCBub3QgZW5kIGluIHRoZSBzdG9yYWdlIHBpdFxuICAgIHJldHVybiBwaXQgIT09IGN1cnJlbnRfc3RvcmVfaWR4O1xuICB9XG5cbiAgcHVibGljIGdldF9zdG9yZV9pbmRleChwbGF5ZXJfdHVybjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgaGFsZiA9ICh0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGggLyAyKSAtIDFcbiAgICByZXR1cm4gcGxheWVyX3R1cm4gPyBoYWxmIDogaGFsZiAqIDIgKyAxXG4gIH1cblxuICBwdWJsaWMgZ2V0X3N0b3JlKHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleChwbGF5ZXJfdHVybik7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9waXRzW2lkeF1cbiAgfVxuXG4gIHB1YmxpYyBnZXRfb2Zmc2V0KHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBoYWxmID0gKHRoaXMuY3VycmVudF9waXRzLmxlbmd0aCAvIDIpIC0gMVxuICAgIHJldHVybiBwbGF5ZXJfdHVybiA/IDAgOiBoYWxmICsgMVxuICB9XG5cbiAgcHVibGljIGdldF9zaWRlX2xlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMiAtIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGJvdW5kaW5nIGluZGljaWVzIGZvciBlYWNoIHBsYXllcidzIGJvYXJkXG4gICAqL1xuICBwdWJsaWMgZ2V0X2JvYXJkX2luZGV4KGJvYXJkOiBudW1iZXJbXSk6IG51bWJlcltdIHtcbiAgICAgIHJldHVybiBbMCwgdGhpcy5nZXRfc2lkZV9sZW5ndGgoKSxcbiAgICAgICAgICAgICB0aGlzLmdldF9zaWRlX2xlbmd0aCgpKzEsIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aC0xXVxuICB9XG5cbiAgcHVibGljIGlzX3dpdGhpbl9wbGF5ZXJfYm91bmRzKHBpdDogbnVtYmVyLCBwbGF5ZXJfMTogYm9vbGVhbik6IGJvb2xlYW57XG4gICAgY29uc3QgW3AxX2xvd2VyLCBwMV91cHBlciwgcDJfbG93ZXIsIHAyX3VwcGVyXSA9IHRoaXMuZ2V0X2JvYXJkX2luZGV4KHRoaXMuY3VycmVudF9waXRzKVxuXG4gICAgaWYocGxheWVyXzEpe1xuICAgICAgcmV0dXJuIChwaXQgPj0gcDFfbG93ZXIgJiYgcGl0IDwgcDFfdXBwZXIpXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gKHBpdCA+PSBwMl9sb3dlciAmJiBwaXQgPCBwMl91cHBlcilcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0X2JvYXJkX3NsaWNlKHBsYXllcl90dXJuOiBib29sZWFuLCBib2FyZDogbnVtYmVyW10pIDogbnVtYmVyW10ge1xuICAgIHJldHVybiBwbGF5ZXJfdHVyblxuICAgICAgPyBib2FyZC5zbGljZSgwLCB0aGlzLmdldF9zaWRlX2xlbmd0aCgpKVxuICAgICAgOiBib2FyZC5zbGljZSh0aGlzLmdldF9zaWRlX2xlbmd0aCgpKzEsIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aC0xKVxuICB9XG5cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBwbGF5ZXIgaGFzIHdvblxuICAgKiBAcmV0dXJuIHtOdW1iZXJ9IC0xIGZvciBubyB3aW4sIDAgZm9yIGRyYXcsIDEgZm9yIHBsYXllciBvbmUgd2luLCAyIGZvciBwbGF5ZXIgdHdvIHdpblxuICAgKi9cbiAgcHVibGljIGNoZWNrX3dpbm5lcigpIHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgcm93IG9uIHRoZSBib2FyZCBpcyBlbXB0eVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBpdHMgVGhlIHBpdHMgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGFsbCBvZiB0aGUgcGl0cyBjb250YWluIG5vIHN0b25lc1xuICAgICAqL1xuICAgIGNvbnN0IGlzX3Jvd19lbXB0eSA9IChwbGF5ZXI6IGJvb2xlYW4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmdldF9ib2FyZF9zbGljZShwbGF5ZXIsIHRoaXMuY3VycmVudF9waXRzKVxuICAgICAgICAgICAgICAgICAuZXZlcnkoKHN0b25lczogbnVtYmVyKSA9PiBzdG9uZXMgPT09IDApO1xuICAgIH07XG5cbiAgICBjb25zdCBwbGF5ZXJfMV9vdXQgPSBpc19yb3dfZW1wdHkoIHRoaXMudHVybl9wbGF5ZXJfMSk7XG4gICAgY29uc3QgcGxheWVyXzJfb3V0ICAgPSBpc19yb3dfZW1wdHkoIXRoaXMudHVybl9wbGF5ZXJfMSk7XG5cbiAgICAvLyB0aGUgZ2FtZSBpcyBub3Qgb3ZlciBpZiBuZWl0aGVyIHBsYXllciBoYXMgYW4gZW1wdHkgcm93XG4gICAgaWYgKCFwbGF5ZXJfMV9vdXQgJiYgIXBsYXllcl8yX291dCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIC8vIE1vdmUgdGhlIHN0b25lcyByZW1haW5pbmcgaW4gYSBwbGF5ZXIncyByb3cgaW50byB0aGVpciBzdG9yZVxuICAgIGxldCBwaXQ7XG4gICAgY29uc3QgW3AxX2xvd2VyLCBwMV91cHBlciwgcDJfbG93ZXIsIHAyX3VwcGVyXSA9IHRoaXMuZ2V0X2JvYXJkX2luZGV4KHRoaXMuY3VycmVudF9waXRzKVxuXG4gICAgaWYgKHBsYXllcl8xX291dCAmJiAhcGxheWVyXzJfb3V0KSB7XG4gICAgICBmb3IgKHBpdCA9IHAxX2xvd2VyOyBwaXQgPD0gcDFfdXBwZXI7IHBpdCsrKSB7XG4gICAgICAgIGNvbnN0IGludmVyc2UgPSBwaXQgKyA3ICUgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoXG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3AxX3VwcGVyKzFdICs9IHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdO1xuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMDtcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAocGxheWVyXzJfb3V0ICYmICFwbGF5ZXJfMV9vdXQpIHtcbiAgICAgIGZvciAocGl0ID0gcDJfbG93ZXI7IHBpdCA8PSBwMl91cHBlcjsgcGl0KyspIHtcbiAgICAgICAgY29uc3QgaW52ZXJzZSA9IHBpdCArIDcgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGhcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcDJfdXBwZXIrMV0gKz0gdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV07XG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZ2FtZS5kcmF3X2FsbF9zdG9uZXMoKTtcbiAgICBjb25zdCBwMV9zdG9yZSA9IHRoaXMuZ2V0X3N0b3JlKHRydWUpXG4gICAgY29uc3QgcDJfc3RvcmUgPSB0aGlzLmdldF9zdG9yZShmYWxzZSlcbiAgICBpZiAocDFfc3RvcmUgPiBwMl9zdG9yZSkge1xuICAgICAgLy8gY3VycmVudCBwbGF5ZXIgd2luc1xuICAgICAgcmV0dXJuIHRoaXMudHVybl9wbGF5ZXJfMSA/IDEgOiAyXG5cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDBcbiAgICB9XG4gIH07XG59XG4iLCJcbmltcG9ydCB7IEJvYXJkIH0gZnJvbSAnLi9Cb2FyZCc7XG5cbmNvbnN0IGZvcm1hdCA9IChzdG9uZXM6IG51bWJlcikgPT4ge1xuICByZXR1cm4gc3RvbmVzID09PSAwID8gbnVsbCA6IHN0b25lcyArICcnXG59XG5cbmV4cG9ydCBjbGFzcyBHYW1lIHtcbiAgYm9hcmQ6IEJvYXJkXG4gIGN1cnJlbnRfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci1vbmUgcCcpXG4gIGN1cnJlbnRfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci1vbmUgLnBpdCBwJylcblxuICBvdGhlcl9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLXR3byBwJylcbiAgb3RoZXJfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCBwJylcblxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuYm9hcmQgPSBuZXcgQm9hcmQodGhpcylcbiAgfVxuXG4gIGdldCBwbGF5ZXJfdGV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMSA/ICdvbmUnIDogJ3R3byc7XG4gIH0gXG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggdGhlIHF1ZXJ5IHNlbGVjdG9ycyBhbmQgdXBkYXRlIHBpdCBzdG9uZXNcbiAgICovXG4gIHB1YmxpYyBpbml0KCl7XG4gICAgdGhpcy5yZWZyZXNoX3F1ZXJpZXMoKVxuICAgIHRoaXMuZHJhd19hbGxfc3RvbmVzKClcbiAgfVxuICAvKipcblx0ICAqIFJldHJpZXZlIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbm90IGN1cnJlbnRseSBoYXZpbmcgYSB0dXJuXG5cdCAgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAgKi9cblx0cHVibGljIGdldF9vdGhlcl9wbGF5ZXIoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzFcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW4gdGhlIHF1ZXJ5IHNlbGVjdG9ycyBmb3IgdGhlIHBpdHNcblx0ICovXG5cdHB1YmxpYyByZWZyZXNoX3F1ZXJpZXMoKSB7XG5cdFx0dGhpcy5jdXJyZW50X3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQgcCcpXG4gICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItb25lIHAnKVxuICAgIFxuXHRcdHRoaXMub3RoZXJfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCBwJylcblx0XHR0aGlzLm90aGVyX3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItdHdvIHAnKVxuXHR9XG5cblx0LyoqXG5cdCAqIFBlcmZvcm0gdGhlIG1vdmUgZm9yIGEgcGxheWVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgLSBUaGUgcGl0IG51bWJlciBjaG9zZW5cblx0ICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgdGhlIGdhbWUgaXMgbm93IG92ZXJcblx0ICovXG5cdHB1YmxpYyBkb19wbGF5ZXJfdHVybihwaXQ6IG51bWJlcikge1xuICAgIGRlYnVnZ2VyO1xuXHRcdC8vIHBlcmZvcm0gdGhlIHBsYXllcidzIGFjdGlvblxuXHRcdGNvbnN0IHR1cm5fb3ZlciA9IHRoaXMuYm9hcmQubW92ZV9zdG9uZXMocGl0KVxuXG5cdFx0Ly8gbWFrZSBzdXJlIHRoYXQgYSBwbGF5ZXIgaGFzbid0IHJ1biBvdXQgb2Ygc3RvbmVzXG5cdFx0aWYgKHRoaXMuY2hlY2tfZ2FtZV9vdmVyKCkpIHtcblx0XHRcdC8vIHRoaXMucmVzZXRfZ2FtZSgpXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblxuXHRcdC8vIGNoYW5nZSB0aGUgcGxheWVyIGlmIHRoZSBjdXJyZW50IHR1cm4gaXMgZW5kZWRcblx0XHRpZiAodHVybl9vdmVyKSB7XG5cdFx0XHR0aGlzLnN3aXRjaF90dXJuKClcblx0XHR9XG5cblx0XHQvLyB0aGlzLnNhdmVfZ2FtZSgpXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHQvKipcblx0ICogQ2hhbmdlIHRoZSB1c2VyIGN1cnJlbnRseSBoYXZpbmcgYSB0dXJuXG5cdCAqL1xuXHRwdWJsaWMgc3dpdGNoX3R1cm4oKSB7XG5cdFx0dGhpcy5ib2FyZC50dXJuX3BsYXllcl8xID0gdGhpcy5nZXRfb3RoZXJfcGxheWVyKClcblx0Ly9cdHRoaXMuYm9hcmQuZmxpcF9ib2FyZCgpXG5cdFx0Ly90aGlzLnJlZnJlc2hfcXVlcmllcygpXG4gICAgdGhpcy5kcmF3X2FsbF9zdG9uZXMoKVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5ib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS1wbGF5ZXInLCB0aGlzLnBsYXllcl90ZXh0KVxuICAgICAgY29uc3QgY3VycmVudF9wbGF5ZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY3VycmVudC1wbGF5ZXInKVxuXHRcdFx0aWYoY3VycmVudF9wbGF5ZXIpe1xuICAgICAgICBjdXJyZW50X3BsYXllci50ZXh0Q29udGVudCA9IHRoaXMucGxheWVyX3RleHRcbiAgICAgIH1cblx0XHR9LCA0MDAgKVxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrIGlmIHRoZSBnYW1lIHNob3VsZCBlbmRcblx0ICogQHJldHVybnMge0Jvb2xlYW59IFdoZXRoZXIgdGhlIGdhbWUgaXMgb3ZlclxuXHQgKi9cblx0cHVibGljIGNoZWNrX2dhbWVfb3ZlcigpIHtcblx0XHRjb25zdCB3aW5uZXIgPSB0aGlzLmJvYXJkLmNoZWNrX3dpbm5lcigpXG5cblx0XHRpZiAod2lubmVyIDwgMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdnYW1lLW92ZXInKVxuXHRcdGNvbnN0IHN0YXR1cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMnKVxuXG4gICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHBsYXllciBob2xkcyB0aGUgbW9zdCBzdG9uZXNcbiAgICBpZiAoc3RhdHVzKXtcbiAgICAgIGlmICgxID09PSB3aW5uZXIpIHtcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ1BsYXllciBvbmUgd2lucyEnXG4gICAgICB9IGVsc2UgaWYgKDIgPT09IHdpbm5lcikge1xuICAgICAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnUGxheWVyIHR3byB3aW5zISdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdEcmF3ISdcbiAgICAgIH1cbiAgICB9XG5cblx0XHR0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPSB0cnVlXG5cdFx0cmV0dXJuIHRydWVcbiAgfVxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdG9uZXMgb24gdGhlIHBhZ2VcbiAgICovXG4gIHB1YmxpYyBkcmF3X2FsbF9zdG9uZXMoKSB7XG4gICAgbGV0IGN1cnJlbnRfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZSh0cnVlKVxuICAgIGxldCBvdGhlcl9zdG9yZSA9IHRoaXMuYm9hcmQuZ2V0X3N0b3JlKGZhbHNlKVxuXG4gICAgbGV0IGN1cnJlbnRfb2Zmc2V0ID0gdGhpcy5ib2FyZC5nZXRfb2Zmc2V0KHRydWUpXG4gICAgbGV0IG90aGVyX29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldChmYWxzZSlcblxuICAgIGlmKHRoaXMuY3VycmVudF9wbGF5ZXJfc3RvcmUpXG4gICAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KGN1cnJlbnRfc3RvcmUpXG5cbiAgICBpZih0aGlzLm90aGVyX3BsYXllcl9zdG9yZSlcbiAgICAgIHRoaXMub3RoZXJfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KG90aGVyX3N0b3JlKVxuXG4gICAgZm9yIChsZXQgcGl0ID0gMDsgcGl0IDwgNjsgcGl0KyspIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9waXRzW3BpdF0udGV4dENvbnRlbnQgPSBmb3JtYXQodGhpcy5ib2FyZC5jdXJyZW50X3BpdHNbY3VycmVudF9vZmZzZXQrcGl0XSlcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW290aGVyX29mZnNldCtwaXRdKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkcmF3X3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIGxldCBjdXJyZW50X3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICBsZXQgb3RoZXJfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZShmYWxzZSlcblxuICAgIGxldCBjdXJyZW50X29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldCh0cnVlKVxuICAgIGxldCBvdGhlcl9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQoZmFsc2UpXG5cbiAgICBpZiAocGl0ID09PSA2KSB7XG4gICAgICBpZih0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlKVxuICAgICAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KGN1cnJlbnRfc3RvcmUpXG4gICAgfSBlbHNlIGlmKHBpdCA9PT0gMTMpIHtcbiAgICAgIGlmKHRoaXMub3RoZXJfcGxheWVyX3N0b3JlKVxuICAgICAgICB0aGlzLm90aGVyX3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChvdGhlcl9zdG9yZSlcbiAgICB9IGVsc2UgaWYgKHBpdCA8IDYpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9waXRzW3BpdF0udGV4dENvbnRlbnQgPSBmb3JtYXQodGhpcy5ib2FyZC5jdXJyZW50X3BpdHNbY3VycmVudF9vZmZzZXQrcGl0XSlcbiAgICB9IGVsc2UgaWYgKHBpdCA+IDYpIHtcbiAgICAgICAgcGl0IC09IDdcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW290aGVyX29mZnNldCtwaXRdKVxuICAgIH1cbn1cbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi9HYW1lXCI7XG5cblxuY29uc3QgZ2FtZSA9IG5ldyBHYW1lKCk7XG4vLyBnYW1lLmxvYWRfZ2FtZSgpO1xuZ2FtZS5pbml0KCk7XG5sZXQgd2FpdGluZ19mb3JfbW92ZSA9IHRydWU7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBwaXQgZWxlbWVudHMgYXNcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIHBsYXllciBUaGUgcGxheWVyIHdobyB0aGUgcm93IGJlbG9uZ3MgdG9cbiAqIEBwYXJhbSB7Tm9kZUxpc3R9IHJvdyAgICBUaGUgcGl0IGVsZW1lbnRzIHRvIGluaXRpYWxpemVcbiAqL1xuY29uc3QgaW5pdF9waXRzID0gKHBsYXllcjogc3RyaW5nLCByb3c6IE5vZGVMaXN0KSA9PiB7XG4gIGNvbnN0IG9uY2xpY2sgPSAoZTogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCk7XG4gICAgY29uc3QgcGxheWVyX2lkID0gcGxheWVyID09PSAnb25lJ1xuICAgIGlmIChnYW1lLmJvYXJkLnR1cm5fcGxheWVyXzEgPT09IHBsYXllcl9pZCAmJiB3YWl0aW5nX2Zvcl9tb3ZlKSB7XG4gICAgICB3YWl0aW5nX2Zvcl9tb3ZlID0gZmFsc2U7XG4gICAgICBjb25zdCBwaXQgPSBwYXJzZUludCh0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXBpdCcpPz8gJzAnLCAxMCk7XG4gICAgICBpZiAoIWdhbWUuZG9fcGxheWVyX3R1cm4ocGl0KSkge1xuICAgICAgICB3YWl0aW5nX2Zvcl9tb3ZlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZm9yIChsZXQgcGl0ID0gMDsgcGl0IDwgcm93Lmxlbmd0aDsgcGl0KyspIHtcbiAgICAocm93W3BpdF0gYXMgSFRNTEVsZW1lbnQpLnNldEF0dHJpYnV0ZSgnZGF0YS1waXQnLCBwaXQudG9TdHJpbmcoKSlcbiAgICByb3dbcGl0XS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uY2xpY2spXG4gIH1cbn07XG5cbmluaXRfcGl0cygnb25lJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQnKSk7XG5pbml0X3BpdHMoJ3R3bycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLXR3byAucGl0JykpO1xuXG5jb25zdCBuZXdHYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5ldy1nYW1lJyk7XG5pZihuZXdHYW1lKVxuICBuZXdHYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIC8vIGdhbWUucmVzZXRfZ2FtZSgpO1xuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgfSlcbiJdfQ==
