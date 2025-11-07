import { GridPosition } from '../core/GridPosition.js';
export interface RoadNode {
    id: string;
    position: GridPosition;
    connections: string[];
    roadType: RoadType;
}
export interface RoadEdge {
    id: string;
    startNodeId: string;
    endNodeId: string;
    length: number;
    capacity: number;
    currentTraffic: number;
    roadType: RoadType;
    speedLimit: number;
}
export declare enum RoadType {
    STREET = "street",
    AVENUE = "avenue",
    HIGHWAY = "highway"
}
export interface Route {
    nodes: string[];
    edges: string[];
    totalDistance: number;
    estimatedTime: number;
}
export declare class RoadNetwork {
    private nodes;
    private edges;
    private nodeIdCounter;
    private edgeIdCounter;
    addRoadNode(position: GridPosition, roadType?: RoadType): RoadNode;
    private autoConnectNode;
    private canConnect;
    connectNodes(nodeId1: string, nodeId2: string): RoadEdge | null;
    private getBestRoadType;
    private getRoadCapacity;
    private getSpeedLimit;
    private calculateDistance;
    findPath(startNodeId: string, endNodeId: string): Route | null;
    private findEdgeBetweenNodes;
    private calculateTravelTime;
    updateTraffic(edgeId: string, trafficChange: number): void;
    getTrafficDensity(edgeId: string): number;
    clearTraffic(): void;
    getNodes(): Map<string, RoadNode>;
    getEdges(): Map<string, RoadEdge>;
    getNode(nodeId: string): RoadNode | undefined;
    getEdge(edgeId: string): RoadEdge | undefined;
    removeNode(nodeId: string): boolean;
    getNetworkStatistics(): {
        nodeCount: number;
        edgeCount: number;
        totalCapacity: number;
        totalTraffic: number;
        averageTrafficDensity: number;
    };
    private calculateAverageTrafficDensity;
}
//# sourceMappingURL=RoadNetwork.d.ts.map