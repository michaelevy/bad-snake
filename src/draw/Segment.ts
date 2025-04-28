import { setColour } from "../draw/draw";
import Snake from "../snake";

function segmentIndexToGridCoords(index: number){
    switch (index){
        case 0:
            return [[1,0],[0,0],[2,0]]
        case 1:
            return [[2,1],[2,0],[2,2]]
        case 2: 
            return [[2,3], [2,2],[2,4]]
        case 3:
            return [[1,4], [2,4],[0,4]]
        case 4:
            return [[0,2],[0,3],[0,4]]
        case 5:
            return [[0,0],[0,1],[0,2]]
        case 6:
            return [[2,2],[1,2],[0,2]]
        default:
            return [[0,0],[0,0],[0,0]]
    }
}

function numberToSegmentDisplay(number: any) {
    const segments: number[][] = 
        [[1,1,1,1,1,1,0],
        [0,1,1,0,0,0,0],
        [1,1,0,1,1,0,1],
        [1,1,1,1,0,0,1],
        [0,1,1,0,0,1,1],
        [1,0,1,1,0,1,1],
        [1,0,1,1,1,1,1],
        [1,1,1,0,0,0,0],
        [1,1,1,1,1,1,1],
        [1,1,1,0,0,1,1]];

    const numStr = String(number);
    let result = [];
  
    for (const digit of numStr) {
        if (segments[Number(digit)]) {
            result.push(segments[Number(digit)]);
        } else {
            result.push([0, 0, 0, 0, 0, 0, 0]);
        }
    }
    return result;

}  

export function drawScore(grid: string[][], snake: Snake, scoreMargin: number){
    let segments = numberToSegmentDisplay(snake.length);
    let x = scoreMargin;
    let y = 5;
    drawSegment(segments, x, y, snake, grid);
}

export function drawTotalScore(grid: string[][], snake: Snake, scoreMargin: number){
    let segments = numberToSegmentDisplay(snake.totalScore);
    let x = grid.length - segments.length * scoreMargin - scoreMargin ;
    let y = 5;
    drawSegment(segments, x, y, snake, grid);
}


function drawSegment(segments: number[][], x: number, y: number, snake: Snake, grid: string[][]) {
    segments.forEach((segment: number[], index: number) => {
        let segmentX = x + (index * 5);
        let segmentY = y + (snake.id * 6);
        setColour(snake.colour, snake.settings.colours, snake.settings.squareColour);

        for (let i = 0; i < segment.length; i++) {
            let segmentCoords = segmentIndexToGridCoords(i);

            segmentCoords.forEach(coord => {
                let gridX = coord[0];
                let gridY = coord[1];
                if (segment[i] == 0 && grid[segmentX + gridX][segmentY + gridY] == snake.id.toString()) {
                    grid[segmentX + gridX][segmentY + gridY] = '0';
                }

            });
        }

        for (let i = 0; i < segment.length; i++) {
            let segmentCoords = segmentIndexToGridCoords(i);

            segmentCoords.forEach(coord => {
                let gridX = coord[0];
                let gridY = coord[1];
                if (segment[i] == 1) {
                    grid[segmentX + gridX][segmentY + gridY] = snake.id.toString();
                }
            });

        }
    });
}