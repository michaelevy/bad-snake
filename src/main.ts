import { Settings, SettingsType, getBeginSettings } from "./components/Settings"
import { SnakeEvent, SnakeEventType } from "./components/SnakeEvent";
import Snake from "./snake";
import { Direction } from "./utilities";
import * as drawer from "./draw/draw";
import * as segment from "./draw/Segment";
import * as controller from "./components/controller";

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
}

let frame = 0;
let fpsInterval = 1000 / settings.fps;
let canvas: HTMLCanvasElement;
let events: SnakeEvent[] = []

export function addEvent(event: SnakeEvent) {
    events.push(event);
    if (event.type == SnakeEventType.SPEED) {
        settings.fps = settings.fps + 5
        fpsInterval = 1000 / settings.fps;
        console.log(settings.fps);
    }
    console.log(`Event added: ${event.colour} ${event.type} at frame ${event.frame}`);
}

function handleResize() {
    // Size of canvas not size of drawing
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
}

export function init(playerNum: number, enabledSettings:string[], enabledEvents: string[]) {
    let snakeNum = playerNum;
    settings.enabledEvents = enabledEvents.map(event => SnakeEventType[event as keyof typeof SnakeEventType]);

    settings.enabledSettings = enabledSettings.map(setting => SettingsType[setting as keyof typeof SettingsType]);
    

    canvas = document.getElementById("snake") as HTMLCanvasElement;
    drawer.initCanvas(canvas)

    let started = false;
    handleResize();
    setSettings();
    let grid = new Array(settings.columnNum).fill('0').map(() => new Array(settings.rowNum).fill('0'));

    // window.addEventListener("resize", handleResize);
    document.addEventListener('contextmenu', event => event.preventDefault());

    let snakes: Snake[] = []
    createSnakes(snakeNum, snakes);

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

            snakes.forEach(snake => {
                if (!snake.dead) { liveSnakes++ }
                snake.update(grid, started, frame);
                if (settings.deadScore){
                    segment.drawScore(grid, snake, 5);
                    segment.drawTotalScore(grid, snake, 5);
                }
            });

            if ((snakeNum > 1 && liveSnakes <= 1) || (snakeNum == 1 && liveSnakes == 0)) {
                ({ started, fpsInterval, grid } = reset(started, snakes, fpsInterval, grid));
            }

            fpsInterval = executeTriggers(started, grid, fpsInterval);

            drawer.drawGrid(grid, settings);
            if (!settings.deadScore) drawer.drawScore(snakes, settings);
            if (!settings.deadScore) drawer.drawTotalScore(snakes, settings);
            drawer.drawEvents(events, settings, frame);
            drawer.drawSettings(settings.currentSettings,settings);

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
        }
    });

    settings.columnNum = Math.floor((canvas.width - 100) / settings.squareSize);
    settings.rowNum = Math.floor((canvas.height - 100) / settings.squareSize);
}

function executeTriggers(started: boolean, grid: any[][], fpsInterval: number) {
    if (started && (frame % settings.foodInterval) == 0) {
        createFood(grid);
    }
    if (started && (frame % 100 == 0)) {
        settings.fps += 1;
        fpsInterval = 1000 / settings.fps;
    }
    return fpsInterval;
}

function createFood(grid: any[][]) {
    let food = 'f';
    let x = Math.floor(Math.random() * settings.columnNum);
    let y = Math.floor(Math.random() * settings.rowNum);
    while (grid[x][y] != '0') {
        x = Math.floor(Math.random() * settings.columnNum);
        y = Math.floor(Math.random() * settings.rowNum);
    }

    if (frame % (settings.foodInterval * 5) == 0) {
        food = 'p';
        addEvent(new SnakeEvent(x, y, SnakeEventType.SPECIAL, 'SPECIAL FOOD', 'p', frame));
    } else {
        addEvent(new SnakeEvent(x, y, SnakeEventType.FOOD, 'FOOD', 'f', frame));
    }

    grid[x][y] = food;
}

function reset(started: boolean, snakes: Snake[], fpsInterval: number, grid: any[][]) {
    setSettings();
    started = false;
    snakes.filter(snake => !snake.dead).forEach(snake => {
        snake.totalScore += snake.length;
    });
    snakes.forEach(snake => {
        snake.reset();
    });
    fpsInterval = 1000 / settings.fps;
    grid = new Array(settings.columnNum).fill('0').map(() => new Array(settings.rowNum).fill('0'));
    frame = 0;
    events = [];
    return { started, fpsInterval, grid };
}

function createSnakes(snakeNum: number, snakes: Snake[]) {
    for (let i = 0; i < snakeNum; i++) {
        let x = Math.floor(Math.random() * (settings.columnNum - settings.spawnMargin * 2)) + settings.spawnMargin;
        let y = Math.floor(Math.random() * (settings.rowNum - settings.spawnMargin * 2)) + settings.spawnMargin;
        let direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction;
        let length = settings.startingLength;
        let colour = ['r', 'g', 'b', 'y', 'm', 'c'][i];
        snakes.push(new Snake(x, y, direction, length, colour, i + 1, settings, addEvent));
    }
}
