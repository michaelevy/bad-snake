import { Direction } from "../utilities";
import Snake from "../snake";

function handleDirectionChange(snake: Snake, direction: Direction) {
    if (!snake.hasMovedOnce) {
        snake.hasMovedOnce = true;
    } else {
        snake.prevDirection = snake.direction;
    }
    snake.directionChanged = true;
    snake.direction = direction;
}

export function keyPress(event: KeyboardEvent,snakes: Snake[]){
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) && (!snakes[0].directionChanged || !snakes[0].hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "ArrowUp") {
            handleDirectionChange(snakes[0], Direction.UP);
        } else if (event.key == "ArrowDown") {
            handleDirectionChange(snakes[0], Direction.DOWN);
        } else if (event.key == "ArrowLeft") {
            handleDirectionChange(snakes[0], Direction.LEFT);
        } else if (event.key == "ArrowRight") {
            handleDirectionChange(snakes[0], Direction.RIGHT);
        }
    } else if (['w', 'a', 's', 'd'].includes(event.key) && (!snakes[1].directionChanged || !snakes[1].hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "w") {
            handleDirectionChange(snakes[1], Direction.UP);
        } else if (event.key == "s") {
            handleDirectionChange(snakes[1], Direction.DOWN);
        } else if (event.key == "a") {
            handleDirectionChange(snakes[1], Direction.LEFT);
        } else if (event.key == "d") {
            handleDirectionChange(snakes[1], Direction.RIGHT);
        }
    } else if (['i', 'j', 'k', 'l'].includes(event.key) && (!snakes[2].directionChanged || !snakes[2].hasMovedOnce)) {
        event.preventDefault();
        if (event.key == "i") {
            handleDirectionChange(snakes[2], Direction.UP);
        } else if (event.key == "k") {
            handleDirectionChange(snakes[2], Direction.DOWN);
        } else if (event.key == "j") {
            handleDirectionChange(snakes[2], Direction.LEFT);
        } else if (event.key == "l") {
            handleDirectionChange(snakes[2], Direction.RIGHT);
        }
    } 
}

export function mousePress(event: MouseEvent, snakes: Snake[]){
    let newDirection: Direction;
    
    if (event.button==0 && snakes[3].direction == Direction.LEFT) {
        newDirection = Direction.DOWN;   
    } else if(event.button==0 && snakes[3].direction == Direction.RIGHT) {
        newDirection = Direction.UP;   
    } else if(event.button==0 && snakes[3].direction == Direction.UP) {
        newDirection = Direction.LEFT;   
    } else if(event.button==0 && snakes[3].direction == Direction.DOWN) {
        newDirection = Direction.RIGHT;   
    } else if(event.button==2 && snakes[3].direction == Direction.LEFT) {
        newDirection = Direction.UP;   
    } else if(event.button==2 && snakes[3].direction == Direction.RIGHT) {
        newDirection = Direction.DOWN;   
    } else if(event.button==2 && snakes[3].direction == Direction.UP) {
        newDirection = Direction.RIGHT;   
    } else if(event.button==2 && snakes[3].direction == Direction.DOWN) {
        newDirection = Direction.LEFT;   
    }
    
    if (newDirection!) {
        handleDirectionChange(snakes[3], newDirection);
    }
    
    event.preventDefault();
    event.stopPropagation();
}