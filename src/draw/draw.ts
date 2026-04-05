import { getSettingRarity, Settings, SettingsType } from "../components/Settings";
import { SnakeEvent } from "../components/SnakeEvent";
import { RoundLogEntry } from "../GameState";
import Snake from "../snake";
import { Rarity, CellValue } from "../utilities";

let ctx: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;
let gridOffset = 0;

export function initCanvas(canvasIn: HTMLCanvasElement) {
    ctx = canvasIn.getContext("2d") as CanvasRenderingContext2D;
    canvas = canvasIn;
    gridOffset = 55;
}

export function getCtx(): CanvasRenderingContext2D {
    return ctx;
}

export function getGridOffset(): number {
    return gridOffset;
}

export function drawGrid(grid: CellValue[][], settings: Settings) {
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    for (let e of events) {
        if (frame - e.frame > 5) continue;
        ctx.fillStyle = settings.colours[e.colour];
        ctx.font = "48px monospace";
        ctx.fillText(e.text, e.x * settings.squareSize, e.y * settings.squareSize + gridOffset);
    }
    
    // Reset text alignment
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
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
    ctx.fillText("LENGTHS: ", x, y);
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

export function drawWinner(winnerColour: string, longestSnakes: Snake[], longestLength: number, settings: Settings) {
    ctx.font = "bold 120px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = `${winnerColour.toUpperCase()} WINS`;
    const x = canvas.width / 2;
    const y = canvas.height / 2;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(text, x, y);

    setColour(winnerColour, settings.colours, settings.squareColour);
    ctx.fillText(text, x, y);

    // Draw longest snake(s) below the winner text
    if (longestSnakes.length > 0) {
        ctx.font = "60px monospace";
        const names = longestSnakes.map(s => s.colour.toUpperCase()).join(", ");
        const longestText = `LONGEST: ${names} (${longestLength})`;
        const longestY = y + 100;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(longestText, x, longestY);

        // Use first snake's colour for the text (tie case is multicoloured by nature, pick one)
        setColour(longestSnakes[0].colour, settings.colours, settings.squareColour);
        ctx.fillText(longestText, x, longestY);
    }

    // Reset text alignment
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

export function drawFinalScores(snakes: Snake[], settings: Settings): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sorted = [...snakes].sort((a, b) => b.totalScore - a.totalScore);
    const topScore = sorted[0]?.totalScore ?? 0;
    const champions = sorted.filter(s => s.totalScore === topScore);

    const cx = canvas.width / 2;
    let y = canvas.height / 4;

    // Title
    ctx.font = "bold 80px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = settings.colours['w'];
    ctx.fillText("GAME OVER", cx, y);
    y += 100;

    // Champion line
    if (champions.length === 1) {
        ctx.font = "bold 60px monospace";
        setColour(champions[0].colour, settings.colours, settings.squareColour);
        ctx.fillText(`${champions[0].colour.toUpperCase()} IS CHAMPION`, cx, y);
    } else {
        ctx.font = "bold 60px monospace";
        ctx.fillStyle = settings.colours['w'];
        const names = champions.map(s => s.colour.toUpperCase()).join(" & ");
        ctx.fillText(`${names} TIE`, cx, y);
    }
    y += 90;

    // Scores list
    ctx.font = "40px monospace";
    sorted.forEach(snake => {
        setColour(snake.colour, settings.colours, settings.squareColour);
        ctx.fillText(`${snake.colour.toUpperCase()}  ${snake.totalScore}`, cx, y);
        y += 55;
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

export function updateRoundInfo(roundNumber: number, roundLimit: number | null): void {
    const el = document.getElementById('round-info');
    if (!el) return;

    const limitText = roundLimit !== null ? `/ ${roundLimit}` : '/ ∞';
    el.innerHTML = `
        <span class="round-label">Round</span>
        <span class="round-number">${roundNumber}</span>
        <span class="round-limit">${limitText}</span>
    `;
}

export function showGameOverUI(onPlayAgain: () => void, onHome: () => void): void {
    if (document.getElementById('game-over-ui')) return;

    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;

    const overlay = document.createElement('div');
    overlay.id = 'game-over-ui';
    overlay.style.cssText = 'position:absolute;left:0;right:0;bottom:170px;display:flex;justify-content:center;gap:30px;pointer-events:none;';

    const makeBtn = (label: string, onClick: () => void) => {
        const btn = document.createElement('button');
        btn.className = 'glass-button';
        btn.textContent = label;
        btn.style.pointerEvents = 'auto';
        btn.style.margin = '0';
        btn.addEventListener('click', onClick);
        return btn;
    };

    overlay.appendChild(makeBtn('PLAY AGAIN', onPlayAgain));
    overlay.appendChild(makeBtn('HOME', onHome));
    wrapper.appendChild(overlay);
}

export function updateActivityLog(log: RoundLogEntry[], colours: Record<string, string>): void {
    const el = document.getElementById('activity-log');
    if (!el) return;

    const colourSpan = (c: string) =>
        `<span style="color:${colours[c] ?? '#fff'}">${c.toUpperCase()}</span>`;

    el.innerHTML = log.slice().reverse().map(entry => {
        const winnerPart = entry.winner ? `${colourSpan(entry.winner)} wins` : 'Draw';
        const longestPart = entry.longestSnakes.map(colourSpan).join(', ');
        return `<div class="log-entry">Round ${entry.round} &mdash; ${winnerPart} &nbsp;|&nbsp; Longest: ${longestPart} (${entry.longestLength})</div>`;
    }).join('');
}
