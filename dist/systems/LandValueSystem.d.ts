import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { ZoneManagerImpl } from '../zoning/ZoneManager.js';
import { SpatialGridImpl } from '../core/SpatialGrid.js';
export declare class LandValueSystem extends System {
    private zoneManager;
    private spatialGrid;
    readonly name = "LandValueSystem";
    private lastUpdateTime;
    private updateInterval;
    constructor(zoneManager: ZoneManagerImpl, spatialGrid: SpatialGridImpl);
    update(deltaTime: number, entities: Entity[]): void;
    private updateLandValues;
    private calculateLandValue;
    private getBaseLandValue;
    private getZoneMultiplier;
    private calculateProximityBonus;
    private calculateInfrastructureBonus;
    private updateBuildingValues;
    checkBuildingDevelopment(entities: Entity[]): void;
    getLandValueStatistics(): {
        min: number;
        max: number;
        average: number;
        total: number;
    };
}
//# sourceMappingURL=LandValueSystem.d.ts.map