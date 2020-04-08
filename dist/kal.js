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
        console.log(__spreadArrays(acc, [move]));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2hvbWUvYWhtYWQvLm52bS92ZXJzaW9ucy9ub2RlL3YxMy4xMS4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL3NyYy9zcmMvQWdlbnQudHMiLCJzcmMvc3JjL3NyYy9Cb2FyZC50cyIsInNyYy9zcmMvc3JjL0dhbWUudHMiLCJzcmMvc3JjL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsK0JBQTJCO0FBSzNCO0lBRUksZUFBb0IsY0FBcUI7UUFBckIsbUJBQWMsR0FBZCxjQUFjLENBQU87UUFEekMsVUFBSyxHQUFHLENBQUMsQ0FBQTtJQUNvQyxDQUFDO0lBRXRDLDJCQUFXLEdBQW5CLFVBQW9CLEtBQVk7UUFDNUIsSUFBSSxVQUFVLEdBQUcsSUFBSSxXQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDaEMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUN6QyxVQUFVLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQTtRQUM5QixVQUFVLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQTtRQUNoQyxPQUFPLFdBQVcsQ0FBQTtJQUN0QixDQUFDO0lBRU0sb0JBQUksR0FBWDtRQUFBLGlCQWNDO1FBYkcsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDeEQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUU1QyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsTUFBTSxJQUFJLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFJLENBQUMsS0FBSyxDQUFDLEVBQW5FLENBQW1FLENBQUMsQ0FBQTtRQUV2RyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxPQUFSLElBQUksRUFBUSxNQUFNLENBQUMsQ0FBQTtRQUVuQyxJQUFJLEtBQUssR0FBZSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBSyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUE7UUFHckUsSUFBSSxVQUFVLEdBQWEsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLEVBQWpCLENBQWlCLENBQUM7YUFDOUIsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFKLENBQUksQ0FBQyxDQUFBO1FBQy9DLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0lBQ3BFLENBQUM7SUFFTyx3QkFBUSxHQUFoQixVQUFpQixLQUFZO1FBRXpCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMvRCxPQUFPLFVBQVUsQ0FBQTtJQUNyQixDQUFDO0lBRU8sMkJBQVcsR0FBbkIsVUFBb0IsS0FBWTtRQUM1QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFBO1FBRWhDLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDMUIsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtRQUMzQixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRTdCLE9BQU8sS0FBSyxDQUFDLFlBQVk7YUFDcEIsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUExQyxDQUEwQyxDQUFDO2FBQ3pELE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsR0FBRyxDQUFDLEVBQUwsQ0FBSyxDQUFDO2FBQ2xCLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsR0FBRyxRQUFRLEVBQVosQ0FBWSxDQUFDLENBQUE7SUFDL0IsQ0FBQztJQUVPLHVCQUFPLEdBQWYsVUFBZ0IsS0FBWSxFQUFFLEtBQWEsRUFBRSxJQUFZLEVBQUUsSUFBWSxFQUFFLEtBQWE7UUFBdEYsaUJBMEJDO1FBekJHLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFMUMsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFdEMsSUFBSSxZQUFZLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFBO1FBQzlDLElBQUcsS0FBSyxJQUFJLENBQUMsSUFBSSxZQUFZLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRXJGLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDNUMsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBO1FBRXJELE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQSxNQUFNO1lBQ2xCLElBQUksU0FBUyxHQUFHLEtBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUUxRSxJQUFHLFlBQVksRUFBQztnQkFDWixXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUE7Z0JBQzlDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTthQUN2QztpQkFBSTtnQkFDRCxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUE7Z0JBQzlDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQTthQUNyQztZQUNELElBQUcsSUFBSSxJQUFJLEtBQUs7Z0JBQUUsT0FBTyxXQUFXLENBQUE7UUFFeEMsQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLFdBQVcsQ0FBQTtJQUN0QixDQUFDO0lBRUwsWUFBQztBQUFELENBM0VBLEFBMkVDLElBQUE7QUEzRVksc0JBQUs7Ozs7O0FDRGxCO0lBT0UsZUFBWSxJQUFVLEVBQ0gsWUFBeUQsRUFDekQsYUFBb0I7UUFEcEIsNkJBQUEsRUFBQSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6RCw4QkFBQSxFQUFBLG9CQUFvQjtRQURwQixpQkFBWSxHQUFaLFlBQVksQ0FBNkM7UUFDekQsa0JBQWEsR0FBYixhQUFhLENBQU87UUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7SUFDbEIsQ0FBQztJQUVELHFCQUFLLEdBQUwsVUFBTSxVQUFnQjtRQUNwQixPQUFPLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtJQUM3RSxDQUFDO0lBT00sMEJBQVUsR0FBakIsVUFBa0IsR0FBVztRQUMzQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDL0IsQ0FBQztJQU9NLDBCQUFVLEdBQWpCLFVBQWtCLEdBQVcsRUFBRSxNQUFjO1FBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFBO0lBQ2pDLENBQUM7SUFPTSwwQkFBVSxHQUFqQixVQUFrQixHQUFXLEVBQUUsTUFBYztRQUMzQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQTtJQUNsQyxDQUFDO0lBT00sMkJBQVcsR0FBbEIsVUFBbUIsR0FBVztRQUM1QixHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO1FBQ3hDLElBQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDbEUsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUVqRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzVCLE9BQU8sS0FBSyxDQUFBO1NBQ2I7UUFHRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRTFCLE9BQU8sTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNqQixHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUE7WUFHMUMsSUFBSSxHQUFHLElBQUksZUFBZSxFQUFFO2dCQUMxQixHQUFHLEdBQUcsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUE7YUFDdkQ7WUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN2QixNQUFNLEVBQUUsQ0FBQTtZQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQzNCO1FBR0QsSUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFBO1FBQ3hELElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBRTNFLElBQUksYUFBYSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBR25GLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN0RSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1lBR3hDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQy9CO1FBR0QsT0FBTyxHQUFHLEtBQUssaUJBQWlCLENBQUE7SUFDbEMsQ0FBQztJQUVNLCtCQUFlLEdBQXRCLFVBQXVCLFdBQW9CO1FBQ3pDLElBQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQy9DLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQzFDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixXQUFvQjtRQUNuQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQzdDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUMvQixDQUFDO0lBRU0sMEJBQVUsR0FBakIsVUFBa0IsV0FBb0I7UUFDcEMsSUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDL0MsT0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRU0sK0JBQWUsR0FBdEI7UUFDRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUtNLCtCQUFlLEdBQXRCLFVBQXVCLEtBQWU7UUFDbEMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQzFCLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUE7SUFDaEUsQ0FBQztJQUVNLHVDQUF1QixHQUE5QixVQUErQixHQUFXLEVBQUUsUUFBaUI7UUFDckQsSUFBQSw0Q0FBa0YsRUFBakYsZ0JBQVEsRUFBRSxnQkFBUSxFQUFFLGdCQUFRLEVBQUUsZ0JBQW1ELENBQUE7UUFFeEYsSUFBRyxRQUFRLEVBQUM7WUFDVixPQUFPLENBQUMsR0FBRyxJQUFJLFFBQVEsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUE7U0FDM0M7YUFBSTtZQUNILE9BQU8sQ0FBQyxHQUFHLElBQUksUUFBUSxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQTtTQUMzQztJQUNILENBQUM7SUFFTSwrQkFBZSxHQUF0QixVQUF1QixXQUFvQixFQUFFLEtBQWU7UUFDMUQsT0FBTyxXQUFXO1lBQ2hCLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDeEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQTtJQUN2RSxDQUFDO0lBT00sNEJBQVksR0FBbkI7UUFBQSxpQkE4Q0M7UUF4Q0MsSUFBTSxZQUFZLEdBQUcsVUFBQyxNQUFlO1lBQ25DLE9BQU8sS0FBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSSxDQUFDLFlBQVksQ0FBQztpQkFDMUMsS0FBSyxDQUFDLFVBQUMsTUFBYyxJQUFLLE9BQUEsTUFBTSxLQUFLLENBQUMsRUFBWixDQUFZLENBQUMsQ0FBQTtRQUNyRCxDQUFDLENBQUE7UUFFRCxJQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdkMsSUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3hDLElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDL0MsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUloRCxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyxDQUFDLENBQUE7U0FDVjtRQUdELElBQUksR0FBRyxDQUFBO1FBQ0QsSUFBQSw0Q0FBa0YsRUFBakYsZ0JBQVEsRUFBRSxnQkFBUSxFQUFFLGdCQUFRLEVBQUUsZ0JBQW1ELENBQUE7UUFDeEYsSUFBSSxZQUFZLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFFakMsS0FBSyxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDekQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7YUFDM0I7U0FFRjthQUFNLElBQUksWUFBWSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3hDLEtBQUssR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3pELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQzNCO1NBQ0Y7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO1FBQzNCLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckMsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUV0QyxJQUFJLFFBQVEsSUFBSSxRQUFRO1lBQ3BCLE9BQU8sQ0FBQyxDQUFBO1FBQ1osT0FBTyxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBQ0gsWUFBQztBQUFELENBaE1BLEFBZ01DLElBQUE7QUFoTVksc0JBQUs7Ozs7O0FDSGxCLGlDQUErQjtBQUUvQixJQUFNLE1BQU0sR0FBRyxVQUFDLE1BQWM7SUFDNUIsT0FBTyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFDMUMsQ0FBQyxDQUFBO0FBRUQ7SUFTRSxjQUFtQixhQUFvQjtRQUFwQiw4QkFBQSxFQUFBLG9CQUFvQjtRQUFwQixrQkFBYSxHQUFiLGFBQWEsQ0FBTztRQVB2Qyx5QkFBb0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFDcEUsd0JBQW1CLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDLENBQUE7UUFFekUsdUJBQWtCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO1FBQ2xFLHNCQUFpQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO1FBQ3ZFLHVCQUFrQixHQUFpQixjQUFPLENBQUMsQ0FBQztRQUcxQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzlCLENBQUM7SUFFRCx1QkFBUSxHQUFSLFVBQVMsUUFBc0I7UUFDN0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQztJQUNyQyxDQUFDO0lBRUQsc0JBQUksNkJBQVc7YUFBZjtZQUNFLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO1FBQ2pELENBQUM7OztPQUFBO0lBS00sbUJBQUksR0FBWDtRQUNFLElBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYTtZQUFFLE9BQU07UUFDOUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUN4QixDQUFDO0lBS0ssK0JBQWdCLEdBQXZCO1FBQ0MsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFBO0lBQ2pDLENBQUM7SUFLTSw4QkFBZSxHQUF0QjtRQUNDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtRQUM1RSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO1FBRTNFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtRQUM1RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO0lBQ3hFLENBQUM7SUFPTSw2QkFBYyxHQUFyQixVQUFzQixHQUFXO1FBRWhDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRzdDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFO1lBRTNCLE9BQU8sSUFBSSxDQUFBO1NBQ1g7UUFHRCxJQUFJLFNBQVMsRUFBRTtZQUNYLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUNsQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtTQUM1QjtRQUVDLE9BQU8sS0FBSyxDQUFBO0lBQ2YsQ0FBQztJQUtNLDBCQUFXLEdBQWxCO1FBQUEsaUJBWUM7UUFYRSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtRQUNsRCxJQUFHLENBQUMsSUFBSSxDQUFDLGFBQWE7WUFBRSxPQUFPO1FBQy9CLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtRQUV0QixVQUFVLENBQUM7O1lBQ1QsTUFBQSxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQywwQ0FBRSxZQUFZLENBQUMsYUFBYSxFQUFFLEtBQUksQ0FBQyxXQUFXLEVBQUM7WUFDaEYsSUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1lBQ25FLElBQUcsY0FBYyxFQUFDO2dCQUNiLGNBQWMsQ0FBQyxXQUFXLEdBQUcsS0FBSSxDQUFDLFdBQVcsQ0FBQTthQUM5QztRQUNMLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNSLENBQUM7SUFNTSw4QkFBZSxHQUF0Qjs7UUFDQyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFBO1FBRXhDLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNmLE9BQU8sS0FBSyxDQUFBO1NBQ1o7UUFFRCxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRzlDLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxNQUFNLEVBQUM7WUFDakMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBRXRDLElBQUksQ0FBQyxLQUFLLE1BQU0sRUFBRTtnQkFDaEIsTUFBTSxDQUFDLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQTtnQkFDdkMsTUFBQSxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQywwQ0FBRSxZQUFZLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBQzthQUN0RTtpQkFBTSxJQUFJLENBQUMsS0FBSyxNQUFNLEVBQUU7Z0JBQ3ZCLE1BQU0sQ0FBQyxXQUFXLEdBQUcsa0JBQWtCLENBQUE7Z0JBQ3ZDLE1BQUEsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsMENBQUUsWUFBWSxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUM7YUFDdEU7aUJBQU07Z0JBQ0wsTUFBQSxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQywwQ0FBRSxZQUFZLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBQztnQkFDbEUsTUFBTSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUE7YUFDN0I7U0FDRjtRQUVILElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtRQUMvQixPQUFPLElBQUksQ0FBQTtJQUNYLENBQUM7SUFJTSw4QkFBZSxHQUF0QjtRQUNFLElBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYTtZQUFFLE9BQU07UUFFOUIsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDOUMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFN0MsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFL0MsSUFBRyxJQUFJLENBQUMsb0JBQW9CO1lBQzFCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBRS9ELElBQUcsSUFBSSxDQUFDLGtCQUFrQjtZQUN4QixJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUUzRCxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzlCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGNBQWMsR0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQy9GLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFlBQVksR0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1NBQzlGO0lBQ0gsQ0FBQztJQUVNLDBCQUFXLEdBQWxCLFVBQW1CLEdBQVc7UUFDNUIsSUFBRyxDQUFDLElBQUksQ0FBQyxhQUFhO1lBQUUsT0FBTTtRQUU5QixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUU3QyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoRCxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUUvQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUU7WUFDYixJQUFHLElBQUksQ0FBQyxvQkFBb0I7Z0JBQzFCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1NBQ2hFO2FBQU0sSUFBRyxHQUFHLEtBQUssRUFBRSxFQUFFO1lBQ3BCLElBQUcsSUFBSSxDQUFDLGtCQUFrQjtnQkFDeEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUE7U0FDNUQ7YUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7WUFDaEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsY0FBYyxHQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7U0FDbEc7YUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7WUFDaEIsR0FBRyxJQUFJLENBQUMsQ0FBQTtZQUNSLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFlBQVksR0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1NBQzlGO0lBQ0wsQ0FBQztJQUNELFdBQUM7QUFBRCxDQXZLQSxBQXVLQyxJQUFBO0FBdktZLG9CQUFJOzs7Ozs7Ozs7Ozs7QUNQakIsK0JBQTZCO0FBQzdCLGlDQUErQjtBQUcvQixJQUFNLElBQUksR0FBRyxJQUFJLFdBQUksRUFBRSxDQUFBO0FBRXZCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNYLElBQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUVuQyxJQUFNLE9BQU8sR0FBRyxVQUFDLEdBQWE7SUFDNUIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDekIsSUFBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFDO1FBQzNCLFVBQVUsQ0FBQztZQUNULE9BQU8sZ0JBQUssR0FBRyxHQUFFLElBQUksR0FBRSxDQUFBO1FBQ3pCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtLQUNSO1NBQUk7UUFDSCxnQkFBZ0IsR0FBRyxJQUFJLENBQUE7UUFDdkIsT0FBTyxDQUFDLEdBQUcsZ0JBQUssR0FBRyxHQUFFLElBQUksR0FBRSxDQUFDO0tBQzdCO0FBQ0gsQ0FBQyxDQUFBO0FBRUQsSUFBTSxXQUFXLEdBQUc7SUFDbEIsSUFBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYTtRQUMxQixVQUFVLENBQUM7WUFDVCxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDYixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDWixDQUFDLENBQUE7QUFFRCxJQUFNLEtBQUssR0FBRyxjQUFPLENBQUMsQ0FBQztBQUV2QixJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzVDLElBQUksYUFBYSxHQUFzQixRQUFTLENBQUMsT0FBTyxDQUFBO0FBRXhELElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFBO0FBRTNCLElBQU0sU0FBUyxHQUFHLFVBQUMsTUFBYyxJQUFLLE9BQUEsVUFBQyxDQUFROztJQUM3QyxJQUFNLE1BQU0sR0FBSSxDQUFDLENBQUMsTUFBMkIsQ0FBQTtJQUM3QyxJQUFNLFNBQVMsR0FBRyxNQUFNLEtBQUssS0FBSyxDQUFBO0lBQ2xDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEtBQUssU0FBUyxJQUFJLGdCQUFnQixFQUFFO1FBQzlELGdCQUFnQixHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFNLEdBQUcsR0FBRyxRQUFRLE9BQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsbUNBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzdCLGdCQUFnQixHQUFHLElBQUksQ0FBQTtTQUN4QjtLQUNGO0FBQ0gsQ0FBQyxFQVZxQyxDQVVyQyxDQUFBO0FBTUQsSUFBTSxlQUFlLEdBQUcsVUFBQyxNQUFjLEVBQUUsR0FBYSxFQUFFLElBQWE7SUFDbkUsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDeEMsR0FBRyxDQUFDLEdBQUcsQ0FBaUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ25FO0FBQ0gsQ0FBQyxDQUFBO0FBRUQsZUFBZSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUMvRSxlQUFlLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUE7QUFFekYsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUNuRCxJQUFHLE9BQU8sRUFBQztJQUNULE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7UUFFaEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUMxQixDQUFDLENBQUMsQ0FBQTtDQUNIO0FBRUQsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFTLENBQUM7SUFDN0MsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQTtJQUNyQixJQUFHLEVBQUUsWUFBWSxnQkFBZ0IsRUFBQztRQUNoQyxJQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUM7WUFDWixlQUFlLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ2hGLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDMUIsSUFBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYTtnQkFDMUIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDN0I7YUFBSTtZQUNILGVBQWUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDL0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUNyQjtLQUVGO0FBQ0gsQ0FBQyxFQUFDO0FBRUYsSUFBRyxhQUFhO0lBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7R2FtZX0gZnJvbSAnLi9HYW1lJ1xuaW1wb3J0IHtCb2FyZH0gZnJvbSAnLi9Cb2FyZCdcblxuLy8gTWluTWF4IGFnZW50XG4vLyBBZ2VudCBpcyBhbHdheXMgcGxheWVyIDIgc28gZmFyLlxuZXhwb3J0IGNsYXNzIEFnZW50IHtcbiAgICBkZXB0aCA9IDVcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9yaWdpbmFsX2JvYXJkOiBCb2FyZCkgeyB9XG5cbiAgICBwcml2YXRlIGNsb25lX2JvYXJkKGJvYXJkOiBCb2FyZCl7XG4gICAgICAgIGxldCBnYW1lX2Nsb25lID0gbmV3IEdhbWUoZmFsc2UpXG4gICAgICAgIGxldCBib2FyZF9jbG9uZSA9IGJvYXJkLmNsb25lKGdhbWVfY2xvbmUpXG4gICAgICAgIGdhbWVfY2xvbmUuYm9hcmQgPSBib2FyZF9jbG9uZVxuICAgICAgICBnYW1lX2Nsb25lLmVuYWJsZV9yZW5kZXIgPSBmYWxzZVxuICAgICAgICByZXR1cm4gYm9hcmRfY2xvbmVcbiAgICB9XG5cbiAgICBwdWJsaWMgbW92ZSgpe1xuICAgICAgICBsZXQgY2xvbmVkX2JvYXJkID0gdGhpcy5jbG9uZV9ib2FyZCh0aGlzLm9yaWdpbmFsX2JvYXJkKVxuICAgICAgICBsZXQgb3B0aW9ucyA9IHRoaXMudmFsaWRfbW92ZXMoY2xvbmVkX2JvYXJkKVxuXG4gICAgICAgIGxldCBzY29yZXMgPSBvcHRpb25zLm1hcChvcHRpb24gPT4gdGhpcy5taW5fbWF4KGNsb25lZF9ib2FyZCwgLUluZmluaXR5LCBJbmZpbml0eSwgb3B0aW9uLCB0aGlzLmRlcHRoKSlcblxuICAgICAgICBsZXQgbWF4X3Njb3JlID0gTWF0aC5tYXgoLi4uc2NvcmVzKVxuXG4gICAgICAgIGxldCBwYWlyczogbnVtYmVyW11bXSA9IHNjb3Jlcy5tYXAoKHNjb3JlLCBpKSA9PiBbc2NvcmUsIG9wdGlvbnNbaV1dKVxuXG4gICAgICAgIC8vIGNvbnNvbGUuaW5mbyhcInBhaXJzIGZvciBvbmUgbW92ZTogXCIsIHBhaXJzKVxuICAgICAgICBsZXQgY2FuZGlkYXRlczogbnVtYmVyW10gPSBwYWlycy5maWx0ZXIoeCA9PiB4WzBdID09IG1heF9zY29yZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHggPT4geFsxXSlcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2FuZGlkYXRlcy5sZW5ndGgpXVxuICAgIH1cblxuICAgIHByaXZhdGUgZXZhbHVhdGUoYm9hcmQ6IEJvYXJkKTogbnVtYmVye1xuICAgICAgICAvLyBGaW5kIHRoZSBwYXlvZmYgb2YgYSB0ZXJtaW5hbCBzdGF0ZVxuICAgICAgICBsZXQgYm9hcmRfZXZhbCA9IGJvYXJkLmdldF9zdG9yZShmYWxzZSkgLSBib2FyZC5nZXRfc3RvcmUodHJ1ZSlcbiAgICAgICAgcmV0dXJuIGJvYXJkX2V2YWxcbiAgICB9XG5cbiAgICBwcml2YXRlIHZhbGlkX21vdmVzKGJvYXJkOiBCb2FyZCk6IG51bWJlcltde1xuICAgICAgICBsZXQgcGxheWVyID0gYm9hcmQudHVybl9wbGF5ZXJfMVxuXG4gICAgICAgIGxldCBsb3dlciA9IHBsYXllciA/IDAgOiA3XG4gICAgICAgIGxldCB1cHBlciA9IHBsYXllciA/IDUgOiAxMlxuICAgICAgICBsZXQgc3VidHJhY3QgPSBwbGF5ZXIgPyAxIDogN1xuXG4gICAgICAgIHJldHVybiBib2FyZC5jdXJyZW50X3BpdHNcbiAgICAgICAgICAgIC5tYXAoKHgsIGkpID0+IGkgPj0gbG93ZXIgJiYgaSA8PSB1cHBlciAmJiB4ID4gMCA/IGkgOiAtMSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4IC0gc3VidHJhY3QpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtaW5fbWF4KGJvYXJkOiBCb2FyZCwgYWxwaGE6IG51bWJlciwgYmV0YTogbnVtYmVyLCBtb3ZlOiBudW1iZXIsIGRlcHRoOiBudW1iZXIpOiBudW1iZXJ7XG4gICAgICAgIGxldCBjbG9uZWRfYm9hcmQgPSB0aGlzLmNsb25lX2JvYXJkKGJvYXJkKVxuICAgICAgICBcbiAgICAgICAgY2xvbmVkX2JvYXJkLmdhbWUuZG9fcGxheWVyX3R1cm4obW92ZSlcblxuICAgICAgICBsZXQgaXNfbWF4aW1pc2VyID0gIWNsb25lZF9ib2FyZC50dXJuX3BsYXllcl8xXG4gICAgICAgIGlmKGRlcHRoID09IDAgfHwgY2xvbmVkX2JvYXJkLmNoZWNrX3dpbm5lcigpID4gLTEpIHJldHVybiB0aGlzLmV2YWx1YXRlKGNsb25lZF9ib2FyZClcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IHRoaXMudmFsaWRfbW92ZXMoY2xvbmVkX2JvYXJkKVxuICAgICAgICB2YXIgYmVzdF9vcHRpb24gPSBpc19tYXhpbWlzZXIgPyAtSW5maW5pdHkgOiBJbmZpbml0eVxuXG4gICAgICAgIG9wdGlvbnMuZm9yRWFjaChvcHRpb24gPT4ge1xuICAgICAgICAgICAgbGV0IG5ld192YWx1ZSA9IHRoaXMubWluX21heChjbG9uZWRfYm9hcmQsIGFscGhhLCBiZXRhLCBvcHRpb24sIGRlcHRoIC0gMSlcblxuICAgICAgICAgICAgaWYoaXNfbWF4aW1pc2VyKXtcbiAgICAgICAgICAgICAgICBiZXN0X29wdGlvbiA9IE1hdGgubWF4KG5ld192YWx1ZSwgYmVzdF9vcHRpb24pXG4gICAgICAgICAgICAgICAgYWxwaGEgPSBNYXRoLm1heChhbHBoYSwgYmVzdF9vcHRpb24pXG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBiZXN0X29wdGlvbiA9IE1hdGgubWluKG5ld192YWx1ZSwgYmVzdF9vcHRpb24pXG4gICAgICAgICAgICAgICAgYmV0YSA9IE1hdGgubWluKGJldGEsIGJlc3Rfb3B0aW9uKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoYmV0YSA8PSBhbHBoYSkgcmV0dXJuIGJlc3Rfb3B0aW9uXG5cbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBiZXN0X29wdGlvblxuICAgIH1cblxufSIsImltcG9ydCB7R2FtZX0gZnJvbSAnLi9HYW1lJ1xuLyoqXG4gKiBNYW5hZ2VzIHRoZSBtYW5jYWxhIGJvYXJkXG4gKi9cbmV4cG9ydCBjbGFzcyBCb2FyZCB7XG4gIGdhbWU6IEdhbWVcblxuXHQvKipcblx0ICogSW5pdGlhbGlzZSBjbGFzc1xuXHQgKiBAcGFyYW0ge0dhbWV9IGdhbWVcblx0ICovXG4gIGNvbnN0cnVjdG9yKGdhbWU6IEdhbWUsXG4gICAgICAgICAgICAgIHB1YmxpYyBjdXJyZW50X3BpdHMgPSBbNCwgNCwgNCwgNCwgNCwgNCwgMCwgNCwgNCwgNCwgNCwgNCwgNCwgMF0sXG4gICAgICAgICAgICAgIHB1YmxpYyB0dXJuX3BsYXllcl8xID0gdHJ1ZSkge1xuICAgIHRoaXMuZ2FtZSA9IGdhbWVcbiAgfVxuXG4gIGNsb25lKGdhbWVfY2xvbmU6IEdhbWUpIHtcbiAgICByZXR1cm4gbmV3IEJvYXJkKGdhbWVfY2xvbmUsIHRoaXMuY3VycmVudF9waXRzLnNsaWNlKCksIHRoaXMudHVybl9wbGF5ZXJfMSlcbiAgfVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZSB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHBpdCBUaGUgcGl0IG51bWJlclxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICBUaGUgYW1vdW50IG9mIHN0b25lc1xuXHQgKi9cbiAgcHVibGljIGdldF9zdG9uZXMocGl0OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHNbcGl0XVxuICB9XG5cblx0LyoqXG5cdCAqIFNldCB0aGUgYW1vdW50IG9mIHN0b25lcyBpbiBhIHBpdFxuXHQgKiBAcGFyYW0ge051bWJlcn0gcGl0ICAgIFRoZSBwaXQgbnVtYmVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBzdG9uZXMgVGhlIGFtb3VudCBvZiBzdG9uZXNcblx0ICovXG4gIHB1YmxpYyBzZXRfc3RvbmVzKHBpdDogbnVtYmVyLCBzdG9uZXM6IG51bWJlcikge1xuICAgIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPSBzdG9uZXNcbiAgfVxuXG5cdC8qKlxuXHQgKiBBZGp1c3QgdGhlIGFtb3VudCBvZiBzdG9uZXMgaW4gYSBwaXRcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHBpdCAgICBUaGUgcGl0IG51bWJlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gc3RvbmVzIFRoZSBhbW91bnQgb2Ygc3RvbmVzXG5cdCAqL1xuICBwdWJsaWMgYWRkX3N0b25lcyhwaXQ6IG51bWJlciwgc3RvbmVzOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdICs9IHN0b25lc1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3RyaWJ1dGUgdGhlIHN0b25lcyBmcm9tIGEgcGl0IGFyb3VuZCB0aGUgYm9hcmRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHBpdCBUaGUgcGl0IHRvIGJlZ2luIGluXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IFdoZXRoZXIgdGhlIHVzZXIncyB0dXJuIGhhcyBlbmRlZFxuICAgKi9cbiAgcHVibGljIG1vdmVfc3RvbmVzKHBpdDogbnVtYmVyKSB7XG4gICAgcGl0ID0gdGhpcy50dXJuX3BsYXllcl8xID8gcGl0IDogcGl0ICsgN1xuICAgIGNvbnN0IGN1cnJlbnRfc3RvcmVfaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgodGhpcy50dXJuX3BsYXllcl8xKVxuICAgIGNvbnN0IG90aGVyX3N0b3JlX2lkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KCF0aGlzLnR1cm5fcGxheWVyXzEpXG4gICAgLy8gcmV0dXJuIGlmIHBpdCBoYXMgbm8gc3RvbmVzXG4gICAgaWYgKHRoaXMuZ2V0X3N0b25lcyhwaXQpIDwgMSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gdGFrZSBzdG9uZXMgb3V0IG9mIHBpdFxuICAgIGxldCBzdG9uZXMgPSB0aGlzLmdldF9zdG9uZXMocGl0KVxuICAgIHRoaXMuc2V0X3N0b25lcyhwaXQsIDApXG4gICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKHBpdClcblxuICAgIHdoaWxlIChzdG9uZXMgPiAwKSB7XG4gICAgICBwaXQgPSAocGl0ICsgMSkgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGhcblxuICAgICAgLy8gd3JhcCBhcm91bmQgdGhlIGJvYXJkIGJlZm9yZSByZWFjaGluZyBvdGhlciBwbGF5ZXIncyBzdG9yZVxuICAgICAgaWYgKHBpdCA9PSBvdGhlcl9zdG9yZV9pZHgpIHtcbiAgICAgICAgcGl0ID0gKG90aGVyX3N0b3JlX2lkeCArIDEpICUgdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoXG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkX3N0b25lcyhwaXQsIDEpXG4gICAgICBzdG9uZXMtLVxuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKHBpdClcbiAgICB9XG5cbiAgICAvLyBJbnZlcnQgdGhlIHBpdCBudW1iZXIgKG51bWJlciBvZiBvcHBvc2l0ZSBwaXQgaW4gb3Bwb25lbnQncyByb3cpXG4gICAgY29uc3QgaW52ZXJzZSA9ICg1IC0gcGl0ICsgNykgJSB0aGlzLmN1cnJlbnRfcGl0cy5sZW5ndGhcbiAgICBjb25zdCBpc19jYXB0dXJhYmxlID0gdGhpcy5pc193aXRoaW5fcGxheWVyX2JvdW5kcyhwaXQsIHRoaXMudHVybl9wbGF5ZXJfMSlcbiAgICAvLyBDaGVjayBmb3IgY2FwdHVyZVxuICAgIGlmIChpc19jYXB0dXJhYmxlICYmIHRoaXMuY3VycmVudF9waXRzW3BpdF0gPT09IDEgJiYgdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV0gPiAwKSB7XG5cbiAgICAgIC8vIFRyYW5zZmVyIHRoaXMgcGl0J3Mgc3RvbmVzIGFsb25nIHdpdGggb3Bwb3NpdGUgcGl0J3Mgc3RvbmVzIHRvIHN0b3JlXG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1tjdXJyZW50X3N0b3JlX2lkeF0gKz0gdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV0gKyAxXG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMoY3VycmVudF9zdG9yZV9pZHgpXG5cbiAgICAgIC8vIENsZWFyIHRoZSBwaXRzXG4gICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMFxuICAgICAgdGhpcy5jdXJyZW50X3BpdHNbaW52ZXJzZV0gPSAwXG4gICAgICB0aGlzLmdhbWUuZHJhd19zdG9uZXMocGl0KVxuICAgICAgdGhpcy5nYW1lLmRyYXdfc3RvbmVzKGludmVyc2UpXG4gICAgfVxuXG4gICAgLy8gdGhlIHVzZXIncyB0dXJuIGVuZGVkIGlmIHRoZSBzdG9uZXMgZGlkIG5vdCBlbmQgaW4gdGhlIHN0b3JhZ2UgcGl0XG4gICAgcmV0dXJuIHBpdCAhPT0gY3VycmVudF9zdG9yZV9pZHhcbiAgfVxuXG4gIHB1YmxpYyBnZXRfc3RvcmVfaW5kZXgocGxheWVyX3R1cm46IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGhhbGYgPSAodGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMikgLSAxXG4gICAgcmV0dXJuIHBsYXllcl90dXJuID8gaGFsZiA6IGhhbGYgKiAyICsgMVxuICB9XG5cbiAgcHVibGljIGdldF9zdG9yZShwbGF5ZXJfdHVybjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5nZXRfc3RvcmVfaW5kZXgocGxheWVyX3R1cm4pXG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9waXRzW2lkeF1cbiAgfVxuXG4gIHB1YmxpYyBnZXRfb2Zmc2V0KHBsYXllcl90dXJuOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBoYWxmID0gKHRoaXMuY3VycmVudF9waXRzLmxlbmd0aCAvIDIpIC0gMVxuICAgIHJldHVybiBwbGF5ZXJfdHVybiA/IDAgOiBoYWxmICsgMVxuICB9XG5cbiAgcHVibGljIGdldF9zaWRlX2xlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3BpdHMubGVuZ3RoIC8gMiAtIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGJvdW5kaW5nIGluZGljaWVzIGZvciBlYWNoIHBsYXllcidzIGJvYXJkXG4gICAqL1xuICBwdWJsaWMgZ2V0X2JvYXJkX2luZGV4KGJvYXJkOiBudW1iZXJbXSk6IG51bWJlcltdIHtcbiAgICAgIHJldHVybiBbMCwgdGhpcy5nZXRfc2lkZV9sZW5ndGgoKSxcbiAgICAgICAgICAgICB0aGlzLmdldF9zaWRlX2xlbmd0aCgpKzEsIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aC0xXVxuICB9XG5cbiAgcHVibGljIGlzX3dpdGhpbl9wbGF5ZXJfYm91bmRzKHBpdDogbnVtYmVyLCBwbGF5ZXJfMTogYm9vbGVhbik6IGJvb2xlYW57XG4gICAgY29uc3QgW3AxX2xvd2VyLCBwMV91cHBlciwgcDJfbG93ZXIsIHAyX3VwcGVyXSA9IHRoaXMuZ2V0X2JvYXJkX2luZGV4KHRoaXMuY3VycmVudF9waXRzKVxuXG4gICAgaWYocGxheWVyXzEpe1xuICAgICAgcmV0dXJuIChwaXQgPj0gcDFfbG93ZXIgJiYgcGl0IDwgcDFfdXBwZXIpXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gKHBpdCA+PSBwMl9sb3dlciAmJiBwaXQgPCBwMl91cHBlcilcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0X2JvYXJkX3NsaWNlKHBsYXllcl90dXJuOiBib29sZWFuLCBib2FyZDogbnVtYmVyW10pIDogbnVtYmVyW10ge1xuICAgIHJldHVybiBwbGF5ZXJfdHVyblxuICAgICAgPyBib2FyZC5zbGljZSgwLCB0aGlzLmdldF9zaWRlX2xlbmd0aCgpKVxuICAgICAgOiBib2FyZC5zbGljZSh0aGlzLmdldF9zaWRlX2xlbmd0aCgpKzEsIHRoaXMuY3VycmVudF9waXRzLmxlbmd0aC0xKVxuICB9XG5cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBwbGF5ZXIgaGFzIHdvblxuICAgKiBAcmV0dXJuIHtOdW1iZXJ9IC0xIGZvciBubyB3aW4sIDAgZm9yIGRyYXcsIDEgZm9yIHBsYXllciBvbmUgd2luLCAyIGZvciBwbGF5ZXIgdHdvIHdpblxuICAgKi9cbiAgcHVibGljIGNoZWNrX3dpbm5lcigpIHtcbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBhIHJvdyBvbiB0aGUgYm9hcmQgaXMgZW1wdHlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwaXRzIFRoZSBwaXRzIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBhbGwgb2YgdGhlIHBpdHMgY29udGFpbiBubyBzdG9uZXNcbiAgICAgKi9cbiAgICBjb25zdCBpc19yb3dfZW1wdHkgPSAocGxheWVyOiBib29sZWFuKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRfYm9hcmRfc2xpY2UocGxheWVyLCB0aGlzLmN1cnJlbnRfcGl0cylcbiAgICAgICAgICAgICAgICAgLmV2ZXJ5KChzdG9uZXM6IG51bWJlcikgPT4gc3RvbmVzID09PSAwKVxuICAgIH1cblxuICAgIGNvbnN0IHBsYXllcl8xX291dCA9IGlzX3Jvd19lbXB0eSh0cnVlKVxuICAgIGNvbnN0IHBsYXllcl8yX291dCA9IGlzX3Jvd19lbXB0eShmYWxzZSlcbiAgICBjb25zdCBwMV9zdG9yZV9pZHggPSB0aGlzLmdldF9zdG9yZV9pbmRleCh0cnVlKVxuICAgIGNvbnN0IHAyX3N0b3JlX2lkeCA9IHRoaXMuZ2V0X3N0b3JlX2luZGV4KGZhbHNlKVxuXG5cbiAgICAvLyB0aGUgZ2FtZSBpcyBub3Qgb3ZlciBpZiBuZWl0aGVyIHBsYXllciBoYXMgYW4gZW1wdHkgcm93XG4gICAgaWYgKCFwbGF5ZXJfMV9vdXQgJiYgIXBsYXllcl8yX291dCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuXG4gICAgLy8gTW92ZSB0aGUgc3RvbmVzIHJlbWFpbmluZyBpbiBhIHBsYXllcidzIHJvdyBpbnRvIHRoZWlyIHN0b3JlXG4gICAgbGV0IHBpdFxuICAgIGNvbnN0IFtwMV9sb3dlciwgcDFfdXBwZXIsIHAyX2xvd2VyLCBwMl91cHBlcl0gPSB0aGlzLmdldF9ib2FyZF9pbmRleCh0aGlzLmN1cnJlbnRfcGl0cylcbiAgICBpZiAocGxheWVyXzFfb3V0ICYmICFwbGF5ZXJfMl9vdXQpIHtcbiAgICAgIFxuICAgICAgZm9yIChwaXQgPSBwMl9sb3dlcjsgcGl0IDwgcDJfdXBwZXI7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3AyX3N0b3JlX2lkeF0gKz0gdGhpcy5jdXJyZW50X3BpdHNbcGl0XVxuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMFxuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChwbGF5ZXJfMl9vdXQgJiYgIXBsYXllcl8xX291dCkge1xuICAgICAgZm9yIChwaXQgPSBwMV9sb3dlcjsgcGl0IDwgcDFfdXBwZXI7IHBpdCsrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9waXRzW3AxX3N0b3JlX2lkeF0gKz0gdGhpcy5jdXJyZW50X3BpdHNbcGl0XVxuICAgICAgICB0aGlzLmN1cnJlbnRfcGl0c1twaXRdID0gMFxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZ2FtZS5kcmF3X2FsbF9zdG9uZXMoKVxuICAgIGNvbnN0IHAxX3N0b3JlID0gdGhpcy5nZXRfc3RvcmUodHJ1ZSlcbiAgICBjb25zdCBwMl9zdG9yZSA9IHRoaXMuZ2V0X3N0b3JlKGZhbHNlKVxuICAgIFxuICAgIGlmIChwMV9zdG9yZSA9PSBwMl9zdG9yZSlcbiAgICAgICAgcmV0dXJuIDBcbiAgICByZXR1cm4gcDFfc3RvcmUgPiBwMl9zdG9yZSA/IDEgOiAyXG4gIH1cbn1cbiIsIlxuaW1wb3J0IHsgQm9hcmQgfSBmcm9tICcuL0JvYXJkJ1xuXG5jb25zdCBmb3JtYXQgPSAoc3RvbmVzOiBudW1iZXIpID0+IHtcbiAgcmV0dXJuIHN0b25lcyA9PT0gMCA/IG51bGwgOiBzdG9uZXMgKyAnJ1xufVxuXG5leHBvcnQgY2xhc3MgR2FtZSB7XG4gIGJvYXJkOiBCb2FyZFxuICBjdXJyZW50X3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItb25lIHAnKVxuICBjdXJyZW50X3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQgcCcpXG5cbiAgb3RoZXJfcGxheWVyX3N0b3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0b3JlLnBsYXllci10d28gcCcpXG4gIG90aGVyX3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQgcCcpXG4gIG5ld19yb3VuZF9jYWxsYmFjazogKCgpID0+IHZvaWQpID0gKCkgPT4ge307XG5cbiAgY29uc3RydWN0b3IocHVibGljIGVuYWJsZV9yZW5kZXIgPSB0cnVlKSB7XG4gICAgdGhpcy5ib2FyZCA9IG5ldyBCb2FyZCh0aGlzKVxuICB9XG5cbiAgZW5hYmxlQWkoY2FsbGJhY2s6ICgoKSA9PiB2b2lkKSkge1xuICAgIHRoaXMubmV3X3JvdW5kX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gIH1cblxuICBnZXQgcGxheWVyX3RleHQgKCkge1xuICAgIHJldHVybiB0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPyAnb25lJyA6ICd0d28nXG4gIH0gXG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggdGhlIHF1ZXJ5IHNlbGVjdG9ycyBhbmQgdXBkYXRlIHBpdCBzdG9uZXNcbiAgICovXG4gIHB1YmxpYyBpbml0KCl7XG4gICAgaWYoIXRoaXMuZW5hYmxlX3JlbmRlcikgcmV0dXJuXG4gICAgdGhpcy5yZWZyZXNoX3F1ZXJpZXMoKVxuICAgIHRoaXMuZHJhd19hbGxfc3RvbmVzKClcbiAgfVxuICAvKipcblx0ICAqIFJldHJpZXZlIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbm90IGN1cnJlbnRseSBoYXZpbmcgYSB0dXJuXG5cdCAgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAgKi9cblx0cHVibGljIGdldF9vdGhlcl9wbGF5ZXIoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzFcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW4gdGhlIHF1ZXJ5IHNlbGVjdG9ycyBmb3IgdGhlIHBpdHNcblx0ICovXG5cdHB1YmxpYyByZWZyZXNoX3F1ZXJpZXMoKSB7XG5cdFx0dGhpcy5jdXJyZW50X3BsYXllcl9waXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItb25lIC5waXQgcCcpXG4gICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItb25lIHAnKVxuICAgIFxuXHRcdHRoaXMub3RoZXJfcGxheWVyX3BpdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCBwJylcblx0XHR0aGlzLm90aGVyX3BsYXllcl9zdG9yZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdG9yZS5wbGF5ZXItdHdvIHAnKVxuXHR9XG5cblx0LyoqXG5cdCAqIFBlcmZvcm0gdGhlIG1vdmUgZm9yIGEgcGxheWVyXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBwaXQgLSBUaGUgcGl0IG51bWJlciBjaG9zZW5cblx0ICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgdGhlIGdhbWUgaXMgbm93IG92ZXJcblx0ICovXG5cdHB1YmxpYyBkb19wbGF5ZXJfdHVybihwaXQ6IG51bWJlcikge1xuXHRcdC8vIHBlcmZvcm0gdGhlIHBsYXllcidzIGFjdGlvblxuXHRcdGNvbnN0IHR1cm5fb3ZlciA9IHRoaXMuYm9hcmQubW92ZV9zdG9uZXMocGl0KVxuXG5cdFx0Ly8gbWFrZSBzdXJlIHRoYXQgYSBwbGF5ZXIgaGFzbid0IHJ1biBvdXQgb2Ygc3RvbmVzXG5cdFx0aWYgKHRoaXMuY2hlY2tfZ2FtZV9vdmVyKCkpIHtcblx0XHRcdC8vIHRoaXMucmVzZXRfZ2FtZSgpXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblxuXHRcdC8vIGNoYW5nZSB0aGUgcGxheWVyIGlmIHRoZSBjdXJyZW50IHR1cm4gaXMgZW5kZWRcblx0XHRpZiAodHVybl9vdmVyKSB7XG4gICAgICB0aGlzLnN3aXRjaF90dXJuKClcbiAgICAgIHRoaXMubmV3X3JvdW5kX2NhbGxiYWNrKClcblx0XHR9XG5cbiAgICByZXR1cm4gZmFsc2Vcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGFuZ2UgdGhlIHVzZXIgY3VycmVudGx5IGhhdmluZyBhIHR1cm5cblx0ICovXG5cdHB1YmxpYyBzd2l0Y2hfdHVybigpIHtcbiAgICB0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPSB0aGlzLmdldF9vdGhlcl9wbGF5ZXIoKVxuICAgIGlmKCF0aGlzLmVuYWJsZV9yZW5kZXIpIHJldHVybjtcbiAgICB0aGlzLmRyYXdfYWxsX3N0b25lcygpXG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMnKT8uc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsIHRoaXMucGxheWVyX3RleHQpXG4gICAgICBjb25zdCBjdXJyZW50X3BsYXllciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jdXJyZW50LXBsYXllcicpXG5cdFx0XHRpZihjdXJyZW50X3BsYXllcil7XG4gICAgICAgIGN1cnJlbnRfcGxheWVyLnRleHRDb250ZW50ID0gdGhpcy5wbGF5ZXJfdGV4dFxuICAgICAgfVxuXHRcdH0sIDIwMClcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVjayBpZiB0aGUgZ2FtZSBzaG91bGQgZW5kXG5cdCAqIEByZXR1cm5zIHtCb29sZWFufSBXaGV0aGVyIHRoZSBnYW1lIGlzIG92ZXJcblx0ICovXG5cdHB1YmxpYyBjaGVja19nYW1lX292ZXIoKSB7XG5cdFx0Y29uc3Qgd2lubmVyID0gdGhpcy5ib2FyZC5jaGVja193aW5uZXIoKVxuXG5cdFx0aWYgKHdpbm5lciA8IDApIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblxuXHRcdGNvbnN0IHN0YXR1cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMnKVxuXG4gICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHBsYXllciBob2xkcyB0aGUgbW9zdCBzdG9uZXNcbiAgICBpZiAodGhpcy5lbmFibGVfcmVuZGVyICYmIHN0YXR1cyl7XG4gIFx0XHRkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2dhbWUtb3ZlcicpXG4gICAgICBcbiAgICAgIGlmICgxID09PSB3aW5uZXIpIHtcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ1BsYXllciBvbmUgd2lucyEnXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMnKT8uc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsICdvbmUnKVxuICAgICAgfSBlbHNlIGlmICgyID09PSB3aW5uZXIpIHtcbiAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ1BsYXllciB0d28gd2lucyEnXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMnKT8uc2V0QXR0cmlidXRlKCdkYXRhLXBsYXllcicsICd0d28nKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXR1cycpPy5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGxheWVyJywgJycpXG4gICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdEcmF3ISdcbiAgICAgIH1cbiAgICB9XG5cblx0XHR0aGlzLmJvYXJkLnR1cm5fcGxheWVyXzEgPSB0cnVlXG5cdFx0cmV0dXJuIHRydWVcbiAgfVxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdG9uZXMgb24gdGhlIHBhZ2VcbiAgICovXG4gIHB1YmxpYyBkcmF3X2FsbF9zdG9uZXMoKSB7XG4gICAgaWYoIXRoaXMuZW5hYmxlX3JlbmRlcikgcmV0dXJuXG5cbiAgICBsZXQgY3VycmVudF9zdG9yZSA9IHRoaXMuYm9hcmQuZ2V0X3N0b3JlKHRydWUpXG4gICAgbGV0IG90aGVyX3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUoZmFsc2UpXG5cbiAgICBsZXQgY3VycmVudF9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQodHJ1ZSlcbiAgICBsZXQgb3RoZXJfb2Zmc2V0ID0gdGhpcy5ib2FyZC5nZXRfb2Zmc2V0KGZhbHNlKVxuXG4gICAgaWYodGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSlcbiAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfc3RvcmUudGV4dENvbnRlbnQgPSBmb3JtYXQoY3VycmVudF9zdG9yZSlcblxuICAgIGlmKHRoaXMub3RoZXJfcGxheWVyX3N0b3JlKVxuICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUudGV4dENvbnRlbnQgPSBmb3JtYXQob3RoZXJfc3RvcmUpXG5cbiAgICBmb3IgKGxldCBwaXQgPSAwOyBwaXQgPCA2OyBwaXQrKykge1xuICAgICAgICB0aGlzLmN1cnJlbnRfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tjdXJyZW50X29mZnNldCtwaXRdKVxuICAgICAgICB0aGlzLm90aGVyX3BsYXllcl9waXRzW3BpdF0udGV4dENvbnRlbnQgPSBmb3JtYXQodGhpcy5ib2FyZC5jdXJyZW50X3BpdHNbb3RoZXJfb2Zmc2V0K3BpdF0pXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGRyYXdfc3RvbmVzKHBpdDogbnVtYmVyKSB7XG4gICAgaWYoIXRoaXMuZW5hYmxlX3JlbmRlcikgcmV0dXJuXG4gICBcbiAgICBsZXQgY3VycmVudF9zdG9yZSA9IHRoaXMuYm9hcmQuZ2V0X3N0b3JlKHRydWUpXG4gICAgbGV0IG90aGVyX3N0b3JlID0gdGhpcy5ib2FyZC5nZXRfc3RvcmUoZmFsc2UpXG5cbiAgICBsZXQgY3VycmVudF9vZmZzZXQgPSB0aGlzLmJvYXJkLmdldF9vZmZzZXQodHJ1ZSlcbiAgICBsZXQgb3RoZXJfb2Zmc2V0ID0gdGhpcy5ib2FyZC5nZXRfb2Zmc2V0KGZhbHNlKVxuXG4gICAgaWYgKHBpdCA9PT0gNikge1xuICAgICAgaWYodGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZSlcbiAgICAgICAgdGhpcy5jdXJyZW50X3BsYXllcl9zdG9yZS50ZXh0Q29udGVudCA9IGZvcm1hdChjdXJyZW50X3N0b3JlKVxuICAgIH0gZWxzZSBpZihwaXQgPT09IDEzKSB7XG4gICAgICBpZih0aGlzLm90aGVyX3BsYXllcl9zdG9yZSlcbiAgICAgICAgdGhpcy5vdGhlcl9wbGF5ZXJfc3RvcmUudGV4dENvbnRlbnQgPSBmb3JtYXQob3RoZXJfc3RvcmUpXG4gICAgfSBlbHNlIGlmIChwaXQgPCA2KSB7XG4gICAgICAgIHRoaXMuY3VycmVudF9wbGF5ZXJfcGl0c1twaXRdLnRleHRDb250ZW50ID0gZm9ybWF0KHRoaXMuYm9hcmQuY3VycmVudF9waXRzW2N1cnJlbnRfb2Zmc2V0K3BpdF0pXG4gICAgfSBlbHNlIGlmIChwaXQgPiA2KSB7XG4gICAgICAgIHBpdCAtPSA3XG4gICAgICAgIHRoaXMub3RoZXJfcGxheWVyX3BpdHNbcGl0XS50ZXh0Q29udGVudCA9IGZvcm1hdCh0aGlzLmJvYXJkLmN1cnJlbnRfcGl0c1tvdGhlcl9vZmZzZXQrcGl0XSlcbiAgICB9XG59XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4vR2FtZVwiXG5pbXBvcnQgeyBBZ2VudCB9IGZyb20gXCIuL0FnZW50XCJcbmltcG9ydCB7IEJvYXJkIH0gZnJvbSBcIi4vQm9hcmRcIlxuXG5jb25zdCBnYW1lID0gbmV3IEdhbWUoKVxuLy8gZ2FtZS5sb2FkX2dhbWUoKVxuZ2FtZS5pbml0KClcbmNvbnN0IGFnZW50ID0gbmV3IEFnZW50KGdhbWUuYm9hcmQpXG5cbmNvbnN0IGRvX21vdmUgPSAoYWNjOiBudW1iZXJbXSkgPT4ge1xuICBsZXQgbW92ZSA9IGFnZW50Lm1vdmUoKVxuICBnYW1lLmRvX3BsYXllcl90dXJuKG1vdmUpXG4gIGlmKCFnYW1lLmJvYXJkLnR1cm5fcGxheWVyXzEpe1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9fbW92ZShbLi4uYWNjLCBtb3ZlXSlcbiAgICB9LCA2MDApXG4gIH1lbHNle1xuICAgIHdhaXRpbmdfZm9yX21vdmUgPSB0cnVlXG4gICAgY29uc29sZS5sb2coWy4uLmFjYywgbW92ZV0pO1xuICB9XG59XG5cbmNvbnN0IGRvX2FpX3N0dWZmID0gKCkgPT4ge1xuICBpZighZ2FtZS5ib2FyZC50dXJuX3BsYXllcl8xKVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9fbW92ZShbXSlcbiAgICB9LCA0MDApO1xufVxuXG5jb25zdCBub19haSA9ICgpID0+IHt9O1xuXG5sZXQgY2hlY2tib3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIkFJXCIpXG5sZXQgY2hlY2tlZF9zdGF0ZSA9ICg8SFRNTElucHV0RWxlbWVudD5jaGVja2JveCkuY2hlY2tlZFxuXG5sZXQgd2FpdGluZ19mb3JfbW92ZSA9IHRydWVcblxuY29uc3QgcGl0X2NsaWNrID0gKHBsYXllcjogc3RyaW5nKSA9PiAoZTogRXZlbnQpID0+IHtcbiAgY29uc3QgdGFyZ2V0ID0gKGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpXG4gIGNvbnN0IHBsYXllcl9pZCA9IHBsYXllciA9PT0gJ29uZSdcbiAgaWYgKGdhbWUuYm9hcmQudHVybl9wbGF5ZXJfMSA9PT0gcGxheWVyX2lkICYmIHdhaXRpbmdfZm9yX21vdmUpIHtcbiAgICB3YWl0aW5nX2Zvcl9tb3ZlID0gZmFsc2VcbiAgICBjb25zdCBwaXQgPSBwYXJzZUludCh0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXBpdCcpPz8gJzAnLCAxMClcbiAgICBpZiAoIWdhbWUuZG9fcGxheWVyX3R1cm4ocGl0KSkge1xuICAgICAgd2FpdGluZ19mb3JfbW92ZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbi8qKlxuICogSW5pdGlhbGl6ZSBwaXQgZWxlbWVudHMgYXNcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIHBsYXllciBUaGUgcGxheWVyIHdobyB0aGUgcm93IGJlbG9uZ3MgdG9cbiAqIEBwYXJhbSB7Tm9kZUxpc3R9IHJvdyAgICBUaGUgcGl0IGVsZW1lbnRzIHRvIGluaXRpYWxpemVcbiAqL1xuY29uc3QgcGl0X2NsaWNrX3N0YXRlID0gKHBsYXllcjogc3RyaW5nLCByb3c6IE5vZGVMaXN0LCBpbml0OiBib29sZWFuKSA9PiB7XG4gIGZvciAobGV0IHBpdCA9IDA7IHBpdCA8IHJvdy5sZW5ndGg7IHBpdCsrKSB7XG4gICAgKHJvd1twaXRdIGFzIEhUTUxFbGVtZW50KS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGl0JywgcGl0LnRvU3RyaW5nKCkpXG4gICAgcm93W3BpdF0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBpbml0PyBwaXRfY2xpY2socGxheWVyKSA6IG51bGwpXG4gIH1cbn1cblxucGl0X2NsaWNrX3N0YXRlKCdvbmUnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci1vbmUgLnBpdCcpLCB0cnVlKVxucGl0X2NsaWNrX3N0YXRlKCd0d28nLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93LnBsYXllci10d28gLnBpdCcpLCAhY2hlY2tlZF9zdGF0ZSlcblxuY29uc3QgbmV3R2FtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uZXctZ2FtZScpXG5pZihuZXdHYW1lKXtcbiAgbmV3R2FtZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAvLyBnYW1lLnJlc2V0X2dhbWUoKVxuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKVxuICB9KVxufVxuXG5jaGVja2JveD8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICBsZXQgZWwgPSBlLnNyY0VsZW1lbnRcbiAgaWYoZWwgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KXtcbiAgICBpZihlbC5jaGVja2VkKXtcbiAgICAgIHBpdF9jbGlja19zdGF0ZSgndHdvJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQnKSwgZmFsc2UpXG4gICAgICBnYW1lLmVuYWJsZUFpKGRvX2FpX3N0dWZmKVxuICAgICAgaWYoIWdhbWUuYm9hcmQudHVybl9wbGF5ZXJfMSlcbiAgICAgICAgZ2FtZS5uZXdfcm91bmRfY2FsbGJhY2soKTtcbiAgICB9ZWxzZXtcbiAgICAgIHBpdF9jbGlja19zdGF0ZSgndHdvJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdy5wbGF5ZXItdHdvIC5waXQnKSwgdHJ1ZSlcbiAgICAgIGdhbWUuZW5hYmxlQWkobm9fYWkpXG4gICAgfVxuICAgIFxuICB9XG59KVxuXG5pZihjaGVja2VkX3N0YXRlKSBnYW1lLmVuYWJsZUFpKGRvX2FpX3N0dWZmKSJdfQ==
