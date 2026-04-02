import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

export class DashBoostEffect implements EventEffect {
    readonly type = SnakeEventType.DASH_BOOST;

    onTrigger(_context: EventContext): void {
        // Snake-local effect: dashDistance += 1 in snake.ts move()
        // No global side effects needed
    }
}
