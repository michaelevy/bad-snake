import { Rarity } from "../utilities";

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
    LENGTH = 'LENGTH',
    RING_OF_FIRE = 'RING OF FIRE',
    METEORS = 'METEORS',
}

let eventRarity = {
    [SnakeEventType.CURSE]: Rarity.RARE,
    [SnakeEventType.SPEED]: Rarity.RARE,
    [SnakeEventType.LENGTH]: Rarity.COMMON,
    [SnakeEventType.SNAKED]: Rarity.NEVER,
    [SnakeEventType.WALL]: Rarity.NEVER,
    [SnakeEventType.BACKWARDS_MOMENT]: Rarity.NEVER,
    [SnakeEventType.EATEN]: Rarity.NEVER,
    [SnakeEventType.FOOD]: Rarity.NEVER,
    [SnakeEventType.SPECIAL]: Rarity.NEVER,
    [SnakeEventType.CHAT]: Rarity.NEVER,
    [SnakeEventType.RING_OF_FIRE]: Rarity.EPIC,
    [SnakeEventType.METEORS]: Rarity.EPIC,
}

export function getEventRarity(event: SnakeEventType) {
    return eventRarity[event];
}

