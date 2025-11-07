import { Entity } from '../core/Entity.js';
import { EntityManager } from '../core/EntityManager.js';
import { GridPosition } from '../core/GridPosition.js';
import { BuildingTemplate, ZoneType } from './BuildingTypes.js';
export declare class BuildingFactory {
    private entityManager;
    constructor(entityManager: EntityManager);
    createBuilding(templateKey: string, position: GridPosition, zoneType?: ZoneType): Entity | null;
    private getPowerPriority;
    private getTrafficMultiplier;
    private getTaxRate;
    private calculateLandValue;
    private getLandValueMultiplier;
    getAvailableBuildings(): Record<string, BuildingTemplate>;
    getBuildingTemplate(templateKey: string): BuildingTemplate | undefined;
    canPlaceBuilding(templateKey: string, position: GridPosition, zoneType?: ZoneType): boolean;
    upgradeBuilding(entity: Entity): boolean;
    private updateComponentsAfterUpgrade;
}
//# sourceMappingURL=BuildingFactory.d.ts.map