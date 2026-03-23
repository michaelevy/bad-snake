export enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right'
}


export enum Rarity {
    NEVER = 'NEVER',
    COMMON = 'COMMON',
    RARE = 'RARE',
    EPIC = 'EPIC'
}

export enum CellType {
    EMPTY = '0',
    FOOD = 'f',
    SPECIAL = 'p',
    HAZARD = 'r',
}

// CellValue covers enum values plus snake colour/ID strings
export type CellValue = CellType | string;
