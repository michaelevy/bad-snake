import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

export class LengthEffect implements EventEffect {
    readonly type = SnakeEventType.LENGTH;

    onTrigger(_context: EventContext): void {
        // Snake-local effect: length += 10 in snake.ts move()
        // No global side effects needed
    }
}
