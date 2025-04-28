export class SnakeEvent {
    x: number;
    y: number;
    frame: number;
    type: SnakeEventType;
    colour: string;
    text: string;
    constructor(x: number,y: number, type: SnakeEventType, text: string, colour: string, frame: any) {
        this.x = x;
        this.y = y;
        this.frame = frame; 
        this.type = type;
        this.colour = colour;
        this.text = text;
    }   
}

export enum SnakeEventType {
    CURSE = 'CURSE',
    FOOD = 'FOOD',
    SNAKED = 'SNAKED',
    WALL = 'WALL',
    BACKWARDS_MOMENT = 'BACKWARDS MOMENT',
    EATEN = 'EATEN',
    SPEED = 'SPEED',
    CHAT = 'CHAT',
    SPECIAL = 'SPECIAL',
    LENGTH = 'LENGTH'
}
