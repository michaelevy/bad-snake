import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

const FREEZE_DURATION = 4; // frames to freeze after swap so players can reorient

export class FreakFridayEffect implements EventEffect {
    readonly type = SnakeEventType.FREAKY_FRIDAY;

    onTrigger(context: EventContext): void {
        const aliveSnakes = context.snakes.filter((snake) => !snake.dead);
        if (aliveSnakes.length < 2) return;

        // Snapshot all snake state before swapping
        const snakeData = aliveSnakes.map((snake) => ({
            body: snake.body.map((pos) => [...pos]),
            length: snake.length,
            x: snake.x,
            y: snake.y,
            direction: snake.direction,
            prevDirection: snake.prevDirection,
            curses: [...snake.curses],
        }));

        // Rotate bodies: each snake gets the next snake's body
        for (let i = 0; i < aliveSnakes.length; i++) {
            const nextIndex = (i + 1) % aliveSnakes.length;
            const nextData = snakeData[nextIndex];

            aliveSnakes[i].body = nextData.body;
            aliveSnakes[i].length = nextData.length;
            aliveSnakes[i].x = nextData.x;
            aliveSnakes[i].y = nextData.y;
            aliveSnakes[i].direction = nextData.direction;
            aliveSnakes[i].prevDirection = nextData.prevDirection;
            aliveSnakes[i].curses = nextData.curses;
        }

        // Intentional freeze so players can get their bearings
        context.runtime.frozenUntilFrame = context.frame + FREEZE_DURATION;
    }
}
