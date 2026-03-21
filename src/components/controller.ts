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
    snake.hasDashedThisDirection = false;
}

function handleKeyOrDash(snake: Snake, rawDirection: Direction) {
    let effective = rawDirection;
    if (snake.settings.invertedControls) effective = invertDirection(effective);

    if (snake.hasMovedOnce && snake.direction === effective) {
        if (!snake.hasDashedThisDirection || snake.dashUnlimited) {
            snake.pendingDash = true;
        }
        // same direction with no dash available: do nothing (don't fall through to handleDirectionChange)
    } else if (!snake.directionChanged || !snake.hasMovedOnce) {
        handleDirectionChange(snake, rawDirection);
    }
}

export function keyPress(event: KeyboardEvent,snakes: Snake[]){
    // Find snake with arrows control scheme
    const arrowSnake = snakes.find(s => s.controlScheme === 'arrows');
    if (arrowSnake && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        if (event.key == "ArrowUp") {
            handleKeyOrDash(arrowSnake, Direction.UP);
        } else if (event.key == "ArrowDown") {
            handleKeyOrDash(arrowSnake, Direction.DOWN);
        } else if (event.key == "ArrowLeft") {
            handleKeyOrDash(arrowSnake, Direction.LEFT);
        } else if (event.key == "ArrowRight") {
            handleKeyOrDash(arrowSnake, Direction.RIGHT);
        }
    }

    // Find snake with wasd control scheme
    const wasdSnake = snakes.find(s => s.controlScheme === 'wasd');
    if (wasdSnake && ['w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault();
        if (event.key == "w") {
            handleKeyOrDash(wasdSnake, Direction.UP);
        } else if (event.key == "s") {
            handleKeyOrDash(wasdSnake, Direction.DOWN);
        } else if (event.key == "a") {
            handleKeyOrDash(wasdSnake, Direction.LEFT);
        } else if (event.key == "d") {
            handleKeyOrDash(wasdSnake, Direction.RIGHT);
        }
    }

    // Find snake with ijkl control scheme
    const ijklSnake = snakes.find(s => s.controlScheme === 'ijkl');
    if (ijklSnake && ['i', 'j', 'k', 'l'].includes(event.key)) {
        event.preventDefault();
        if (event.key == "i") {
            handleKeyOrDash(ijklSnake, Direction.UP);
        } else if (event.key == "k") {
            handleKeyOrDash(ijklSnake, Direction.DOWN);
        } else if (event.key == "j") {
            handleKeyOrDash(ijklSnake, Direction.LEFT);
        } else if (event.key == "l") {
            handleKeyOrDash(ijklSnake, Direction.RIGHT);
        }
    }

    // Find snake with numpad control scheme
    const numpadSnake = snakes.find(s => s.controlScheme === 'numpad');
    if (numpadSnake && ['8', '4', '5', '6'].includes(event.key)) {
        event.preventDefault();
        if (event.key == "8") {
            handleKeyOrDash(numpadSnake, Direction.UP);
        } else if (event.key == "5") {
            handleKeyOrDash(numpadSnake, Direction.DOWN);
        } else if (event.key == "4") {
            handleKeyOrDash(numpadSnake, Direction.LEFT);
        } else if (event.key == "6") {
            handleKeyOrDash(numpadSnake, Direction.RIGHT);
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

    if (event.button == 1) {
        if (mouseSnake.hasMovedOnce && (!mouseSnake.hasDashedThisDirection || mouseSnake.dashUnlimited)) mouseSnake.pendingDash = true;
    } else if (newDirection!) {
        handleDirectionChange(mouseSnake, newDirection);
    }

    event.preventDefault();
    event.stopPropagation();
}