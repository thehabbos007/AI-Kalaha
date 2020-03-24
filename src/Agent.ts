import {Game} from './Game';

// MinMax agent
// Agent is always player 2 so far.
class Agent {
    constructor(private game: Game) { }

    public move(){
        let game_clone = Object.assign({}, this.game);

    }

    private valid_moves(): boolean[]{
        const board = this.game.board.current_pits;
        // if it's player 2's pit, and the pit has more than 0 stones.
        // [false,false,false,false,false,false,false,true,true,true,true,true,true,false]
        // in initial state
        return board.map((x, i) => i >= 7 && i <= 12 && x > 0 ? true : false)   
    }

    private min_max(){

    }
}