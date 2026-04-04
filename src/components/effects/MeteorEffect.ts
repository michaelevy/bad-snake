import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType, SnakeEvent } from "../SnakeEvent";
import { Status } from "../Settings";
import { Meteor } from "../Meteor";
import { CellType } from "../../utilities";

export class MeteorEffect implements EventEffect {
    readonly type = SnakeEventType.METEORS;

    onTrigger(context: EventContext): void {
        context.runtime.status = {
            frame: context.frame,
            type: Status.METEORS,
        };
    }

    onTick(context: EventContext): void {
        if (context.runtime.status.type !== Status.METEORS) return;

        // Random meteor spawning (5% chance per tick)
        if (Math.random() < 0.05) {
            const x = Math.floor(Math.random() * context.config.columnNum);
            const y = Math.floor(Math.random() * context.config.rowNum);
            const radius = Math.floor(Math.random() * 5) + 3;
            const meteor = new Meteor(x, y, radius, context.frame);
            context.runtime.meteors.push(meteor);

            // Preserve the "INCOMING!" warning event from original spawnMeteor()
            context.addEvent(new SnakeEvent(x, y, SnakeEventType.CHAT, 'INCOMING!', 'y', context.frame));
        }

        // Remove finished meteors
        context.runtime.meteors = context.runtime.meteors.filter(
            (meteor) => !meteor.isFinished(context.frame)
        );

        // Apply impact damage
        context.runtime.meteors.forEach((meteor) => {
            if (meteor.isInImpactPhase(context.frame)) {
                for (let i = 0; i < context.config.columnNum; i++) {
                    for (let j = 0; j < context.config.rowNum; j++) {
                        if (meteor.containsPoint(i, j)) {
                            context.gameGrid.setCell(i, j, CellType.HAZARD);
                        }
                    }
                }
            }
        });
    }
}
