export class Meteor {
    x: number;
    y: number;
    radius: number;
    spawnFrame: number;
    warningDuration: number;
    impactDuration: number;

    static readonly WARNING_SECS = 1.0;
    static readonly IMPACT_SECS = 0.5;

    constructor(x: number, y: number, radius: number, spawnFrame: number, fps: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.spawnFrame = spawnFrame;
        this.warningDuration = Math.round(Meteor.WARNING_SECS * fps);
        this.impactDuration = Math.round(Meteor.IMPACT_SECS * fps);
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
