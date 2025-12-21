export enum MeteorPhase {
    WARNING = 'WARNING',
    IMPACT = 'IMPACT',
    FINISHED = 'FINISHED'
}

export class Meteor {
    x: number;
    y: number;
    radius: number;
    spawnFrame: number;
    warningDuration: number = 10
    impactDuration: number = 5;

    constructor(x: number, y: number, radius: number, spawnFrame: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.spawnFrame = spawnFrame;
    }

    getPhase(currentFrame: number): MeteorPhase {
        const elapsed = currentFrame - this.spawnFrame;

        if (elapsed < this.warningDuration) {
            return MeteorPhase.WARNING;
        } else if (elapsed < this.warningDuration + this.impactDuration) {
            return MeteorPhase.IMPACT;
        } else {
            return MeteorPhase.FINISHED;
        }
    }

    isFinished(currentFrame: number): boolean {
        return this.getPhase(currentFrame) === MeteorPhase.FINISHED;
    }


    isInImpactPhase(currentFrame: number): boolean {
        return this.getPhase(currentFrame) === MeteorPhase.IMPACT;
    }

    containsPoint(x: number, y: number): boolean {
        const dx = x - this.x;
        const dy = y - this.y;
        return (dx * dx + dy * dy) <= (this.radius * this.radius);
    }
}
