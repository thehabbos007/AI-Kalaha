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
//# sourceMappingURL=index.js.map