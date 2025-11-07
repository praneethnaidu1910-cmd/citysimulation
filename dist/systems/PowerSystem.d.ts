import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { SpatialGridImpl } from '../core/SpatialGrid.js';
import { GridPosition } from '../core/GridPosition.js';
export interface PowerPlant {
    entityId: string;
    capacity: number;
    currentOutput: number;
    efficiency: number;
    fuelType: 'coal' | 'gas' | 'nuclear' | 'solar' | 'wind';
}
export interface PowerGrid {
    totalCapacity: number;
    totalDemand: number;
    totalOutput: number;
    efficiency: number;
    blackoutZones: GridPosition[];
}
export declare class PowerSystem extends System {
    readonly name = "PowerSystem";
    private spatialGrid;
    private powerPlants;
    private lastPowerUpdate;
    private powerUpdateInterval;
    constructor(spatialGrid: SpatialGridImpl);
    update(deltaTime: number, entities: Entity[]): void;
    handleEntityAdded(entity: Entity): void;
    handleEntityRemoved(entity: Entity): void;
    private addPowerPlant;
    private calculatePlantCapacity;
    private determineFuelType;
    private updatePowerGrid;
    private distributePower;
    getPowerGridStatus(): PowerGrid;
    getPowerPlants(): Map<string, PowerPlant>;
    getUnpoweredBuildings(entities: Entity[]): Entity[];
    getPowerCoverage(entities: Entity[]): number;
    getPowerCoverageInArea(area: GridPosition, entities: Entity[]): number;
    canReceivePower(entity: Entity, entities: Entity[]): boolean;
    private calculateDistance;
}
//# sourceMappingURL=PowerSystem.d.ts.map