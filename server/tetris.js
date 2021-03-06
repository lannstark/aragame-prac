// Variables for game
const W = 300, H = 600;
const COLS = 10, ROWS = 20;
const BLOCK_W = W / COLS, BLOCK_H = H / ROWS;
let board = [];
let lose;
let interval_game;
let interval_render;
let interval_timer_game;
let interval_timer_bonus;

let score = 0;
let totalTime = 100;
let level = 0;
let how_may_lines = 0;
let time_limit=60;


var current; // current moving shape
var currentX, currentY; // position of current shape
var freezed; // is current shape settled on the board?
var restart = false;

const shapes = [
    [ 1, 1, 1, 1 ],
    [ 1, 1, 1, 0,
      1 ],
    [ 1, 1, 1, 0,
      0, 0, 1 ],
    [ 1, 1, 0, 0,
      1, 1 ],
    [ 1, 1, 0, 0,
      0, 1, 1 ],
    [ 0, 1, 1, 0,
      1, 1 ],
    [ 0, 1, 0, 0,
      1, 1, 1 ]
];
const colors = [
    '#43C79E', '#ED9A3A', '#31E0EF', '#F2EA30', '#ED3A3A', '#33E247', '#B9248B'
];

// Variables for DOM control
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
const btnPlay = document.getElementById("playbutton");
const btnPause = document.getElementById("pausebutton");
const scoreDiv = document.getElementById('score');
const linesDiv = document.getElementById('scorelines');
const timeDiv = document.getElementById('limittime');

btnPlay.addEventListener("click", function() {
    restart ? restartGame() : playButtonClicked();
})

btnPause.addEventListener("click", function() {
    console.log("Pause clicked")
    if (interval_game !== undefined && interval_render !== undefined) {
        clearInterval(interval_game);
        clearInterval(interval_render);
        restart = true;
        btnPlay.disabled = false;    
    }
})

document.body.onkeydown = function( e ) {
    var keys = {
        37: 'left',
        39: 'right',
        40: 'down',
        38: 'rotate',
        32: 'drop'
    };
    if ( typeof keys[ e.keyCode ] != 'undefined' ) {
        keyPress( keys[ e.keyCode ] );
        render();
    }
};



// draw a single square at (x, y)
function drawBlock( x, y ) {
    ctx.fillRect( BLOCK_W * x, BLOCK_H * y, BLOCK_W - 1 , BLOCK_H - 1 );
    ctx.strokeRect( BLOCK_W * x, BLOCK_H * y, BLOCK_W - 1 , BLOCK_H - 1 );
}

// draws the board and the moving shape
function render() {

    ctx.clearRect( 0, 0, W, H );

    ctx.strokeStyle = 'black';
    for ( var x = 0; x < COLS; ++x ) {
        for ( var y = 0; y < ROWS; ++y ) {
            if ( board[ y ][ x ] ) {
                ctx.fillStyle = colors[ board[ y ][ x ] - 1 ];
                drawBlock( x, y );
            }
        }
    }

    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'black';
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                ctx.fillStyle = colors[ current[ y ][ x ] - 1 ];
                drawBlock( currentX + x, currentY + y );
            }
        }
    }
}


// creates a new 4x4 shape in global variable 'current'
// 4x4 so as to cover the size when the shape is rotated
function newShape() {
    var id = Math.floor( Math.random() * shapes.length );
    var shape = shapes[ id ]; // maintain id for color filling

    current = [];
    for ( var y = 0; y < 4; ++y ) {
        current[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            var i = 4 * y + x;
            if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
                current[ y ][ x ] = id + 1;
            }
            else {
                current[ y ][ x ] = 0;
            }
        }
    }
    
    // new shape starts to move
    freezed = false;
    // position where the shape will evolve
    currentX = 5;
    currentY = 0;
}

// clears the board
function init() {
    for ( var y = 0; y < ROWS; ++y ) {
        board[ y ] = [];
        for ( var x = 0; x < COLS; ++x ) {
            board[ y ][ x ] = 0;
        }
    }
}

// keep the element moving down, creating new shapes and clearing lines
function tick() {
    if ( valid( 0, 1 ) ) {
        ++currentY;
    }
    // if the element settled
    else {
        freeze();
        valid(0, 1);
        clearLines();
        if (lose) {
            return false;
        }
        newShape();
    }
}

