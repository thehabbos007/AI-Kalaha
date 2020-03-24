import { Game } from "./Game";
import { Agent } from "./Agent";

const game = new Game();
// game.load_game();
game.init();
const agent = new Agent(game.board)

let waiting_for_move = true;

/**
 * Initialize pit elements as
 * @param {String}   player The player who the row belongs to
 * @param {NodeList} row    The pit elements to initialize
 */
const init_pits = (player: string, row: NodeList) => {
  const onclick = (e: Event) => {
    const target = (e.target as HTMLInputElement);
    const player_id = player === 'one'
    if (game.board.turn_player_1 === player_id && waiting_for_move) {
      waiting_for_move = false;
      const pit = parseInt(target.getAttribute('data-pit')?? '0', 10);
      if (!game.do_player_turn(pit)) {
        waiting_for_move = true;
      }
    }
  };

  for (let pit = 0; pit < row.length; pit++) {
    (row[pit] as HTMLElement).setAttribute('data-pit', pit.toString())
    row[pit].addEventListener('click', onclick)
  }
};

init_pits('one', document.querySelectorAll('.row.player-one .pit'));
init_pits('two', document.querySelectorAll('.row.player-two .pit'));

const newGame = document.querySelector('.new-game');
if(newGame)
  newGame.addEventListener('click', () => {
    // game.reset_game();
    window.location.reload();
  })

document.getElementById("AI")?.addEventListener('click', function(e) {
  if(!game.board.turn_player_1)
    console.log(agent.move())
})