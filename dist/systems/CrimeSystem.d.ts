import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { SpatialGridImpl } from '../core/SpatialGrid.js';
import { GridPosition } from '../core/GridPosition.js';
export interface CrimeData {
    position: GridPosition;
    crimeScore: number;
    crimeTypes: CrimeType[];
    policePresence: number;
}
export declare enum CrimeType {
    PETTY_THEFT = "petty_theft",
    BURGLARY = "burglary",
    ASSAULT = "assault",
    VANDALISM = "vandalism",
    DRUG_RELATED = "drug_related"
}
export declare class CrimeSystem extends System {
    readonly name = "CrimeSystem";
    private spatialGrid;
    private crimeMap;
    private policeStations;
    private lastCrimeUpdate;
    private crimeUpdateInterval;
    constructor(spatialGrid: SpatialGridImpl);
    update(deltaTime: number, entities: Entity[]): void;
    handleEntityAdded(entity: Entity): void;
    handleEntityRemoved(entity: Entity): void;
    private updateCrimeScores;
    private calculateCrimeScore;
    private getBuildingCrimeFactor;
    private calculatePolicePresence;
    private determineCrimeTypes;
    private calculateDistance;
    getCrimeScore(position: GridPosition): number;
    getCrimeMap(): Map<string, CrimeData>;
    getCrimeStatistics(): {
        averageCrimeScore: number;
        highCrimeAreas: number;
        totalPoliceStations: number;
        crimeTypeDistribution: {
            [k: string]: number;
        };
        safetyLevel: string;
    };
    getPoliceStations(): Entity[];
    needsPoliceStation(area: GridPosition): boolean;
}
//# sourceMappingURL=CrimeSystem.d.ts.map