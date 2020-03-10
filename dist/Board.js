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
        var current_store = this.get_store(this.turn_player_1);
        if (this.get_stones(pit) < 1) {
            return false;
        }
        var stones = this.get_stones(pit);
        this.set_stones(pit, 0);
        this.game.draw_stones(pit);
        while (stones > 0) {
            ++pit;
            if (pit > 12) {
                pit = 0;
            }
            this.add_stones(pit, 1);
            stones--;
            this.game.draw_stones(pit);
        }
        var inverse = pit + 7 % this.current_pits.length;
        if (pit < 6 && this.current_pits[pit] === 1 && this.current_pits[inverse] > 0) {
            this.current_pits[current_store] += this.current_pits[inverse] + 1;
            this.game.draw_stones(6);
            this.current_pits[pit] = 0;
            this.current_pits[inverse] = 0;
            this.game.draw_stones(pit);
            this.game.draw_stones(12 - pit);
        }
        return pit !== 6;
    };
    Board.prototype.get_store = function (player_turn) {
        var half = (this.current_pits.length / 2) - 1;
        return player_turn ? half : half * 2 + 1;
    };
    Board.prototype.get_side_length = function () {
        return this.current_pits.length / 2 - 1;
    };
    Board.prototype.get_board_index = function (board) {
        return [0, this.get_side_length(),
            this.get_side_length() + 1, this.current_pits.length - 1];
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
        var p1_store = this.current_pits[this.get_store(true)];
        var p2_store = this.current_pits[this.get_store(false)];
        if (p1_store > p2_store) {
            return this.game.player === 'two' ? 2 : 1;
        }
        else {
            return 0;
        }
    };
    ;
    return Board;
}());
exports.Board = Board;
//# sourceMappingURL=Board.js.map