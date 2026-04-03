import { Settings, SettingsType, Status, getBeginSettings } from "./components/Settings"
import { SnakeEvent, SnakeEventType } from "./components/SnakeEvent";
import Snake from "./snake";
import { Direction, CellType, CellValue } from "./utilities";
import * as drawer from "./draw/draw";
import * as segment from "./draw/Segment";
import * as controller from "./components/controller";
import { EventRegistry, EventContext } from "./components/EventEffect";
import { SpeedEffect } from "./components/effects/SpeedEffect";
import { RingOfFireEffect } from "./components/effects/RingOfFireEffect";
import { MeteorEffect } from "./components/effects/MeteorEffect";
import { FreakFridayEffect } from "./components/effects/FreakFridayEffect";
import { CurseEffect } from "./components/effects/CurseEffect";
import { LengthEffect } from "./components/effects/LengthEffect";
import { DashBoostEffect } from "./components/effects/DashBoostEffect";
import { DashFrenzyEffect } from "./components/effects/DashFrenzyEffect";
import { GameGrid } from "./GameGrid";

let settings: Settings = {
    squareSize: 25,
    margin: 5,
    colours:
    {
        'r': '#FF0000',
        'g': '#00FF00',
        'b': '#0000FF',
        'y': 'yellow',
        'm': 'magenta',
        'c': 'cyan',
        '1': '#770000',
        '2': '#005500',
        '3': '#000077',
        '4': '#777700',
        '5': '#770077',
        '6': '#007777',
        'f': '#d44c50',
        'p': 'purple',
        '0': '#243344',
        'w': '#FFFFFF',

    },
    fps: 6,
    foodInterval: 540 / 6,
    curseStrings: ['GET IT OFF ME!!', 'ARGH', 'OWWWW', 'HELP ME',
        'GET IT OFF ME!!', 'ARGH', 'OWWWW', 'HELP ME',
        'OOF', 'MY TAIL!', '!!!!', '!', '!!', '!!!', '!!!',
        'I LOOKED UPON GOD\'S VISAGE AND SAW THAT HE HAS FORSAKEN US'],
    elapsed: 0,
    spawnMargin: 10,
    foodAmount: 6,
    squareColour: '0',
    enabledEvents: [],
    enabledSettings: [],
    startingLength: 3,
    currentSettings: [],
    columnNum: 0,
    rowNum: 0,
    deadScore: false,
    invertedControls: false,
    specialOnly: false,
    status: {
        frame: 0,
        type: Status.NORMAL
    },
    meteors: [],
    frozenUntilFrame: 0,
}

const eventRegistry = new EventRegistry();
eventRegistry.register(new SpeedEffect());
eventRegistry.register(new RingOfFireEffect());
eventRegistry.register(new MeteorEffect());
eventRegistry.register(new FreakFridayEffect());
eventRegistry.register(new CurseEffect());
eventRegistry.register(new LengthEffect());
eventRegistry.register(new DashBoostEffect());
eventRegistry.register(new DashFrenzyEffect());

let frame = 0;
let fpsInterval = 1000 / settings.fps;
let canvas: HTMLCanvasElement;
let events: SnakeEvent[] = []

let gameGrid: GameGrid;

let allSnakes: Snake[] = [];
let roundWinner: Snake | null = null;
let longestSnakeInRound: Snake | null = null;
let longestSnakeLength: number = 0;
let showWinnerUntil: number = 0;

export function addEvent(event: SnakeEvent) {
    events.push(event);

    // Build context for the registry
    const context: EventContext = {
        grid: gameGrid.getRawGrid(),
        snakes: allSnakes,
        settings: settings,
        frame: event.frame,
        addEvent: addEvent,
    };

    // Dispatch to the appropriate effect handler
    eventRegistry.dispatch(event.type, context);

    // Update fpsInterval if speed changed
    fpsInterval = 1000 / settings.fps;
}

function handleResize() {
    // Size of canvas not size of drawing
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
}

