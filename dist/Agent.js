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
//# sourceMappingURL=Agent.js.map