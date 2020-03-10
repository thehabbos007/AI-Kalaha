"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Board_1 = require("./Board");
var format = function (stones) {
    return stones === 0 ? null : stones + '';
};
var Game = (function () {
    function Game() {
        this.player = 'one';
        this.current_player_store = document.querySelector('.store.player-' + this.player + ' p');
        this.current_player_pits = document.querySelectorAll('.row.player-' + this.player + ' .pit p');
        this.other_player_store = document.querySelector('.store.player-' + this.get_other_player() + ' p');
        this.other_player_pits = document.querySelectorAll('.row.player-' + this.get_other_player() + ' .pit p');
        this.board = new Board_1.Board(this);
    }
    Game.prototype.init = function () {
        this.refresh_queries();
        this.draw_all_stones();
    };
    Game.prototype.get_other_player = function () {
        return this.player === 'one' ? 'two' : 'one';
    };
    Game.prototype.refresh_queries = function () {
        this.current_player_pits = document.querySelectorAll('.row.player-' + this.player + ' .pit p');
        this.other_player_pits = document.querySelectorAll('.row.player-' + this.get_other_player() + ' .pit p');
        this.current_player_store = document.querySelector('.store.player-' + this.player + ' p');
        this.other_player_store = document.querySelector('.store.player-' + this.get_other_player() + ' p');
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
        this.player = this.get_other_player();
        this.board.flip_board();
        this.refresh_queries();
        this.draw_all_stones();
        var player = this.player;
        setTimeout(function () {
            document.body.setAttribute('data-player', player);
            var current_player = document.querySelector('.current-player');
            if (current_player) {
                current_player.textContent = player;
            }
        }, 700);
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
        this.player = '';
        return true;
    };
    Game.prototype.draw_all_stones = function () {
        if (this.current_player_store)
            this.current_player_store.textContent = format(this.board.current_store);
        if (this.other_player_store)
            this.other_player_store.textContent = format(this.board.other_store);
        for (var pit = 0; pit < 6; pit++) {
            this.current_player_pits[pit].textContent = format(this.board.current_pits[pit]);
            this.other_player_pits[pit].textContent = format(this.board.other_pits[pit]);
        }
    };
    Game.prototype.draw_stones = function (pit) {
        if (pit === 6) {
            if (this.current_player_store)
                this.current_player_store.textContent = format(this.board.current_store);
        }
        else if (pit === 13) {
            if (this.other_player_store)
                this.other_player_store.textContent = format(this.board.other_store);
        }
        else if (pit < 6) {
            this.current_player_pits[pit].textContent = format(this.board.current_pits[pit]);
        }
        else if (pit > 6) {
            pit -= 7;
            this.other_player_pits[pit].textContent = format(this.board.other_pits[pit]);
        }
    };
    return Game;
}());
exports.Game = Game;
//# sourceMappingURL=Game.js.map