export function init(controlSchemes: string[], enabledSettings:string[], enabledEvents: string[]) {
    let snakeNum = controlSchemes.length;
    settings.enabledEvents = enabledEvents.map(event => SnakeEventType[event as keyof typeof SnakeEventType]);
    console.log(settings.enabledEvents);

    settings.enabledSettings = enabledSettings.map(setting => SettingsType[setting as keyof typeof SettingsType]);

    canvas = document.getElementById("snake") as HTMLCanvasElement;
    drawer.initCanvas(canvas)

    let started = false;
    handleResize();
    setSettings();
    gameGrid = new GameGrid(settings.columnNum, settings.rowNum);

    // window.addEventListener("resize", handleResize);
    document.addEventListener('contextmenu', event => event.preventDefault());

    let snakes: Snake[] = []
    createSnakes(controlSchemes, snakes);
    allSnakes = snakes;

    addEventListener("keydown", (e) => {
        if (!started) {
            started = true;
            frame = 0;
        }
        controller.keyPress(e, snakes)
    }, false);

    addEventListener("mousedown", (e) => {
        if (!started) {
            started = true;
            frame = 0;
        }
        controller.mousePress(e, snakes)
    }, false);

    let now = 0
    let then = window.performance.now();
    let elapsed = 0;

    function draw(newtime: DOMHighResTimeStamp) {

        requestAnimationFrame(draw);

        now = newtime;
        elapsed = now - then;
        if (elapsed > fpsInterval) {

            then = now - (elapsed % fpsInterval);

            let liveSnakes = 0;
            const frozen = frame < settings.frozenUntilFrame;

            snakes.forEach(snake => {
                if (!snake.dead) { liveSnakes++ }
            });

            if (!frozen) {
                // Step 1: Collect intents (snakes read grid but do NOT write)
                snakes.forEach(snake => {
                    const intent = snake.update(gameGrid, started, frame);
                    if (intent) {
                        gameGrid.queueIntent(intent);
                    }
                    if (snake.dead) {
                        snake.markDead(gameGrid);
                    }
                });

                // Step 2: Resolve all intents simultaneously
                gameGrid.resolveAll();
                // Results can be used for future features (e.g. simultaneous head-on collision detection)
            }

            // Step 3: Write surviving snake bodies to grid for rendering
            snakes.forEach(snake => {
                if (!snake.dead) {
                    snake.drawSnakeToGrid(gameGrid, frame);
                }
            });

            if ((snakeNum > 1 && liveSnakes <= 1) || (snakeNum == 1 && liveSnakes == 0)) {
                ({ started, fpsInterval } = reset(started, snakes, fpsInterval));
            }

            executeTriggers(started);

            // Tick all ongoing effects
            const tickContext: EventContext = {
                grid: gameGrid.getRawGrid(),
                snakes: snakes,
                settings: settings,
                frame: frame,
                addEvent: addEvent,
            };
            eventRegistry.tickAll(tickContext);

            drawer.drawGrid(gameGrid.getRawGrid(), settings);
            if (settings.deadScore) {
                snakes.forEach(snake => {
                    segment.drawScore(snake, 5, settings);
                    segment.drawTotalScore(snake, 5, settings);
                });
            }
            if (!settings.deadScore) drawer.drawScore(snakes, settings);
            if (!settings.deadScore) drawer.drawTotalScore(snakes, settings);
            drawer.drawEvents(events, settings, frame);
            drawer.drawSettings(settings.currentSettings,settings);

            // Draw winner if we're in the winner display period
            if (roundWinner && frame < showWinnerUntil) {
                drawer.drawWinner(roundWinner.colour, longestSnakeInRound, longestSnakeLength, settings);
            }

            frame++;
        }
    }
    draw(0);

}

