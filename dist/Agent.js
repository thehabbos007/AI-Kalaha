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
//# sourceMappingURL=Agent.js.map