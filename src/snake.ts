import { Direction, CellType, isSpecialFood } from './utilities';
import { SnakeEvent, SnakeEventType } from './components/SnakeEvent';
import { getEventResult, Settings } from './components/Settings';
import { GameGrid, MoveIntent, DashIntent, SnakeIntent } from './GameGrid';

export default class Snake {
    x: number;
    y: number;
    direction: Direction;
    prevDirection: Direction | undefined;
    length: number;
    body: number[][];
    curses: number[];
    colour: string;
    dead: boolean;
    totalScore: number;
    directionChanged: boolean;
    id: number;
    settings: Settings;
    addEvent: (event: SnakeEvent) => void;
    hasMovedOnce: boolean;
    controlScheme: string;
    pendingDash: boolean;
    hasDashedThisDirection: boolean;
    dashDistance: number;
    dashUnlimited: boolean;

    constructor(x: number, y: number, direction: Direction, length: number, colour: string, id: number, settings: Settings, addEvent: (event: SnakeEvent) => void, controlScheme: string) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.length = length;
        this.body = [[x, y]];
        this.curses = [];
        this.colour = colour;
        this.dead = false;
        this.id = id;
        this.totalScore = 0;
        this.directionChanged = false;
        this.settings = settings;
        this.addEvent = addEvent;
        this.hasMovedOnce = false;
        this.controlScheme = controlScheme;
        this.pendingDash = false;
        this.hasDashedThisDirection = false;
        this.dashDistance = 3;
        this.dashUnlimited = false;
    }

    /**
     * Compute the snake's intended move this frame.
     * Returns null if the snake doesn't move (dead, not started, frozen).
     * The snake updates its own internal state (body, position) optimistically.
     * It does NOT write to the grid -- the game loop calls resolveAll() for that.
     */
    update(gameGrid: GameGrid, started: boolean, frame: number): SnakeIntent | null {
        if (this.dead) return null;
        if (!started || !this.hasMovedOnce) return null;

        if (this.pendingDash) {
            return this.computeDash(gameGrid, frame);
        } else {
            return this.computeMove(gameGrid, frame);
        }
    }

    private computeMove(gameGrid: GameGrid, frame: number): MoveIntent | null {
        let newX = this.x;
        let newY = this.y;
        let die = false;

        if (this.direction == Direction.UP) {
            if (this.prevDirection == Direction.DOWN) { die = true; }
            newY -= 1;
        } else if (this.direction == Direction.DOWN) {
            if (this.prevDirection == Direction.UP) { die = true; }
            newY += 1;
        } else if (this.direction == Direction.LEFT) {
            if (this.prevDirection == Direction.RIGHT) { die = true; }
            newX -= 1;
        } else if (this.direction == Direction.RIGHT) {
            if (this.prevDirection == Direction.LEFT) { die = true; }
            newX += 1;
        }

        if (frame < 5) {
            die = false;
        }

        if (die) {
            this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.BACKWARDS_MOMENT, "BACKWARDS MOMENT", this.colour, frame));
            this.dead = true;
            return null;
        }

        if (!gameGrid.isInBounds(newX, newY)) {
            this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.WALL, "WALL", this.colour, frame));
            this.dead = true;
            return null;
        }

        // TODO: ARCHITECTURAL TENSION - Collision detection is duplicated here (snake pre-check)
        // and in GameGrid.resolveMove(). Snake pre-checks deaths and returns null, so the resolver's
        // death paths are dead code. Future: Consolidate into resolver only and have snakes commit intents.
        const targetCell = gameGrid.getCell(newX, newY);

        if (targetCell === CellType.FOOD) {
            this.length += this.settings.foodAmount;
            this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.EATEN, "EATEN", this.colour, frame));
        } else if (isSpecialFood(targetCell)) {
            const shouldAbort = this.handleSpecialFood(newX, newY, frame);
            if (this.dead || shouldAbort) return null;
        } else if (targetCell !== CellType.EMPTY) {
            this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.SNAKED, "SNAKED", this.colour, frame));
            this.dead = true;
            return null;
        }

        // Compute trail (tail segments to remove)
        const trail: [number, number][] = [];
        this.x = newX;
        this.y = newY;
        this.directionChanged = false;
        this.prevDirection = this.direction;

        this.body.unshift([newX, newY]);
        while (this.body.length > this.length) {
            const old = this.body.pop();
            if (old) trail.push([old[0], old[1]]);
        }

        return {
            snakeId: this.id,
            snakeColour: this.colour,
            from: [this.x, this.y],
            to: [newX, newY],
            trail,
            bodySegments: this.body.map(b => [b[0], b[1]] as [number, number]),
        };
    }

    private computeDash(gameGrid: GameGrid, frame: number): DashIntent | null {
        this.pendingDash = false;
        const DASH_STEPS = this.dashDistance;

        const steps: [number, number][] = [];
        let cx = this.x, cy = this.y;
        for (let i = 0; i < DASH_STEPS; i++) {
            if (this.direction === Direction.UP) cy -= 1;
            else if (this.direction === Direction.DOWN) cy += 1;
            else if (this.direction === Direction.LEFT) cx -= 1;
            else if (this.direction === Direction.RIGHT) cx += 1;

            if (!gameGrid.isInBounds(cx, cy)) {
                this.addEvent(new SnakeEvent(cx, cy, SnakeEventType.WALL, "WALL", this.colour, frame));
                this.dead = true;
                return null;
            }
            steps.push([cx, cy]);
        }

        // Add all positions to front of body
        for (const step of steps) {
            this.body.unshift([step[0], step[1]]);
        }

        // Check each step for food/special/collision
        let cutFromIndex = this.body.length;
        for (let i = 0; i < DASH_STEPS; i++) {
            const [sx, sy] = steps[i];
            const cell = gameGrid.getCell(sx, sy);

            if (cell === CellType.FOOD) {
                this.length += this.settings.foodAmount;
                this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.EATEN, "EATEN", this.colour, frame));
            } else if (isSpecialFood(cell)) {
                const shouldAbort = this.handleSpecialFood(sx, sy, frame);
                if (shouldAbort) return null;
            } else if (cell !== CellType.EMPTY && cell !== this.colour) {
                const cutAt = DASH_STEPS - i;
                if (cutAt < cutFromIndex) cutFromIndex = cutAt;
            }
        }

        // Compute trail
        const trail: [number, number][] = [];
        if (cutFromIndex < this.body.length) {
            for (let i = cutFromIndex; i < this.body.length; i++) {
                trail.push([this.body[i][0], this.body[i][1]]);
            }
            this.body.splice(cutFromIndex);
            this.length = this.body.length;
        } else {
            for (let i = 0; i < DASH_STEPS; i++) {
                if (this.body.length > this.length) {
                    const old = this.body.pop();
                    if (old) trail.push([old[0], old[1]]);
                }
            }
        }

        this.x = steps[DASH_STEPS - 1][0];
        this.y = steps[DASH_STEPS - 1][1];
        this.directionChanged = false;
        this.prevDirection = this.direction;
        this.hasDashedThisDirection = true;

        return {
            snakeId: this.id,
            snakeColour: this.colour,
            steps,
            trail,
            bodySegments: this.body.map(b => [b[0], b[1]] as [number, number]),
        };
    }

    /**
     * Handle special food consumption and trigger associated events.
     * Returns true if the move should abort (e.g., FREAKY_FRIDAY swap), false otherwise.
     */
    private handleSpecialFood(x: number, y: number, frame: number): boolean {
        const event = this.settings.specialFoodEvents.get(`${x},${y}`) ?? getEventResult(this.settings.enabledEvents);
        this.settings.specialFoodEvents.delete(`${x},${y}`);
        switch (event) {
            case SnakeEventType.CURSE:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.CURSE, "CURSED!", 'p', frame));
                this.curses.push(Math.round(Math.random() * this.body.length));
                return false;
            case SnakeEventType.SPEED:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.SPEED, "SPEED", 'p', frame));
                return false;
            case SnakeEventType.LENGTH:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.LENGTH, "LENGTH", 'p', frame));
                this.length += 10;
                return false;
            case SnakeEventType.RING_OF_FIRE:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.RING_OF_FIRE, "RING OF FIRE", 'r', frame));
                return false;
            case SnakeEventType.METEORS:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.METEORS, "METEORS", 'r', frame));
                return false;
            case SnakeEventType.FREAKY_FRIDAY:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.FREAKY_FRIDAY, "FREAKY FRIDAY", 'm', frame));
                // Abort the move: FreakFridayEffect.onTrigger will swap all snakes synchronously
                return true;
            case SnakeEventType.DASH_BOOST:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.DASH_BOOST, "DASH+", 'c', frame));
                this.dashDistance += 1;
                return false;
            case SnakeEventType.DASH_FRENZY:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.DASH_FRENZY, "DASH FRENZY!", 'c', frame));
                this.dashUnlimited = true;
                this.hasDashedThisDirection = false;
                return false;
            case SnakeEventType.CORNUCOPIA:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.CORNUCOPIA, "CORNUCOPIA!", 'f', frame));
                return false;
            case SnakeEventType.GRAND_FEAST:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.GRAND_FEAST, "GRAND FEAST!", 'f', frame));
                return false;
            case SnakeEventType.BOUNTIFUL_HARVEST:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.BOUNTIFUL_HARVEST, "BOUNTIFUL HARVEST!", 'f', frame));
                return false;
            case SnakeEventType.TERRA_FIRMA:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.TERRA_FIRMA, "TERRA FIRMA!", 'g', frame));
                return false;
            case SnakeEventType.TERRA_NULLIUS:
                this.addEvent(new SnakeEvent(x, y, SnakeEventType.TERRA_NULLIUS, "TERRA NULLIUS!", 'r', frame));
                return false;
        }
        return false;
    }

    /**
     * Write snake body to the grid for rendering.
     * Also handles curse visual side-effects and random curse chat events.
     */
    drawSnakeToGrid(gameGrid: GameGrid, frame: number): void {
        for (let i = 0; i < this.body.length; i++) {
            const x = this.body[i][0];
            const y = this.body[i][1];
            gameGrid.setCell(x, y, this.colour);
            if (this.curses.length > 0 && this.curses.includes(i)) {
                // Random curse chat event (preserved from original drawSnake)
                if (Math.random() > 0.95) {
                    this.addEvent(new SnakeEvent(x, y, SnakeEventType.CHAT, this.getCurseString(), 'r', frame));
                }
                if (this.direction === Direction.UP) gameGrid.setCell(x, y - 1, this.id.toString());
                else if (this.direction === Direction.DOWN) gameGrid.setCell(x, y + 1, this.id.toString());
                else if (this.direction === Direction.LEFT) gameGrid.setCell(x - 1, y, this.id.toString());
                else if (this.direction === Direction.RIGHT) gameGrid.setCell(x + 1, y, this.id.toString());
            }
        }
    }

    /**
     * Mark dead snake body on the grid (ID markers instead of colour).
     */
    markDead(gameGrid: GameGrid): void {
        for (const [bx, by] of this.body) {
            gameGrid.setCell(bx, by, this.id.toString());
        }
    }

    getCurseString() {
        const curse = Math.floor(Math.random() * this.settings.curseStrings.length);
        return this.settings.curseStrings[curse];
    }

    reset() {
        this.x = Math.floor(Math.random() * (this.settings.columnNum - this.settings.spawnMargin * 2)) + this.settings.spawnMargin;
        this.y = Math.floor(Math.random() * (this.settings.rowNum - this.settings.spawnMargin * 2)) + this.settings.spawnMargin;
        this.direction = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT][Math.floor(Math.random() * 4)];
        this.prevDirection = undefined;
        this.length = this.settings.startingLength;
        this.body = [[this.x, this.y]];
        this.dead = false;
        this.curses = [];
        this.hasMovedOnce = false;
        this.pendingDash = false;
        this.hasDashedThisDirection = false;
        this.dashDistance = 3;
        this.dashUnlimited = false;
    }
}
