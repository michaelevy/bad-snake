import { Direction } from "../utilities";
import Snake from "../snake";

function invertDirection(direction: Direction): Direction {
    switch(direction) {
        case Direction.UP: return Direction.DOWN;
        case Direction.DOWN: return Direction.UP;
        case Direction.LEFT: return Direction.RIGHT;
        case Direction.RIGHT: return Direction.LEFT;
    }
}

function handleDirectionChange(snake: Snake, direction: Direction) {
    if (snake.settings.invertedControls) {
        direction = invertDirection(direction);
    }
    if (!snake.hasMovedOnce) {
        snake.hasMovedOnce = true;
    } else {
        snake.prevDirection = snake.direction;
    }
    snake.directionChanged = true;
    snake.direction = direction;
}

export function keyPress(event: KeyboardEvent,snakes: Snake[]){
    // Find snake with arrows control scheme
    const arrowSnake = snakes.find(s => s.controlScheme === 'arrows');
    if (arrowSnake && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) && (!arrowSnake.directionChanged || !arrowSnake.hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "ArrowUp") {
            handleDirectionChange(arrowSnake, Direction.UP);
        } else if (event.key == "ArrowDown") {
            handleDirectionChange(arrowSnake, Direction.DOWN);
        } else if (event.key == "ArrowLeft") {
            handleDirectionChange(arrowSnake, Direction.LEFT);
        } else if (event.key == "ArrowRight") {
            handleDirectionChange(arrowSnake, Direction.RIGHT);
        }
    }
    
    // Find snake with wasd control scheme
    const wasdSnake = snakes.find(s => s.controlScheme === 'wasd');
    if (wasdSnake && ['w', 'a', 's', 'd'].includes(event.key) && (!wasdSnake.directionChanged || !wasdSnake.hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "w") {
            handleDirectionChange(wasdSnake, Direction.UP);
        } else if (event.key == "s") {
            handleDirectionChange(wasdSnake, Direction.DOWN);
        } else if (event.key == "a") {
            handleDirectionChange(wasdSnake, Direction.LEFT);
        } else if (event.key == "d") {
            handleDirectionChange(wasdSnake, Direction.RIGHT);
        }
    }
    
    // Find snake with ijkl control scheme
    const ijklSnake = snakes.find(s => s.controlScheme === 'ijkl');
    if (ijklSnake && ['i', 'j', 'k', 'l'].includes(event.key) && (!ijklSnake.directionChanged || !ijklSnake.hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "i") {
            handleDirectionChange(ijklSnake, Direction.UP);
        } else if (event.key == "k") {
            handleDirectionChange(ijklSnake, Direction.DOWN);
        } else if (event.key == "j") {
            handleDirectionChange(ijklSnake, Direction.LEFT);
        } else if (event.key == "l") {
            handleDirectionChange(ijklSnake, Direction.RIGHT);
        }
    }
    
    // Find snake with numpad control scheme
    const numpadSnake = snakes.find(s => s.controlScheme === 'numpad');
    if (numpadSnake && ['8', '4', '5', '6'].includes(event.key) && (!numpadSnake.directionChanged || !numpadSnake.hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "8") {
            handleDirectionChange(numpadSnake, Direction.UP);
        } else if (event.key == "5") {
            handleDirectionChange(numpadSnake, Direction.DOWN);
        } else if (event.key == "4") {
            handleDirectionChange(numpadSnake, Direction.LEFT);
        } else if (event.key == "6") {
            handleDirectionChange(numpadSnake, Direction.RIGHT);
        }
    }
}

export function mousePress(event: MouseEvent, snakes: Snake[]){
    // Find snake with mouse control scheme
    const mouseSnake = snakes.find(s => s.controlScheme === 'mouse');
    if (!mouseSnake) return;
    
    let newDirection: Direction;
    
    if (event.button==0 && mouseSnake.direction == Direction.LEFT) {
        newDirection = Direction.DOWN;   
    } else if(event.button==0 && mouseSnake.direction == Direction.RIGHT) {
        newDirection = Direction.UP;   
    } else if(event.button==0 && mouseSnake.direction == Direction.UP) {
        newDirection = Direction.LEFT;   
    } else if(event.button==0 && mouseSnake.direction == Direction.DOWN) {
        newDirection = Direction.RIGHT;   
    } else if(event.button==2 && mouseSnake.direction == Direction.LEFT) {
        newDirection = Direction.UP;   
    } else if(event.button==2 && mouseSnake.direction == Direction.RIGHT) {
        newDirection = Direction.DOWN;   
    } else if(event.button==2 && mouseSnake.direction == Direction.UP) {
        newDirection = Direction.RIGHT;   
    } else if(event.button==2 && mouseSnake.direction == Direction.DOWN) {
        newDirection = Direction.LEFT;   
    }
    
    if (newDirection!) {
        handleDirectionChange(mouseSnake, newDirection);
    }
    
    event.preventDefault();
    event.stopPropagation();
}