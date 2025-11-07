import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { RoadNetwork, Route } from '../transportation/RoadNetwork.js';
import { SpatialGridImpl } from '../core/SpatialGrid.js';
import { GridPosition } from '../core/GridPosition.js';
export interface TrafficTrip {
    id: string;
    originEntityId: string;
    destinationEntityId: string;
    route: Route | null;
    tripType: TripType;
    startTime: number;
    duration: number;
}
export declare enum TripType {
    COMMUTE = "commute",
    SHOPPING = "shopping",
    LEISURE = "leisure",
    FREIGHT = "freight"
}
export declare class TrafficSystem extends System {
    readonly name = "TrafficSystem";
    private roadNetwork;
    private spatialGrid;
    private activeTrips;
    private tripIdCounter;
    private lastTrafficUpdate;
    private trafficUpdateInterval;
    constructor(roadNetwork: RoadNetwork, spatialGrid: SpatialGridImpl);
    update(deltaTime: number, entities: Entity[]): void;
    private generateTraffic;
    private generateTripsForEntity;
    private getPeakHourMultiplier;
    private findDestination;
    private getValidDestinations;
    private getTripType;
    private createTrip;
    private getTripTrafficWeight;
    private findNearestRoadNode;
    private calculateDistance;
    private updateTrafficFlow;
    getTrafficStatistics(): {
        activeTrips: number;
        tripsByType: {
            [k: string]: number;
        };
        congestionLevel: "low" | "medium" | "high";
        nodeCount: number;
        edgeCount: number;
        totalCapacity: number;
        totalTraffic: number;
        averageTrafficDensity: number;
    };
    private calculateCongestionLevel;
    getRoadNetwork(): RoadNetwork;
    getActiveTrips(): Map<string, TrafficTrip>;
    addRoad(position: GridPosition): void;
    getTrafficDensityMap(): Map<string, number>;
}
//# sourceMappingURL=TrafficSystem.d.ts.map