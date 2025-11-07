import { Entity } from './Entity.js';
import { GridPosition } from './GridPosition.js';
import { System } from './System.js';
export declare class EntityManager {
    private entities;
    private systems;
    private nextEntityId;
    addSystem(system: System): void;
    removeSystem(systemName: string): void;
    createEntity(position: GridPosition): Entity;
    removeEntity(entityId: string): boolean;
    getEntity(entityId: string): Entity | undefined;
    getAllEntities(): Entity[];
    getEntitiesWithComponent(componentType: string): Entity[];
    getEntitiesInArea(area: GridPosition): Entity[];
    private positionsOverlap;
    update(deltaTime: number): void;
    getEntityCount(): number;
    clear(): void;
}
//# sourceMappingURL=EntityManager.d.ts.map