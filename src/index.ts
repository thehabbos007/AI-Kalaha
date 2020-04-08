import { Game } from "./Game"
import { Agent } from "./Agent"
import { Board } from "./Board"

const game = new Game()
// game.load_game()
game.init()
const agent = new Agent(game.board)
const ai_move_span = document.getElementById("moves")

const draw_ai_moves = (arr: number[]) =>{
  console.log(arr)
  if(ai_move_span)
    ai_move_span.innerText = arr.join(" then ")
}

const do_move = (acc: number[]) => {
  let move = agent.move()
  game.do_player_turn(move)
  if(!game.board.turn_player_1){
    setTimeout(() => {
      do_move([...acc, move])
    }, 600)
  }else{
    waiting_for_move = true
    draw_ai_moves([...acc, move])
  }
}

const do_ai_stuff = () => {
  if(!game.board.turn_player_1)
    setTimeout(() => {
      do_move([])
    }, 400);
}

const no_ai = () => {};

let checkbox = document.getElementById("AI")
let checked_state = (<HTMLInputElement>checkbox).checked

let waiting_for_move = true

const pit_click = (player: string) => (e: Event) => {
  const target = (e.target as HTMLInputElement)
  const player_id = player === 'one'
  if (game.board.turn_player_1 === player_id && waiting_for_move) {
    waiting_for_move = false
    const pit = parseInt(target.getAttribute('data-pit')?? '0', 10)
    if (!game.do_player_turn(pit)) {
      waiting_for_move = true
    }
  }
}
/**
 * Initialize pit elements as
 * @param {String}   player The player who the row belongs to
 * @param {NodeList} row    The pit elements to initialize
 */
const pit_click_state = (player: string, row: NodeList, init: boolean) => {
  for (let pit = 0; pit < row.length; pit++) {
    (row[pit] as HTMLElement).setAttribute('data-pit', pit.toString())
    row[pit].addEventListener('click', init? pit_click(player) : null)
  }
}

pit_click_state('one', document.querySelectorAll('.row.player-one .pit'), true)
pit_click_state('two', document.querySelectorAll('.row.player-two .pit'), !checked_state)

const newGame = document.querySelector('.new-game')
if(newGame){
  newGame.addEventListener('click', () => {
    // game.reset_game()
    window.location.reload()
  })
}

checkbox?.addEventListener('change', function(e) {
  let el = e.srcElement
  if(el instanceof HTMLInputElement){
    if(el.checked){
      pit_click_state('two', document.querySelectorAll('.row.player-two .pit'), false)
      game.enableAi(do_ai_stuff)
      if(!game.board.turn_player_1)
        game.new_round_callback();
    }else{
      pit_click_state('two', document.querySelectorAll('.row.player-two .pit'), true)
      game.enableAi(no_ai)
    }
    
  }
})

if(checked_state) game.enableAi(do_ai_stuff)