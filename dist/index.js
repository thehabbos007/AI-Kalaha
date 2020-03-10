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
            var pit = parseInt((_a = target.getAttribute('data-pit')) !== null && _a !== void 0 ? _a : '0', 10);
            console.log(pit);
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
//# sourceMappingURL=index.js.map