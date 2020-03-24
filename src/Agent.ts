import {Game} from './Game';
import {Board} from './Board';

// MinMax agent
// Agent is always player 2 so far.
export class Agent {
    depth = 5
    
    constructor(private board: Board) { }

    private clone_board(board: Board){
        let game_clone = new Game(false)
        let board_clone = Object.assign({}, board)
        board_clone.game = game_clone
        return board_clone
    }

    public move(){
        let cloned_board = this.clone_board(this.board)
        let options = this.valid_moves(cloned_board)

        let scores = options.map(option => this.min_max(cloned_board, -Infinity, Infinity, option, this.depth))

        let max_score = Math.max(...scores)

        let candidates: number[] = scores.map((score, i) => [score, options[i]])
                               .filter(x => x[0] == max_score)
                               .map(x => x[1])
        console.info("Candidates for next move: " + candidates)

        return candidates[Math.floor(Math.random() * candidates.length)]
    }

    private evaluate(board: Board): number{
        return board.game.board.get_store(false) // Get player 2's store
    }

    private valid_moves(board: Board): number[]{
        // if it's player 2's pit, and the pit has more than 0 stones.
        // [false,false,false,false,false,false,false,true,true,true,true,true,true,false]
        // in initial state
        return board.current_pits
                    .map((x, i) => i >= 7 && i <= 12 && x > 0 ? i : -1)
                    .filter(x => x > 0)
    }

    private min_max(board: Board, alpha: number, beta: number, move: number, depth: number): number{
        let cloned_board = this.clone_board(board)
        cloned_board.game.do_player_turn(move)

        let is_maximiser = !board.turn_player_1
        if(depth == 0) return this.evaluate(cloned_board)

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