import { GameGrid } from "./GameGrid";
import { GameConfig, RuntimeState, Settings, Status, getBeginSettings, SettingsType } from "./components/Settings";
import { SnakeEvent, SnakeEventType } from "./components/SnakeEvent";
import { EventRegistry, EventContext } from "./components/EventEffect";
import { SpeedEffect } from "./components/effects/SpeedEffect";
import { RingOfFireEffect } from "./components/effects/RingOfFireEffect";
import { MeteorEffect } from "./components/effects/MeteorEffect";
import { FreakFridayEffect } from "./components/effects/FreakFridayEffect";
import { CurseEffect } from "./components/effects/CurseEffect";
import { LengthEffect } from "./components/effects/LengthEffect";
import { DashBoostEffect } from "./components/effects/DashBoostEffect";
import { DashFrenzyEffect } from "./components/effects/DashFrenzyEffect";
import { CornucopiaEffect, GrandFeastEffect, BountifulHarvestEffect } from "./components/effects/CornucopiaEffect";
import Snake from "./snake";
import { Direction, CellType, CellValue } from "./utilities";

export interface RoundLogEntry {
    round: number;
    winner: string | null;
    longestSnakes: string[];
    longestLength: number;
}

export class GameState {
    grid: GameGrid;
    snakes: Snake[];
    runtime: RuntimeState;
    config: GameConfig;
    readonly baseConfig: GameConfig;
    events: SnakeEvent[];
    eventRegistry: EventRegistry;
    frame: number;
    started: boolean;
    roundWinner: Snake | null;
    longestSnakesInRound: Snake[];
    longestSnakeLength: number;
    showWinnerUntil: number;
    roundNumber: number;
    roundLog: RoundLogEntry[];
    gameOver: boolean;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(config: GameConfig) {
        this.baseConfig = config;
        this.config = config;
        this.grid = new GameGrid(config.columnNum, config.rowNum);
        this.snakes = [];
        this.events = [];
        this.frame = 0;
        this.started = false;
        this.roundWinner = null;
        this.longestSnakesInRound = [];
        this.longestSnakeLength = 0;
        this.showWinnerUntil = 0;
        this.roundNumber = 0;
        this.roundLog = [];
        this.gameOver = false;
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        this.runtime = {
            fps: config.fps,
            foodInterval: Math.round(540 / config.fps),
            status: { frame: 0, type: Status.NORMAL },
            meteors: [],
            deadScore: false,
            invertedControls: false,
            specialOnly: false,
            frozenUntilFrame: 0,
            currentSettings: [],
        };

        // Create and populate event registry
        this.eventRegistry = new EventRegistry();
        this.eventRegistry.register(new SpeedEffect());
        this.eventRegistry.register(new RingOfFireEffect());
        this.eventRegistry.register(new MeteorEffect());
        this.eventRegistry.register(new FreakFridayEffect());
        this.eventRegistry.register(new CurseEffect());
        this.eventRegistry.register(new LengthEffect());
        this.eventRegistry.register(new DashBoostEffect());
        this.eventRegistry.register(new DashFrenzyEffect());
        this.eventRegistry.register(new CornucopiaEffect());
        this.eventRegistry.register(new GrandFeastEffect());
        this.eventRegistry.register(new BountifulHarvestEffect());
    }

