import { SettingsType, GameConfig } from "./components/Settings";
import { SnakeEventType } from "./components/SnakeEvent";
import * as drawer from "./draw/draw";
import * as controller from "./components/controller";
import { GameState } from "./GameState";
import { GameLoop } from "./GameLoop";

export function init(controlSchemes: string[], enabledSettings: string[], enabledEvents: string[]) {
    const canvas = document.getElementById("snake") as HTMLCanvasElement;
    drawer.initCanvas(canvas);

    // Size canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    // Parse enabled options from HTML checkboxes
    const parsedEvents = enabledEvents.map(event => SnakeEventType[event as keyof typeof SnakeEventType]);
    const parsedSettings = enabledSettings.map(setting => SettingsType[setting as keyof typeof SettingsType]);

    // Build initial GameConfig with defaults, then apply round settings
    const config: GameConfig = {
        squareSize: 25,
        margin: 5,
        colours: {
            'r': '#FF0000', 'g': '#00FF00', 'b': '#0000FF',
            'y': 'yellow', 'm': 'magenta', 'c': 'cyan',
            '1': '#770000', '2': '#005500', '3': '#000077',
            '4': '#777700', '5': '#770077', '6': '#007777',
            'f': '#d44c50', 'p': 'purple', 'h': '#FF0000', '0': '#243344', 'w': '#FFFFFF',
        },
        curseStrings: [
            'GET IT OFF ME!!', 'ARGH', 'OWWWW', 'HELP ME',
            'GET IT OFF ME!!', 'ARGH', 'OWWWW', 'HELP ME',
            'OOF', 'MY TAIL!', '!!!!', '!', '!!', '!!!', '!!!',
            'I LOOKED UPON GOD\'S VISAGE AND SAW THAT HE HAS FORSAKEN US',
        ],
        spawnMargin: 20,
        foodAmount: 6,
        squareColour: '0',
        enabledEvents: parsedEvents,
        enabledSettings: parsedSettings,
        startingLength: 3,
        columnNum: Math.floor((canvas.width - 100) / 25),
        rowNum: Math.floor((canvas.height - 100) / 25),
        fps: 6,
    };

    // Create game state
    const state = new GameState(config);
    state.setCanvasDimensions(canvas.width, canvas.height);
    state.applyRoundSettings();
    state.createSnakes(controlSchemes);

    // Wire input handlers
    document.addEventListener('contextmenu', event => event.preventDefault());

    addEventListener("keydown", (e) => {
        if (!state.started) {
            state.started = true;
            state.frame = 0;
        }
        controller.keyPress(e, state.snakes);
    }, false);

    addEventListener("mousedown", (e) => {
        if (!state.started) {
            state.started = true;
            state.frame = 0;
        }
        controller.mousePress(e, state.snakes);
    }, false);

    // Start game loop
    const loop = new GameLoop(state);
    loop.start();
}
