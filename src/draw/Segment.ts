import { getCtx, getGridOffset, setColour } from "../draw/draw";
import Snake from "../snake";
import { Settings } from "../components/Settings";

function segmentIndexToGridCoords(index: number) {
    switch (index) {
        case 0: return [[1, 0], [0, 0], [2, 0]];
        case 1: return [[2, 1], [2, 0], [2, 2]];
        case 2: return [[2, 3], [2, 2], [2, 4]];
        case 3: return [[1, 4], [2, 4], [0, 4]];
        case 4: return [[0, 2], [0, 3], [0, 4]];
        case 5: return [[0, 0], [0, 1], [0, 2]];
        case 6: return [[2, 2], [1, 2], [0, 2]];
        default: return [[0, 0], [0, 0], [0, 0]];
    }
}

function numberToSegmentDisplay(number: number) {
    const segments: number[][] = [
        [1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 0],
        [1, 1, 0, 1, 1, 0, 1],
        [1, 1, 1, 1, 0, 0, 1],
        [0, 1, 1, 0, 0, 1, 1],
        [1, 0, 1, 1, 0, 1, 1],
        [1, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 1, 1],
    ];

    const numStr = String(number);
    const result = [];

    for (const digit of numStr) {
        if (segments[Number(digit)]) {
            result.push(segments[Number(digit)]);
        } else {
            result.push([0, 0, 0, 0, 0, 0, 0]);
        }
    }
    return result;
}

export function getScoreGridCells(snakes: Snake[], columnNum: number): [number, number][] {
    const scoreMargin = 5;
    const cells: [number, number][] = [];

    snakes.forEach(snake => {
        const y = 5 + snake.id * 6;

        const leftSegments = numberToSegmentDisplay(snake.length);
        collectSegmentCells(cells, leftSegments, scoreMargin, y);

        const rightSegments = numberToSegmentDisplay(snake.totalScore);
        const rightX = columnNum - rightSegments.length * scoreMargin - scoreMargin;
        collectSegmentCells(cells, rightSegments, rightX, y);
    });

    return cells;
}

function collectSegmentCells(cells: [number, number][], segments: number[][], x: number, y: number) {
    segments.forEach((segment, index) => {
        const segmentX = x + index * 5;
        for (let i = 0; i < segment.length; i++) {
            if (segment[i] === 1) {
                segmentIndexToGridCoords(i).forEach(coord => {
                    cells.push([segmentX + coord[0], y + coord[1]]);
                });
            }
        }
    });
}

export function drawScore(snake: Snake, scoreMargin: number, settings: Settings) {
    const segments = numberToSegmentDisplay(snake.length);
    const x = scoreMargin;
    const y = 5;
    drawSegment(segments, x, y, snake, settings);
}

export function drawTotalScore(snake: Snake, scoreMargin: number, settings: Settings) {
    const segments = numberToSegmentDisplay(snake.totalScore);
    const x = settings.columnNum - segments.length * scoreMargin - scoreMargin;
    const y = 5;
    drawSegment(segments, x, y, snake, settings);
}

function drawSegment(segments: number[][], x: number, y: number, snake: Snake, settings: Settings) {
    const ctx = getCtx();
    const gridOffset = getGridOffset();
    setColour(snake.colour, settings.colours, settings.squareColour);

    segments.forEach((segment: number[], index: number) => {
        const segmentX = x + index * 5;
        const segmentY = y + snake.id * 6;

        for (let i = 0; i < segment.length; i++) {
            if (segment[i] === 1) {
                const segmentCoords = segmentIndexToGridCoords(i);
                segmentCoords.forEach((coord) => {
                    const gridX = coord[0];
                    const gridY = coord[1];
                    const px = (segmentX + gridX) * settings.squareSize;
                    const py = (segmentY + gridY) * settings.squareSize + gridOffset;
                    ctx.fillRect(
                        px + settings.margin / 2,
                        py + settings.margin / 2,
                        settings.squareSize - settings.margin / 2,
                        settings.squareSize - settings.margin / 2
                    );
                });
            }
        }
    });
}
