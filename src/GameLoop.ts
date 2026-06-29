import { GameState } from "./GameState";
import { EventContext } from "./components/EventEffect";
import * as drawer from "./draw/draw";
import * as segment from "./draw/Segment";
import { CellType } from "./utilities";

export class GameLoop {
    private state: GameState;
    private fpsInterval: number;
    private then: number;
    private snakeNum: number;
    private onGameOver?: () => void;
    private gameOverHandled = false;
    private rafId = 0;

    constructor(state: GameState, onGameOver?: () => void) {
        this.state = state;
        this.fpsInterval = 1000 / state.runtime.fps;
        this.then = window.performance.now();
        this.snakeNum = state.snakes.length;
        this.onGameOver = onGameOver;
    }

    start(): void {
        drawer.updateRoundInfo(this.state.roundNumber + 1, this.state.config.roundLimit);
        this.draw(0);
    }

    stop(): void {
        cancelAnimationFrame(this.rafId);
    }

    private draw = (newtime: DOMHighResTimeStamp): void => {
        this.rafId = requestAnimationFrame(this.draw);

        const now = newtime;
        const elapsed = now - this.then;
        if (elapsed <= this.fpsInterval) return;

        this.then = now - (elapsed % this.fpsInterval);
        this.tick();
    }

    private tick(): void {
        const state = this.state;

        if (state.gameOver) {
            if (!this.gameOverHandled) {
                this.gameOverHandled = true;
                this.onGameOver?.();
            }
            const combinedSettings = { ...state.config, ...state.runtime, elapsed: 0 };
            drawer.drawFinalScores(state.snakes, combinedSettings);
            return;
        }

        let liveSnakes = 0;

        // 1. Count live snakes
        state.snakes.forEach(snake => {
            if (!snake.dead) liveSnakes++;
        });

        // 2. Collect intents and resolve (move-then-resolve pattern from Phase 4)
        const frozen = state.frame < state.runtime.frozenUntilFrame;

        if (!frozen) {
            // Write dead score cells as hazards before snakes read the grid
            if (state.runtime.deadScore) {
                segment.getScoreGridCells(state.snakes, state.config.columnNum).forEach(([x, y]) => {
                    state.grid.setCell(x, y, CellType.HAZARD);
                });
            }

            // Collect intents (snakes read grid but do NOT write)
            state.snakes.forEach(snake => {
                const intent = snake.update(state.grid, state.started, state.frame);
                if (intent) { state.grid.queueIntent(intent); }
                if (snake.dead) { snake.markDead(state.grid); }
            });
            // Resolve all intents simultaneously and apply any deaths the resolver detected
            // (e.g. simultaneous same-cell collisions that snake.update() couldn't see)
            const collisionResults = state.grid.resolveAll();
            collisionResults.forEach(result => {
                const { type } = result.outcome;
                if (type === 'died_snake' || type === 'died_wall' || type === 'died_hazard') {
                    const snake = state.snakes.find(s => s.id === result.snakeId);
                    if (snake && !snake.dead) snake.dead = true;
                }
            });
        }

        // 3. Write surviving snake bodies to grid for rendering
        state.snakes.forEach(snake => {
            if (!snake.dead) snake.drawSnakeToGrid(state.grid, state.frame);
        });

        // 4. Check round end
        if ((this.snakeNum > 1 && liveSnakes <= 1) || (this.snakeNum == 1 && liveSnakes == 0)) {
            state.reset();
            drawer.updateActivityLog(state.roundLog, state.config.colours);
            if (!state.gameOver) {
                drawer.updateRoundInfo(state.roundNumber + 1, state.baseConfig.roundLimit);
            }
            this.fpsInterval = 1000 / state.runtime.fps;
            this.snakeNum = state.snakes.length;
            return;
        }

        // 5. Execute triggers (food spawning, FPS escalation)
        if (state.started && (state.frame % state.runtime.foodInterval) == 0) {
            state.spawnFood();
        }
        if (state.started && (state.frame % 100 == 0)) {
            state.runtime.fps += 1;
            this.fpsInterval = 1000 / state.runtime.fps;
        }

        // 6. Tick ongoing effects (ring of fire, meteors)
        const tickContext: EventContext = {
            grid: state.grid.getRawGrid(),
            gameGrid: state.grid,
            snakes: state.snakes,
            config: state.config,
            runtime: state.runtime,
            frame: state.frame,
            addEvent: state.addEvent.bind(state),
        };
        state.eventRegistry.tickAll(tickContext);

        // 7. Render
        const combinedSettings = {
            ...state.config,
            ...state.runtime,
            elapsed: 0,
        };

        drawer.drawGrid(state.grid.getRawGrid(), combinedSettings);
        drawer.drawMeteorWarnings(state.runtime.meteors, state.frame, combinedSettings);

        if (state.runtime.deadScore) {
            state.snakes.forEach(snake => {
                segment.drawScore(snake, 5, combinedSettings);
                segment.drawTotalScore(snake, 5, combinedSettings);
            });
        }
        if (!state.runtime.deadScore) drawer.drawScore(state.snakes, combinedSettings);
        if (!state.runtime.deadScore) drawer.drawTotalScore(state.snakes, combinedSettings);
        drawer.drawEvents(state.events, combinedSettings, state.frame);
        drawer.drawSettings(state.runtime.currentSettings, combinedSettings);

        if (state.roundWinner && state.frame < state.showWinnerUntil) {
            drawer.drawWinner(state.roundWinner.colour, state.longestSnakesInRound, state.longestSnakeLength, combinedSettings);
        }

        // 8. Advance frame
        state.frame++;

        // Update fpsInterval in case an event changed fps
        this.fpsInterval = 1000 / state.runtime.fps;
    }
}
