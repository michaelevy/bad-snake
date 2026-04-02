import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";
import { Status } from "../Settings";
import { CellType } from "../../utilities";

export class RingOfFireEffect implements EventEffect {
    readonly type = SnakeEventType.RING_OF_FIRE;

    onTrigger(context: EventContext): void {
        context.settings.status = {
            frame: context.frame,
            type: Status.RING_OF_FIRE,
        };
    }

    onTick(context: EventContext): void {
        if (context.settings.status.type !== Status.RING_OF_FIRE) return;

        const ringSize = Math.floor((context.frame - context.settings.status.frame) / 5);
        const cols = context.settings.columnNum;
        const rows = context.settings.rowNum;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (i < ringSize || i >= cols - ringSize || j < ringSize || j >= rows - ringSize) {
                    context.grid[i][j] = CellType.HAZARD;
                }
            }
        }
    }
}