    createSnakes(controlSchemes: string[]): void {
        const colours = ['r', 'g', 'b', 'y', 'm', 'c'];
        for (let i = 0; i < controlSchemes.length; i++) {
            const x = Math.floor(Math.random() * (this.config.columnNum - this.config.spawnMargin * 2)) + this.config.spawnMargin;
            const y = Math.floor(Math.random() * (this.config.rowNum - this.config.spawnMargin * 2)) + this.config.spawnMargin;
            const direction = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT][Math.floor(Math.random() * 4)];
            const length = this.config.startingLength;
            const colour = colours[i % colours.length];

            // Snake still receives the combined settings object for backward compatibility.
            // It reads config values from it. This is acceptable since config values don't change mid-round.
            const combinedSettings = this.buildCombinedSettings();
            this.snakes.push(new Snake(x, y, direction, length, colour, i + 1, combinedSettings, this.addEvent.bind(this), controlSchemes[i]));
        }
    }

    addEvent(event: SnakeEvent): void {
        this.events.push(event);

        const context: EventContext = {
            grid: this.grid.getRawGrid(),
            gameGrid: this.grid,
            snakes: this.snakes,
            config: this.config,
            runtime: this.runtime,
            frame: event.frame,
            eventX: event.x,
            eventY: event.y,
            addEvent: this.addEvent.bind(this),
        };

        this.eventRegistry.dispatch(event.type, context);
    }

    spawnFood(): void {
        let food: CellValue = CellType.FOOD;
        const pos = this.grid.findEmpty();
        if (!pos) return;

        const [x, y] = pos;

        if (this.runtime.specialOnly || this.frame % (this.runtime.foodInterval * 4) == (this.runtime.foodInterval * 3)) {
            food = CellType.SPECIAL;
            this.addEvent(new SnakeEvent(x, y, SnakeEventType.SPECIAL, 'SPECIAL FOOD', 'p', this.frame));
        } else {
            this.addEvent(new SnakeEvent(x, y, SnakeEventType.FOOD, 'FOOD', 'f', this.frame));
        }

        this.grid.setCell(x, y, food);
    }

    reset(): void {
        // Track winner before resetting
        const aliveSnakes = this.snakes.filter(snake => !snake.dead);
        if (aliveSnakes.length === 1) {
            this.roundWinner = aliveSnakes[0];
            this.showWinnerUntil = 20;
        } else {
            this.roundWinner = null;
        }

        // Track longest snake
        const longestLength = Math.max(...this.snakes.map(s => s.length));
        const longestSnakes = this.snakes.filter(s => s.length === longestLength);
        this.longestSnakesInRound = longestSnakes;
        this.longestSnakeLength = longestLength;

        // Score: alive snakes get +1, longest snakes get +1
        this.snakes.filter(snake => !snake.dead).forEach(snake => {
            snake.totalScore += 1;
        });
        longestSnakes.forEach(snake => {
            snake.totalScore += 1;
        });

        this.roundNumber++;
        this.roundLog.push({
            round: this.roundNumber,
            winner: this.roundWinner?.colour ?? null,
            longestSnakes: longestSnakes.map(s => s.colour),
            longestLength,
        });

        if (this.baseConfig.roundLimit !== null && this.roundNumber >= this.baseConfig.roundLimit) {
            this.gameOver = true;
            return;
        }

        // Apply new round settings
        this.applyRoundSettings();

        this.started = false;
        this.snakes.forEach(snake => {
            snake.settings = this.buildCombinedSettings();
            snake.reset();
        });
        this.grid.reset(this.config.columnNum, this.config.rowNum);
        this.frame = 0;
        this.events = [];
        this.runtime.meteors = [];
        this.runtime.status = { frame: 0, type: Status.NORMAL };
        this.runtime.frozenUntilFrame = 0;
    }

    /**
     * Build a fresh GameConfig for a new round. Creates a NEW config object
     * rather than mutating the existing one, preserving the immutability contract.
     */
    applyRoundSettings(): void {
        const beginSettings = getBeginSettings(this.baseConfig.enabledSettings);

        // Start with base defaults
        let squareSize = 25;
        let margin = 5;
        let spawnMargin = 20;
        let foodAmount = 6;
        let startingLength = 3;
        let fps = 6;
        const colours = { ...this.baseConfig.colours, '0': '#243344' };

        // Reset runtime
        this.runtime = {
            fps: 6,
            foodInterval: Math.round(540 / 6),
            status: { frame: 0, type: Status.NORMAL },
            meteors: [],
            deadScore: false,
            invertedControls: false,
            specialOnly: false,
            frozenUntilFrame: 0,
            currentSettings: beginSettings,
        };

        beginSettings.forEach((setting: SettingsType) => {
            switch (setting) {
                case SettingsType.BIG:
                    squareSize = 50; margin = 10; spawnMargin = 0; fps -= 2; break;
                case SettingsType.SMALL:
                    squareSize = 10; margin = 2; foodAmount *= 2; fps += 5; break;
                case SettingsType.FAST:
                    fps = 12; break;
                case SettingsType.SHORT:
                    startingLength = 1; break;
                case SettingsType.LONG:
                    startingLength = 10; break;
                case SettingsType.REALLY_LONG:
                    startingLength = 100; break;
                case SettingsType.DEAD_SCORE:
                    this.runtime.deadScore = true; break;
                case SettingsType.INVERTED_CONTROLS:
                    this.runtime.invertedControls = true; colours['0'] = '#ABAC9B'; break;
                case SettingsType.SPECIAL_ONLY:
                    this.runtime.specialOnly = true; break;
            }
        });

        this.runtime.fps = fps;
        this.runtime.foodInterval = Math.round(540 / fps);

        // Create NEW immutable config for this round
        this.config = {
            ...this.baseConfig,
            squareSize,
            margin,
            spawnMargin,
            foodAmount,
            startingLength,
            colours,
            fps,
            columnNum: Math.floor((this.canvasWidth - 100) / squareSize),
            rowNum: Math.floor((this.canvasHeight - 100) / squareSize),
        };
    }

    setCanvasDimensions(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    /**
     * Build a combined settings object for backward compatibility with Snake.
     * Snake reads config values from this. The values don't change mid-round.
     */
    private buildCombinedSettings(): Settings {
        return {
            ...this.config,
            ...this.runtime,
            elapsed: 0,
        };
    }
}
