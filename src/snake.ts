import { Direction, CellType, CellValue } from './utilities';
import { SnakeEvent, SnakeEventType } from './components/SnakeEvent';
import { getEventResult, Settings } from './components/Settings';

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
    settings: Settings
    addEvent: Function;
    hasMovedOnce: boolean;
    controlScheme: string;
    pendingDash: boolean;
    hasDashedThisDirection: boolean;
    dashDistance: number;
    dashUnlimited: boolean;
    constructor(x: number, y: number, direction: Direction, length: number, colour: string, id: number, settings: Settings, addEvent: Function, controlScheme: string) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.length = length;
        this.body = [[x, y]];
        this.curses = [];
        this.colour = colour;
        this.dead = false
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

    update(grid: CellValue[][], started: boolean, frame: number) {
        if (this.dead) return
        if (started && this.hasMovedOnce) {
            if (this.pendingDash) {
                this.dash(grid, frame);
            } else {
                this.move(grid, frame);
            }
        }
        if (this.dead) return
        this.drawSnake(grid, frame)
    }

    move(grid: CellValue[][], frame: number) {
        let newX = this.x;
        let newY = this.y;
        let die = false;

        if (this.direction == 'up') {
            if (this.prevDirection == 'down') { die = true };
            newY -= 1;
        } else if (this.direction == 'down') {
            if (this.prevDirection == 'up') { die = true };
            newY += 1;
        } else if (this.direction == 'left') {
            if (this.prevDirection == 'right') { die = true };
            newX -= 1;
        } else if (this.direction == 'right') {
            if (this.prevDirection == 'left') { die = true };
            newX += 1;
        }

        if (frame < 5) {
            die = false
        }

        if (die === true) {
            this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.BACKWARDS_MOMENT, "BACKWARDS MOMENT", this.colour, frame))
        }
        else if (newX < 0 || newX >= this.settings.columnNum || newY < 0 || newY >= this.settings.rowNum || die) {
            die = true
            this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.WALL, "WALL", this.colour, frame))
        } else {
            if (grid[newX][newY] == CellType.FOOD) {
                this.length += this.settings.foodAmount;
                this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.EATEN, "EATEN", this.colour, frame))
                grid[newX][newY] = this.colour;

            } else if (grid[newX][newY] == CellType.SPECIAL) {
                // roll event with rarity taken into account
                let event = getEventResult(this.settings.enabledEvents);
                console.log('Enabled events:', this.settings.enabledEvents);
                console.log('getEventResult returned:', event);
                console.log('SnakeEventType.FREAKY_FRIDAY:', SnakeEventType.FREAKY_FRIDAY);
                switch (event) {
                    case SnakeEventType.CURSE:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.CURSE, "CURSED!", 'p', frame))
                        this.curses.push(Math.round(Math.random() * this.body.length))
                        break;
                    case SnakeEventType.SPEED:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.SPEED, "SPEED", 'p', frame))
                        break;
                    case SnakeEventType.LENGTH:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.LENGTH, "LENGTH", 'p', frame))
                        this.length += 10
                        break;
                    case SnakeEventType.RING_OF_FIRE:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.RING_OF_FIRE, "RING OF FIRE", 'r', frame))
                    break;
                    case SnakeEventType.METEORS:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.METEORS, "METEORS", 'r', frame))
                    break;
                    case SnakeEventType.FREAKY_FRIDAY:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.FREAKY_FRIDAY, "FREAKY FRIDAY", 'm', frame))
                        grid[newX][newY] = CellType.EMPTY; // Clear the special food
                        return; // Don't continue moving this frame - the swap handles positioning
                    case SnakeEventType.DASH_BOOST:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.DASH_BOOST, "DASH+", 'c', frame))
                        this.dashDistance += 1;
                        break;
                    case SnakeEventType.DASH_FRENZY:
                        this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.DASH_FRENZY, "DASH FRENZY!", 'c', frame))
                        this.dashUnlimited = true;
                        this.hasDashedThisDirection = false;
                        break;
                }
            }
            else if (grid[newX][newY] != CellType.EMPTY) {
                die = true
                this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.SNAKED, "SNAKED", this.colour, frame))
            }
        }

        if (die || this.dead) {
            for (let i = 0; i < this.body.length; i++) {
                let x = this.body[i][0];
                let y = this.body[i][1];
                grid[x][y] = this.id.toString();;
            }
            this.dead = true;
            return;
        };


        this.x = newX;
        this.y = newY;
        this.directionChanged = false;
        this.prevDirection = this.direction;

        this.body.unshift([newX, newY]);
        if (this.body.length > this.length) {
            let old = this.body.pop();
            if (old) {
                grid[old[0]][old[1]] = CellType.EMPTY;
            }
        }
    }

    dash(grid: CellValue[][], frame: number) {
        this.pendingDash = false;
        const DASH_STEPS = this.dashDistance;

        // Compute step positions, bailing early on wall hit
        const steps: [number, number][] = [];
        let cx = this.x, cy = this.y;
        for (let i = 0; i < DASH_STEPS; i++) {
            if (this.direction === Direction.UP) cy -= 1;
            else if (this.direction === Direction.DOWN) cy += 1;
            else if (this.direction === Direction.LEFT) cx -= 1;
            else if (this.direction === Direction.RIGHT) cx += 1;

            if (cx < 0 || cx >= this.settings.columnNum || cy < 0 || cy >= this.settings.rowNum) {
                this.addEvent(new SnakeEvent(cx, cy, SnakeEventType.WALL, "WALL", this.colour, frame));
                for (const [bx, by] of this.body) grid[bx][by] = this.id.toString();
                this.dead = true;
                return;
            }
            steps.push([cx, cy]);
        }

        // Add all 3 positions to front of body (step 0 first → ends up at body[2])
        // After: body = [N2, N1, N0, origHead, B1, ...]
        for (const step of steps) {
            this.body.unshift([step[0], step[1]]);
        }

        // Check each step: collision at step i → cutFromIndex = DASH_STEPS - i
        let cutFromIndex = this.body.length; // default: no cut
        for (let i = 0; i < DASH_STEPS; i++) {
            const [sx, sy] = steps[i];
            const cell = grid[sx][sy];

            if (cell === CellType.FOOD) {
                this.length += this.settings.foodAmount;
                this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.EATEN, "EATEN", this.colour, frame));
                grid[sx][sy] = this.colour;
            } else if (cell === CellType.SPECIAL) {
                let event = getEventResult(this.settings.enabledEvents);
                switch (event) {
                    case SnakeEventType.CURSE:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.CURSE, "CURSED!", 'p', frame));
                        this.curses.push(Math.round(Math.random() * this.body.length));
                        break;
                    case SnakeEventType.SPEED:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.SPEED, "SPEED", 'p', frame));
                        break;
                    case SnakeEventType.LENGTH:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.LENGTH, "LENGTH", 'p', frame));
                        this.length += 10;
                        break;
                    case SnakeEventType.RING_OF_FIRE:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.RING_OF_FIRE, "RING OF FIRE", 'r', frame));
                        break;
                    case SnakeEventType.METEORS:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.METEORS, "METEORS", 'r', frame));
                        break;
                    case SnakeEventType.FREAKY_FRIDAY:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.FREAKY_FRIDAY, "FREAKY FRIDAY", 'm', frame));
                        break;
                    case SnakeEventType.DASH_BOOST:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.DASH_BOOST, "TURBO DASH", 'c', frame));
                        this.dashDistance += 1;
                        break;
                    case SnakeEventType.DASH_FRENZY:
                        this.addEvent(new SnakeEvent(sx, sy, SnakeEventType.DASH_FRENZY, "DASH FRENZY", 'c', frame));
                        this.dashUnlimited = true;
                        this.hasDashedThisDirection = false;
                        break;
                }
            } else if (cell !== CellType.EMPTY && cell !== this.colour) {
                // Collision — parts of body behind this step die
                const cutAt = DASH_STEPS - i;
                if (cutAt < cutFromIndex) cutFromIndex = cutAt;
            }
        }

        // Apply truncation or normal tail removal
        if (cutFromIndex < this.body.length) {
            for (let i = cutFromIndex; i < this.body.length; i++) {
                const [bx, by] = this.body[i];
                if (grid[bx][by] === this.colour) grid[bx][by] = CellType.EMPTY;
            }
            this.body.splice(cutFromIndex);
            this.length = this.body.length;
            } else {
            for (let i = 0; i < DASH_STEPS; i++) {
                if (this.body.length > this.length) {
                    const old = this.body.pop();
                    if (old) grid[old[0]][old[1]] = CellType.EMPTY;
                }
            }
        }

        this.x = steps[DASH_STEPS - 1][0];
        this.y = steps[DASH_STEPS - 1][1];
        this.directionChanged = false;
        this.prevDirection = this.direction;
        this.hasDashedThisDirection = true;
    }

    getCurseString() {
        let curse = Math.floor(Math.random() * this.settings.curseStrings.length);
        return this.settings.curseStrings[curse]
    }

    drawSnake(grid: CellValue[][], frame: number) {
        for (let i = 0; i < this.body.length; i++) {
            let x = this.body[i][0];
            let y = this.body[i][1];
            grid[x][y] = this.colour;
            if (this.curses.length > 0 && this.curses.includes(i)) {
                if (Math.random() > 0.95) {
                    this.addEvent(new SnakeEvent(x, y, SnakeEventType.CHAT, this.getCurseString(), 'r', frame))
                }
                if (this.direction == 'up') {
                    grid[x][y - 1] = this.id.toString();
                } else if (this.direction == 'down') {
                    grid[x][y + 1] = this.id.toString();;
                } else if (this.direction == 'left') {
                    grid[x - 1][y] = this.id.toString();;
                } else if (this.direction == 'right') {
                    grid[x + 1][y] = this.id.toString();;
                }
            }
        }

    }

    reset() {
        this.x = Math.floor(Math.random() * (this.settings.columnNum - this.settings.spawnMargin)) + this.settings.spawnMargin;
        this.y = Math.floor(Math.random() * (this.settings.rowNum - this.settings.spawnMargin)) + this.settings.spawnMargin;
        this.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction;
        this.prevDirection = undefined;
        this.length = this.settings.startingLength
        this.body = [[this.x, this.y]];
        this.dead = false
        this.curses = [];
        this.hasMovedOnce = false;
        this.pendingDash = false;
        this.hasDashedThisDirection = false;
        this.dashDistance = 3;
        this.dashUnlimited = false;
    }
}
