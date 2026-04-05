import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";
import { CellType } from "../../utilities";

function baseRange(squareSize: number): number {
    if (squareSize >= 50) return 4;   // BIG
    if (squareSize <= 10) return 16;  // SMALL
    return 8;
}

function spawnFoodGrid(context: EventContext, gridSize: number, rangeMultiplier: number): void {
    const range = baseRange(context.config.squareSize) * rangeMultiplier;
    const cx = context.eventX ?? Math.floor(context.config.columnNum / 2);
    const cy = context.eventY ?? Math.floor(context.config.rowNum / 2);

    const offsetX = Math.floor(Math.random() * (range * 2 + 1)) - range;
    const offsetY = Math.floor(Math.random() * (range * 2 + 1)) - range;
    const anchorX = Math.min(Math.max(cx + offsetX, 0), context.config.columnNum - gridSize);
    const anchorY = Math.min(Math.max(cy + offsetY, 0), context.config.rowNum - gridSize);

    for (let dx = 0; dx < gridSize; dx++) {
        for (let dy = 0; dy < gridSize; dy++) {
            const x = anchorX + dx;
            const y = anchorY + dy;
            if (context.gameGrid.isEmpty(x, y)) {
                context.gameGrid.setCell(x, y, CellType.FOOD);
            }
        }
    }
}

export class CornucopiaEffect implements EventEffect {
    readonly type = SnakeEventType.CORNUCOPIA;
    onTrigger(context: EventContext): void { spawnFoodGrid(context, 4, 1); }
}

export class GrandFeastEffect implements EventEffect {
    readonly type = SnakeEventType.GRAND_FEAST;
    onTrigger(context: EventContext): void { spawnFoodGrid(context, 8, 1.5); }
}

export class BountifulHarvestEffect implements EventEffect {
    readonly type = SnakeEventType.BOUNTIFUL_HARVEST;
    onTrigger(context: EventContext): void { spawnFoodGrid(context, 12, 2); }
}
