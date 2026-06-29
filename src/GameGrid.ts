import { CellType, CellValue, isSpecialFood } from "./utilities";

export interface MoveIntent {
    snakeId: number;
    snakeColour: string;
    from: [number, number];
    to: [number, number];
    trail: [number, number][];    // tail segments to clear
    bodySegments: [number, number][]; // full body to write after move
}

export interface DashIntent {
    snakeId: number;
    snakeColour: string;
    steps: [number, number][];    // all cells the dash passes through
    trail: [number, number][];    // tail segments to clear
    bodySegments: [number, number][]; // full body to write after dash
}

export type SnakeIntent = MoveIntent | DashIntent;

export function isDashIntent(intent: SnakeIntent): intent is DashIntent {
    return 'steps' in intent;
}

export type CellOutcome =
    | { type: 'empty' }
    | { type: 'food', cellType: CellType.FOOD }
    | { type: 'special', cellType: CellType.SPECIAL }
    | { type: 'died_wall' }
    | { type: 'died_snake' }
    | { type: 'died_hazard' };

export interface CollisionResult {
    snakeId: number;
    outcome: CellOutcome;
}

export class GameGrid {
    private cells: CellValue[][];
    readonly columns: number;
    readonly rows: number;
    private pendingIntents: SnakeIntent[] = [];

    constructor(columns: number, rows: number) {
        this.columns = columns;
        this.rows = rows;
        this.cells = new Array(columns)
            .fill(CellType.EMPTY)
            .map(() => new Array(rows).fill(CellType.EMPTY));
    }

    getCell(x: number, y: number): CellValue {
        if (x < 0 || x >= this.columns || y < 0 || y >= this.rows) {
            return CellType.HAZARD; // out of bounds treated as hazard
        }
        return this.cells[x][y];
    }

    setCell(x: number, y: number, value: CellValue): void {
        if (x >= 0 && x < this.columns && y >= 0 && y < this.rows) {
            this.cells[x][y] = value;
        }
    }

    isInBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.columns && y >= 0 && y < this.rows;
    }

    isEmpty(x: number, y: number): boolean {
        return this.getCell(x, y) === CellType.EMPTY;
    }

    /**
     * Find a random empty cell. Returns null if grid is full.
     */
    findEmpty(): [number, number] | null {
        // Try random positions first (fast for sparse grids)
        for (let attempt = 0; attempt < 100; attempt++) {
            const x = Math.floor(Math.random() * this.columns);
            const y = Math.floor(Math.random() * this.rows);
            if (this.cells[x][y] === CellType.EMPTY) return [x, y];
        }
        // Fallback: linear scan
        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                if (this.cells[x][y] === CellType.EMPTY) return [x, y];
            }
        }
        return null;
    }

    queueIntent(intent: SnakeIntent): void {
        this.pendingIntents.push(intent);
    }

    /**
     * Resolve all queued intents simultaneously.
     * Returns collision results for each snake.
     */
    resolveAll(): CollisionResult[] {
        const results: CollisionResult[] = [];

        // Find cells targeted by more than one normal move intent simultaneously
        const normalMoves = this.pendingIntents.filter(i => !isDashIntent(i)) as MoveIntent[];
        const seen = new Set<string>();
        const conflicts = new Set<string>();
        for (const intent of normalMoves) {
            const key = `${intent.to[0]},${intent.to[1]}`;
            if (seen.has(key)) conflicts.add(key);
            else seen.add(key);
        }

        for (const intent of this.pendingIntents) {
            if (isDashIntent(intent)) {
                results.push(...this.resolveDash(intent));
            } else {
                const key = `${intent.to[0]},${intent.to[1]}`;
                if (conflicts.has(key)) {
                    // Simultaneous same-cell collision -- both snakes die
                    this.clearTrail(intent.trail);
                    for (const [bx, by] of intent.bodySegments) {
                        this.setCell(bx, by, intent.snakeId.toString());
                    }
                    results.push({ snakeId: intent.snakeId, outcome: { type: 'died_snake' } });
                } else {
                    results.push(this.resolveMove(intent));
                }
            }
        }

        this.pendingIntents = [];
        return results;
    }

    private resolveMove(intent: MoveIntent): CollisionResult {
        const [tx, ty] = intent.to;

        // TODO: ARCHITECTURAL TENSION - These death checks are dead code since snake.ts pre-checks
        // all deaths and returns null before queuing an intent. The resolver path is unreachable.
        // Future: Remove these checks once snakes commit intents regardless of outcome.

        // Check bounds
        if (!this.isInBounds(tx, ty)) {
            this.clearTrail(intent.trail);
            for (const [bx, by] of intent.bodySegments) {
                this.setCell(bx, by, intent.snakeId.toString());
            }
            return { snakeId: intent.snakeId, outcome: { type: 'died_wall' } };
        }

        const targetCell = this.cells[tx][ty];

        // Check food
        if (targetCell === CellType.FOOD) {
            this.setCell(tx, ty, intent.snakeColour);
            this.clearTrail(intent.trail);
            this.writeBody(intent.bodySegments, intent.snakeColour);
            return { snakeId: intent.snakeId, outcome: { type: 'food', cellType: CellType.FOOD } };
        }

        // Check special food
        if (isSpecialFood(targetCell)) {
            // Clear the special food cell before writing body
            this.setCell(tx, ty, CellType.EMPTY);
            this.clearTrail(intent.trail);
            this.writeBody(intent.bodySegments, intent.snakeColour);
            return { snakeId: intent.snakeId, outcome: { type: 'special', cellType: CellType.SPECIAL } };
        }

        // Check hazard
        if (targetCell === CellType.HAZARD) {
            this.clearTrail(intent.trail);
            for (const [bx, by] of intent.bodySegments) {
                this.setCell(bx, by, intent.snakeId.toString());
            }
            return { snakeId: intent.snakeId, outcome: { type: 'died_hazard' } };
        }

        // Check collision with non-empty cell (another snake or self)
        if (targetCell !== CellType.EMPTY) {
            this.clearTrail(intent.trail);
            for (const [bx, by] of intent.bodySegments) {
                this.setCell(bx, by, intent.snakeId.toString());
            }
            return { snakeId: intent.snakeId, outcome: { type: 'died_snake' } };
        }

        // Empty cell -- safe move
        this.clearTrail(intent.trail);
        // TODO: REDUNDANCY - Body is written here AND again in main.ts via snake.drawSnakeToGrid() for alive snakes.
        // This is duplicated work. Future: Remove writeBody here and rely on drawSnakeToGrid for all body rendering.
        this.writeBody(intent.bodySegments, intent.snakeColour);
        return { snakeId: intent.snakeId, outcome: { type: 'empty' } };
    }

    private resolveDash(intent: DashIntent): CollisionResult[] {
        const results: CollisionResult[] = [];

        for (const [sx, sy] of intent.steps) {
            if (!this.isInBounds(sx, sy)) {
                // Hit wall during dash
                for (const [bx, by] of intent.bodySegments) {
                    this.setCell(bx, by, intent.snakeId.toString());
                }
                results.push({ snakeId: intent.snakeId, outcome: { type: 'died_wall' } });
                return results;
            }

            const cell = this.cells[sx][sy];

            if (cell === CellType.FOOD) {
                this.setCell(sx, sy, intent.snakeColour);
                results.push({ snakeId: intent.snakeId, outcome: { type: 'food', cellType: CellType.FOOD } });
            } else if (isSpecialFood(cell)) {
                results.push({ snakeId: intent.snakeId, outcome: { type: 'special', cellType: CellType.SPECIAL } });
            } else if (cell !== CellType.EMPTY && cell !== intent.snakeColour) {
                // Collision during dash -- truncate
                results.push({ snakeId: intent.snakeId, outcome: { type: 'died_snake' } });
            }
        }

        // Write final body position
        this.clearTrail(intent.trail);
        this.writeBody(intent.bodySegments, intent.snakeColour);

        return results;
    }

    private clearTrail(trail: [number, number][]): void {
        for (const [x, y] of trail) {
            if (this.isInBounds(x, y) && this.cells[x][y] !== CellType.HAZARD) {
                this.setCell(x, y, CellType.EMPTY);
            }
        }
    }

    private writeBody(segments: [number, number][], colour: string): void {
        for (const [x, y] of segments) {
            if (this.isInBounds(x, y)) {
                this.setCell(x, y, colour);
            }
        }
    }

    /**
     * Get the raw grid array for rendering.
     * This is a read-only view -- do not mutate directly.
     */
    getRawGrid(): CellValue[][] {
        return this.cells;
    }

    /**
     * Shrink the grid by updating bounds. Cells outside the new dimensions
     * become inaccessible but are not deleted.
     */
    shrink(newColumns: number, newRows: number): void {
        (this as { columns: number }).columns = newColumns;
        (this as { rows: number }).rows = newRows;
    }

    /**
     * Grow the grid to new dimensions, preserving existing cell content.
     */
    expand(newColumns: number, newRows: number): void {
        for (let x = 0; x < this.columns; x++) {
            while (this.cells[x].length < newRows) {
                this.cells[x].push(CellType.EMPTY);
            }
        }
        while (this.cells.length < newColumns) {
            this.cells.push(new Array(newRows).fill(CellType.EMPTY));
        }
        (this as { columns: number }).columns = newColumns;
        (this as { rows: number }).rows = newRows;
    }

    /**
     * Reset the grid to all empty cells (new dimensions allowed).
     */
    reset(columns: number, rows: number): void {
        (this as { columns: number }).columns = columns;
        (this as { rows: number }).rows = rows;
        this.cells = new Array(columns)
            .fill(CellType.EMPTY)
            .map(() => new Array(rows).fill(CellType.EMPTY));
        this.pendingIntents = [];
    }
}
