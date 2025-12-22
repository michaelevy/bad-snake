export class Meteor {
    x: number;
    y: number;
    radius: number;
    spawnFrame: number;
    warningDuration: number = 10;
    impactDuration: number = 5;

    constructor(x: number, y: number, radius: number, spawnFrame: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.spawnFrame = spawnFrame;
    }

    isFinished(currentFrame: number): boolean {
        const elapsed = currentFrame - this.spawnFrame;
        return elapsed >= this.warningDuration + this.impactDuration;
    }

    isInImpactPhase(currentFrame: number): boolean {
        const elapsed = currentFrame - this.spawnFrame;
        return elapsed >= this.warningDuration && elapsed < this.warningDuration + this.impactDuration;
    }

    containsPoint(x: number, y: number): boolean {
        const dx = x - this.x;
        const dy = y - this.y;
        return (dx * dx + dy * dy) <= (this.radius * this.radius);
    }
}
