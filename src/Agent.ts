import {Game} from './Game'
import {Board} from './Board'

// MinMax agent
// Agent is always player 2 so far.
export class Agent {
    depth = 5
    first_print = 0
    constructor(private original_board: Board) { }

    private clone_board(board: Board){
        let game_clone = new Game(false)
        let board_clone = board.clone(game_clone)
        game_clone.board = board_clone
        game_clone.enable_render = false
        return board_clone
    }

    public move(){
        let cloned_board = this.clone_board(this.original_board)
        let options = this.valid_moves(cloned_board)

        let scores = options.map(option => this.min_max(cloned_board, -Infinity, Infinity, option, this.depth))

        let max_score = Math.max(...scores)

        let pairs: number[][] = scores.map((score, i) => [score, options[i]])

        // console.info("pairs for one move: ", pairs)
        let candidates: number[] = pairs.filter(x => x[0] == max_score)
                                        .map(x => x[1])
        return candidates[Math.floor(Math.random() * candidates.length)]
    }

    private evaluate(board: Board): number{
        // Find a differnce
        let board_eval = board.get_store(false) - board.get_store(true)
        this.first_print++
        return board_eval
    }

    private valid_moves(board: Board): number[]{
        let player = board.turn_player_1

        let lower = player ? 0 : 7
        let upper = player ? 5 : 12
        let subtract = player ? 1 : 7

        return board.current_pits
            .map((x, i) => i >= lower && i <= upper && x > 0 ? i : -1)
            .filter(x => x > 0)
            .map(x => x - subtract)
    }

    private min_max(board: Board, alpha: number, beta: number, move: number, depth: number): number{
        let cloned_board = this.clone_board(board)
        
        cloned_board.game.do_player_turn(move)

        let is_maximiser = !cloned_board.turn_player_1
        if(depth == 0 || cloned_board.check_winner() > -1) return this.evaluate(cloned_board)

        let options = this.valid_moves(cloned_board)
        var best_option = is_maximiser ? -Infinity : Infinity

        options.forEach(option => {
            let new_value = this.min_max(cloned_board, alpha, beta, option, depth - 1)

            if(is_maximiser){
                best_option = Math.max(new_value, best_option)
                alpha = Math.max(alpha, best_option)
            }else{
                best_option = Math.min(new_value, best_option)
                beta = Math.min(beta, best_option)
            }
            if(beta <= alpha) return best_option

        })
        
        return best_option
    }

}