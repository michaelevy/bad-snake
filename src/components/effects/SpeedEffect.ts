import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

export class SpeedEffect implements EventEffect {
    readonly type = SnakeEventType.SPEED;

    onTrigger(context: EventContext): void {
        context.runtime.fps += 5;
    }
}
