import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType, SnakeEvent } from "../SnakeEvent";
import { Status } from "../Settings";
import { Meteor } from "../Meteor";
import { CellType } from "../../utilities";

export class MeteorEffect implements EventEffect {
    readonly type = SnakeEventType.METEORS;

    onTrigger(context: EventContext): void {
        context.settings.status = {
            frame: context.frame,
            type: Status.METEORS,
        };
    }

    onTick(context: EventContext): void {
        if (context.settings.status.type !== Status.METEORS) return;

        // Random meteor spawning (5% chance per tick)
        if (Math.random() < 0.05) {
            const x = Math.floor(Math.random() * context.settings.columnNum);
            const y = Math.floor(Math.random() * context.settings.rowNum);
            const radius = Math.floor(Math.random() * 5) + 3;
            const meteor = new Meteor(x, y, radius, context.frame);
            context.settings.meteors.push(meteor);

            // Preserve the "INCOMING!" warning event from original spawnMeteor()
            context.addEvent(new SnakeEvent(x, y, SnakeEventType.CHAT, 'INCOMING!', 'y', context.frame));
        }

        // Remove finished meteors
        context.settings.meteors = context.settings.meteors.filter(
            (meteor) => !meteor.isFinished(context.frame)
        );

        // Apply impact damage
        context.settings.meteors.forEach((meteor) => {
            if (meteor.isInImpactPhase(context.frame)) {
                for (let i = 0; i < context.settings.columnNum; i++) {
                    for (let j = 0; j < context.settings.rowNum; j++) {
                        if (meteor.containsPoint(i, j)) {
                            context.grid[i][j] = CellType.HAZARD;
                        }
                    }
                }
            }
        });
    }
}
