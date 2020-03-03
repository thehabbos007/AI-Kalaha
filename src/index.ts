import { Game } from "./Game";


var game = new Game();
//game.load_game();

game.init();
var waiting_for_move = true;

/**
 * Initialize pit elements as
 * @param {String}   player The player who the row belongs to
 * @param {NodeList} row    The pit elements to initialize
 */
var init_pits = (player: string, row: NodeList) => {
  var onclick = function (e: Event) {
    const target = (e.target as HTMLInputElement);
    if (game.player === player && waiting_for_move) {
      waiting_for_move = false;
      var pit = parseInt(target.getAttribute('data-pit')?? "0");
      if (!game.do_player_turn(pit)) {
        waiting_for_move = true;
      }
    }
  };

  for (var pit = 0; pit < row.length; pit++) {
    (row[pit] as HTMLElement).setAttribute('data-pit', pit.toString())
    row[pit].addEventListener('click', onclick)
  }
};

init_pits('one', document.querySelectorAll('.row.player-one .pit'));
init_pits('two', document.querySelectorAll('.row.player-two .pit'));

const newGame = document.querySelector('.new-game');
if(newGame)
  newGame.addEventListener('click', () => {
    //game.reset_game();
    window.location.reload();
  })
