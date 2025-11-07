export interface GridPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    contains?(other: GridPosition): boolean;
    overlaps?(other: GridPosition): boolean;
    getCenter?(): {
        x: number;
        y: number;
    };
    distanceTo?(other: GridPosition): number;
}
export declare class GridPositionImpl implements GridPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width?: number, height?: number);
    contains(other: GridPosition): boolean;
    overlaps(other: GridPosition): boolean;
    getCenter(): {
        x: number;
        y: number;
    };
    distanceTo(other: GridPosition): number;
}
//# sourceMappingURL=GridPosition.d.ts.map