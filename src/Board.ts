import {Game} from "./Game";
/**
 * Manages the mancala board
 */
export class Board {
  game: Game
  current_pits: number[]
  other_pits: number[]
  current_store: number
  other_store: number

	/**
	 * Initialise class
	 * @param {Game} game
	 */
  constructor(game: Game) {
    this.game = game

    this.current_pits = [4, 4, 4, 4, 4, 4]
    this.other_pits = [4, 4, 4, 4, 4, 4]
    this.current_store = 0
    this.other_store = 0
  }

	/**
	 * Exchange the players' positions on the board
	 */
  public flip_board() {
    let current_pits = this.current_pits
    this.current_pits = this.other_pits
    this.other_pits = current_pits

    let current_store = this.current_store
    this.current_store = this.other_store
    this.other_store = current_store
  }

	/**
	 * Retrieve the amount of stones in a pit
	 * @param  {Number} pit The pit number
	 * @return {Number}     The amount of stones
	 */
  public get_stones(pit: number) {

    if (pit === 6) {
      return this.current_store
    } else if (pit === 13) {
      return this.other_store
    } else if (pit < 6) {
      return this.current_pits[pit]
    } else if (pit > 6) {
      return this.other_pits[pit - 7]
    }

    return NaN
  }

	/**
	 * Set the amount of stones in a pit
	 * @param {Number} pit    The pit number
	 * @param {Number} stones The amount of stones
	 */
  public set_stones(pit: number, stones: number) {

    if (pit === 6) {
      this.current_store = stones
    } else if (pit === 13) {
      this.other_store = stones
    } else if (pit < 6) {
      this.current_pits[pit] = stones
    } else if (pit > 6) {
      this.other_pits[pit - 7] = stones
    }
  }

	/**
	 * Adjust the amount of stones in a pit
	 * @param {Number} pit    The pit number
	 * @param {Number} stones The amount of stones
	 */
  public add_stones(pit: number, stones: number) {

    if (pit === 6) {
      this.current_store += stones
    } else if (pit === 13) {
      this.other_store += stones
    } else if (pit < 6) {
      this.current_pits[pit] += stones
    } else if (pit > 6) {
      this.other_pits[pit - 7] += stones
    }
  }

  /**
   * Distribute the stones from a pit around the board
   * @param {Number} pit The pit to begin in
   * @return {Boolean} Whether the user's turn has ended
   */
  public move_stones(pit: number) {

    // return if pit has no stones
    if (this.get_stones(pit) < 1) {
      return false;
    }

    // take stones out of pit
    let stones = this.get_stones(pit);
    this.set_stones(pit, 0);
    this.game.draw_stones(pit);

    while (stones > 0) {
      ++pit;

      // wrap around the board before reaching other player's store
      if (pit > 12) {
        pit = 0;
      }

      this.add_stones(pit, 1);
      stones--;
      this.game.draw_stones(pit);
    }

    // Invert the pit number (number of opposite pit in opponent's row)
    let inverse = 5 - pit;

    // Check for capture
    if (pit < 6 && this.current_pits[pit] === 1 && this.other_pits[inverse] > 0) {

      // Transfer this pit's stones along with opposite pit's stones to store
      this.current_store += this.other_pits[inverse] + 1;
      this.game.draw_stones(6);

      // Clear the pits
      this.current_pits[pit] = 0;
      this.other_pits[inverse] = 0;
      this.game.draw_stones(pit);
      this.game.draw_stones(12 - pit);
    }

    // the user's turn ended if the stones did not end in the storage pit
    return pit !== 6;
  }


  /**
  * Check if a player has won
  * @return {Number} -1 for no win, 0 for draw, 1 for player one win, 2 for player two win
  */
  public check_winner() {

    /**
     * Check if a row on the board is empty
     * @param {Array} pits The pits to check
     * @return {Boolean} true all of the pits contain no stones
     */
    let is_row_empty = function (pits: number[]) {
      return pits.every((stones: number) => stones === 0);
    };

    let current_player_out = is_row_empty(this.current_pits);
    let other_player_out = is_row_empty(this.other_pits);

    // the game is not over if neither player has an empty row
    if (!current_player_out && !other_player_out) {
      return -1;
    }

    // Move the stones remaining in a player's row into their store
    let pit;

    if (current_player_out && !other_player_out) {
      for (pit = 0; pit < 6; pit++) {
        this.other_store += this.other_pits[pit];
        this.other_pits[pit] = 0;
      }

    } else if (other_player_out && !current_player_out) {
      for (pit = 0; pit < 6; pit++) {
        this.current_store += this.current_pits[pit];
        this.current_pits[pit] = 0;
      }
    }

    this.game.draw_all_stones();

    if (this.current_store > this.other_store) {
      // current player wins
      return this.game.player === 'two' ? 2 : 1;

    } else if (this.other_store > this.current_store) {
      // other player wins
      return this.game.player === 'two' ? 1 : 2;

    } else {
      return 0;
    }
  };
}