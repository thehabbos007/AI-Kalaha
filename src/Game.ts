
import { Board } from './Board';

const format = (stones: number) => {
  return stones === 0 ? null : stones + ''
}

export class Game {
  board: Board
  current_player_store = document.querySelector('.store.player-one p')
  current_player_pits = document.querySelectorAll('.row.player-one .pit p')

  other_player_store = document.querySelector('.store.player-two p')
  other_player_pits = document.querySelectorAll('.row.player-two .pit p')


  constructor(private enable_render: boolean = true) {
    this.board = new Board(this)
  }

  get player_text () {
    return this.board.turn_player_1 ? 'one' : 'two';
  } 

  /**
   * Refresh the query selectors and update pit stones
   */
  public init(){
    if(!this.enable_render) return;
    this.refresh_queries()
    this.draw_all_stones()
  }
  /**
	  * Retrieve the name of the player not currently having a turn
	  * @return {String}
	  */
	public get_other_player() {
		return !this.board.turn_player_1
	}

	/**
	 * Run the query selectors for the pits
	 */
	public refresh_queries() {
		this.current_player_pits = document.querySelectorAll('.row.player-one .pit p')
    this.current_player_store = document.querySelector('.store.player-one p')
    
		this.other_player_pits = document.querySelectorAll('.row.player-two .pit p')
		this.other_player_store = document.querySelector('.store.player-two p')
	}

	/**
	 * Perform the move for a player
	 * @param {Number} pit - The pit number chosen
	 * @returns {Boolean} true if the game is now over
	 */
	public do_player_turn(pit: number) {
		// perform the player's action
		const turn_over = this.board.move_stones(pit)

		// make sure that a player hasn't run out of stones
		if (this.check_game_over()) {
			// this.reset_game()
			return true
		}

		// change the player if the current turn is ended
		if (turn_over) {
			this.switch_turn()
		}

    return false
	}

	/**
	 * Change the user currently having a turn
	 */
	public switch_turn() {
		this.board.turn_player_1 = this.get_other_player()
    this.draw_all_stones()

    setTimeout(() => {
      document.body.setAttribute('data-player', this.player_text)
      const current_player = document.querySelector('.current-player')
			if(current_player){
        current_player.textContent = this.player_text
      }
		}, 200 )
	}

	/**
	 * Check if the game should end
	 * @returns {Boolean} Whether the game is over
	 */
	public check_game_over() {
		const winner = this.board.check_winner()

		if (winner < 0) {
			return false
		}

		const status = document.querySelector('.status')

    // Determine which player holds the most stones
    if (this.enable_render && status){
  		document.body.classList.add('game-over')

      if (1 === winner) {
        status.textContent = 'Player one wins!'
        document.body.setAttribute('data-player', 'one')
      } else if (2 === winner) {
        status.textContent = 'Player two wins!'
        document.body.setAttribute('data-player', 'two')
      } else {
        document.body.setAttribute('data-player', '')
        status.textContent = 'Draw!'
      }
    }

		this.board.turn_player_1 = true
		return true
  }
  /**
   * Update the stones on the page
   */
  public draw_all_stones() {
    if(!this.enable_render) return;

    let current_store = this.board.get_store(true)
    let other_store = this.board.get_store(false)

    let current_offset = this.board.get_offset(true)
    let other_offset = this.board.get_offset(false)

    if(this.current_player_store)
      this.current_player_store.textContent = format(current_store)

    if(this.other_player_store)
      this.other_player_store.textContent = format(other_store)

    for (let pit = 0; pit < 6; pit++) {
        this.current_player_pits[pit].textContent = format(this.board.current_pits[current_offset+pit])
        this.other_player_pits[pit].textContent = format(this.board.current_pits[other_offset+pit])
    }
  }

  public draw_stones(pit: number) {
    if(!this.enable_render) return;
   
    let current_store = this.board.get_store(true)
    let other_store = this.board.get_store(false)

    let current_offset = this.board.get_offset(true)
    let other_offset = this.board.get_offset(false)

    if (pit === 6) {
      if(this.current_player_store)
        this.current_player_store.textContent = format(current_store)
    } else if(pit === 13) {
      if(this.other_player_store)
        this.other_player_store.textContent = format(other_store)
    } else if (pit < 6) {
        this.current_player_pits[pit].textContent = format(this.board.current_pits[current_offset+pit])
    } else if (pit > 6) {
        pit -= 7
        this.other_player_pits[pit].textContent = format(this.board.current_pits[other_offset+pit])
    }
}
}