// stop shape at its position and fix it to board
function freeze() {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                board[ y + currentY ][ x + currentX ] = current[ y ][ x ];
            }
        }
    }
    freezed = true;
}

// returns rotates the rotated shape 'current' perpendicularly anticlockwise
function rotate( current ) {
    var newCurrent = [];
    for ( var y = 0; y < 4; ++y ) {
        newCurrent[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            newCurrent[ y ][ x ] = current[ 3 - x ][ y ];
        }
    }

    return newCurrent;
}

// check if any lines are filled and clear them
function clearLines() {
    let lines = 0;

    for ( var y = ROWS - 1; y >= 0; --y ) {
        var rowFilled = true;
        for ( var x = 0; x < COLS; ++x ) {
            if ( board[ y ][ x ] == 0 ) {
                rowFilled = false;
                break;
            }
        }

        if ( rowFilled ) {
            
            if (lines === 0) {
                score += 100
                lines += 1
            } else if (lines === 1 || lines === 2) {
                score += 200
                lines += 1
            } else if (lines === 3) {
                score += 500
            }

            
            how_may_lines += 1;
            level = parseInt(how_may_lines/5);
            
            scoreDiv.innerText = "점수 : "+score
            linesDiv.innerText = "클리어라인 : "+how_may_lines;
            /*
                Later, socket here
            */
            

            for ( var yy = y; yy > 0; --yy ) {
                for ( var x = 0; x < COLS; ++x ) {
                    board[ yy ][ x ] = board[ yy - 1 ][ x ];
                }
            }
            ++y;
        }
    }
}

// scoring
function dropping() {
    if(softDrop){
        score += 1 * distance;
    }else if(hardDrop){
        score += 2 * distance;
    }
}
function comboTime() {

   if (time > 0 && time <= 5) {
      var ss = time%60;
        var mm = parseInt(time/60);
        score += 500;
        time -= 1;
   } else if(time==0){
      time=5;
   }
}


function keyPress( key ) {
    switch ( key ) {
        case 'left':
            if ( valid( -1 ) ) {
                --currentX;
            }
            break;
        case 'right':
            if ( valid( 1 ) ) {
                ++currentX;
            }
            break;
        case 'down':
            if ( valid( 0, 1 ) ) {
                ++currentY;
            }
            break;
        case 'rotate':
            var rotated = rotate( current );
            if ( valid( 0, 0, rotated ) ) {
                current = rotated;
            }
            break;
        case 'drop':
            if(!lose) {
                score += Math.abs(currentY-20) * 2;
                scoreDiv.innerText = "점수 : "+score    
            }
            while( valid(0, 1) ) {
                ++currentY;
            }
            tick();
            break;
    }
}




// checks if the resulting position of current shape will be feasible
function valid( offsetX, offsetY, newCurrent ) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    offsetX = currentX + offsetX;
    offsetY = currentY + offsetY;
    newCurrent = newCurrent || current;

    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( newCurrent[ y ][ x ] ) {
                if ( typeof board[ y + offsetY ] == 'undefined'
                  || typeof board[ y + offsetY ][ x + offsetX ] == 'undefined'
                  || board[ y + offsetY ][ x + offsetX ]
                  || x + offsetX < 0
                  || y + offsetY >= ROWS
                  || x + offsetX >= COLS ) {
                    if (offsetY == 1 && freezed) {
                        lose = true; // lose if the current shape is settled at the top most row
                        endGame()
                    } 
                    return false;
                }
            }
        }
    }
    return true;
}



function playButtonClicked() {
    restart = false;
    newGame();
    document.getElementById("playbutton").disabled = true;
}

function newGame() {

    clearInterval( interval_game );
    interval_render = setInterval( render, 30 );
    
    score = 0;
    scoreDiv.innerText = "점수 : "+score;

    init();
    newShape();
    
    interval_timer_game = setInterval(timer, 1000);
    lose = false;
    interval_game = setInterval( tick, 500 - level*50 );
}

function restartGame() {
    interval_render = setInterval(render, 30);
    interval_game = setInterval(tick, 400);
    btnPlay.disabled = true;
}

function timer() {
    time_limit -= 1
    timeDiv.innerHTML = "남은 시간 : "+time_limit;

    if (time_limit == 0) {
        lose = true;
        endGame()
    }
}


function endGame() {
    time_limit = 60;
    restart = false;
    clearInterval(interval_timer_game);
    clearInterval(interval_render);
    btnPlay.disabled = false;
}
