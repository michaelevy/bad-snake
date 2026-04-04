import { SnakeEvent, SnakeEventType } from "./SnakeEvent";
import { GameConfig, RuntimeState } from "./Settings";
import Snake from "../snake";
import { CellValue } from "../utilities";

export interface EventContext {
    grid: CellValue[][];
    snakes: Snake[];
    config: GameConfig;
    runtime: RuntimeState;
    frame: number;
    triggeringSnake?: Snake;
    addEvent: (event: SnakeEvent) => void; // for effects that need to emit secondary events (e.g. INCOMING! chat)
}

export interface EventEffect {
    readonly type: SnakeEventType;
    onTrigger(context: EventContext): void;
    onTick?(context: EventContext): void;
}

export class EventRegistry {
    private effects: Map<SnakeEventType, EventEffect> = new Map();

    register(effect: EventEffect): void {
        this.effects.set(effect.type, effect);
    }

    dispatch(type: SnakeEventType, context: EventContext): void {
        const effect = this.effects.get(type);
        if (effect) {
            effect.onTrigger(context);
        }
    }

    tickAll(context: EventContext): void {
        for (const effect of this.effects.values()) {
            if (effect.onTick) {
                effect.onTick(context);
            }
        }
    }

    has(type: SnakeEventType): boolean {
        return this.effects.has(type);
    }
}
