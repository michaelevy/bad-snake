import { Direction } from "../utilities";
import Snake from "../snake";

export function keyPress(event: KeyboardEvent,snakes: Snake[]){
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) && !snakes[0].directionChanged) {
        snakes[0].prevDirection = snakes[0].direction;
        snakes[0].directionChanged = true;
        event.preventDefault();
        if (event.key == "ArrowUp") {
            snakes[0].direction = Direction.UP;
        } else if (event.key == "ArrowDown") {
            snakes[0].direction = Direction.DOWN;
        } else if (event.key == "ArrowLeft") {
            snakes[0].direction = Direction.LEFT;
        } else if (event.key == "ArrowRight") {
            snakes[0].direction = Direction.RIGHT;
        }
    } else if (['w', 'a', 's', 'd'].includes(event.key) && !snakes[1].directionChanged) {
        snakes[1].prevDirection = snakes[1].direction;
        snakes[1].directionChanged = true;
        event.preventDefault();
        if (event.key == "w") {
            snakes[1].direction = Direction.UP;
        } else if (event.key == "s") {
            snakes[1].direction = Direction.DOWN;
        } else if (event.key == "a") {
            snakes[1].direction = Direction.LEFT;
        } else if (event.key == "d") {
            snakes[1].direction = Direction.RIGHT;
        }
    } else if (['i', 'j', 'k', 'l'].includes(event.key) && !snakes[2].directionChanged) {
        snakes[2].prevDirection = snakes[2].direction;
        snakes[2].directionChanged = true;
        event.preventDefault();
        if (event.key == "i") {
            snakes[2].direction = Direction.UP;
        } else if (event.key == "k") {
            snakes[2].direction = Direction.DOWN;
        } else if (event.key == "j") {
            snakes[2].direction = Direction.LEFT;
        } else if (event.key == "l") {
            snakes[2].direction = Direction.RIGHT;
        }
    } 
}

export function mousePress(event: MouseEvent, snakes: Snake[]){
    if (event.button==0 && snakes[3].direction == Direction.LEFT) {
        snakes[3].direction = Direction.DOWN;   
    } else if(event.button==0&& snakes[3].direction == Direction.RIGHT) {
        snakes[3].direction = Direction.UP;   
    } else if (event.button==0 && snakes[3].direction == Direction.UP) {
        snakes[3].direction = Direction.UP;   
    } else if(event.button==0&& snakes[3].direction == Direction.DOWN) {
        snakes[3].direction = Direction.DOWN;   
    } else if(event.button==2 && snakes[3].direction == Direction.LEFT) {
        snakes[3].direction = Direction.UP;   
    } else if(event.button==2&& snakes[3].direction == Direction.RIGHT) {
        snakes[3].direction = Direction.DOWN;   
    } else if(event.button==2 && snakes[3].direction == Direction.UP) {
        snakes[3].direction = Direction.RIGHT;   
    } else if(event.button==2&& snakes[3].direction == Direction.DOWN) {
        snakes[3].direction = Direction.LEFT;   
    }
    event.preventDefault();
    event.stopPropagation();
}