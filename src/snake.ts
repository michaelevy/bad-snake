import { Direction } from './utilities';
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
    constructor(x: number, y: number, direction: Direction, length: number, colour: string, id: number, settings: Settings, addEvent: Function) {
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
    }

    update(grid: string[][], started: boolean, frame: number) {
        if (this.dead) return
        if (started) this.move(grid, frame)
        if (this.dead) return
        this.drawSnake(grid, frame)
    }

    move(grid: string[][], frame: number) {
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
            if (grid[newX][newY] == 'f') {
                this.length += this.settings.foodAmount;
                this.addEvent(new SnakeEvent(newX, newY, SnakeEventType.EATEN, "EATEN", this.colour, frame))
                grid[newX][newY] = this.colour;

            } else if (grid[newX][newY] == 'p') {
                // roll event with rarity taken into account
                let event = getEventResult(this.settings.enabledEvents);
                console.log(this.settings.enabledEvents)
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
                }
            }
            else if (grid[newX][newY] != '0') {
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
                grid[old[0]][old[1]] = '0';
            }
        }
    }

    getCurseString() {
        let curse = Math.floor(Math.random() * this.settings.curseStrings.length);
        return this.settings.curseStrings[curse]
    }

    drawSnake(grid: string[][], frame: number) {
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
        this.totalScore += this.length;
        this.length = this.settings.startingLength
        this.body = [[this.x, this.y]];
        this.dead = false
        this.curses = [];
    }
}