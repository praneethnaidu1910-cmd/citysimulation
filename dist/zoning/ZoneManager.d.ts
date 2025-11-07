import { GridPosition } from '../core/GridPosition.js';
import { ZoneType } from '../buildings/BuildingTypes.js';
export interface ZoneMap {
    width: number;
    height: number;
    grid: ZoneType[][];
    landValues: number[][];
    updateLandValue(x: number, y: number, value: number): void;
    getZone(x: number, y: number): ZoneType;
    setZone(x: number, y: number, zoneType: ZoneType): void;
    getZoneArea(area: GridPosition): ZoneType[];
    getLandValue(x: number, y: number): number;
}
export declare class ZoneManagerImpl implements ZoneMap {
    readonly width: number;
    readonly height: number;
    grid: ZoneType[][];
    landValues: number[][];
    constructor(width?: number, height?: number);
    private initializeGrids;
    private calculateBaseLandValue;
    getZone(x: number, y: number): ZoneType;
    setZone(x: number, y: number, zoneType: ZoneType): void;
    setZoneArea(area: GridPosition, zoneType: ZoneType): void;
    getZoneArea(area: GridPosition): ZoneType[];
    getLandValue(x: number, y: number): number;
    updateLandValue(x: number, y: number, value: number): void;
    private updateLandValueForZoneChange;
    private getZoneValueMultiplier;
    private isValidCoordinate;
    recalculateLandValues(): void;
    private calculateUpdatedLandValue;
    private calculateProximityBonus;
    getZoneStatistics(): Record<ZoneType, number>;
    getTotalLandValue(): number;
    clear(): void;
}
//# sourceMappingURL=ZoneManager.d.ts.map