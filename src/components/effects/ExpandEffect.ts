import { EventEffect, EventContext } from "../EventEffect";
import { SnakeEventType } from "../SnakeEvent";

const GRID_OFFSET = 55;
const MIN_SQUARE_SIZE = 8;
const EXPAND_COLS = 4;
const EXPAND_ROWS = 3;

export class ExpandEffect implements EventEffect {
    readonly type = SnakeEventType.TERRA_FIRMA;

    onTrigger(context: EventContext): void {
        const { config } = context;

        if (config.squareSize <= MIN_SQUARE_SIZE) return;

        const targetCols = config.columnNum + EXPAND_COLS;
        const targetRows = config.rowNum + EXPAND_ROWS;

        const newSquareSize = Math.max(
            MIN_SQUARE_SIZE,
            Math.min(
                Math.floor(config.canvasWidth / targetCols),
                Math.floor((config.canvasHeight - GRID_OFFSET) / targetRows)
            )
        );

        if (newSquareSize >= config.squareSize) return; // no room to grow

        const newCols = Math.floor(config.canvasWidth / newSquareSize);
        const newRows = Math.floor((config.canvasHeight - GRID_OFFSET) / newSquareSize);

        context.gameGrid.expand(newCols, newRows);
        config.columnNum = newCols;
        config.rowNum = newRows;
        config.squareSize = newSquareSize;
        config.margin = Math.max(1, Math.round(newSquareSize * 0.2));
    }
}
