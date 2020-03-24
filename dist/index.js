(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Game_1 = require("./Game");
var Agent = (function () {
    function Agent(board) {
        this.board = board;
        this.depth = 5;
    }
    Agent.prototype.clone_board = function (board) {
        var game_clone = new Game_1.Game(false);
        var board_clone = Object.assign({}, board);
        board_clone.game = game_clone;
        return board_clone;
    };
    Agent.prototype.move = function () {
        var _this = this;
        var cloned_board = this.clone_board(this.board);
        var options = this.valid_moves(cloned_board);
        var scores = options.map(function (option) { return _this.min_max(cloned_board, -Infinity, Infinity, option, _this.depth); });
        var max_score = Math.max.apply(Math, scores);
        var candidates = scores.map(function (score, i) { return [score, options[i]]; })
            .filter(function (x) { return x[0] == max_score; })
            .map(function (x) { return x[1]; });
        console.info("Candidates for next move: " + candidates);
        return candidates[Math.floor(Math.random() * candidates.length)];
    };
    Agent.prototype.evaluate = function (board) {
        return board.game.board.get_store(false);
    };
    Agent.prototype.valid_moves = function (board) {
        return board.current_pits
            .map(function (x, i) { return i >= 7 && i <= 12 && x > 0 ? i : -1; })
            .filter(function (x) { return x > 0; });
    };
    Agent.prototype.min_max = function (board, alpha, beta, move, depth) {
        var _this = this;
        var cloned_board = this.clone_board(board);
        cloned_board.game.do_player_turn(move);
        var is_maximiser = !board.turn_player_1;
        if (depth == 0)
            return this.evaluate(cloned_board);
        var options = this.valid_moves(cloned_board);
        var best_option = is_maximiser ? -Infinity : Infinity;
        options.forEach(function (option) {
            var new_value = _this.min_max(cloned_board, alpha, beta, option, depth - 1);
            if (is_maximiser) {
                best_option = Math.max(new_value, best_option);
                alpha = Math.max(alpha, best_option);
            }
            else {
                best_option = Math.min(new_value, best_option);
                beta = Math.min(beta, best_option);
            }
            if (beta <= alpha)
                return best_option;
        });
        return best_option;
    };
    return Agent;
}());
exports.Agent = Agent;
},{"./Game":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{"./Board":2}],4:[function(require,module,exports){
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var Game_1 = require("./Game");
var Agent_1 = require("./Agent");
var game = new Game_1.Game();
game.init();
var agent = new Agent_1.Agent(game.board);
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
(_a = document.getElementById("AI")) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (e) {
    if (!game.board.turn_player_1)
        console.log(agent.move());
});
},{"./Agent":1,"./Game":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zcmMvc3JjL0FnZW50LnRzIiwic3JjL3NyYy9zcmMvQm9hcmQudHMiLCJzcmMvc3JjL3NyYy9HYW1lLnRzIiwic3JjL3NyYy9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLCtCQUE0QjtBQUs1QjtJQUdJLGVBQW9CLEtBQVk7UUFBWixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBRmhDLFVBQUssR0FBRyxDQUFDLENBQUE7SUFFMkIsQ0FBQztJQUU3QiwyQkFBVyxHQUFuQixVQUFvQixLQUFZO1FBQzVCLElBQUksVUFBVSxHQUFHLElBQUksV0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2hDLElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFBO1FBQzdCLE9BQU8sV0FBVyxDQUFBO0lBQ3RCLENBQUM7SUFFTSxvQkFBSSxHQUFYO1FBQUEsaUJBY0M7UUFiRyxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRTVDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxNQUFNLElBQUksT0FBQSxLQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUksQ0FBQyxLQUFLLENBQUMsRUFBbkUsQ0FBbUUsQ0FBQyxDQUFBO1FBRXZHLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFH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QUUsR0FBRyxFQUFFLEVBQUU7UUFDeEMsR0FBRyxDQUFDLEdBQUcsQ0FBaUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDNUM7QUFDSCxDQUFDLENBQUM7QUFFRixTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7QUFDcEUsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO0FBRXBFLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDcEQsSUFBRyxPQUFPO0lBQ1IsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRTtRQUVoQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFBO0FBRUosTUFBQSxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQywwQ0FBRSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBUyxDQUFDO0lBQ2pFLElBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWE7UUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUM3QixDQUFDLEVBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQge0dhbWV9IGZyb20gJy4vR2FtZSc7XHJcbmltcG9ydCB7Qm9hcmR9IGZyb20gJy4vQm9hcmQnO1xyXG5cclxuLy8gTWluTWF4IGFnZW50XHJcbi8vIEFnZW50IGlzIGFsd2F5cyBwbGF5ZXIgMiBzbyBmYXIuXHJcbmV4cG9ydCBjbGFzcyBBZ2VudCB7XHJcbiAgICBkZXB0aCA9IDVcclxuICAgIFxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBib2FyZDogQm9hcmQpIHsgfVxyXG5cclxuICAgIHByaXZhdGUgY2xvbmVfYm9hcmQoYm9hcmQ6IEJvYXJkKXtcclxuICAgICAgICBsZXQgZ2FtZV9jbG9uZSA9IG5ldyBHYW1lKGZhbHNlKVxyXG4gICAgICAgIGxldCBib2FyZF9jbG9uZSA9IE9iamVjdC5hc3NpZ24oe30sIGJvYXJkKVxyXG4gICAgICAgIGJvYXJkX2Nsb25lLmdhbWUgPSBnYW1lX2Nsb25lXHJcbiAgICAgICAgcmV0dXJuIGJvYXJkX2Nsb25lXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1vdmUoKXtcclxuICAgICAgICBsZXQgY2xvbmVkX2JvYXJkID0gdGhpcy5jbG9uZV9ib2FyZCh0aGlzLmJvYXJkKVxyXG4gICAgICAgIGxldCBvcHRpb25zID0gdGhpcy52YWxpZF9tb3ZlcyhjbG9uZWRfYm9hcmQpXHJcblxyXG4gICAgICAgIGxldCBzY29yZXMgPSBvcHRpb25zLm1hcChvcHRpb24gPT4gdGhpcy5taW5fbWF4KGNsb25lZF9ib2FyZCwgLUluZmluaXR5LCBJbmZpbml0eSwgb3B0aW9uLCB0aGlzLmRlcHRoKSlcclxuXHJcbiAgICAgICAgbGV0IG1heF9zY29yZSA9IE1hdGgubWF4KC4uLnNjb3JlcylcclxuXHJcbiAgICAgICAgbGV0IGNhbmRpZGF0ZXM6IG51bWJlcltdID0gc2NvcmVzLm1hcCgoc2NvcmUsIGkpID0+IFtzY29yZSwgb3B0aW9uc1tpXV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4geFswXSA9PSBtYXhfc2NvcmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHggPT4geFsxXSlcclxuICAgICAgICBjb25zb2xlLmluZm8oXCJDYW5kaWRhdGVzIGZvciBuZXh0IG1vdmU6IFwiICsgY2FuZGlkYXRlcylcclxuXHJcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2FuZGlkYXRlcy5sZW5ndGgpXVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZXZhbHVhdGUoYm9hcmQ6IEJvYXJkKTogbnVtYmVye1xyXG4gICAgICAgIHJldHVybiBib2FyZC5nYW1lLmJvYXJkLmdldF9zdG9yZShmYWxzZSkgLy8gR2V0IHBsYXllciAyJ3Mgc3RvcmVcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHZhbGlkX21vdmVzKGJvYXJkOiBCb2FyZCk6IG51bWJlcltde1xyXG4gICAgICAgIC8vIGlmIGl0J3MgcGxheWVyIDIncyBwaXQsIGFuZCB0aGUgcGl0IGhhcyBtb3JlIHRoYW4gMCBzdG9uZXMuXHJcbiAgICAgICAgLy8gW2ZhbHNlLGZhbHNlLGZhbHNlLGZhbHNlLGZhbHNlLGZhbHNlLGZhbHNlLHRydWUsdHJ1ZSx0cnVlLHRydWUsdHJ1ZSx0cnVlLGZhbHNlXVxyXG4gICAgICAgIC8vIGluIGluaXRpYWwgc3RhdGVcclxuICAgICAgICByZXR1cm4gYm9hcmQuY3VycmVudF9waXRzXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoeCwgaSkgPT4gaSA+PSA3ICYmIGkgPD0gMTIgJiYgeCA+IDAgPyBpIDogLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggPiAwKVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbWluX21heChib2FyZDogQm9hcmQsIGFscGhhOiBudW1iZXIsIGJldGE6IG51bWJlciwgbW92ZTogbnVtYmVyLCBkZXB0aDogbnVtYmVyKTogbnVtYmVye1xyXG4gICAgICAgIGxldCBjbG9uZWRfYm9hcmQgPSB0aGlzLmNsb25lX2JvYXJkKGJvYXJkKVxyXG4gICAgICAgIGNsb25lZF9ib2FyZC5nYW1lLmRvX3BsYXllcl90dXJuKG1vdmUpXHJcblxyXG4gICAgICAgIGxldCBpc19tYXhpbWlzZXIgPSAhYm9hcmQudHVybl9wbGF5ZXJfMVxyXG4gICAgICAgIGlmKGRlcHRoID09IDApIHJldHVybiB0aGlzLmV2YWx1YXRlKGNsb25lZF9ib2FyZClcclxuXHJcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB0aGlzLnZhbGlkX21vdmVzKGNsb25lZF9ib2FyZClcclxuICAgICAgICB2YXIgYmVzdF9vcHRpb24gPSBpc19tYXhpbWlzZXIgPyAtSW5maW5pdHkgOiBJbmZpbml0eVxyXG5cclxuICAgICAgICBvcHRpb25zLmZvckVhY2gob3B0aW9uID0+IHtcclxuICAgICAgICAgICAgbGV0IG5ld192YWx1ZSA9IHRoaXMubWluX21heChjbG9uZWRfYm9hcmQsIGFscGhhLCBiZXRhLCBvcHRpb24sIGRlcHRoIC0gMSlcclxuXHJcbiAgICAgICAgICAgIGlmKGlzX21heGltaXNlcil7XHJcbiAgICAgICAgICAgICAgICBiZXN0X29wdGlvbiA9IE1hdGgubWF4KG5ld192YWx1ZSwgYmVzdF9vcHRpb24pXHJcbiAgICAgICAgICAgICAgICBhbHBoYSA9IE1hdGgubWF4KGFscGhhLCBiZXN0X29wdGlvbilcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBiZXN0X29wdGlvbiA9IE1hdGgubWluKG5ld192YWx1ZSwgYmVzdF9vcHRpb24pXHJcbiAgICAgICAgICAgICAgICBiZXRhID0gTWF0aC5taW4oYmV0YSwgYmVzdF9vcHRpb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoYmV0YSA8PSBhbHBoYSkgcmV0dXJuIGJlc3Rfb3B0aW9uXHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHJldHVybiBiZXN0X29wdGlvblxyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7R2FtZX0gZnJvbSAnLi9HYW1lJztcbi8qKlxuICogTWFuYWdlcyB0aGUgbWFuY2FsYSBib2FyZFxuICovXG5leHBvcnQgY2xhc3MgQm9hcmQge1xuICBnYW1lOiBHYW1lXG4gIGN1cnJlbnRfcGl0czogbnVtYmVyW11cbiAgdHVybl9wbGF5ZXJfMTogYm9vbGVhbjtcblxuXHQvKipcblx0ICogSW5pdGlhbGlzZSBjbGFzc1xuXHQgKiBAcGFyYW0ge0dhbWV9IGdhbWVcblx0ICovXG4gIGNvbnN0cnVjdG9yKGdhbWU6IEdhbWUpIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lXG4gICAgdGhpcy5jdXJyZW50X3BpdHMgPSBbNCwgNCwgNCwgNCwgNCwgNCwgMCwgNCwgNCwgNCwgNCwgNCwgNCwgMF1cbiAgICAvL3RoaXMuY3VycmVudF9waXRzID0gWzEsIDQsMSwwLCA0LCA0LCAyNSwgMCwgMCwgMCwgMCwgMCwgMSwgMjVdXG4gICAgdGhpcy50dXJuX3BsYXllcl8xID0gdHJ1ZTtcbiAgfVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZSB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHBpdCBUaGUgcGl0IG51bWJlclxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICBUaGUgYW1vdW50IG9mIHN0b25lc1xuXHQgKi9cbiAgcHVibGljIGdldF9zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHNbcGl0XTtcbiAgfVxuXG5cdC8qKlxuXHQgKiBTZXQgdGhlIGFtb3VudCBvZiBzdG9uZXMgaW4gYSBwaXRcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHBpdCAgICBUaGUgcGl0IG51bWJlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gc3RvbmVzIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgc2V0X3N0b25lcyhwaXQ6IG51bWJlciwgc3RvbmVzOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gc3RvbmVzXG4gIH1cblxuXHQvKipcblx0ICogQWRqdXN0IHRoZSBhbW91bnQgb2Ygc3RvbmVzIGluIGEgcGl0XG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgICAgVGhlIHBpdCBudW1iZXJcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHN0b25lcyBUaGUgYW1vdW50IG9mIHN0b25lc1xuXHQgKi9cbiAgcHVibGljIGFkZF9zdG9uZXMocGl0OiBudW1iZXIsIHN0b25lczogbnVtYmVyKSB7XG4gICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSArPSBzdG9uZXM7XG4gIH1cblxuICAvKipcbiAgICogRGlzdHJpYnV0ZSB0aGUgc3RvbmVzIGZyb20gYSBwaXQgYXJvdW5kIHRoZSBib2FyZFxuICAgKiBAcGFyYW0ge051bWJlcn0gcGl0IFRoZSBwaXQgdG8gYmVnaW4gaW5cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgdXNlcidzIHR1cm4gaGFzIGVuZGVkXG4gICAqL1xuICBwdWJsaWMgbW92ZV9zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICBwaXQgPSB0aGlzLnR1cm5fcGxheWVyXzEgPyBwaXQgOiBwaXQgKyA3XG4gICAgY29uc3QgY3VycmVudF9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleCh0aGlzLnR1cm5fcGxheWVyXzEpXG4gICAgY29uc3Qgb3RoZXJfc3RvcmVfaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgoIXRoaXMudHVybl9wbGF5ZXJfMSlcbiAgICAvLyByZXR1cm4gaWYgcGl0IGhhcyBubyBzdG9uZXNcbiAgICBpZiAodGhpcy5nZXRfc3RvbmVzKHBpdCkgPCAxKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gdGFrZSBzdG9uZXMgb3V0IG9mIHBpdFxuICAgIGxldCBzdG9uZXMgPSB0aGlzLmdldF9zdG9uZXMocGl0KTtcbiAgICB0aGlzLnNldF9zdG9uZXMocGl0LCAwKTtcbiAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KTtcblxuICAgIHdoaWxlIChzdG9uZXMgPiAwKSB7XG4gICAgICBwaXQgPSAocGl0ICsgMSkgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGg7XG5cbiAgICAgIC8vIHdyYXAgYXJvdW5kIHRoZSBib2FyZCBiZWZvcmUgcmVhY2hpbmcgb3RoZXIgcGxheWVyJ3Mgc3RvcmVcbiAgICAgIGlmIChwaXQgPT0gb3RoZXJfc3RvcmVfaWR4KSB7XG4gICAgICAgIHBpdCA9IChvdGhlcl9zdG9yZV9pZHggKyAxKSAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5hZGRfc3RvbmVzKHBpdCwgMSk7XG4gICAgICBzdG9uZXMtLTtcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhwaXQpO1xuICAgIH1cblxuICAgIC8vIEludmVydCB0aGUgcGl0IG51bWJlciAobnVtYmVyIG9mIG9wcG9zaXRlIHBpdCBpbiBvcHBvbmVudCdzIHJvdylcbiAgICBjb25zdCBpbnZlcnNlID0gKDUgLSBwaXQgKyA3KSAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aFxuICAgIGNvbnN0IGlzX2NhcHR1cmFibGUgPSB0aGlzLmlzX3dpdGhpbl9wbGF5ZXJfYm91bmRzKHBpdCwgdGhpcy50dXJuX3BsYXllcl8xKTtcbiAgICAvLyBDaGVjayBmb3IgY2FwdHVyZVxuICAgIGlmIChpc19jYXB0dXJhYmxlICYmIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPT09IDEgJiYgdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV0gPiAwKSB7XG5cbiAgICAgIC8vIFRyYW5zZmVyIHRoaXMgcGl0J3Mgc3RvbmVzIGFsb25nIHdpdGggb3Bwb3NpdGUgcGl0J3Mgc3RvbmVzIHRvIHN0b3JlXG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1tjdXJyZW50X3N0b3JlX2lkeF0gKz0gdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV0gKyAxO1xuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKGN1cnJlbnRfc3RvcmVfaWR4KTtcblxuICAgICAgLy8gQ2xlYXIgdGhlIHBpdHNcbiAgICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSAwO1xuICAgICAgdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV0gPSAwO1xuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKHBpdCk7XG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMoaW52ZXJzZSk7XG4gICAgfVxuXG4gICAgLy8gdGhlIHVzZXIncyB0dXJuIGVuZGVkIGlmIHRoZSBzdG9uZXMgZGlkIG5vdCBlbmQgaW4gdGhlIHN0b3JhZ2UgcGl0XG4gICAgcmV0dXJuIHBpdCAhPT0gY3VycmVudF9zdG9yZV9pZHg7XG4gIH1cblxuICBwdWJsaWMgZ2V0X3N0b3JlX2luZGV4KHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBoYWxmID0gKHRoaXMuY3VycmVudF9waXRzLmxlbmd0aCAvIDIpIC0gMVxuICAgIHJldHVybiBwbGF5ZXJfdHVybiA/IGhhbGYgOiBoYWxmICogMiArIDFcbiAgfVxuXG4gIHB1YmxpYyBnZXRfc3RvcmUocGxheWVyX3R1cm46IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KHBsYXllcl90dXJuKTtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHNbaWR4XVxuICB9XG5cbiAgcHVibGljIGdldF9vZmZzZXQocGxheWVyX3R1cm46IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGhhbGYgPSAodGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMikgLSAxXG4gICAgcmV0dXJuIHBsYXllcl90dXJuID8gMCA6IGhhbGYgKyAxXG4gIH1cblxuICBwdWJsaWMgZ2V0X3NpZGVfbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGggLyAyIC0gMVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYm91bmRpbmcgaW5kaWNpZXMgZm9yIGVhY2ggcGxheWVyJ3MgYm9hcmRcbiAgICovXG4gIHB1YmxpYyBnZXRfYm9hcmRfaW5kZXgoYm9hcmQ6IG51bWJlcltdKTogbnVtYmVyW10ge1xuICAgICAgcmV0dXJuIFswLCB0aGlzLmdldF9zaWRlX2xlbmd0aCgpLFxuICAgICAgICAgICAgIHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCkrMSwgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoLTFdXG4gIH1cblxuICBwdWJsaWMgaXNfd2l0aGluX3BsYXllcl9ib3VuZHMocGl0OiBudW1iZXIsIHBsYXllcl8xOiBib29sZWFuKTogYm9vbGVhbntcbiAgICBjb25zdCBbcDFfbG93ZXIsIHAxX3VwcGVyLCBwMl9sb3dlciwgcDJfdXBwZXJdID0gdGhpcy5nZXRfYm9hcmRfaW5kZXgodGhpcy5jdXJyZW50X3BpdHMpXG5cbiAgICBpZihwbGF5ZXJfMSl7XG4gICAgICByZXR1cm4gKHBpdCA+PSBwMV9sb3dlciAmJiBwaXQgPCBwMV91cHBlcilcbiAgICB9ZWxzZXtcbiAgICAgIHJldHVybiAocGl0ID49IHAyX2xvd2VyICYmIHBpdCA8IHAyX3VwcGVyKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXRfYm9hcmRfc2xpY2UocGxheWVyX3R1cm46IGJvb2xlYW4sIGJvYXJkOiBudW1iZXJbXSkgOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHBsYXllcl90dXJuXG4gICAgICA/IGJvYXJkLnNsaWNlKDAsIHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCkpXG4gICAgICA6IGJvYXJkLnNsaWNlKHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCkrMSwgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoLTEpXG4gIH1cblxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHBsYXllciBoYXMgd29uXG4gICAqIEByZXR1cm4ge051bWJlcn0gLTEgZm9yIG5vIHdpbiwgMCBmb3IgZHJhdywgMSBmb3IgcGxheWVyIG9uZSB3aW4sIDIgZm9yIHBsYXllciB0d28gd2luXG4gICAqL1xuICBwdWJsaWMgY2hlY2tfd2lubmVyKCkge1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgYSByb3cgb24gdGhlIGJvYXJkIGlzIGVtcHR5XG4gICAgICogQHBhcmFtIHtBcnJheX0gcGl0cyBUaGUgcGl0cyB0byBjaGVja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgYWxsIG9mIHRoZSBwaXRzIGNvbnRhaW4gbm8gc3RvbmVzXG4gICAgICovXG4gICAgY29uc3QgaXNfcm93X2VtcHR5ID0gKHBsYXllcjogYm9vbGVhbikgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0X2JvYXJkX3NsaWNlKHBsYXllciwgdGhpcy5jdXJyZW50X3BpdHMpXG4gICAgICAgICAgICAgICAgIC5ldmVyeSgoc3RvbmVzOiBudW1iZXIpID0+IHN0b25lcyA9PT0gMCk7XG4gICAgfTtcblxuICAgIGNvbnN0IHBsYXllcl8xX291dCA9IGlzX3Jvd19lbXB0eSh0cnVlKTtcbiAgICBjb25zdCBwbGF5ZXJfMl9vdXQgPSBpc19yb3dfZW1wdHkoZmFsc2UpO1xuICAgIGNvbnN0IHAxX3N0b3JlX2lkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KHRydWUpXG4gICAgY29uc3QgcDJfc3RvcmVfaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgoZmFsc2UpXG5cblxuICAgIC8vIHRoZSBnYW1lIGlzIG5vdCBvdmVyIGlmIG5laXRoZXIgcGxheWVyIGhhcyBhbiBlbXB0eSByb3dcbiAgICBpZiAoIXBsYXllcl8xX291dCAmJiAhcGxheWVyXzJfb3V0KSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLy8gTW92ZSB0aGUgc3RvbmVzIHJlbWFpbmluZyBpbiBhIHBsYXllcidzIHJvdyBpbnRvIHRoZWlyIHN0b3JlXG4gICAgbGV0IHBpdDtcbiAgICBjb25zdCBbcDFfbG93ZXIsIHAxX3VwcGVyLCBwMl9sb3dlciwgcDJfdXBwZXJdID0gdGhpcy5nZXRfYm9hcmRfaW5kZXgodGhpcy5jdXJyZW50X3BpdHMpXG5cbiAgICBpZiAocGxheWVyXzFfb3V0ICYmICFwbGF5ZXJfMl9vdXQpIHtcbiAgICAgIGZvciAocGl0ID0gcDJfbG93ZXI7IHBpdCA8IHAyX3VwcGVyOyBwaXQrKykge1xuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twMl9zdG9yZV9pZHhdICs9IHRoaXMuY3VycmVudF9waXRzW3BpdF07XG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSAwO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChwbGF5ZXJfMl9vdXQgJiYgIXBsYXllcl8xX291dCkge1xuICAgICAgZm9yIChwaXQgPSBwMV9sb3dlcjsgcGl0IDwgcDFfdXBwZXI7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3AxX3N0b3JlX2lkeF0gKz0gdGhpcy5jdXJyZW50X3BpdHNbcGl0XTtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5nYW1lLmRyYXdfYWxsX3N0b25lcygpO1xuICAgIGNvbnN0IHAxX3N0b3JlID0gdGhpcy5nZXRfc3RvcmUodHJ1ZSlcbiAgICBjb25zdCBwMl9zdG9yZSA9IHRoaXMuZ2V0X3N0b3JlKGZhbHNlKVxuICAgIFxuICAgIGlmIChwMV9zdG9yZSA9PSBwMl9zdG9yZSlcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgcmV0dXJuIHAxX3N0b3JlID4gcDJfc3RvcmUgPyAxIDogMjtcbiAgfTtcbn1cbiIsIlxuaW1wb3J0IHsgQm9hcmQgfSBmcm9tICcuL0JvYXJkJztcblxuY29uc3QgZm9ybWF0ID0gKHN0b25lczogbnVtYmVyKSA9PiB7XG4gIHJldHVybiBzdG9uZXMgPT09IDAgPyBudWxsIDogc3RvbmVzICsgJydcbn1cblxuZXhwb3J0IGNsYXNzIEdhbWUge1xuICBib2FyZDogQm9hcmRcbiAgY3VycmVudF9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLW9uZSBwJylcbiAgY3VycmVudF9wbGF5ZXJfcGl0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLW9uZSAucGl0IHAnKVxuXG4gIG90aGVyX3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItdHdvIHAnKVxuICBvdGhlcl9wbGF5ZXJfcGl0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLXR3byAucGl0IHAnKVxuXG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbmFibGVfcmVuZGVyOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHRoaXMuYm9hcmQgPSBuZXcgQm9hcmQodGhpcylcbiAgfVxuXG4gIGdldCBwbGF5ZXJfdGV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMSA/ICdvbmUnIDogJ3R3byc7XG4gIH0gXG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggdGhlIHF1ZXJ5IHNlbGVjdG9ycyBhbmQgdXBkYXRlIHBpdCBzdG9uZXNcbiAgICovXG4gIHB1YmxpYyBpbml0KCl7XG4gICAgaWYoIXRoaXMuZW5hYmxlX3JlbmRlcikgcmV0dXJuO1xuICAgIHRoaXMucmVmcmVzaF9xdWVyaWVzKClcbiAgICB0aGlzLmRyYXdfYWxsX3N0b25lcygpXG4gIH1cbiAgLyoqXG5cdCAgKiBSZXRyaWV2ZSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyIG5vdCBjdXJyZW50bHkgaGF2aW5nIGEgdHVyblxuXHQgICogQHJldHVybiB7U3RyaW5nfVxuXHQgICovXG5cdHB1YmxpYyBnZXRfb3RoZXJfcGxheWVyKCkge1xuXHRcdHJldHVybiAhdGhpcy5ib2FyZC50dXJuX3BsYXllcl8xXG5cdH1cblxuXHQvKipcblx0ICogUnVuIHRoZSBxdWVyeSBzZWxlY3RvcnMgZm9yIHRoZSBwaXRzXG5cdCAqL1xuXHRwdWJsaWMgcmVmcmVzaF9xdWVyaWVzKCkge1xuXHRcdHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLW9uZSAucGl0IHAnKVxuICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLW9uZSBwJylcbiAgICBcblx0XHR0aGlzLm90aGVyX3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQgcCcpXG5cdFx0dGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLXR3byBwJylcblx0fVxuXG5cdC8qKlxuXHQgKiBQZXJmb3JtIHRoZSBtb3ZlIGZvciBhIHBsYXllclxuXHQgKiBAcGFyYW0ge051bWJlcn0gcGl0IC0gVGhlIHBpdCBudW1iZXIgY2hvc2VuXG5cdCAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIHRoZSBnYW1lIGlzIG5vdyBvdmVyXG5cdCAqL1xuXHRwdWJsaWMgZG9fcGxheWVyX3R1cm4ocGl0OiBudW1iZXIpIHtcblx0XHQvLyBwZXJmb3JtIHRoZSBwbGF5ZXIncyBhY3Rpb25cblx0XHRjb25zdCB0dXJuX292ZXIgPSB0aGlzLmJvYXJkLm1vdmVfc3RvbmVzKHBpdClcblxuXHRcdC8vIG1ha2Ugc3VyZSB0aGF0IGEgcGxheWVyIGhhc24ndCBydW4gb3V0IG9mIHN0b25lc1xuXHRcdGlmICh0aGlzLmNoZWNrX2dhbWVfb3ZlcigpKSB7XG5cdFx0XHQvLyB0aGlzLnJlc2V0X2dhbWUoKVxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHQvLyBjaGFuZ2UgdGhlIHBsYXllciBpZiB0aGUgY3VycmVudCB0dXJuIGlzIGVuZGVkXG5cdFx0aWYgKHR1cm5fb3Zlcikge1xuXHRcdFx0dGhpcy5zd2l0Y2hfdHVybigpXG5cdFx0fVxuXG4gICAgcmV0dXJuIGZhbHNlXG5cdH1cblxuXHQvKipcblx0ICogQ2hhbmdlIHRoZSB1c2VyIGN1cnJlbnRseSBoYXZpbmcgYSB0dXJuXG5cdCAqL1xuXHRwdWJsaWMgc3dpdGNoX3R1cm4oKSB7XG5cdFx0dGhpcy5ib2FyZC50dXJuX3BsYXllcl8xID0gdGhpcy5nZXRfb3RoZXJfcGxheWVyKClcbiAgICB0aGlzLmRyYXdfYWxsX3N0b25lcygpXG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsIHRoaXMucGxheWVyX3RleHQpXG4gICAgICBjb25zdCBjdXJyZW50X3BsYXllciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jdXJyZW50LXBsYXllcicpXG5cdFx0XHRpZihjdXJyZW50X3BsYXllcil7XG4gICAgICAgIGN1cnJlbnRfcGxheWVyLnRleHRDb250ZW50ID0gdGhpcy5wbGF5ZXJfdGV4dFxuICAgICAgfVxuXHRcdH0sIDIwMCApXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2sgaWYgdGhlIGdhbWUgc2hvdWxkIGVuZFxuXHQgKiBAcmV0dXJucyB7Qm9vbGVhbn0gV2hldGhlciB0aGUgZ2FtZSBpcyBvdmVyXG5cdCAqL1xuXHRwdWJsaWMgY2hlY2tfZ2FtZV9vdmVyKCkge1xuXHRcdGNvbnN0IHdpbm5lciA9IHRoaXMuYm9hcmQuY2hlY2tfd2lubmVyKClcblxuXHRcdGlmICh3aW5uZXIgPCAwKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRjb25zdCBzdGF0dXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhdHVzJylcblxuICAgIC8vIERldGVybWluZSB3aGljaCBwbGF5ZXIgaG9sZHMgdGhlIG1vc3Qgc3RvbmVzXG4gICAgaWYgKHRoaXMuZW5hYmxlX3JlbmRlciAmJiBzdGF0dXMpe1xuICBcdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdnYW1lLW92ZXInKVxuXG4gICAgICBpZiAoMSA9PT0gd2lubmVyKSB7XG4gICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdQbGF5ZXIgb25lIHdpbnMhJ1xuICAgICAgICBkb2N1bWVudC5ib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS1wbGF5ZXInLCAnb25lJylcbiAgICAgIH0gZWxzZSBpZiAoMiA9PT0gd2lubmVyKSB7XG4gICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdQbGF5ZXIgdHdvIHdpbnMhJ1xuICAgICAgICBkb2N1bWVudC5ib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS1wbGF5ZXInLCAndHdvJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsICcnKVxuICAgICAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnRHJhdyEnXG4gICAgICB9XG4gICAgfVxuXG5cdFx0dGhpcy5ib2FyZC50dXJuX3BsYXllcl8xID0gdHJ1ZVxuXHRcdHJldHVybiB0cnVlXG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgc3RvbmVzIG9uIHRoZSBwYWdlXG4gICAqL1xuICBwdWJsaWMgZHJhd19hbGxfc3RvbmVzKCkge1xuICAgIGlmKCF0aGlzLmVuYWJsZV9yZW5kZXIpIHJldHVybjtcblxuICAgIGxldCBjdXJyZW50X3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICBsZXQgb3RoZXJfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZShmYWxzZSlcblxuICAgIGxldCBjdXJyZW50X29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldCh0cnVlKVxuICAgIGxldCBvdGhlcl9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQoZmFsc2UpXG5cbiAgICBpZih0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlKVxuICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChjdXJyZW50X3N0b3JlKVxuXG4gICAgaWYodGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUpXG4gICAgICB0aGlzLm90aGVyX3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChvdGhlcl9zdG9yZSlcblxuICAgIGZvciAobGV0IHBpdCA9IDA7IHBpdCA8IDY7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW2N1cnJlbnRfb2Zmc2V0K3BpdF0pXG4gICAgICAgIHRoaXMub3RoZXJfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tvdGhlcl9vZmZzZXQrcGl0XSlcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZHJhd19zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICBpZighdGhpcy5lbmFibGVfcmVuZGVyKSByZXR1cm47XG4gICBcbiAgICBsZXQgY3VycmVudF9zdG9yZSA9IHRoaXMuYm9hcmQuZ2V0X3N0b3JlKHRydWUpXG4gICAgbGV0IG90aGVyX3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUoZmFsc2UpXG5cbiAgICBsZXQgY3VycmVudF9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQodHJ1ZSlcbiAgICBsZXQgb3RoZXJfb2Zmc2V0ID0gdGhpcy5ib2FyZC5nZXRfb2Zmc2V0KGZhbHNlKVxuXG4gICAgaWYgKHBpdCA9PT0gNikge1xuICAgICAgaWYodGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSlcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChjdXJyZW50X3N0b3JlKVxuICAgIH0gZWxzZSBpZihwaXQgPT09IDEzKSB7XG4gICAgICBpZih0aGlzLm90aGVyX3BsYXllcl9zdG9yZSlcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUudGV4dENvbnRlbnQgPSBmb3JtYXQob3RoZXJfc3RvcmUpXG4gICAgfSBlbHNlIGlmIChwaXQgPCA2KSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW2N1cnJlbnRfb2Zmc2V0K3BpdF0pXG4gICAgfSBlbHNlIGlmIChwaXQgPiA2KSB7XG4gICAgICAgIHBpdCAtPSA3XG4gICAgICAgIHRoaXMub3RoZXJfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tvdGhlcl9vZmZzZXQrcGl0XSlcbiAgICB9XG59XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4vR2FtZVwiO1xuaW1wb3J0IHsgQWdlbnQgfSBmcm9tIFwiLi9BZ2VudFwiO1xuXG5jb25zdCBnYW1lID0gbmV3IEdhbWUoKTtcbi8vIGdhbWUubG9hZF9nYW1lKCk7XG5nYW1lLmluaXQoKTtcbmNvbnN0IGFnZW50ID0gbmV3IEFnZW50KGdhbWUuYm9hcmQpXG5cbmxldCB3YWl0aW5nX2Zvcl9tb3ZlID0gdHJ1ZTtcblxuLyoqXG4gKiBJbml0aWFsaXplIHBpdCBlbGVtZW50cyBhc1xuICogQHBhcmFtIHtTdHJpbmd9ICAgcGxheWVyIFRoZSBwbGF5ZXIgd2hvIHRoZSByb3cgYmVsb25ncyB0b1xuICogQHBhcmFtIHtOb2RlTGlzdH0gcm93ICAgIFRoZSBwaXQgZWxlbWVudHMgdG8gaW5pdGlhbGl6ZVxuICovXG5jb25zdCBpbml0X3BpdHMgPSAocGxheWVyOiBzdHJpbmcsIHJvdzogTm9kZUxpc3QpID0+IHtcbiAgY29uc3Qgb25jbGljayA9IChlOiBFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IChlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KTtcbiAgICBjb25zdCBwbGF5ZXJfaWQgPSBwbGF5ZXIgPT09ICdvbmUnXG4gICAgaWYgKGdhbWUuYm9hcmQudHVybl9wbGF5ZXJfMSA9PT0gcGxheWVyX2lkICYmIHdhaXRpbmdfZm9yX21vdmUpIHtcbiAgICAgIHdhaXRpbmdfZm9yX21vdmUgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHBpdCA9IHBhcnNlSW50KHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGl0Jyk/PyAnMCcsIDEwKTtcbiAgICAgIGlmICghZ2FtZS5kb19wbGF5ZXJfdHVybihwaXQpKSB7XG4gICAgICAgIHdhaXRpbmdfZm9yX21vdmUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmb3IgKGxldCBwaXQgPSAwOyBwaXQgPCByb3cubGVuZ3RoOyBwaXQrKykge1xuICAgIChyb3dbcGl0XSBhcyBIVE1MRWxlbWVudCkuc2V0QXR0cmlidXRlKCdkYXRhLXBpdCcsIHBpdC50b1N0cmluZygpKVxuICAgIHJvd1twaXRdLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25jbGljaylcbiAgfVxufTtcblxuaW5pdF9waXRzKCdvbmUnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci1vbmUgLnBpdCcpKTtcbmluaXRfcGl0cygndHdvJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQnKSk7XG5cbmNvbnN0IG5ld0dhbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmV3LWdhbWUnKTtcbmlmKG5ld0dhbWUpXG4gIG5ld0dhbWUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgLy8gZ2FtZS5yZXNldF9nYW1lKCk7XG4gICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICB9KVxuXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIkFJXCIpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgaWYoIWdhbWUuYm9hcmQudHVybl9wbGF5ZXJfMSlcbiAgICBjb25zb2xlLmxvZyhhZ2VudC5tb3ZlKCkpXG59KSJdfQ==
