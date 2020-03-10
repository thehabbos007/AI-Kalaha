import {Game} from './Game';
/**
 * Manages the mancala board
 */
export class Board {
  game: Game
  current_pits: number[]
  turn_player_1: boolean;

	/**
	 * Initialise class
	 * @param {Game} game
	 */
  constructor(game: Game) {
    this.game = game
    this.current_pits = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]
    this.turn_player_1 = true;
  }

	/**
	 * Retrieve the amount of stones in a pit
	 * @param  {Number} pit The pit number
	 * @return {Number}     The amount of stones
	 */
  public get_stones(pit: number) {
    return this.current_pits[pit];
  }

	/**
	 * Set the amount of stones in a pit
	 * @param {Number} pit    The pit number
	 * @param {Number} stones The amount of stones
	 */
  public set_stones(pit: number, stones: number) {
    this.current_pits[pit] = stones
  }

	/**
	 * Adjust the amount of stones in a pit
	 * @param {Number} pit    The pit number
	 * @param {Number} stones The amount of stones
	 */
  public add_stones(pit: number, stones: number) {
    this.current_pits[pit] += stones;
  }

  /**
   * Distribute the stones from a pit around the board
   * @param {Number} pit The pit to begin in
   * @return {Boolean} Whether the user's turn has ended
   */
  public move_stones(pit: number) {
    const current_store = this.get_store(this.turn_player_1)
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
    const inverse = pit + 7 % this.current_pits.length

    // Check for capture
    if (pit < 6 && this.current_pits[pit] === 1 && this.current_pits[inverse] > 0) {

      // Transfer this pit's stones along with opposite pit's stones to store
      this.current_pits[current_store] += this.current_pits[inverse] + 1;
      this.game.draw_stones(6);

      // Clear the pits
      this.current_pits[pit] = 0;
      this.current_pits[inverse] = 0;
      this.game.draw_stones(pit);
      this.game.draw_stones(12 - pit);
    }

    // the user's turn ended if the stones did not end in the storage pit
    return pit !== 6;
  }

  public get_store(player_turn: boolean): number {
    const half = (this.current_pits.length / 2) - 1
    return player_turn ? half : half * 2 + 1
  }

  public get_side_length() {
    return this.current_pits.length / 2 - 1
  }

  /**
   * Returns an array of bounding indicies for each player's board
   */
  public get_board_index(board: number[]): number[] {
      return [0, this.get_side_length(),
             this.get_side_length()+1, this.current_pits.length-1]
  }

  public get_board_slice(player_turn: boolean, board: number[]) : number[] {
    return player_turn
      ? board.slice(0, this.get_side_length())
      : board.slice(this.get_side_length()+1, this.current_pits.length-1)
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
    const is_row_empty = (player: boolean) => {
      return this.get_board_slice(player, this.current_pits)
                 .every((stones: number) => stones === 0);
    };

    const player_1_out = is_row_empty( this.turn_player_1);
    const player_2_out   = is_row_empty(!this.turn_player_1);

    // the game is not over if neither player has an empty row
    if (!player_1_out && !player_2_out) {
      return -1;
    }

    // Move the stones remaining in a player's row into their store
    let pit;
    const [p1_lower, p1_upper, p2_lower, p2_upper] = this.get_board_index(this.current_pits)

    if (player_1_out && !player_2_out) {
      for (pit = p1_lower; pit <= p1_upper; pit++) {
        const inverse = pit + 7 % this.current_pits.length
        this.current_pits[p1_upper+1] += this.current_pits[inverse];
        this.current_pits[pit] = 0;
      }

    } else if (player_2_out && !player_1_out) {
      for (pit = p2_lower; pit <= p2_upper; pit++) {
        const inverse = pit + 7 % this.current_pits.length
        this.current_pits[p2_upper+1] += this.current_pits[inverse];
        this.current_pits[pit] = 0;
      }
    }

    this.game.draw_all_stones();
    const p1_store = this.current_pits[this.get_store(true)]
    const p2_store = this.current_pits[this.get_store(false)]
    if (p1_store > p2_store) {
      // current player wins
      return this.game.player === 'two' ? 2 : 1

    } else {
      return 0
    }
  };
}
