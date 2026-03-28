import { Direction } from "../utilities";
import Snake from "../snake";

// --- Control Scheme Registry ---

type KeyMap = Record<string, Direction>;

const KEYBOARD_SCHEMES = new Map<string, KeyMap>([
    ['arrows', {
        'ArrowUp': Direction.UP,
        'ArrowDown': Direction.DOWN,
        'ArrowLeft': Direction.LEFT,
        'ArrowRight': Direction.RIGHT,
    } as KeyMap],
    ['wasd', {
        'w': Direction.UP,
        's': Direction.DOWN,
        'a': Direction.LEFT,
        'd': Direction.RIGHT,
    } as KeyMap],
    ['ijkl', {
        'i': Direction.UP,
        'k': Direction.DOWN,
        'j': Direction.LEFT,
        'l': Direction.RIGHT,
    } as KeyMap],
    ['numpad', {
        '8': Direction.UP,
        '5': Direction.DOWN,
        '4': Direction.LEFT,
        '6': Direction.RIGHT,
    } as KeyMap],
]);

// --- Direction helpers ---

function invertDirection(direction: Direction): Direction {
    switch (direction) {
        case Direction.UP: return Direction.DOWN;
        case Direction.DOWN: return Direction.UP;
        case Direction.LEFT: return Direction.RIGHT;
        case Direction.RIGHT: return Direction.LEFT;
    }
}

/**
 * Resolve the effective direction, applying inversion exactly once if enabled.
 * This is the ONLY place inversion is applied -- fixes the double-inversion bug
 * where handleKeyOrDash and handleDirectionChange both inverted independently.
 */
function resolveDirection(raw: Direction, inverted: boolean): Direction {
    return inverted ? invertDirection(raw) : raw;
}

// --- Input handling ---

function handleDirectionChange(snake: Snake, rawDirection: Direction) {
    const effective = resolveDirection(rawDirection, snake.settings.invertedControls);
    if (!snake.hasMovedOnce) {
        snake.hasMovedOnce = true;
    } else {
        snake.prevDirection = snake.direction;
    }
    snake.directionChanged = true;
    snake.direction = effective;
    snake.hasDashedThisDirection = false;
}

function handleKeyOrDash(snake: Snake, rawDirection: Direction) {
    const effective = resolveDirection(rawDirection, snake.settings.invertedControls);

    if (snake.hasMovedOnce && snake.direction === effective) {
        if (!snake.hasDashedThisDirection || snake.dashUnlimited) {
            snake.pendingDash = true;
        }
        // same direction with no dash available: do nothing
    } else if (!snake.directionChanged || !snake.hasMovedOnce) {
        // Pass raw direction -- handleDirectionChange applies its own resolution
        handleDirectionChange(snake, rawDirection);
    }
}

// --- Public API ---

export function keyPress(event: KeyboardEvent, snakes: Snake[]) {
    for (const [scheme, keyMap] of KEYBOARD_SCHEMES) {
        const snake = snakes.find(s => s.controlScheme === scheme);
        if (!snake) continue;

        const direction = keyMap[event.key];
        if (direction !== undefined) {
            event.preventDefault();
            handleKeyOrDash(snake, direction);
            return; // Key handled, stop checking other schemes
        }
    }
}

// Mouse control scheme -- relative turning, not absolute direction
export function mousePress(event: MouseEvent, snakes: Snake[]) {
    const mouseSnake = snakes.find(s => s.controlScheme === 'mouse');
    if (!mouseSnake) return;

    if (event.button === 1) {
        // Middle click = dash
        if (mouseSnake.hasMovedOnce && (!mouseSnake.hasDashedThisDirection || mouseSnake.dashUnlimited)) {
            mouseSnake.pendingDash = true;
        }
    } else {
        // Left click (0) = turn left relative to current direction
        // Right click (2) = turn right relative to current direction
        const turnLeft = event.button === 0;
        const currentDir = mouseSnake.direction;
        let newDirection: Direction;

        if (turnLeft) {
            switch (currentDir) {
                case Direction.UP: newDirection = Direction.LEFT; break;
                case Direction.LEFT: newDirection = Direction.DOWN; break;
                case Direction.DOWN: newDirection = Direction.RIGHT; break;
                case Direction.RIGHT: newDirection = Direction.UP; break;
            }
        } else {
            switch (currentDir) {
                case Direction.UP: newDirection = Direction.RIGHT; break;
                case Direction.RIGHT: newDirection = Direction.DOWN; break;
                case Direction.DOWN: newDirection = Direction.LEFT; break;
                case Direction.LEFT: newDirection = Direction.UP; break;
            }
        }

        // Mouse scheme bypasses handleKeyOrDash -- it's relative turning, not absolute direction.
        // Pass the already-resolved direction directly (no inversion for relative turns).
        if (!mouseSnake.hasMovedOnce) {
            mouseSnake.hasMovedOnce = true;
        } else {
            mouseSnake.prevDirection = mouseSnake.direction;
        }
        mouseSnake.directionChanged = true;
        mouseSnake.direction = newDirection!;
        mouseSnake.hasDashedThisDirection = false;
    }

    event.preventDefault();
    event.stopPropagation();
}
