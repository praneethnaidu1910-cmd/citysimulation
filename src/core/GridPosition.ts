export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  contains?(other: GridPosition): boolean;
  overlaps?(other: GridPosition): boolean;
  getCenter?(): { x: number; y: number };
  distanceTo?(other: GridPosition): number;
}

export class GridPositionImpl implements GridPosition {
  constructor(
    public x: number,
    public y: number,
    public width: number = 1,
    public height: number = 1
  ) {}

  contains(other: GridPosition): boolean {
    return (
      other.x >= this.x &&
      other.y >= this.y &&
      other.x + other.width <= this.x + this.width &&
      other.y + other.height <= this.y + this.height
    );
  }

  overlaps(other: GridPosition): boolean {
    return !(
      other.x >= this.x + this.width ||
      other.x + other.width <= this.x ||
      other.y >= this.y + this.height ||
      other.y + other.height <= this.y
    );
  }

  getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  distanceTo(other: GridPosition): number {
    const center1 = this.getCenter();
    const center2 = other.getCenter ? other.getCenter() : { x: other.x + other.width / 2, y: other.y + other.height / 2 };
    const dx = center1.x - center2.x;
    const dy = center1.y - center2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}