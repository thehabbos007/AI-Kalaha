"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Board = (function () {
    function Board(game) {
        this.game = game;
        this.current_pits = [4, 4, 4, 4, 4, 4];
        this.other_pits = [4, 4, 4, 4, 4, 4];
        this.current_store = 0;
        this.other_store = 0;
    }
    Board.prototype.flip_board = function () {
        var current_pits = this.current_pits;
        this.current_pits = this.other_pits;
        this.other_pits = current_pits;
        var current_store = this.current_store;
        this.current_store = this.other_store;
        this.other_store = current_store;
    };
    Board.prototype.get_stones = function (pit) {
        if (pit === 6) {
            return this.current_store;
        }
        else if (pit === 13) {
            return this.other_store;
        }
        else if (pit < 6) {
            return this.current_pits[pit];
        }
        else if (pit > 6) {
            return this.other_pits[pit - 7];
        }
        return NaN;
    };
    Board.prototype.set_stones = function (pit, stones) {
        if (pit === 6) {
            this.current_store = stones;
        }
        else if (pit === 13) {
            this.other_store = stones;
        }
        else if (pit < 6) {
            this.current_pits[pit] = stones;
        }
        else if (pit > 6) {
            this.other_pits[pit - 7] = stones;
        }
    };
    Board.prototype.add_stones = function (pit, stones) {
        if (pit === 6) {
            this.current_store += stones;
        }
        else if (pit === 13) {
            this.other_store += stones;
        }
        else if (pit < 6) {
            this.current_pits[pit] += stones;
        }
        else if (pit > 6) {
            this.other_pits[pit - 7] += stones;
        }
    };
    Board.prototype.move_stones = function (pit) {
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
        var inverse = 5 - pit;
        if (pit < 6 && this.current_pits[pit] === 1 && this.other_pits[inverse] > 0) {
            this.current_store += this.other_pits[inverse] + 1;
            this.game.draw_stones(6);
            this.current_pits[pit] = 0;
            this.other_pits[inverse] = 0;
            this.game.draw_stones(pit);
            this.game.draw_stones(12 - pit);
        }
        return pit !== 6;
    };
    Board.prototype.check_winner = function () {
        var is_row_empty = function (pits) {
            return pits.every(function (stones) { return stones === 0; });
        };
        var current_player_out = is_row_empty(this.current_pits);
        var other_player_out = is_row_empty(this.other_pits);
        if (!current_player_out && !other_player_out) {
            return -1;
        }
        var pit;
        if (current_player_out && !other_player_out) {
            for (pit = 0; pit < 6; pit++) {
                this.other_store += this.other_pits[pit];
                this.other_pits[pit] = 0;
            }
        }
        else if (other_player_out && !current_player_out) {
            for (pit = 0; pit < 6; pit++) {
                this.current_store += this.current_pits[pit];
                this.current_pits[pit] = 0;
            }
        }
        this.game.draw_all_stones();
        if (this.current_store > this.other_store) {
            return this.game.player === 'two' ? 2 : 1;
        }
        else if (this.other_store > this.current_store) {
            return this.game.player === 'two' ? 1 : 2;
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