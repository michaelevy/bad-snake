import { describe, it, expect, beforeEach } from 'vitest';
import { GameGrid } from './GameGrid';
import { CellType } from './utilities';

describe('GameGrid', () => {
    let grid: GameGrid;

    beforeEach(() => {
        grid = new GameGrid(10, 10);
    });

    describe('constructor', () => {
        it('creates an empty grid with correct dimensions', () => {
            const testGrid = new GameGrid(20, 15);
            expect(testGrid.columns).toBe(20);
            expect(testGrid.rows).toBe(15);

            // Verify all cells are initially empty
            for (let x = 0; x < 20; x++) {
                for (let y = 0; y < 15; y++) {
                    expect(testGrid.getCell(x, y)).toBe(CellType.EMPTY);
                }
            }
        });
    });

    describe('setCell and getCell', () => {
        it('sets and gets a cell value correctly', () => {
            grid.setCell(5, 5, CellType.FOOD);
            expect(grid.getCell(5, 5)).toBe(CellType.FOOD);
        });

        it('sets and gets HAZARD cell correctly', () => {
            grid.setCell(3, 7, CellType.HAZARD);
            expect(grid.getCell(3, 7)).toBe(CellType.HAZARD);
        });

        it('sets and gets SPECIAL cell correctly', () => {
            grid.setCell(2, 2, CellType.SPECIAL);
            expect(grid.getCell(2, 2)).toBe(CellType.SPECIAL);
        });

        it('sets and gets colour values (snake body)', () => {
            grid.setCell(4, 4, 'r');
            expect(grid.getCell(4, 4)).toBe('r');

            grid.setCell(6, 8, 'g');
            expect(grid.getCell(6, 8)).toBe('g');
        });

        it('ignores setCell calls outside bounds', () => {
            grid.setCell(-1, 5, CellType.FOOD);
            grid.setCell(10, 5, CellType.FOOD); // out of bounds
            grid.setCell(5, -1, CellType.FOOD);
            grid.setCell(5, 10, CellType.FOOD); // out of bounds

            expect(grid.getCell(-1, 5)).toBe(CellType.HAZARD); // out of bounds returns HAZARD
            expect(grid.getCell(10, 5)).toBe(CellType.HAZARD);
            expect(grid.getCell(5, -1)).toBe(CellType.HAZARD);
            expect(grid.getCell(5, 10)).toBe(CellType.HAZARD);
        });

        it('returns HAZARD for out of bounds getCell calls', () => {
            expect(grid.getCell(-5, 0)).toBe(CellType.HAZARD);
            expect(grid.getCell(15, 5)).toBe(CellType.HAZARD);
            expect(grid.getCell(5, -2)).toBe(CellType.HAZARD);
            expect(grid.getCell(5, 20)).toBe(CellType.HAZARD);
        });
    });

    describe('isInBounds', () => {
        it('returns true for valid coordinates', () => {
            expect(grid.isInBounds(0, 0)).toBe(true);
            expect(grid.isInBounds(5, 5)).toBe(true);
            expect(grid.isInBounds(9, 9)).toBe(true);
        });

        it('returns false for out of bounds coordinates', () => {
            expect(grid.isInBounds(-1, 5)).toBe(false);
            expect(grid.isInBounds(10, 5)).toBe(false);
            expect(grid.isInBounds(5, -1)).toBe(false);
            expect(grid.isInBounds(5, 10)).toBe(false);
            expect(grid.isInBounds(20, 20)).toBe(false);
        });

        it('returns true for edge cells', () => {
            expect(grid.isInBounds(0, 0)).toBe(true);
            expect(grid.isInBounds(0, 9)).toBe(true);
            expect(grid.isInBounds(9, 0)).toBe(true);
            expect(grid.isInBounds(9, 9)).toBe(true);
        });
    });

    describe('isEmpty', () => {
        it('returns true for empty cells', () => {
            expect(grid.isEmpty(0, 0)).toBe(true);
            expect(grid.isEmpty(5, 5)).toBe(true);
        });

        it('returns false for non-empty cells', () => {
            grid.setCell(3, 3, CellType.FOOD);
            expect(grid.isEmpty(3, 3)).toBe(false);

            grid.setCell(7, 2, 'r');
            expect(grid.isEmpty(7, 2)).toBe(false);
        });

        it('returns false for out of bounds (treated as HAZARD)', () => {
            expect(grid.isEmpty(-1, 5)).toBe(false);
            expect(grid.isEmpty(10, 5)).toBe(false);
        });
    });

    describe('findEmpty', () => {
        it('finds an empty cell in an empty grid', () => {
            const empty = grid.findEmpty();
            expect(empty).not.toBeNull();
            if (empty) {
                expect(grid.isEmpty(empty[0], empty[1])).toBe(true);
                expect(grid.isInBounds(empty[0], empty[1])).toBe(true);
            }
        });

        it('finds an empty cell when some cells are filled', () => {
            grid.setCell(0, 0, CellType.FOOD);
            grid.setCell(5, 5, 'r');
            grid.setCell(9, 9, CellType.HAZARD);

            const empty = grid.findEmpty();
            expect(empty).not.toBeNull();
            if (empty) {
                expect(grid.isEmpty(empty[0], empty[1])).toBe(true);
            }
        });

        it('returns null when grid is full', () => {
            // Fill entire grid
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 10; y++) {
                    grid.setCell(x, y, CellType.FOOD);
                }
            }

            const empty = grid.findEmpty();
            expect(empty).toBeNull();
        });
    });

    describe('clearTrail', () => {
        it('clears non-hazard cells and skips hazard cells', () => {
            // Set up a trail with mixed hazards and empty cells
            grid.setCell(1, 1, 'r');
            grid.setCell(2, 2, 'r');
            grid.setCell(3, 3, CellType.HAZARD);
            grid.setCell(4, 4, 'r');

            // Clear the trail (private method, so test through resolveMove)
            // We'll set up a move intent and verify that clearTrail preserves hazards
            const rawGrid = grid.getRawGrid();
            expect(rawGrid[1][1]).toBe('r');
            expect(rawGrid[3][3]).toBe(CellType.HAZARD);

            // Instead, we'll test this indirectly via a move that clears trail
            const intent = {
                snakeId: 1,
                snakeColour: 'b',
                from: [0, 0] as [number, number],
                to: [5, 5] as [number, number],
                trail: [[1, 1], [2, 2], [3, 3], [4, 4]] as [number, number][],
                bodySegments: [[5, 5], [0, 0]] as [number, number][],
            };

            grid.queueIntent(intent);
            grid.resolveAll();

            // After resolution, trail cells should be cleared (except hazards are preserved)
            expect(grid.getCell(1, 1)).toBe(CellType.EMPTY); // cleared
            expect(grid.getCell(2, 2)).toBe(CellType.EMPTY); // cleared
            expect(grid.getCell(3, 3)).toBe(CellType.HAZARD); // preserved (hazard)
            expect(grid.getCell(4, 4)).toBe(CellType.EMPTY); // cleared
        });
    });

    describe('resolveMove', () => {
        it('resolves a move to an empty cell', () => {
            const intent = {
                snakeId: 1,
                snakeColour: 'r',
                from: [0, 0] as [number, number],
                to: [1, 1] as [number, number],
                trail: [] as [number, number][],
                bodySegments: [[1, 1], [0, 0]] as [number, number][],
            };

            grid.queueIntent(intent);
            const results = grid.resolveAll();

            expect(results).toHaveLength(1);
            expect(results[0].snakeId).toBe(1);
            expect(results[0].outcome.type).toBe('empty');
            expect(grid.getCell(1, 1)).toBe('r');
            expect(grid.getCell(0, 0)).toBe('r');
        });

        it('resolves a move to food', () => {
            grid.setCell(2, 2, CellType.FOOD);

            const intent = {
                snakeId: 1,
                snakeColour: 'g',
                from: [1, 1] as [number, number],
                to: [2, 2] as [number, number],
                trail: [] as [number, number][],
                bodySegments: [[2, 2], [1, 1]] as [number, number][],
            };

            grid.queueIntent(intent);
            const results = grid.resolveAll();

            expect(results[0].outcome.type).toBe('food');
            expect((results[0].outcome as any).cellType).toBe(CellType.FOOD);
        });

        it('resolves a move to hazard (death)', () => {
            grid.setCell(3, 3, CellType.HAZARD);

            const intent = {
                snakeId: 1,
                snakeColour: 'b',
                from: [2, 2] as [number, number],
                to: [3, 3] as [number, number],
                trail: [] as [number, number][],
                bodySegments: [[3, 3], [2, 2]] as [number, number][],
            };

            grid.queueIntent(intent);
            const results = grid.resolveAll();

            expect(results[0].outcome.type).toBe('died_hazard');
            // Dead body should be marked with snake ID
            expect(grid.getCell(3, 3)).toBe('1');
            expect(grid.getCell(2, 2)).toBe('1');
        });

        it('resolves a move out of bounds (wall death)', () => {
            const intent = {
                snakeId: 1,
                snakeColour: 'y',
                from: [9, 9] as [number, number],
                to: [10, 9] as [number, number], // out of bounds
                trail: [] as [number, number][],
                bodySegments: [[10, 9], [9, 9]] as [number, number][],
            };

            grid.queueIntent(intent);
            const results = grid.resolveAll();

            expect(results[0].outcome.type).toBe('died_wall');
            // Dead body marked
            expect(grid.getCell(9, 9)).toBe('1');
        });

        it('clears trail when moving to empty cell', () => {
            grid.setCell(0, 0, 'r');
            grid.setCell(1, 1, 'r');
            grid.setCell(2, 2, 'r');

            const intent = {
                snakeId: 1,
                snakeColour: 'r',
                from: [2, 2] as [number, number],
                to: [3, 3] as [number, number],
                trail: [[0, 0]] as [number, number][],
                bodySegments: [[3, 3], [2, 2], [1, 1]] as [number, number][],
            };

            grid.queueIntent(intent);
            grid.resolveAll();

            // Trail should be cleared
            expect(grid.getCell(0, 0)).toBe(CellType.EMPTY);
            // New position and body should be written
            expect(grid.getCell(3, 3)).toBe('r');
            expect(grid.getCell(2, 2)).toBe('r');
        });
    });

    describe('getRawGrid', () => {
        it('returns the raw grid array', () => {
            grid.setCell(5, 5, CellType.FOOD);
            const raw = grid.getRawGrid();
            expect(raw[5][5]).toBe(CellType.FOOD);
        });
    });

    describe('reset', () => {
        it('resets grid to empty with new dimensions', () => {
            grid.setCell(5, 5, CellType.FOOD);
            grid.reset(20, 20);

            expect(grid.columns).toBe(20);
            expect(grid.rows).toBe(20);
            expect(grid.getCell(5, 5)).toBe(CellType.EMPTY);

            // Verify entire new grid is empty
            for (let x = 0; x < 20; x++) {
                for (let y = 0; y < 20; y++) {
                    expect(grid.getCell(x, y)).toBe(CellType.EMPTY);
                }
            }
        });
    });
});
