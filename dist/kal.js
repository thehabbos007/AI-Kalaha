(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Game_1 = require("./Game");
var Agent = (function () {
    function Agent(original_board) {
        this.original_board = original_board;
        this.depth = 5;
    }
    Agent.prototype.clone_board = function (board) {
        var game_clone = new Game_1.Game(false);
        var board_clone = board.clone(game_clone);
        game_clone.board = board_clone;
        game_clone.enable_render = false;
        return board_clone;
    };
    Agent.prototype.move = function () {
        var _this = this;
        var cloned_board = this.clone_board(this.original_board);
        var options = this.valid_moves(cloned_board);
        var scores = options.map(function (option) { return _this.min_max(cloned_board, -Infinity, Infinity, option, _this.depth); });
        var max_score = Math.max.apply(Math, scores);
        var pairs = scores.map(function (score, i) { return [score, options[i]]; });
        var candidates = pairs.filter(function (x) { return x[0] == max_score; })
            .map(function (x) { return x[1]; });
        return candidates[Math.floor(Math.random() * candidates.length)];
    };
    Agent.prototype.evaluate = function (board) {
        var board_eval = board.get_store(false) - board.get_store(true);
        return board_eval;
    };
    Agent.prototype.valid_moves = function (board) {
        var player = board.turn_player_1;
        var lower = player ? 0 : 7;
        var upper = player ? 5 : 12;
        var subtract = player ? 1 : 7;
        return board.current_pits
            .map(function (x, i) { return i >= lower && i <= upper && x > 0 ? i : -1; })
            .filter(function (x) { return x > 0; })
            .map(function (x) { return x - subtract; });
    };
    Agent.prototype.min_max = function (board, alpha, beta, move, depth) {
        var _this = this;
        var cloned_board = this.clone_board(board);
        cloned_board.game.do_player_turn(move);
        var is_maximiser = !cloned_board.turn_player_1;
        if (depth == 0 || cloned_board.check_winner() > -1)
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
    function Board(game, current_pits, turn_player_1) {
        if (current_pits === void 0) { current_pits = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; }
        if (turn_player_1 === void 0) { turn_player_1 = true; }
        this.current_pits = current_pits;
        this.turn_player_1 = turn_player_1;
        this.game = game;
    }
    Board.prototype.clone = function (game_clone) {
        return new Board(game_clone, this.current_pits.slice(), this.turn_player_1);
    };
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
        this.new_round_callback = function () { };
        this.board = new Board_1.Board(this);
    }
    Game.prototype.enableAi = function (callback) {
        this.new_round_callback = callback;
    };
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
            this.new_round_callback();
        }
        return false;
    };
    Game.prototype.switch_turn = function () {
        var _this = this;
        this.board.turn_player_1 = this.get_other_player();
        if (!this.enable_render)
            return;
        this.draw_all_stones();
        setTimeout(function () {
            var _a;
            (_a = document.querySelector('.status')) === null || _a === void 0 ? void 0 : _a.setAttribute('data-player', _this.player_text);
            var current_player = document.querySelector('.current-player');
            if (current_player) {
                current_player.textContent = _this.player_text;
            }
        }, 200);
    };
    Game.prototype.check_game_over = function () {
        var _a, _b, _c;
        var winner = this.board.check_winner();
        if (winner < 0) {
            return false;
        }
        var status = document.querySelector('.status');
        if (this.enable_render && status) {
            document.body.classList.add('game-over');
            if (1 === winner) {
                status.textContent = 'Player one wins!';
                (_a = document.querySelector('.status')) === null || _a === void 0 ? void 0 : _a.setAttribute('data-player', 'one');
            }
            else if (2 === winner) {
                status.textContent = 'Player two wins!';
                (_b = document.querySelector('.status')) === null || _b === void 0 ? void 0 : _b.setAttribute('data-player', 'two');
            }
            else {
                (_c = document.querySelector('.status')) === null || _c === void 0 ? void 0 : _c.setAttribute('data-player', '');
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Game_1 = require("./Game");
var Agent_1 = require("./Agent");
var game = new Game_1.Game();
game.init();
var agent = new Agent_1.Agent(game.board);
var ai_move_span = document.getElementById("moves");
var draw_ai_moves = function (arr) {
    console.log(arr);
    if (ai_move_span)
        ai_move_span.innerText = arr.join(" then ");
};
var do_move = function (acc) {
    var move = agent.move();
    game.do_player_turn(move);
    if (!game.board.turn_player_1) {
        setTimeout(function () {
            do_move(__spreadArrays(acc, [move]));
        }, 600);
    }
    else {
        waiting_for_move = true;
        draw_ai_moves(__spreadArrays(acc, [move]));
    }
};
var do_ai_stuff = function () {
    if (!game.board.turn_player_1)
        setTimeout(function () {
            do_move([]);
        }, 400);
};
var no_ai = function () { };
var checkbox = document.getElementById("AI");
var checked_state = checkbox.checked;
var waiting_for_move = true;
var pit_click = function (player) { return function (e) {
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
}; };
var pit_click_state = function (player, row, init) {
    for (var pit = 0; pit < row.length; pit++) {
        row[pit].setAttribute('data-pit', pit.toString());
        row[pit].addEventListener('click', init ? pit_click(player) : null);
    }
};
pit_click_state('one', document.querySelectorAll('.row.player-one .pit'), true);
pit_click_state('two', document.querySelectorAll('.row.player-two .pit'), !checked_state);
var newGame = document.querySelector('.new-game');
if (newGame) {
    newGame.addEventListener('click', function () {
        window.location.reload();
    });
}
checkbox === null || checkbox === void 0 ? void 0 : checkbox.addEventListener('change', function (e) {
    var el = e.srcElement;
    if (el instanceof HTMLInputElement) {
        if (el.checked) {
            pit_click_state('two', document.querySelectorAll('.row.player-two .pit'), false);
            game.enableAi(do_ai_stuff);
            if (!game.board.turn_player_1)
                game.new_round_callback();
        }
        else {
            pit_click_state('two', document.querySelectorAll('.row.player-two .pit'), true);
            game.enableAi(no_ai);
        }
    }
});
if (checked_state)
    game.enableAi(do_ai_stuff);

},{"./Agent":1,"./Game":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2hvbWUvYWhtYWQvLm52bS92ZXJzaW9ucy9ub2RlL3YxMy4xMS4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL3NyYy9zcmMvQWdlbnQudHMiLCJzcmMvc3JjL3NyYy9Cb2FyZC50cyIsInNyYy9zcmMvc3JjL0dhbWUudHMiLCJzcmMvc3JjL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsK0JBQTJCO0FBSzNCO0lBRUksZUFBb0IsY0FBcUI7UUFBckIsbUJBQWMsR0FBZCxjQUFjLENBQU87UUFEekMsVUFBSyxHQUFHLENBQUMsQ0FBQTtJQUNvQyxDQUFDO0lBRXRDLDJCQUFXLEdBQW5CLFVBQW9CLEtBQVk7UUFDNUIsSUFBSSxVQUFVLEdBQUcsSUFBSSxXQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDaEMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUN6QyxVQUFVLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQTtRQUM5QixVQUFVLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQTtRQUNoQyxPQUFPLFdBQVcsQ0FBQTtJQUN0QixDQUFDO0lBRU0sb0JBQUksR0FBWDtRQUFBLGlCQWNDO1FBYkcsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDeEQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUU1QyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsTUFBTSxJQUFJLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFJLENBQUMsS0FB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QUFhO2dCQUMxQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztTQUM3QjthQUFJO1lBQ0gsZUFBZSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUMvRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ3JCO0tBRUY7QUFDSCxDQUFDLEVBQUM7QUFFRixJQUFHLGFBQWE7SUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHtHYW1lfSBmcm9tICcuL0dhbWUnXG5pbXBvcnQge0JvYXJkfSBmcm9tICcuL0JvYXJkJ1xuXG4vLyBNaW5NYXggYWdlbnRcbi8vIEFnZW50IGlzIGFsd2F5cyBwbGF5ZXIgMiBzbyBmYXIuXG5leHBvcnQgY2xhc3MgQWdlbnQge1xuICAgIGRlcHRoID0gNVxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb3JpZ2luYWxfYm9hcmQ6IEJvYXJkKSB7IH1cblxuICAgIHByaXZhdGUgY2xvbmVfYm9hcmQoYm9hcmQ6IEJvYXJkKXtcbiAgICAgICAgbGV0IGdhbWVfY2xvbmUgPSBuZXcgR2FtZShmYWxzZSlcbiAgICAgICAgbGV0IGJvYXJkX2Nsb25lID0gYm9hcmQuY2xvbmUoZ2FtZV9jbG9uZSlcbiAgICAgICAgZ2FtZV9jbG9uZS5ib2FyZCA9IGJvYXJkX2Nsb25lXG4gICAgICAgIGdhbWVfY2xvbmUuZW5hYmxlX3JlbmRlciA9IGZhbHNlXG4gICAgICAgIHJldHVybiBib2FyZF9jbG9uZVxuICAgIH1cblxuICAgIHB1YmxpYyBtb3ZlKCl7XG4gICAgICAgIGxldCBjbG9uZWRfYm9hcmQgPSB0aGlzLmNsb25lX2JvYXJkKHRoaXMub3JpZ2luYWxfYm9hcmQpXG4gICAgICAgIGxldCBvcHRpb25zID0gdGhpcy52YWxpZF9tb3ZlcyhjbG9uZWRfYm9hcmQpXG5cbiAgICAgICAgbGV0IHNjb3JlcyA9IG9wdGlvbnMubWFwKG9wdGlvbiA9PiB0aGlzLm1pbl9tYXgoY2xvbmVkX2JvYXJkLCAtSW5maW5pdHksIEluZmluaXR5LCBvcHRpb24sIHRoaXMuZGVwdGgpKVxuXG4gICAgICAgIGxldCBtYXhfc2NvcmUgPSBNYXRoLm1heCguLi5zY29yZXMpXG5cbiAgICAgICAgbGV0IHBhaXJzOiBudW1iZXJbXVtdID0gc2NvcmVzLm1hcCgoc2NvcmUsIGkpID0+IFtzY29yZSwgb3B0aW9uc1tpXV0pXG5cbiAgICAgICAgLy8gY29uc29sZS5pbmZvKFwicGFpcnMgZm9yIG9uZSBtb3ZlOiBcIiwgcGFpcnMpXG4gICAgICAgIGxldCBjYW5kaWRhdGVzOiBudW1iZXJbXSA9IHBhaXJzLmZpbHRlcih4ID0+IHhbMF0gPT0gbWF4X3Njb3JlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoeCA9PiB4WzFdKVxuICAgICAgICByZXR1cm4gY2FuZGlkYXRlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjYW5kaWRhdGVzLmxlbmd0aCldXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBldmFsdWF0ZShib2FyZDogQm9hcmQpOiBudW1iZXJ7XG4gICAgICAgIC8vIEZpbmQgdGhlIHBheW9mZiBvZiBhIHRlcm1pbmFsIHN0YXRlXG4gICAgICAgIGxldCBib2FyZF9ldmFsID0gYm9hcmQuZ2V0X3N0b3JlKGZhbHNlKSAtIGJvYXJkLmdldF9zdG9yZSh0cnVlKVxuICAgICAgICByZXR1cm4gYm9hcmRfZXZhbFxuICAgIH1cblxuICAgIHByaXZhdGUgdmFsaWRfbW92ZXMoYm9hcmQ6IEJvYXJkKTogbnVtYmVyW117XG4gICAgICAgIGxldCBwbGF5ZXIgPSBib2FyZC50dXJuX3BsYXllcl8xXG5cbiAgICAgICAgbGV0IGxvd2VyID0gcGxheWVyID8gMCA6IDdcbiAgICAgICAgbGV0IHVwcGVyID0gcGxheWVyID8gNSA6IDEyXG4gICAgICAgIGxldCBzdWJ0cmFjdCA9IHBsYXllciA/IDEgOiA3XG5cbiAgICAgICAgcmV0dXJuIGJvYXJkLmN1cnJlbnRfcGl0c1xuICAgICAgICAgICAgLm1hcCgoeCwgaSkgPT4gaSA+PSBsb3dlciAmJiBpIDw9IHVwcGVyICYmIHggPiAwID8gaSA6IC0xKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggPiAwKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHggLSBzdWJ0cmFjdClcbiAgICB9XG5cbiAgICBwcml2YXRlIG1pbl9tYXgoYm9hcmQ6IEJvYXJkLCBhbHBoYTogbnVtYmVyLCBiZXRhOiBudW1iZXIsIG1vdmU6IG51bWJlciwgZGVwdGg6IG51bWJlcik6IG51bWJlcntcbiAgICAgICAgbGV0IGNsb25lZF9ib2FyZCA9IHRoaXMuY2xvbmVfYm9hcmQoYm9hcmQpXG4gICAgICAgIFxuICAgICAgICBjbG9uZWRfYm9hcmQuZ2FtZS5kb19wbGF5ZXJfdHVybihtb3ZlKVxuXG4gICAgICAgIGxldCBpc19tYXhpbWlzZXIgPSAhY2xvbmVkX2JvYXJkLnR1cm5fcGxheWVyXzFcbiAgICAgICAgaWYoZGVwdGggPT0gMCB8fCBjbG9uZWRfYm9hcmQuY2hlY2tfd2lubmVyKCkgPiAtMSkgcmV0dXJuIHRoaXMuZXZhbHVhdGUoY2xvbmVkX2JvYXJkKVxuXG4gICAgICAgIGxldCBvcHRpb25zID0gdGhpcy52YWxpZF9tb3ZlcyhjbG9uZWRfYm9hcmQpXG4gICAgICAgIHZhciBiZXN0X29wdGlvbiA9IGlzX21heGltaXNlciA/IC1JbmZpbml0eSA6IEluZmluaXR5XG5cbiAgICAgICAgb3B0aW9ucy5mb3JFYWNoKG9wdGlvbiA9PiB7XG4gICAgICAgICAgICBsZXQgbmV3X3ZhbHVlID0gdGhpcy5taW5fbWF4KGNsb25lZF9ib2FyZCwgYWxwaGEsIGJldGEsIG9wdGlvbiwgZGVwdGggLSAxKVxuXG4gICAgICAgICAgICBpZihpc19tYXhpbWlzZXIpe1xuICAgICAgICAgICAgICAgIGJlc3Rfb3B0aW9uID0gTWF0aC5tYXgobmV3X3ZhbHVlLCBiZXN0X29wdGlvbilcbiAgICAgICAgICAgICAgICBhbHBoYSA9IE1hdGgubWF4KGFscGhhLCBiZXN0X29wdGlvbilcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGJlc3Rfb3B0aW9uID0gTWF0aC5taW4obmV3X3ZhbHVlLCBiZXN0X29wdGlvbilcbiAgICAgICAgICAgICAgICBiZXRhID0gTWF0aC5taW4oYmV0YSwgYmVzdF9vcHRpb24pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiZXRhIDw9IGFscGhhKSByZXR1cm4gYmVzdF9vcHRpb25cblxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJlc3Rfb3B0aW9uXG4gICAgfVxuXG59IiwiaW1wb3J0IHtHYW1lfSBmcm9tICcuL0dhbWUnXG4vKipcbiAqIE1hbmFnZXMgdGhlIG1hbmNhbGEgYm9hcmRcbiAqL1xuZXhwb3J0IGNsYXNzIEJvYXJkIHtcbiAgZ2FtZTogR2FtZVxuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXNlIGNsYXNzXG5cdCAqIEBwYXJhbSB7R2FtZX0gZ2FtZVxuXHQgKi9cbiAgY29uc3RydWN0b3IoZ2FtZTogR2FtZSxcbiAgICAgICAgICAgICAgcHVibGljIGN1cnJlbnRfcGl0cyA9IFs0LCA0LCA0LCA0LCA0LCA0LCAwLCA0LCA0LCA0LCA0LCA0LCA0LCAwXSxcbiAgICAgICAgICAgICAgcHVibGljIHR1cm5fcGxheWVyXzEgPSB0cnVlKSB7XG4gICAgdGhpcy5nYW1lID0gZ2FtZVxuICB9XG5cbiAgY2xvbmUoZ2FtZV9jbG9uZTogR2FtZSkge1xuICAgIHJldHVybiBuZXcgQm9hcmQoZ2FtZV9jbG9uZSwgdGhpcy5jdXJyZW50X3BpdHMuc2xpY2UoKSwgdGhpcy50dXJuX3BsYXllcl8xKVxuICB9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlIHRoZSBhbW91bnQgb2Ygc3RvbmVzIGluIGEgcGl0XG5cdCAqIEBwYXJhbSAge051bWJlcn0gcGl0IFRoZSBwaXQgbnVtYmVyXG5cdCAqIEByZXR1cm4ge051bWJlcn0gICAgIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgZ2V0X3N0b25lcyhwaXQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcGl0c1twaXRdXG4gIH1cblxuXHQvKipcblx0ICogU2V0IHRoZSBhbW91bnQgb2Ygc3RvbmVzIGluIGEgcGl0XG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgICAgVGhlIHBpdCBudW1iZXJcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHN0b25lcyBUaGUgYW1vdW50IG9mIHN0b25lc1xuXHQgKi9cbiAgcHVibGljIHNldF9zdG9uZXMocGl0OiBudW1iZXIsIHN0b25lczogbnVtYmVyKSB7XG4gICAgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9IHN0b25lc1xuICB9XG5cblx0LyoqXG5cdCAqIEFkanVzdCB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0ge051bWJlcn0gcGl0ICAgIFRoZSBwaXQgbnVtYmVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBzdG9uZXMgVGhlIGFtb3VudCBvZiBzdG9uZXNcblx0ICovXG4gIHB1YmxpYyBhZGRfc3RvbmVzKHBpdDogbnVtYmVyLCBzdG9uZXM6IG51bWJlcikge1xuICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gKz0gc3RvbmVzXG4gIH1cblxuICAvKipcbiAgICogRGlzdHJpYnV0ZSB0aGUgc3RvbmVzIGZyb20gYSBwaXQgYXJvdW5kIHRoZSBib2FyZFxuICAgKiBAcGFyYW0ge051bWJlcn0gcGl0IFRoZSBwaXQgdG8gYmVnaW4gaW5cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgdXNlcidzIHR1cm4gaGFzIGVuZGVkXG4gICAqL1xuICBwdWJsaWMgbW92ZV9zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICBwaXQgPSB0aGlzLnR1cm5fcGxheWVyXzEgPyBwaXQgOiBwaXQgKyA3XG4gICAgY29uc3QgY3VycmVudF9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleCh0aGlzLnR1cm5fcGxheWVyXzEpXG4gICAgY29uc3Qgb3RoZXJfc3RvcmVfaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgoIXRoaXMudHVybl9wbGF5ZXJfMSlcbiAgICAvLyByZXR1cm4gaWYgcGl0IGhhcyBubyBzdG9uZXNcbiAgICBpZiAodGhpcy5nZXRfc3RvbmVzKHBpdCkgPCAxKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyB0YWtlIHN0b25lcyBvdXQgb2YgcGl0XG4gICAgbGV0IHN0b25lcyA9IHRoaXMuZ2V0X3N0b25lcyhwaXQpXG4gICAgdGhpcy5zZXRfc3RvbmVzKHBpdCwgMClcbiAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KVxuXG4gICAgd2hpbGUgKHN0b25lcyA+IDApIHtcbiAgICAgIHBpdCA9IChwaXQgKyAxKSAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aFxuXG4gICAgICAvLyB3cmFwIGFyb3VuZCB0aGUgYm9hcmQgYmVmb3JlIHJlYWNoaW5nIG90aGVyIHBsYXllcidzIHN0b3JlXG4gICAgICBpZiAocGl0ID09IG90aGVyX3N0b3JlX2lkeCkge1xuICAgICAgICBwaXQgPSAob3RoZXJfc3RvcmVfaWR4ICsgMSkgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGhcbiAgICAgIH1cblxuICAgICAgdGhpcy5hZGRfc3RvbmVzKHBpdCwgMSlcbiAgICAgIHN0b25lcy0tXG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KVxuICAgIH1cblxuICAgIC8vIEludmVydCB0aGUgcGl0IG51bWJlciAobnVtYmVyIG9mIG9wcG9zaXRlIHBpdCBpbiBvcHBvbmVudCdzIHJvdylcbiAgICBjb25zdCBpbnZlcnNlID0gKDUgLSBwaXQgKyA3KSAlIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aFxuICAgIGNvbnN0IGlzX2NhcHR1cmFibGUgPSB0aGlzLmlzX3dpdGhpbl9wbGF5ZXJfYm91bmRzKHBpdCwgdGhpcy50dXJuX3BsYXllcl8xKVxuICAgIC8vIENoZWNrIGZvciBjYXB0dXJlXG4gICAgaWYgKGlzX2NhcHR1cmFibGUgJiYgdGhpcy5jdXJyZW50X3BpdHNbcGl0XSA9PT0gMSAmJiB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXSA+IDApIHtcblxuICAgICAgLy8gVHJhbnNmZXIgdGhpcyBwaXQncyBzdG9uZXMgYWxvbmcgd2l0aCBvcHBvc2l0ZSBwaXQncyBzdG9uZXMgdG8gc3RvcmVcbiAgICAgIHRoaXMuY3VycmVudF9waXRzW2N1cnJlbnRfc3RvcmVfaWR4XSArPSB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXSArIDFcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhjdXJyZW50X3N0b3JlX2lkeClcblxuICAgICAgLy8gQ2xlYXIgdGhlIHBpdHNcbiAgICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSAwXG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1tpbnZlcnNlXSA9IDBcbiAgICAgIHRoaXMuZ2FtZS5kcmF3X3N0b25lcyhwaXQpXG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMoaW52ZXJzZSlcbiAgICB9XG5cbiAgICAvLyB0aGUgdXNlcidzIHR1cm4gZW5kZWQgaWYgdGhlIHN0b25lcyBkaWQgbm90IGVuZCBpbiB0aGUgc3RvcmFnZSBwaXRcbiAgICByZXR1cm4gcGl0ICE9PSBjdXJyZW50X3N0b3JlX2lkeFxuICB9XG5cbiAgcHVibGljIGdldF9zdG9yZV9pbmRleChwbGF5ZXJfdHVybjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgaGFsZiA9ICh0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGggLyAyKSAtIDFcbiAgICByZXR1cm4gcGxheWVyX3R1cm4gPyBoYWxmIDogaGFsZiAqIDIgKyAxXG4gIH1cblxuICBwdWJsaWMgZ2V0X3N0b3JlKHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleChwbGF5ZXJfdHVybilcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHNbaWR4XVxuICB9XG5cbiAgcHVibGljIGdldF9vZmZzZXQocGxheWVyX3R1cm46IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGhhbGYgPSAodGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMikgLSAxXG4gICAgcmV0dXJuIHBsYXllcl90dXJuID8gMCA6IGhhbGYgKyAxXG4gIH1cblxuICBwdWJsaWMgZ2V0X3NpZGVfbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGggLyAyIC0gMVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYm91bmRpbmcgaW5kaWNpZXMgZm9yIGVhY2ggcGxheWVyJ3MgYm9hcmRcbiAgICovXG4gIHB1YmxpYyBnZXRfYm9hcmRfaW5kZXgoYm9hcmQ6IG51bWJlcltdKTogbnVtYmVyW10ge1xuICAgICAgcmV0dXJuIFswLCB0aGlzLmdldF9zaWRlX2xlbmd0aCgpLFxuICAgICAgICAgICAgIHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCkrMSwgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoLTFdXG4gIH1cblxuICBwdWJsaWMgaXNfd2l0aGluX3BsYXllcl9ib3VuZHMocGl0OiBudW1iZXIsIHBsYXllcl8xOiBib29sZWFuKTogYm9vbGVhbntcbiAgICBjb25zdCBbcDFfbG93ZXIsIHAxX3VwcGVyLCBwMl9sb3dlciwgcDJfdXBwZXJdID0gdGhpcy5nZXRfYm9hcmRfaW5kZXgodGhpcy5jdXJyZW50X3BpdHMpXG5cbiAgICBpZihwbGF5ZXJfMSl7XG4gICAgICByZXR1cm4gKHBpdCA+PSBwMV9sb3dlciAmJiBwaXQgPCBwMV91cHBlcilcbiAgICB9ZWxzZXtcbiAgICAgIHJldHVybiAocGl0ID49IHAyX2xvd2VyICYmIHBpdCA8IHAyX3VwcGVyKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZXRfYm9hcmRfc2xpY2UocGxheWVyX3R1cm46IGJvb2xlYW4sIGJvYXJkOiBudW1iZXJbXSkgOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHBsYXllcl90dXJuXG4gICAgICA/IGJvYXJkLnNsaWNlKDAsIHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCkpXG4gICAgICA6IGJvYXJkLnNsaWNlKHRoaXMuZ2V0X3NpZGVfbGVuZ3RoKCkrMSwgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoLTEpXG4gIH1cblxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHBsYXllciBoYXMgd29uXG4gICAqIEByZXR1cm4ge051bWJlcn0gLTEgZm9yIG5vIHdpbiwgMCBmb3IgZHJhdywgMSBmb3IgcGxheWVyIG9uZSB3aW4sIDIgZm9yIHBsYXllciB0d28gd2luXG4gICAqL1xuICBwdWJsaWMgY2hlY2tfd2lubmVyKCkge1xuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgcm93IG9uIHRoZSBib2FyZCBpcyBlbXB0eVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBpdHMgVGhlIHBpdHMgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGFsbCBvZiB0aGUgcGl0cyBjb250YWluIG5vIHN0b25lc1xuICAgICAqL1xuICAgIGNvbnN0IGlzX3Jvd19lbXB0eSA9IChwbGF5ZXI6IGJvb2xlYW4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmdldF9ib2FyZF9zbGljZShwbGF5ZXIsIHRoaXMuY3VycmVudF9waXRzKVxuICAgICAgICAgICAgICAgICAuZXZlcnkoKHN0b25lczogbnVtYmVyKSA9PiBzdG9uZXMgPT09IDApXG4gICAgfVxuXG4gICAgY29uc3QgcGxheWVyXzFfb3V0ID0gaXNfcm93X2VtcHR5KHRydWUpXG4gICAgY29uc3QgcGxheWVyXzJfb3V0ID0gaXNfcm93X2VtcHR5KGZhbHNlKVxuICAgIGNvbnN0IHAxX3N0b3JlX2lkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KHRydWUpXG4gICAgY29uc3QgcDJfc3RvcmVfaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgoZmFsc2UpXG5cblxuICAgIC8vIHRoZSBnYW1lIGlzIG5vdCBvdmVyIGlmIG5laXRoZXIgcGxheWVyIGhhcyBhbiBlbXB0eSByb3dcbiAgICBpZiAoIXBsYXllcl8xX291dCAmJiAhcGxheWVyXzJfb3V0KSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG5cbiAgICAvLyBNb3ZlIHRoZSBzdG9uZXMgcmVtYWluaW5nIGluIGEgcGxheWVyJ3Mgcm93IGludG8gdGhlaXIgc3RvcmVcbiAgICBsZXQgcGl0XG4gICAgY29uc3QgW3AxX2xvd2VyLCBwMV91cHBlciwgcDJfbG93ZXIsIHAyX3VwcGVyXSA9IHRoaXMuZ2V0X2JvYXJkX2luZGV4KHRoaXMuY3VycmVudF9waXRzKVxuICAgIGlmIChwbGF5ZXJfMV9vdXQgJiYgIXBsYXllcl8yX291dCkge1xuICAgICAgXG4gICAgICBmb3IgKHBpdCA9IHAyX2xvd2VyOyBwaXQgPCBwMl91cHBlcjsgcGl0KyspIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcDJfc3RvcmVfaWR4XSArPSB0aGlzLmN1cnJlbnRfcGl0c1twaXRdXG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSAwXG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHBsYXllcl8yX291dCAmJiAhcGxheWVyXzFfb3V0KSB7XG4gICAgICBmb3IgKHBpdCA9IHAxX2xvd2VyOyBwaXQgPCBwMV91cHBlcjsgcGl0KyspIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BpdHNbcDFfc3RvcmVfaWR4XSArPSB0aGlzLmN1cnJlbnRfcGl0c1twaXRdXG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSAwXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5nYW1lLmRyYXdfYWxsX3N0b25lcygpXG4gICAgY29uc3QgcDFfc3RvcmUgPSB0aGlzLmdldF9zdG9yZSh0cnVlKVxuICAgIGNvbnN0IHAyX3N0b3JlID0gdGhpcy5nZXRfc3RvcmUoZmFsc2UpXG4gICAgXG4gICAgaWYgKHAxX3N0b3JlID09IHAyX3N0b3JlKVxuICAgICAgICByZXR1cm4gMFxuICAgIHJldHVybiBwMV9zdG9yZSA+IHAyX3N0b3JlID8gMSA6IDJcbiAgfVxufVxuIiwiXG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4vQm9hcmQnXG5cbmNvbnN0IGZvcm1hdCA9IChzdG9uZXM6IG51bWJlcikgPT4ge1xuICByZXR1cm4gc3RvbmVzID09PSAwID8gbnVsbCA6IHN0b25lcyArICcnXG59XG5cbmV4cG9ydCBjbGFzcyBHYW1lIHtcbiAgYm9hcmQ6IEJvYXJkXG4gIGN1cnJlbnRfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci1vbmUgcCcpXG4gIGN1cnJlbnRfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci1vbmUgLnBpdCBwJylcblxuICBvdGhlcl9wbGF5ZXJfc3RvcmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RvcmUucGxheWVyLXR3byBwJylcbiAgb3RoZXJfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCBwJylcbiAgbmV3X3JvdW5kX2NhbGxiYWNrOiAoKCkgPT4gdm9pZCkgPSAoKSA9PiB7fTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5hYmxlX3JlbmRlciA9IHRydWUpIHtcbiAgICB0aGlzLmJvYXJkID0gbmV3IEJvYXJkKHRoaXMpXG4gIH1cblxuICBlbmFibGVBaShjYWxsYmFjazogKCgpID0+IHZvaWQpKSB7XG4gICAgdGhpcy5uZXdfcm91bmRfY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgfVxuXG4gIGdldCBwbGF5ZXJfdGV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMSA/ICdvbmUnIDogJ3R3bydcbiAgfSBcblxuICAvKipcbiAgICogUmVmcmVzaCB0aGUgcXVlcnkgc2VsZWN0b3JzIGFuZCB1cGRhdGUgcGl0IHN0b25lc1xuICAgKi9cbiAgcHVibGljIGluaXQoKXtcbiAgICBpZighdGhpcy5lbmFibGVfcmVuZGVyKSByZXR1cm5cbiAgICB0aGlzLnJlZnJlc2hfcXVlcmllcygpXG4gICAgdGhpcy5kcmF3X2FsbF9zdG9uZXMoKVxuICB9XG4gIC8qKlxuXHQgICogUmV0cmlldmUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBub3QgY3VycmVudGx5IGhhdmluZyBhIHR1cm5cblx0ICAqIEByZXR1cm4ge1N0cmluZ31cblx0ICAqL1xuXHRwdWJsaWMgZ2V0X290aGVyX3BsYXllcigpIHtcblx0XHRyZXR1cm4gIXRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMVxuXHR9XG5cblx0LyoqXG5cdCAqIFJ1biB0aGUgcXVlcnkgc2VsZWN0b3JzIGZvciB0aGUgcGl0c1xuXHQgKi9cblx0cHVibGljIHJlZnJlc2hfcXVlcmllcygpIHtcblx0XHR0aGlzLmN1cnJlbnRfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci1vbmUgLnBpdCBwJylcbiAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci1vbmUgcCcpXG4gICAgXG5cdFx0dGhpcy5vdGhlcl9wbGF5ZXJfcGl0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLXR3byAucGl0IHAnKVxuXHRcdHRoaXMub3RoZXJfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci10d28gcCcpXG5cdH1cblxuXHQvKipcblx0ICogUGVyZm9ybSB0aGUgbW92ZSBmb3IgYSBwbGF5ZXJcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHBpdCAtIFRoZSBwaXQgbnVtYmVyIGNob3NlblxuXHQgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2FtZSBpcyBub3cgb3ZlclxuXHQgKi9cblx0cHVibGljIGRvX3BsYXllcl90dXJuKHBpdDogbnVtYmVyKSB7XG5cdFx0Ly8gcGVyZm9ybSB0aGUgcGxheWVyJ3MgYWN0aW9uXG5cdFx0Y29uc3QgdHVybl9vdmVyID0gdGhpcy5ib2FyZC5tb3ZlX3N0b25lcyhwaXQpXG5cblx0XHQvLyBtYWtlIHN1cmUgdGhhdCBhIHBsYXllciBoYXNuJ3QgcnVuIG91dCBvZiBzdG9uZXNcblx0XHRpZiAodGhpcy5jaGVja19nYW1lX292ZXIoKSkge1xuXHRcdFx0Ly8gdGhpcy5yZXNldF9nYW1lKClcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0Ly8gY2hhbmdlIHRoZSBwbGF5ZXIgaWYgdGhlIGN1cnJlbnQgdHVybiBpcyBlbmRlZFxuXHRcdGlmICh0dXJuX292ZXIpIHtcbiAgICAgIHRoaXMuc3dpdGNoX3R1cm4oKVxuICAgICAgdGhpcy5uZXdfcm91bmRfY2FsbGJhY2soKVxuXHRcdH1cblxuICAgIHJldHVybiBmYWxzZVxuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZSB0aGUgdXNlciBjdXJyZW50bHkgaGF2aW5nIGEgdHVyblxuXHQgKi9cblx0cHVibGljIHN3aXRjaF90dXJuKCkge1xuICAgIHRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMSA9IHRoaXMuZ2V0X290aGVyX3BsYXllcigpXG4gICAgaWYoIXRoaXMuZW5hYmxlX3JlbmRlcikgcmV0dXJuO1xuICAgIHRoaXMuZHJhd19hbGxfc3RvbmVzKClcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXR1cycpPy5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgdGhpcy5wbGF5ZXJfdGV4dClcbiAgICAgIGNvbnN0IGN1cnJlbnRfcGxheWVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmN1cnJlbnQtcGxheWVyJylcblx0XHRcdGlmKGN1cnJlbnRfcGxheWVyKXtcbiAgICAgICAgY3VycmVudF9wbGF5ZXIudGV4dENvbnRlbnQgPSB0aGlzLnBsYXllcl90ZXh0XG4gICAgICB9XG5cdFx0fSwgMjAwKVxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrIGlmIHRoZSBnYW1lIHNob3VsZCBlbmRcblx0ICogQHJldHVybnMge0Jvb2xlYW59IFdoZXRoZXIgdGhlIGdhbWUgaXMgb3ZlclxuXHQgKi9cblx0cHVibGljIGNoZWNrX2dhbWVfb3ZlcigpIHtcblx0XHRjb25zdCB3aW5uZXIgPSB0aGlzLmJvYXJkLmNoZWNrX3dpbm5lcigpXG5cblx0XHRpZiAod2lubmVyIDwgMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhdHVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXR1cycpXG5cbiAgICAvLyBEZXRlcm1pbmUgd2hpY2ggcGxheWVyIGhvbGRzIHRoZSBtb3N0IHN0b25lc1xuICAgIGlmICh0aGlzLmVuYWJsZV9yZW5kZXIgJiYgc3RhdHVzKXtcbiAgXHRcdGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnZ2FtZS1vdmVyJylcbiAgICAgIFxuICAgICAgaWYgKDEgPT09IHdpbm5lcikge1xuICAgICAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnUGxheWVyIG9uZSB3aW5zISdcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXR1cycpPy5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgJ29uZScpXG4gICAgICB9IGVsc2UgaWYgKDIgPT09IHdpbm5lcikge1xuICAgICAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnUGxheWVyIHR3byB3aW5zISdcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXR1cycpPy5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgJ3R3bycpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhdHVzJyk/LnNldEF0dHJpYnV0ZSgnZGF0YS1wbGF5ZXInLCAnJylcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ0RyYXchJ1xuICAgICAgfVxuICAgIH1cblxuXHRcdHRoaXMuYm9hcmQudHVybl9wbGF5ZXJfMSA9IHRydWVcblx0XHRyZXR1cm4gdHJ1ZVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHN0b25lcyBvbiB0aGUgcGFnZVxuICAgKi9cbiAgcHVibGljIGRyYXdfYWxsX3N0b25lcygpIHtcbiAgICBpZighdGhpcy5lbmFibGVfcmVuZGVyKSByZXR1cm5cblxuICAgIGxldCBjdXJyZW50X3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICBsZXQgb3RoZXJfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZShmYWxzZSlcblxuICAgIGxldCBjdXJyZW50X29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldCh0cnVlKVxuICAgIGxldCBvdGhlcl9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQoZmFsc2UpXG5cbiAgICBpZih0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlKVxuICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChjdXJyZW50X3N0b3JlKVxuXG4gICAgaWYodGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUpXG4gICAgICB0aGlzLm90aGVyX3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChvdGhlcl9zdG9yZSlcblxuICAgIGZvciAobGV0IHBpdCA9IDA7IHBpdCA8IDY7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW2N1cnJlbnRfb2Zmc2V0K3BpdF0pXG4gICAgICAgIHRoaXMub3RoZXJfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tvdGhlcl9vZmZzZXQrcGl0XSlcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZHJhd19zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICBpZighdGhpcy5lbmFibGVfcmVuZGVyKSByZXR1cm5cbiAgIFxuICAgIGxldCBjdXJyZW50X3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICBsZXQgb3RoZXJfc3RvcmUgPSB0aGlzLmJvYXJkLmdldF9zdG9yZShmYWxzZSlcblxuICAgIGxldCBjdXJyZW50X29mZnNldCA9IHRoaXMuYm9hcmQuZ2V0X29mZnNldCh0cnVlKVxuICAgIGxldCBvdGhlcl9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQoZmFsc2UpXG5cbiAgICBpZiAocGl0ID09PSA2KSB7XG4gICAgICBpZih0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlKVxuICAgICAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3N0b3JlLnRleHRDb250ZW50ID0gZm9ybWF0KGN1cnJlbnRfc3RvcmUpXG4gICAgfSBlbHNlIGlmKHBpdCA9PT0gMTMpIHtcbiAgICAgIGlmKHRoaXMub3RoZXJfcGxheWVyX3N0b3JlKVxuICAgICAgICB0aGlzLm90aGVyX3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChvdGhlcl9zdG9yZSlcbiAgICB9IGVsc2UgaWYgKHBpdCA8IDYpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9waXRzW3BpdF0udGV4dENvbnRlbnQgPSBmb3JtYXQodGhpcy5ib2FyZC5jdXJyZW50X3BpdHNbY3VycmVudF9vZmZzZXQrcGl0XSlcbiAgICB9IGVsc2UgaWYgKHBpdCA+IDYpIHtcbiAgICAgICAgcGl0IC09IDdcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW290aGVyX29mZnNldCtwaXRdKVxuICAgIH1cbn1cbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi9HYW1lXCJcbmltcG9ydCB7IEFnZW50IH0gZnJvbSBcIi4vQWdlbnRcIlxuaW1wb3J0IHsgQm9hcmQgfSBmcm9tIFwiLi9Cb2FyZFwiXG5cbmNvbnN0IGdhbWUgPSBuZXcgR2FtZSgpXG4vLyBnYW1lLmxvYWRfZ2FtZSgpXG5nYW1lLmluaXQoKVxuY29uc3QgYWdlbnQgPSBuZXcgQWdlbnQoZ2FtZS5ib2FyZClcbmNvbnN0IGFpX21vdmVfc3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW92ZXNcIilcblxuY29uc3QgZHJhd19haV9tb3ZlcyA9IChhcnI6IG51bWJlcltdKSA9PntcbiAgY29uc29sZS5sb2coYXJyKVxuICBpZihhaV9tb3ZlX3NwYW4pXG4gICAgYWlfbW92ZV9zcGFuLmlubmVyVGV4dCA9IGFyci5qb2luKFwiIHRoZW4gXCIpXG59XG5cbmNvbnN0IGRvX21vdmUgPSAoYWNjOiBudW1iZXJbXSkgPT4ge1xuICBsZXQgbW92ZSA9IGFnZW50Lm1vdmUoKVxuICBnYW1lLmRvX3BsYXllcl90dXJuKG1vdmUpXG4gIGlmKCFnYW1lLmJvYXJkLnR1cm5fcGxheWVyXzEpe1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9fbW92ZShbLi4uYWNjLCBtb3ZlXSlcbiAgICB9LCA2MDApXG4gIH1lbHNle1xuICAgIHdhaXRpbmdfZm9yX21vdmUgPSB0cnVlXG4gICAgZHJhd19haV9tb3ZlcyhbLi4uYWNjLCBtb3ZlXSlcbiAgfVxufVxuXG5jb25zdCBkb19haV9zdHVmZiA9ICgpID0+IHtcbiAgaWYoIWdhbWUuYm9hcmQudHVybl9wbGF5ZXJfMSlcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvX21vdmUoW10pXG4gICAgfSwgNDAwKTtcbn1cblxuY29uc3Qgbm9fYWkgPSAoKSA9PiB7fTtcblxubGV0IGNoZWNrYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJBSVwiKVxubGV0IGNoZWNrZWRfc3RhdGUgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+Y2hlY2tib3gpLmNoZWNrZWRcblxubGV0IHdhaXRpbmdfZm9yX21vdmUgPSB0cnVlXG5cbmNvbnN0IHBpdF9jbGljayA9IChwbGF5ZXI6IHN0cmluZykgPT4gKGU6IEV2ZW50KSA9PiB7XG4gIGNvbnN0IHRhcmdldCA9IChlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KVxuICBjb25zdCBwbGF5ZXJfaWQgPSBwbGF5ZXIgPT09ICdvbmUnXG4gIGlmIChnYW1lLmJvYXJkLnR1cm5fcGxheWVyXzEgPT09IHBsYXllcl9pZCAmJiB3YWl0aW5nX2Zvcl9tb3ZlKSB7XG4gICAgd2FpdGluZ19mb3JfbW92ZSA9IGZhbHNlXG4gICAgY29uc3QgcGl0ID0gcGFyc2VJbnQodGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1waXQnKT8/ICcwJywgMTApXG4gICAgaWYgKCFnYW1lLmRvX3BsYXllcl90dXJuKHBpdCkpIHtcbiAgICAgIHdhaXRpbmdfZm9yX21vdmUgPSB0cnVlXG4gICAgfVxuICB9XG59XG4vKipcbiAqIEluaXRpYWxpemUgcGl0IGVsZW1lbnRzIGFzXG4gKiBAcGFyYW0ge1N0cmluZ30gICBwbGF5ZXIgVGhlIHBsYXllciB3aG8gdGhlIHJvdyBiZWxvbmdzIHRvXG4gKiBAcGFyYW0ge05vZGVMaXN0fSByb3cgICAgVGhlIHBpdCBlbGVtZW50cyB0byBpbml0aWFsaXplXG4gKi9cbmNvbnN0IHBpdF9jbGlja19zdGF0ZSA9IChwbGF5ZXI6IHN0cmluZywgcm93OiBOb2RlTGlzdCwgaW5pdDogYm9vbGVhbikgPT4ge1xuICBmb3IgKGxldCBwaXQgPSAwOyBwaXQgPCByb3cubGVuZ3RoOyBwaXQrKykge1xuICAgIChyb3dbcGl0XSBhcyBIVE1MRWxlbWVudCkuc2V0QXR0cmlidXRlKCdkYXRhLXBpdCcsIHBpdC50b1N0cmluZygpKVxuICAgIHJvd1twaXRdLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW5pdD8gcGl0X2NsaWNrKHBsYXllcikgOiBudWxsKVxuICB9XG59XG5cbnBpdF9jbGlja19zdGF0ZSgnb25lJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQnKSwgdHJ1ZSlcbnBpdF9jbGlja19zdGF0ZSgndHdvJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQnKSwgIWNoZWNrZWRfc3RhdGUpXG5cbmNvbnN0IG5ld0dhbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmV3LWdhbWUnKVxuaWYobmV3R2FtZSl7XG4gIG5ld0dhbWUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgLy8gZ2FtZS5yZXNldF9nYW1lKClcbiAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcbiAgfSlcbn1cblxuY2hlY2tib3g/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgbGV0IGVsID0gZS5zcmNFbGVtZW50XG4gIGlmKGVsIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCl7XG4gICAgaWYoZWwuY2hlY2tlZCl7XG4gICAgICBwaXRfY2xpY2tfc3RhdGUoJ3R3bycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLXR3byAucGl0JyksIGZhbHNlKVxuICAgICAgZ2FtZS5lbmFibGVBaShkb19haV9zdHVmZilcbiAgICAgIGlmKCFnYW1lLmJvYXJkLnR1cm5fcGxheWVyXzEpXG4gICAgICAgIGdhbWUubmV3X3JvdW5kX2NhbGxiYWNrKCk7XG4gICAgfWVsc2V7XG4gICAgICBwaXRfY2xpY2tfc3RhdGUoJ3R3bycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb3cucGxheWVyLXR3byAucGl0JyksIHRydWUpXG4gICAgICBnYW1lLmVuYWJsZUFpKG5vX2FpKVxuICAgIH1cbiAgICBcbiAgfVxufSlcblxuaWYoY2hlY2tlZF9zdGF0ZSkgZ2FtZS5lbmFibGVBaShkb19haV9zdHVmZikiXX0=
