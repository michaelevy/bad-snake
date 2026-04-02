import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

export class CurseEffect implements EventEffect {
    readonly type = SnakeEventType.CURSE;

    onTrigger(_context: EventContext): void {
        // Snake-local effect: curse segment added in snake.ts move()
        // No global side effects needed
    }
}
