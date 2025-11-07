import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { SpatialGridImpl } from '../core/SpatialGrid.js';
import { GridPosition } from '../core/GridPosition.js';
export interface TransitLine {
    id: string;
    name: string;
    stations: string[];
    ridership: number;
    capacity: number;
    type: 'bus' | 'subway' | 'train';
}
export interface TransitStation {
    id: string;
    position: GridPosition;
    lines: string[];
    dailyRiders: number;
    accessibilityRadius: number;
}
export declare class PublicTransitSystem extends System {
    readonly name = "PublicTransitSystem";
    private spatialGrid;
    private transitLines;
    private transitStations;
    private lastTransitUpdate;
    private transitUpdateInterval;
    constructor(spatialGrid: SpatialGridImpl);
    update(deltaTime: number, entities: Entity[]): void;
    private updateTransitUsage;
    private calculateBuildingRiders;
    addTransitStation(position: GridPosition, type?: 'bus' | 'subway' | 'train'): TransitStation;
    addTransitLine(name: string, stationIds: string[], type: 'bus' | 'subway' | 'train'): TransitLine;
    private getLineCapacity;
    getTransitAccessibility(position: GridPosition): number;
    getTrafficReduction(entities: Entity[]): number;
    private calculateDistance;
    getTransitStatistics(): {
        totalLines: number;
        totalStations: number;
        totalRidership: number;
        totalCapacity: number;
        utilizationRate: number;
    };
    getTransitLines(): Map<string, TransitLine>;
    getTransitStations(): Map<string, TransitStation>;
}
//# sourceMappingURL=PublicTransitSystem.d.ts.map