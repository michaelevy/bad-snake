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
    SPECIAL = 'p',          // epic special food (purple)
    SPECIAL_COMMON = 'sc',  // common special food (lime)
    SPECIAL_RARE = 'sr',    // rare special food (sky blue)
    HAZARD = 'h',
}

// CellValue covers enum values plus snake colour/ID strings
export type CellValue = CellType | string;

export function isSpecialFood(cell: CellValue): boolean {
    return cell === CellType.SPECIAL || cell === CellType.SPECIAL_COMMON || cell === CellType.SPECIAL_RARE;
}
