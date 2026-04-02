import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

export class DashFrenzyEffect implements EventEffect {
    readonly type = SnakeEventType.DASH_FRENZY;

    onTrigger(_context: EventContext): void {
        // Snake-local effect: dashUnlimited = true in snake.ts move()
        // No global side effects needed
    }
}
