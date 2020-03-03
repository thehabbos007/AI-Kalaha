
import { Board } from "./Board";

const format = (stones: number) => {
  return stones === 0 ? null : stones + ""
}

export class Game {
  board: Board
  player: string = 'one'
  current_player_store = document.querySelector('.store.player-' + this.player + ' p')
  current_player_pits = document.querySelectorAll('.row.player-' + this.player + ' .pit p')

  other_player_store = document.querySelector('.store.player-' + this.get_other_player() + ' p')
  other_player_pits = document.querySelectorAll('.row.player-' + this.get_other_player() + ' .pit p')


  constructor() {
    this.board = new Board(this)
  }

  /**
  * Refresh the query selectors and update pit stones
  */
  public init(){
    this.refresh_queries()
    this.draw_all_stones()
  }
  /**
	 * Retrieve the name of the player not currently having a turn
	 * @return {String}
	 */
	public get_other_player() {
		return this.player === 'one' ? 'two' : 'one'
	}

	/**
	 * Run the query selectors for the pits
	 */
	public refresh_queries() {
		this.current_player_pits = document.querySelectorAll('.row.player-' + this.player + ' .pit p')
		this.other_player_pits = document.querySelectorAll('.row.player-' + this.get_other_player() + ' .pit p')
		this.current_player_store = document.querySelector('.store.player-' + this.player + ' p')
		this.other_player_store = document.querySelector('.store.player-' + this.get_other_player() + ' p')
	}

	/**
	 * Perform the move for a player
	 * @param {Number} pit - The pit number chosen
	 * @returns {Boolean} true if the game is now over
	 */
	public do_player_turn(pit: number) {

		// perform the player's action
		let turn_over = this.board.move_stones(pit)

		// make sure that a player hasn't run out of stones
		if (this.check_game_over()) {
			//this.reset_game()
			return true
		}

		// change the player if the current turn is ended
		if (turn_over) {
			this.switch_turn()
		}

		//this.save_game()
		return false
	}

	/**
	 * Change the user currently having a turn
	 */
	public switch_turn() {
		this.player = this.get_other_player()
		this.board.flip_board()
		this.refresh_queries()
		this.draw_all_stones()

		let player = this.player
		setTimeout(function () {
      document.body.setAttribute('data-player', player)
      let current_player = document.querySelector('.current-player')
			if(current_player){
        current_player.textContent = player
      }
		}, 700 )
	}

	/**
	 * Check if the game should end
	 * @returns {Boolean} Whether the game is over
	 */
	public check_game_over() {
		let winner = this.board.check_winner()

		if (winner < 0) {
			return false
		}

		document.body.classList.add('game-over')
		let status = document.querySelector('.status')

    // Determine which player holds the most stones
    if (status){
      if (1 === winner) {
        status.textContent = 'Player one wins!'
      } else if (2 === winner) {
        status.textContent = 'Player two wins!'
      } else {
        status.textContent = 'Draw!'
      }
    }

		this.player = ''
		return true
  }
  
  /**
   * Update the stones on the page
   */
  public draw_all_stones() {
    if(this.current_player_store)
      this.current_player_store.textContent = format(this.board.current_store)
    

    if(this.other_player_store)
      this.other_player_store.textContent = format(this.board.other_store)

    for (let pit = 0; pit < 6; pit++) {
        this.current_player_pits[pit].textContent = format(this.board.current_pits[pit])
        this.other_player_pits[pit].textContent = format(this.board.other_pits[pit])
    }
  }

  public draw_stones(pit: number) {

    if (pit === 6) {
      if(this.current_player_store)
        this.current_player_store.textContent = format(this.board.current_store)
    } else if(pit === 13) {
      if(this.other_player_store)
        this.other_player_store.textContent = format(this.board.other_store)
    } else if (pit < 6) {
        this.current_player_pits[pit].textContent = format(this.board.current_pits[pit])
    } else if (pit > 6) {
        pit -= 7
        this.other_player_pits[pit].textContent = format(this.board.other_pits[pit])
    }
}
}