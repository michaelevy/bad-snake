import { Rarity } from "../utilities";
import { getEventRarity, SnakeEventType } from "./SnakeEvent";
import { Meteor } from "./Meteor";

export enum SettingsType {
    BIG = 'BIG',
    SMALL = 'SMALL',
    FAST = 'FAST',
    SHORT = 'SHORT',
    LONG = 'LONG',
    REALLY_LONG = 'REALLY LONG',
    DEAD_SCORE = 'DEAD SCORE',
    INVERTED_CONTROLS = 'INVERTED CONTROLS',
}

export interface StatusEvent {
    frame: number;
    type: Status;
}

export enum Status {
    NORMAL = 'NORMAL',
    RING_OF_FIRE = 'RING OF FIRE',
    METEORS = 'METEORS',
}

let settingRarity = {
    [SettingsType.BIG]: Rarity.RARE,
    [SettingsType.SMALL]: Rarity.RARE,
    [SettingsType.FAST]: Rarity.COMMON,
    [SettingsType.DEAD_SCORE]: Rarity.COMMON,
    [SettingsType.SHORT]: Rarity.COMMON,
    [SettingsType.LONG]: Rarity.COMMON,
    [SettingsType.REALLY_LONG]: Rarity.EPIC,
    [SettingsType.INVERTED_CONTROLS]: Rarity.EPIC
}

export interface Settings{
    columnNum: number;
    rowNum: number;
    squareSize: number;
    margin: number;
    foodAmount: number;
    colours: Record<string,string>;
    fps: number;
    foodInterval: number;
    curseStrings: string[];
    elapsed: number;
    spawnMargin: number;
    squareColour: string;
    enabledEvents: SnakeEventType[];
    enabledSettings: SettingsType[];
    currentSettings: SettingsType[];
    startingLength: number;
    deadScore: boolean;
    invertedControls: boolean;
    status: StatusEvent;
    meteors: Meteor[];
}

export function getBeginSettings(enabledSettings: SettingsType[]){
    const weightedSettings = createWeightedList(enabledSettings, getSettingRarity);
    
    // Pick 0-4 random settings
    const numSettings = Math.floor(Math.random() * 5);
    let randomSettings = choose(weightedSettings, numSettings);
    
    // Remove duplicates
    randomSettings = [...new Set(randomSettings)];

    // Handle conflicts
    if (randomSettings.includes(SettingsType.BIG) && randomSettings.includes(SettingsType.SMALL)) {
        randomSettings = randomSettings.filter(setting => setting != SettingsType.SMALL);
    }

    if (randomSettings.includes(SettingsType.BIG) && randomSettings.includes(SettingsType.DEAD_SCORE)) {
        randomSettings = randomSettings.filter(setting => setting != SettingsType.DEAD_SCORE);
    }

    if (randomSettings.filter(s=>[SettingsType.SHORT, SettingsType.LONG, SettingsType.REALLY_LONG].includes(s)).length > 1) {
        randomSettings = randomSettings.filter(setting => setting != SettingsType.LONG && setting != SettingsType.REALLY_LONG);
    }

    return randomSettings;
}

export function getSettingRarity(setting: SettingsType) {
    return settingRarity[setting];
}

export function getEventResult(enabledEvents: SnakeEventType[]): SnakeEventType{
    const weightedEvents = createWeightedList(enabledEvents, getEventRarity);
    return chooseSingle(weightedEvents) as SnakeEventType;
}


function shuffled(elements: any[]) {
    const copy = [...elements];
    for(let i = copy.length - 1; i >= 0; i--){
        let j = Math.floor(Math.random() * (i + 1)); // 0 <= j <= i
        let tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
    }
    return copy;
}
function choose(elements: any[], n: number){
    return shuffled(elements).slice(0, n);
}

function chooseSingle(elements: any[]){
    return choose(elements, 1)[0];
}

function createWeightedList<T>(items: T[], getRarityFn: (item: T) => Rarity): T[] {
    const weightedList: T[] = [];
    items.forEach(item => {
        const rarity = getRarityFn(item);
        const weight = rarity === Rarity.COMMON ? 4 : rarity === Rarity.RARE ? 2 : 1;
        for (let i = 0; i < weight; i++) {
            weightedList.push(item);
        }
    });
    return weightedList;
}