import { getSettingRarity, Settings, SettingsType } from "../components/Settings";
import { SnakeEvent } from "../components/SnakeEvent";
import Snake from "../snake";
import { Rarity } from "../utilities";

let ctx: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;
let gridOffset = 0;

export function initCanvas(canvasIn: HTMLCanvasElement) {
    ctx = canvasIn.getContext("2d") as CanvasRenderingContext2D;
    canvas = canvasIn;
    gridOffset = 55;
}

export function drawGrid(grid: string[][], settings: Settings) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = settings.colours[settings.squareColour];
    for (let i = 0; i < settings.columnNum; i++) {
        for (let j = 0; j < settings.rowNum; j++) {
            setColour(grid[i][j], settings.colours, settings.squareColour);
            let x = i * settings.squareSize;
            let y = j * settings.squareSize;
            ctx.fillRect(x + (settings.margin/2), y + (settings.margin/2) + gridOffset, settings.squareSize - (settings.margin / 2), settings.squareSize - (settings.margin / 2));
        }
    }
}

export function drawEvents(events: SnakeEvent[], settings: Settings, frame: number) {
    for (let e of events) {
        if (frame - e.frame > 5) continue;
        ctx.fillStyle = settings.colours[e.colour];
        ctx.font = "48px monospace";
        ctx.fillText(e.text, e.x * settings.squareSize , e.y * settings.squareSize);
    }
}

export function drawSettings(settingTypes: SettingsType[], settings: Settings){
    ctx.font = "48px monospace";
    ctx.fillStyle = settings.colours['w'];

    let x = 0;

    ctx.fillText("ROUND SETTINGS: ", 0, 50);

    x += ctx.measureText("ROUND SETTINGS: ").width + 10;

    if (settingTypes.length == 0) {
        ctx.fillText("NONE", x, 50);
        return;
    }

    settingTypes.forEach((setting: SettingsType, index: number) => {
        let rarity = getSettingRarity(setting)
        if (rarity == Rarity.COMMON) {
            ctx.fillStyle = settings.colours['g'];
        } else if (rarity == Rarity.RARE) {
            ctx.fillStyle = settings.colours['b'];
        } else if (rarity == Rarity.EPIC) {
            ctx.fillStyle = settings.colours['p'];
        }

        ctx.fillText(setting, x, 50);
        x += ctx.measureText(setting).width + 5;

        if (index < settingTypes.length - 1) {
            ctx.fillStyle = settings.colours['w'];
            ctx.fillText("+", x, 50);
        }

        x += ctx.measureText("+").width + 5;
    });
}

export function drawScore(snakes: Snake[], settings: Settings) {
    ctx.font = "24px monospace";
    ctx.fillStyle = settings.colours['w'];
    let y = 50 + gridOffset;
    let x = 10
    ctx.fillText("ROUND SCORES: ", x, y);
    x += ctx.measureText("ROUND SCORES: ").width + 10;
    

    snakes.forEach((snake: Snake) => {
        setColour(snake.colour, settings.colours, settings.squareColour);
        ctx.fillText(snake.length.toString(), x, y);
        x += ctx.measureText(snake.length.toString()).width + 10;
    });
}

export function drawTotalScore(snakes: Snake[], settings: Settings) {
    ctx.font = "24px monospace";
    ctx.fillStyle = settings.colours['w'];
    let y = 100 + gridOffset;
    let x = 10
    ctx.fillText("TOTAL SCORES: ", x, y);
    x += ctx.measureText("TOTAL SCORES: ").width + 10;
    

    snakes.forEach((snake: Snake) => {
        setColour(snake.colour, settings.colours, settings.squareColour);
        ctx.fillText(snake.totalScore.toString(), x, y);
        x += ctx.measureText(snake.totalScore.toString()).width + 10;
    });
}

export function setColour(colour: string, colours: Record<string, string>, squareColour: string) {
    if (colours[colour]) {
        ctx.fillStyle = colours[colour];
    } else {
        ctx.fillStyle = colours[squareColour];
    }
}

