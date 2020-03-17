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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2hvbWUvYWhtYWQvLmFzZGYvaW5zdGFsbHMvbm9kZWpzLzEwLjEzLjAvLm5wbS9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zcmMvc3JjL0JvYXJkLnRzIiwic3JjL3NyYy9zcmMvR2FtZS50cyIsInNyYy9zcmMvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNJQTtJQVNFLGVBQVksSUFBVTtRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzlELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFPTSwwQkFBVSxHQUFqQixVQUFrQixHQUFXO1FBQzNCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBT00sMEJBQVUsR0FBakIsVUFBa0IsR0FBVyxFQUFFLE1BQWM7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUE7SUFDakMsQ0FBQztJQU9NLDBCQUFVLEdBQWpCLFVBQWtCLEdBQVcsRUFBRSxNQUFjO1FBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDO0lBQ25DLENBQUM7SUFPTSwyQkFBVyxHQUFsQixVQUFtQixHQUFXO1FBQzVCLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxH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QUFDO0FBRUYsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztBQUVwRSxJQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3BELElBQUcsT0FBTztJQUNSLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7UUFFaEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMzQixDQUFDLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7R2FtZX0gZnJvbSAnLi9HYW1lJztcbi8qKlxuICogTWFuYWdlcyB0aGUgbWFuY2FsYSBib2FyZFxuICovXG5leHBvcnQgY2xhc3MgQm9hcmQge1xuICBnYW1lOiBHYW1lXG4gIGN1cnJlbnRfcGl0czogbnVtYmVyW11cbiAgdHVybl9wbGF5ZXJfMTogYm9vbGVhbjtcblxuXHQvKipcblx0ICogSW5pdGlhbGlzZSBjbGFzc1xuXHQgKiBAcGFyYW0ge0dhbWV9IGdhbWVcblx0ICovXG4gIGNvbnN0cnVjdG9yKGdhbWU6IEdhbWUpIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lXG4gICAgdGhpcy5jdXJyZW50X3BpdHMgPSBbNCwgNCwgNCwgNCwgNCwgNCwgMCwgNCwgNCwgNCwgNCwgNCwgNCwgMF1cbiAgICB0aGlzLnR1cm5fcGxheWVyXzEgPSB0cnVlO1xuICB9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlIHRoZSBhbW91bnQgb2Ygc3RvbmVzIGluIGEgcGl0XG5cdCAqIEBwYXJhbSAge051bWJlcn0gcGl0IFRoZSBwaXQgbnVtYmVyXG5cdCAqIEByZXR1cm4ge051bWJlcn0gICAgIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgZ2V0X3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcGl0c1twaXRdO1xuICB9XG5cblx0LyoqXG5cdCAqIFNldCB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0ge051bWJlcn0gcGl0ICAgIFRoZSBwaXQgbnVtYmVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBzdG9uZXMgVGhlIGFtb3VudCBvZiBzdG9uZXNcblx0ICovXG4gIHB1YmxpYyBzZXRfc3RvbmVzKHBpdDogbnVtYmVyLCBzdG9uZXM6IG51bWJlcikge1xuICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSBzdG9uZXNcbiAgfVxuXG5cdC8qKlxuXHQgKiBBZGp1c3QgdGhlIGFtb3VudCBvZiBzdG9uZXMgaW4gYSBwaXRcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHBpdCAgICBUaGUgcGl0IG51bWJlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gc3RvbmVzIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgYWRkX3N0b25lcyhwaXQ6IG51bWJlciwgc3RvbmVzOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdICs9IHN0b25lcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXN0cmlidXRlIHRoZSBzdG9uZXMgZnJvbSBhIHBpdCBhcm91bmQgdGhlIGJvYXJkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgVGhlIHBpdCB0byBiZWdpbiBpblxuICAgKiBAcmV0dXJuIHtCb29sZWFufSBXaGV0aGVyIHRoZSB1c2VyJ3MgdHVybiBoYXMgZW5kZWRcbiAgICovXG4gIHB1YmxpYyBtb3ZlX3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIHBpdCA9IHRoaXMudHVybl9wbGF5ZXJfMSA/IHBpdCA6IHBpdCArIDdcbiAgICBjb25zdCBjdXJyZW50X3N0b3JlX2lkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KHRoaXMudHVybl9wbGF5ZXJfMSlcbiAgICBjb25zdCBvdGhlcl9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleCghdGhpcy50dXJuX3BsYXllcl8xKVxuICAgIC8vIHJldHVybiBpZiBwaXQgaGFzIG5vIHN0b25lc1xuICAgIGlmICh0aGlzLmdldF9zdG9uZXMocGl0KSA8IDEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyB0YWtlIHN0b25lcyBvdXQgb2YgcGl0XG4gICAgbGV0IHN0b25lcyA9IHRoaXMuZ2V0X3N0b25lcyhwaXQpO1xuICAgIHRoaXMuc2V0X3N0b25lcyhwaXQsIDApO1xuICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhwaXQpO1xuXG4gICAgd2hpbGUgKHN0b25lcyA+IDApIHtcbiAgICAgIHBpdCA9IChwaXQgKyAxKSAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aDtcblxuICAgICAgXG4gICAgICAvLyB3cmFwIGFyb3VuZCB0aGUgYm9hcmQgYmVmb3JlIHJlYWNoaW5nIG90aGVyIHBsYXllcidzIHN0b3JlXG4gICAgICBpZiAocGl0ID09IG90aGVyX3N0b3JlX2lkeCkge1xuICAgICAgICBwaXQgPSAob3RoZXJfc3RvcmVfaWR4ICsgMSkgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkX3N0b25lcyhwaXQsIDEpO1xuICAgICAgc3RvbmVzLS07XG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KTtcbiAgICB9XG5cbiAgICAvLyBJbnZlcnQgdGhlIHBpdCBudW1iZXIgKG51bWJlciBvZiBvcHBvc2l0ZSBwaXQgaW4gb3Bwb25lbnQncyByb3cpXG4gICAgY29uc3QgaW52ZXJzZSA9ICg1IC0gcGl0ICsgNykgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGhcbiAgICBjb25zdCBpc19jYXB0dXJhYmxlID0gdGhpcy5pc193aXRoaW5fcGxheWVyX2JvdW5kcyhwaXQsIHRoaXMudHVybl9wbGF5ZXJfMSk7XG4gICAgLy8gQ2hlY2sgZm9yIGNhcHR1cmVcbiAgICBpZiAoaXNfY2FwdHVyYWJsZSAmJiB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID09PSAxICYmIHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdID4gMCkge1xuXG4gICAgICAvLyBUcmFuc2ZlciB0aGlzIHBpdCdzIHN0b25lcyBhbG9uZyB3aXRoIG9wcG9zaXRlIHBpdCdzIHN0b25lcyB0byBzdG9yZVxuICAgICAgdGhpcy5jdXJyZW50X3BpdHNbY3VycmVudF9zdG9yZV9pZHhdICs9IHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdICsgMTtcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhjdXJyZW50X3N0b3JlX2lkeCk7XG5cbiAgICAgIC8vIENsZWFyIHRoZSBwaXRzXG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMDtcbiAgICAgIHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdID0gMDtcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhwaXQpO1xuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKGludmVyc2UpO1xuICAgIH1cblxuICAgIC8vIHRoZSB1c2VyJ3MgdHVybiBlbmRlZCBpZiB0aGUgc3RvbmVzIGRpZCBub3QgZW5kIGluIHRoZSBzdG9yYWdlIHBpdFxuICAgIHJldHVybiBwaXQgIT09IGN1cnJlbnRfc3RvcmVfaWR4O1xuICB9XG5cbiAgcHVibGljIGdldF9zdG9yZV9pbmRleChwbGF5ZXJfdHVybjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgaGFsZiA9ICh0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGggLyAyKSAtIDFcbiAgICByZXR1cm4gcGxheWVyX3R1cm4gPyBoYWxmIDogaGFsZiAqIDIgKyAxXG4gIH1cblxuICBwdWJsaWMgZ2V0X3N0b3JlKHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleChwbGF5ZXJfdHVybik7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9waXRzW2lkeF1cbiAgfVxuXG4gIHB1YmxpYyBnZXRfb2Zmc2V0KHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBoYWxmID0gKHRoaXMuY3VycmVudF9waXRzLmxlbmd0aCAvIDIpIC0gMVxuICAgIHJldHVybiBwbGF5ZXJfdHVybiA/IDAgOiBoYWxmICsgMVxuICB9XG5cbiAgcHVibGljIGdldF9zaWRlX2xlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMiAtIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGJvdW5kaW5nIGluZGljaWVzIGZvciBlYWNoIHBsYXllcidzIGJvYXJkXG4gICAqL1xuICBwdWJsaWMgZ2V0X2JvYXJkX2luZGV4KGJvYXJkOiBudW1iZXJbXSk6IG51bWJlcltdIHtcbiAgICAgIHJldHVybiBbMCwgdGhpcy5nZXRfc2lkZV9sZW5ndGgoKSxcbiAgICAgICAgICAgICB0aGlzLmdldF9zaWRlX2xlbmd0aCgpKzEsIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aC0xXVxuICB9XG5cbiAgcHVibGljIGlzX3dpdGhpbl9wbGF5ZXJfYm91bmRzKHBpdDogbnVtYmVyLCBwbGF5ZXJfMTogYm9vbGVhbik6IGJvb2xlYW57XG4gICAgY29uc3QgW3AxX2xvd2VyLCBwMV91cHBlciwgcDJfbG93ZXIsIHAyX3VwcGVyXSA9IHRoaXMuZ2V0X2JvYXJkX2luZGV4KHRoaXMuY3VycmVudF9waXRzKVxuXG4gICAgaWYocGxheWVyXzEpe1xuICAgICAgcmV0dXJuIChwaXQgPj0gcDFfbG93ZXIgJiYgcGl0IDwgcDFfdXBwZXIpXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gKHBpdCA+PSBwMl9sb3dlciAmJiBwaXQgPCBwMl91cHBlcilcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0X2JvYXJkX3NsaWNlKHBsYXllcl90dXJuOiBib29sZWFuLCBib2FyZDogbnVtYmVyW10pIDogbnVtYmVyW10ge1xuICAgIHJldHVybiBwbGF5ZXJfdHVyblxuICAgICAgPyBib2FyZC5zbGljZSgwLCB0aGlzLmdldF9zaWRlX2xlbmd0aCgpKVxuICAgICAgOiBib2FyZC5zbGljZSh0aGlzLmdldF9zaWRlX2xlbmd0aCgpKzEsIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aC0xKVxuICB9XG5cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBwbGF5ZXIgaGFzIHdvblxuICAgKiBAcmV0dXJuIHtOdW1iZXJ9IC0xIGZvciBubyB3aW4sIDAgZm9yIGRyYXcsIDEgZm9yIHBsYXllciBvbmUgd2luLCAyIGZvciBwbGF5ZXIgdHdvIHdpblxuICAgKi9cbiAgcHVibGljIGNoZWNrX3dpbm5lcigpIHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgcm93IG9uIHRoZSBib2FyZCBpcyBlbXB0eVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBpdHMgVGhlIHBpdHMgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGFsbCBvZiB0aGUgcGl0cyBjb250YWluIG5vIHN0b25lc1xuICAgICAqL1xuICAgIGNvbnN0IGlzX3Jvd19lbXB0eSA9IChwbGF5ZXI6IGJvb2xlYW4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmdldF9ib2FyZF9zbGljZShwbGF5ZXIsIHRoaXMuY3VycmVudF9waXRzKVxuICAgICAgICAgICAgICAgICAuZXZlcnkoKHN0b25lczogbnVtYmVyKSA9PiBzdG9uZXMgPT09IDApO1xuICAgIH07XG5cbiAgICBjb25zdCBwbGF5ZXJfMV9vdXQgPSBpc19yb3dfZW1wdHkoIHRoaXMudHVybl9wbGF5ZXJfMSk7XG4gICAgY29uc3QgcGxheWVyXzJfb3V0ID0gaXNfcm93X2VtcHR5KCF0aGlzLnR1cm5fcGxheWVyXzEpO1xuXG4gICAgLy8gdGhlIGdhbWUgaXMgbm90IG92ZXIgaWYgbmVpdGhlciBwbGF5ZXIgaGFzIGFuIGVtcHR5IHJvd1xuICAgIGlmICghcGxheWVyXzFfb3V0ICYmICFwbGF5ZXJfMl9vdXQpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICAvLyBNb3ZlIHRoZSBzdG9uZXMgcmVtYWluaW5nIGluIGEgcGxheWVyJ3Mgcm93IGludG8gdGhlaXIgc3RvcmVcbiAgICBsZXQgcGl0O1xuICAgIGNvbnN0IFtwMV9sb3dlciwgcDFfdXBwZXIsIHAyX2xvd2VyLCBwMl91cHBlcl0gPSB0aGlzLmdldF9ib2FyZF9pbmRleCh0aGlzLmN1cnJlbnRfcGl0cylcblxuICAgIGlmIChwbGF5ZXJfMV9vdXQgJiYgIXBsYXllcl8yX291dCkge1xuICAgICAgZm9yIChwaXQgPSBwMV9sb3dlcjsgcGl0IDw9IHAxX3VwcGVyOyBwaXQrKykge1xuICAgICAgICBjb25zdCBpbnZlcnNlID0gcGl0ICsgNyAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aFxuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twMV91cHBlcisxXSArPSB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXTtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9IDA7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHBsYXllcl8yX291dCAmJiAhcGxheWVyXzFfb3V0KSB7XG4gICAgICBmb3IgKHBpdCA9IHAyX2xvd2VyOyBwaXQgPD0gcDJfdXBwZXI7IHBpdCsrKSB7XG4gICAgICAgIGNvbnN0IGludmVyc2UgPSBwaXQgKyA3ICUgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoXG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3AyX3VwcGVyKzFdICs9IHRoaXMuY3VycmVudF9waXRzW2ludmVyc2VdO1xuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmdhbWUuZHJhd19hbGxfc3RvbmVzKCk7XG4gICAgY29uc3QgcDFfc3RvcmUgPSB0aGlzLmdldF9zdG9yZSh0cnVlKVxuICAgIGNvbnN0IHAyX3N0b3JlID0gdGhpcy5nZXRfc3RvcmUoZmFsc2UpXG4gICAgaWYgKHAxX3N0b3JlID4gcDJfc3RvcmUpIHtcbiAgICAgIC8vIGN1cnJlbnQgcGxheWVyIHdpbnNcbiAgICAgIHJldHVybiB0aGlzLnR1cm5fcGxheWVyXzEgPyAxIDogMlxuXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAwXG4gICAgfVxuICB9O1xufVxuIiwiXG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4vQm9hcmQnO1xuXG5jb25zdCBmb3JtYXQgPSAoc3RvbmVzOiBudW1iZXIpID0+IHtcbiAgcmV0dXJuIHN0b25lcyA9PT0gMCA/IG51bGwgOiBzdG9uZXMgKyAnJ1xufVxuXG5leHBvcnQgY2xhc3MgR2FtZSB7XG4gIGJvYXJkOiBCb2FyZFxuICBjdXJyZW50X3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItb25lIHAnKVxuICBjdXJyZW50X3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQgcCcpXG5cbiAgb3RoZXJfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci10d28gcCcpXG4gIG90aGVyX3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQgcCcpXG5cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmJvYXJkID0gbmV3IEJvYXJkKHRoaXMpXG4gIH1cblxuICBnZXQgcGxheWVyX3RleHQgKCkge1xuICAgIHJldHVybiB0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPyAnb25lJyA6ICd0d28nO1xuICB9IFxuXG4gIC8qKlxuICAgKiBSZWZyZXNoIHRoZSBxdWVyeSBzZWxlY3RvcnMgYW5kIHVwZGF0ZSBwaXQgc3RvbmVzXG4gICAqL1xuICBwdWJsaWMgaW5pdCgpe1xuICAgIHRoaXMucmVmcmVzaF9xdWVyaWVzKClcbiAgICB0aGlzLmRyYXdfYWxsX3N0b25lcygpXG4gIH1cbiAgLyoqXG5cdCAgKiBSZXRyaWV2ZSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyIG5vdCBjdXJyZW50bHkgaGF2aW5nIGEgdHVyblxuXHQgICogQHJldHVybiB7U3RyaW5nfVxuXHQgICovXG5cdHB1YmxpYyBnZXRfb3RoZXJfcGxheWVyKCkge1xuXHRcdHJldHVybiAhdGhpcy5ib2FyZC50dXJuX3BsYXllcl8xXG5cdH1cblxuXHQvKipcblx0ICogUnVuIHRoZSBxdWVyeSBzZWxlY3RvcnMgZm9yIHRoZSBwaXRzXG5cdCAqL1xuXHRwdWJsaWMgcmVmcmVzaF9xdWVyaWVzKCkge1xuXHRcdHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLW9uZSAucGl0IHAnKVxuICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLW9uZSBwJylcbiAgICBcblx0XHR0aGlzLm90aGVyX3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQgcCcpXG5cdFx0dGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLXR3byBwJylcblx0fVxuXG5cdC8qKlxuXHQgKiBQZXJmb3JtIHRoZSBtb3ZlIGZvciBhIHBsYXllclxuXHQgKiBAcGFyYW0ge051bWJlcn0gcGl0IC0gVGhlIHBpdCBudW1iZXIgY2hvc2VuXG5cdCAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIHRoZSBnYW1lIGlzIG5vdyBvdmVyXG5cdCAqL1xuXHRwdWJsaWMgZG9fcGxheWVyX3R1cm4ocGl0OiBudW1iZXIpIHtcbiAgICBkZWJ1Z2dlcjtcblx0XHQvLyBwZXJmb3JtIHRoZSBwbGF5ZXIncyBhY3Rpb25cblx0XHRjb25zdCB0dXJuX292ZXIgPSB0aGlzLmJvYXJkLm1vdmVfc3RvbmVzKHBpdClcblxuXHRcdC8vIG1ha2Ugc3VyZSB0aGF0IGEgcGxheWVyIGhhc24ndCBydW4gb3V0IG9mIHN0b25lc1xuXHRcdGlmICh0aGlzLmNoZWNrX2dhbWVfb3ZlcigpKSB7XG5cdFx0XHQvLyB0aGlzLnJlc2V0X2dhbWUoKVxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHQvLyBjaGFuZ2UgdGhlIHBsYXllciBpZiB0aGUgY3VycmVudCB0dXJuIGlzIGVuZGVkXG5cdFx0aWYgKHR1cm5fb3Zlcikge1xuXHRcdFx0dGhpcy5zd2l0Y2hfdHVybigpXG5cdFx0fVxuXG5cdFx0Ly8gdGhpcy5zYXZlX2dhbWUoKVxuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZSB0aGUgdXNlciBjdXJyZW50bHkgaGF2aW5nIGEgdHVyblxuXHQgKi9cblx0cHVibGljIHN3aXRjaF90dXJuKCkge1xuXHRcdHRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMSA9IHRoaXMuZ2V0X290aGVyX3BsYXllcigpXG5cdC8vXHR0aGlzLmJvYXJkLmZsaXBfYm9hcmQoKVxuXHRcdC8vdGhpcy5yZWZyZXNoX3F1ZXJpZXMoKVxuICAgIHRoaXMuZHJhd19hbGxfc3RvbmVzKClcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgdGhpcy5wbGF5ZXJfdGV4dClcbiAgICAgIGNvbnN0IGN1cnJlbnRfcGxheWVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmN1cnJlbnQtcGxheWVyJylcblx0XHRcdGlmKGN1cnJlbnRfcGxheWVyKXtcbiAgICAgICAgY3VycmVudF9wbGF5ZXIudGV4dENvbnRlbnQgPSB0aGlzLnBsYXllcl90ZXh0XG4gICAgICB9XG5cdFx0fSwgNDAwIClcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVjayBpZiB0aGUgZ2FtZSBzaG91bGQgZW5kXG5cdCAqIEByZXR1cm5zIHtCb29sZWFufSBXaGV0aGVyIHRoZSBnYW1lIGlzIG92ZXJcblx0ICovXG5cdHB1YmxpYyBjaGVja19nYW1lX292ZXIoKSB7XG5cdFx0Y29uc3Qgd2lubmVyID0gdGhpcy5ib2FyZC5jaGVja193aW5uZXIoKVxuXG5cdFx0aWYgKHdpbm5lciA8IDApIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblxuXHRcdGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnZ2FtZS1vdmVyJylcblx0XHRjb25zdCBzdGF0dXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhdHVzJylcblxuICAgIC8vIERldGVybWluZSB3aGljaCBwbGF5ZXIgaG9sZHMgdGhlIG1vc3Qgc3RvbmVzXG4gICAgaWYgKHN0YXR1cyl7XG4gICAgICBpZiAoMSA9PT0gd2lubmVyKSB7XG4gICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdQbGF5ZXIgb25lIHdpbnMhJ1xuICAgICAgfSBlbHNlIGlmICgyID09PSB3aW5uZXIpIHtcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ1BsYXllciB0d28gd2lucyEnXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnRHJhdyEnXG4gICAgICB9XG4gICAgfVxuXG5cdFx0dGhpcy5ib2FyZC50dXJuX3BsYXllcl8xID0gdHJ1ZVxuXHRcdHJldHVybiB0cnVlXG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgc3RvbmVzIG9uIHRoZSBwYWdlXG4gICAqL1xuICBwdWJsaWMgZHJhd19hbGxfc3RvbmVzKCkge1xuICAgIGxldCBjdXJyZW50X3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICBsZXQgb3RoZXJfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZShmYWxzZSlcblxuICAgIGxldCBjdXJyZW50X29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldCh0cnVlKVxuICAgIGxldCBvdGhlcl9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQoZmFsc2UpXG5cbiAgICBpZih0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlKVxuICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChjdXJyZW50X3N0b3JlKVxuXG4gICAgaWYodGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUpXG4gICAgICB0aGlzLm90aGVyX3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChvdGhlcl9zdG9yZSlcblxuICAgIGZvciAobGV0IHBpdCA9IDA7IHBpdCA8IDY7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW2N1cnJlbnRfb2Zmc2V0K3BpdF0pXG4gICAgICAgIHRoaXMub3RoZXJfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tvdGhlcl9vZmZzZXQrcGl0XSlcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZHJhd19zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICBsZXQgY3VycmVudF9zdG9yZSA9IHRoaXMuYm9hcmQuZ2V0X3N0b3JlKHRydWUpXG4gICAgbGV0IG90aGVyX3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUoZmFsc2UpXG5cbiAgICBsZXQgY3VycmVudF9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQodHJ1ZSlcbiAgICBsZXQgb3RoZXJfb2Zmc2V0ID0gdGhpcy5ib2FyZC5nZXRfb2Zmc2V0KGZhbHNlKVxuXG4gICAgaWYgKHBpdCA9PT0gNikge1xuICAgICAgaWYodGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSlcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChjdXJyZW50X3N0b3JlKVxuICAgIH0gZWxzZSBpZihwaXQgPT09IDEzKSB7XG4gICAgICBpZih0aGlzLm90aGVyX3BsYXllcl9zdG9yZSlcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUudGV4dENvbnRlbnQgPSBmb3JtYXQob3RoZXJfc3RvcmUpXG4gICAgfSBlbHNlIGlmIChwaXQgPCA2KSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW2N1cnJlbnRfb2Zmc2V0K3BpdF0pXG4gICAgfSBlbHNlIGlmIChwaXQgPiA2KSB7XG4gICAgICAgIHBpdCAtPSA3XG4gICAgICAgIHRoaXMub3RoZXJfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tvdGhlcl9vZmZzZXQrcGl0XSlcbiAgICB9XG59XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4vR2FtZVwiO1xuXG5cbmNvbnN0IGdhbWUgPSBuZXcgR2FtZSgpO1xuLy8gZ2FtZS5sb2FkX2dhbWUoKTtcbmdhbWUuaW5pdCgpO1xubGV0IHdhaXRpbmdfZm9yX21vdmUgPSB0cnVlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgcGl0IGVsZW1lbnRzIGFzXG4gKiBAcGFyYW0ge1N0cmluZ30gICBwbGF5ZXIgVGhlIHBsYXllciB3aG8gdGhlIHJvdyBiZWxvbmdzIHRvXG4gKiBAcGFyYW0ge05vZGVMaXN0fSByb3cgICAgVGhlIHBpdCBlbGVtZW50cyB0byBpbml0aWFsaXplXG4gKi9cbmNvbnN0IGluaXRfcGl0cyA9IChwbGF5ZXI6IHN0cmluZywgcm93OiBOb2RlTGlzdCkgPT4ge1xuICBjb25zdCBvbmNsaWNrID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gKGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpO1xuICAgIGNvbnN0IHBsYXllcl9pZCA9IHBsYXllciA9PT0gJ29uZSdcbiAgICBpZiAoZ2FtZS5ib2FyZC50dXJuX3BsYXllcl8xID09PSBwbGF5ZXJfaWQgJiYgd2FpdGluZ19mb3JfbW92ZSkge1xuICAgICAgd2FpdGluZ19mb3JfbW92ZSA9IGZhbHNlO1xuICAgICAgY29uc3QgcGl0ID0gcGFyc2VJbnQodGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1waXQnKT8/ICcwJywgMTApO1xuICAgICAgaWYgKCFnYW1lLmRvX3BsYXllcl90dXJuKHBpdCkpIHtcbiAgICAgICAgd2FpdGluZ19mb3JfbW92ZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZvciAobGV0IHBpdCA9IDA7IHBpdCA8IHJvdy5sZW5ndGg7IHBpdCsrKSB7XG4gICAgKHJvd1twaXRdIGFzIEhUTUxFbGVtZW50KS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGl0JywgcGl0LnRvU3RyaW5nKCkpXG4gICAgcm93W3BpdF0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbmNsaWNrKVxuICB9XG59O1xuXG5pbml0X3BpdHMoJ29uZScsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLW9uZSAucGl0JykpO1xuaW5pdF9waXRzKCd0d28nLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCcpKTtcblxuY29uc3QgbmV3R2FtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uZXctZ2FtZScpO1xuaWYobmV3R2FtZSlcbiAgbmV3R2FtZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAvLyBnYW1lLnJlc2V0X2dhbWUoKTtcbiAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gIH0pXG4iXX0=
