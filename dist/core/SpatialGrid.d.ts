import { Entity } from './Entity.js';
import { GridPosition } from './GridPosition.js';
export interface SpatialGrid {
    cellSize: number;
    addEntity(entity: Entity): void;
    removeEntity(entity: Entity): void;
    getEntitiesInRadius(center: GridPosition, radius: number): Entity[];
    getEntitiesInCell(x: number, y: number): Entity[];
}
export declare class SpatialGridImpl implements SpatialGrid {
    readonly cellSize: number;
    private grid;
    private entityToCells;
    constructor(cellSize?: number);
    addEntity(entity: Entity): void;
    removeEntity(entity: Entity): void;
    getEntitiesInRadius(center: GridPosition, radius: number): Entity[];
    getEntitiesInCell(x: number, y: number): Entity[];
    getEntitiesInArea(area: GridPosition): Entity[];
    private getEntityCells;
    private getCellKey;
    private positionsOverlap;
    clear(): void;
    getCellCount(): number;
    getEntityCount(): number;
}
//# sourceMappingURL=SpatialGrid.d.ts.map