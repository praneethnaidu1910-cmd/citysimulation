export class GridPositionImpl {
    constructor(x, y, width = 1, height = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    contains(other) {
        return (other.x >= this.x &&
            other.y >= this.y &&
            other.x + other.width <= this.x + this.width &&
            other.y + other.height <= this.y + this.height);
    }
    overlaps(other) {
        return !(other.x >= this.x + this.width ||
            other.x + other.width <= this.x ||
            other.y >= this.y + this.height ||
            other.y + other.height <= this.y);
    }
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    distanceTo(other) {
        const center1 = this.getCenter();
        const center2 = other.getCenter ? other.getCenter() : { x: other.x + other.width / 2, y: other.y + other.height / 2 };
        const dx = center1.x - center2.x;
        const dy = center1.y - center2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
//# sourceMappingURL=GridPosition.js.map