function setSettings() {
    let beginSettings = getBeginSettings(settings.enabledSettings);
    settings.currentSettings = beginSettings;

    settings.fps = 6;
    settings.foodInterval = 540 / settings.fps;
    settings.foodAmount = 6;
    settings.squareSize = 25;
    settings.margin = 5;
    settings.spawnMargin = 20;
    settings.squareColour = '0';
    settings.startingLength = 3;
    settings.deadScore = false;
    settings.invertedControls = false;
    settings.specialOnly = false;
    settings.colours['0'] = '#243344'; // Reset to default dark color

    beginSettings.forEach((setting: SettingsType) => {
        switch (setting) {
            case SettingsType.BIG:
                settings.squareSize = 50;
                settings.margin = 10;
                settings.spawnMargin = 0;
                settings.fps -= 2;
                break;
            case SettingsType.SMALL:
                settings.squareSize = 10;
                settings.margin = 2;
                settings.foodAmount = settings.foodAmount * 2;
                settings.fps += 5;
                break;
            case SettingsType.FAST:
                settings.fps = 12;
                break;
            case SettingsType.SHORT:
                settings.startingLength = 1;
                break;
            case SettingsType.LONG:
                settings.startingLength = 10;
                break;
            case SettingsType.REALLY_LONG:
                settings.startingLength = 100;
                break;
            case SettingsType.DEAD_SCORE:
                settings.deadScore = true;
                break;
            case SettingsType.INVERTED_CONTROLS:
                settings.invertedControls = true;
                settings.colours['0'] = '#ABAC9B';
                break;
            case SettingsType.SPECIAL_ONLY:
                settings.specialOnly = true;
                break;
        }
    });

    settings.columnNum = Math.floor((canvas.width - 100) / settings.squareSize);
    settings.rowNum = Math.floor((canvas.height - 100) / settings.squareSize);
}

function executeTriggers(started: boolean) {
    if (started && (frame % settings.foodInterval) == 0) {
        createFood();
    }
    if (started && (frame % 100 == 0)) {
        settings.fps += 1;
        fpsInterval = 1000 / settings.fps;
    }
}

function createFood() {
    let food: CellValue = CellType.FOOD;
    const pos = gameGrid.findEmpty();
    if (!pos) return; // grid full

    const [x, y] = pos;

    if (settings.specialOnly || frame % (settings.foodInterval * 4) == (settings.foodInterval * 3)) {
        food = CellType.SPECIAL;
        addEvent(new SnakeEvent(x, y, SnakeEventType.SPECIAL, 'SPECIAL FOOD', 'p', frame));
    } else {
        addEvent(new SnakeEvent(x, y, SnakeEventType.FOOD, 'FOOD', 'f', frame));
    }

    gameGrid.setCell(x, y, food);
}

function reset(started: boolean, snakes: Snake[], fpsInterval: number) {
    // Track winner before resetting
    const aliveSnakes = snakes.filter(snake => !snake.dead);
    if (aliveSnakes.length === 1) {
        roundWinner = aliveSnakes[0];
        showWinnerUntil = 20;
    } else {
        roundWinner = null;
    }

    // Track longest snake before resetting
    let longestLength = Math.max(...snakes.map(s => s.length));
    let longestSnakes = snakes.filter(s => s.length === longestLength);
    longestSnakeInRound = longestSnakes[0]; // Display the first one in the tie
    longestSnakeLength = longestLength; // Store the length before reset

    setSettings();
    started = false;

    snakes.filter(snake => !snake.dead).forEach(snake => {
        snake.totalScore += 1;
    });

    // Give points to all snakes that tied for longest
    longestSnakes.forEach(snake => {
        snake.totalScore += 1;
    });

    snakes.forEach(snake => {
        snake.reset();
    });
    fpsInterval = 1000 / settings.fps;
    gameGrid.reset(settings.columnNum, settings.rowNum);
    frame = 0;
    events = [];
    settings.meteors = [];
    settings.frozenUntilFrame = 0;
    settings.status = {
        frame: 0,
        type: Status.NORMAL
    }
    return { started, fpsInterval };
}

function createSnakes(controlSchemes: string[], snakes: Snake[]) {
    const colours = ['r', 'g', 'b', 'y', 'm', 'c'];
    for (let i = 0; i < controlSchemes.length; i++) {
        let x = Math.floor(Math.random() * (settings.columnNum - settings.spawnMargin * 2)) + settings.spawnMargin;
        let y = Math.floor(Math.random() * (settings.rowNum - settings.spawnMargin * 2)) + settings.spawnMargin;
        let direction = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT][Math.floor(Math.random() * 4)];
        let length = settings.startingLength;
        let colour = colours[i % colours.length];
        snakes.push(new Snake(x, y, direction, length, colour, i + 1, settings, addEvent, controlSchemes[i]));
    }
}
