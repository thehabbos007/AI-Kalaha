(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Board_1 = require("./Board");
var format = function (stones) {
    return stones === 0 ? null : stones + "";
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
        if (game.player === player && waiting_for_move) {
            waiting_for_move = false;
            var pit = parseInt((_a = target.getAttribute('data-pit')) !== null && _a !== void 0 ? _a : "0");
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

},{"./Game":2}]},{},[3]);
