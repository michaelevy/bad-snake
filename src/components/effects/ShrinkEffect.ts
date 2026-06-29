import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

const GRID_OFFSET = 55;
const MAX_SQUARE_SIZE = 50;
const WARNING_SECONDS = 4;

export class ShrinkEffect implements EventEffect {
    readonly type = SnakeEventType.TERRA_NULLIUS;

    onTrigger(context: EventContext): void {
        const { config, runtime } = context;

        const newSquareSize = Math.min(MAX_SQUARE_SIZE, Math.round(config.squareSize * 1.6));
        if (newSquareSize <= config.squareSize) return;

        const newCols = Math.floor(config.canvasWidth / newSquareSize);
        const newRows = Math.floor((config.canvasHeight - GRID_OFFSET) / newSquareSize);
        const newMargin = Math.max(1, Math.round(newSquareSize * 0.2));

        runtime.pendingShrink = {
            newCols,
            newRows,
            newSquareSize,
            newMargin,
            executionFrame: context.frame + runtime.fps * WARNING_SECONDS,
        };
    }

    onTick(context: EventContext): void {
        const { runtime, config, gameGrid, snakes, frame } = context;
        if (!runtime.pendingShrink) return;

        const { newCols, newRows, newSquareSize, newMargin, executionFrame } = runtime.pendingShrink;
        if (frame < executionFrame) return;

        for (const snake of snakes) {
            if (!snake.dead && (snake.x >= newCols || snake.y >= newRows)) {
                snake.dead = true;
            }
        }

        gameGrid.shrink(newCols, newRows);
        config.columnNum = newCols;
        config.rowNum = newRows;
        config.squareSize = newSquareSize;
        config.margin = newMargin;

        runtime.pendingShrink = null;
    }
}
