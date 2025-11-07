import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { TrafficGeneratorComponent } from '../core/Component.js';
import { BuildingInfoComponent } from '../buildings/BuildingTypes.js';
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

export enum TripType {
  COMMUTE = 'commute',
  SHOPPING = 'shopping',
  LEISURE = 'leisure',
  FREIGHT = 'freight'
}

export class TrafficSystem extends System {
  public readonly name = 'TrafficSystem';
  private roadNetwork: RoadNetwork;
  private spatialGrid: SpatialGridImpl;
  private activeTrips: Map<string, TrafficTrip> = new Map();
  private tripIdCounter: number = 1;
  private lastTrafficUpdate: number = 0;
  private trafficUpdateInterval: number = 2000; // Update every 2 seconds

  constructor(roadNetwork: RoadNetwork, spatialGrid: SpatialGridImpl) {
    super();
    this.roadNetwork = roadNetwork;
    this.spatialGrid = spatialGrid;
  }

  update(deltaTime: number, entities: Entity[]): void {
    this.lastTrafficUpdate += deltaTime * 1000;
    
    if (this.lastTrafficUpdate >= this.trafficUpdateInterval) {
      this.generateTraffic(entities);
      this.updateTrafficFlow();
      this.lastTrafficUpdate = 0;
    }
  }

  private generateTraffic(entities: Entity[]): void {
    // Clear previous traffic
    this.roadNetwork.clearTraffic();
    this.activeTrips.clear();

    const trafficGenerators = entities.filter(entity => 
      entity.hasComponent('TrafficGenerator')
    );

    for (const entity of trafficGenerators) {
      this.generateTripsForEntity(entity, entities);
    }
  }

  private generateTripsForEntity(entity: Entity, allEntities: Entity[]): void {
    const trafficGen = entity.getComponent<TrafficGeneratorComponent>('TrafficGenerator');
    const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
    
    if (!trafficGen) return;

    const currentHour = new Date().getHours();
    const peakHourMultiplier = this.getPeakHourMultiplier(currentHour);
    const adjustedTrips = Math.floor(trafficGen.dailyTrips * peakHourMultiplier / 24);

    for (let i = 0; i < adjustedTrips; i++) {
      const destination = this.findDestination(entity, allEntities, buildingInfo?.buildingType);
      if (destination) {
        this.createTrip(entity, destination, this.getTripType(buildingInfo?.buildingType));
      }
    }
  }

  private getPeakHourMultiplier(hour: number): number {
    // Morning rush: 7-9 AM, Evening rush: 5-7 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 2.5;
    }
    // Daytime: 10 AM - 4 PM
    if (hour >= 10 && hour <= 16) {
      return 1.2;
    }
    // Evening: 8-11 PM
    if (hour >= 20 && hour <= 23) {
      return 0.8;
    }
    // Night/Early morning
    return 0.3;
  }

  private findDestination(origin: Entity, allEntities: Entity[], originType?: string): Entity | null {
    const destinations = this.getValidDestinations(origin, allEntities, originType);
    
    if (destinations.length === 0) return null;

    // Weight destinations by distance (closer destinations more likely)
    const weightedDestinations = destinations.map(dest => ({
      entity: dest,
      weight: 1 / (this.calculateDistance(origin.position, dest.position) + 1)
    }));

    const totalWeight = weightedDestinations.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weightedDestinations) {
      random -= item.weight;
      if (random <= 0) {
        return item.entity;
      }
    }

    return destinations[0];
  }

  private getValidDestinations(origin: Entity, allEntities: Entity[], originType?: string): Entity[] {
    return allEntities.filter(entity => {
      if (entity.id === origin.id) return false;
      
      const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
      if (!buildingInfo) return false;

      // Define valid destination types based on origin type
      switch (originType) {
        case 'residential':
          return ['commercial', 'industrial', 'municipal'].includes(buildingInfo.buildingType);
        case 'commercial':
          return ['residential', 'industrial'].includes(buildingInfo.buildingType);
        case 'industrial':
          return ['commercial', 'residential'].includes(buildingInfo.buildingType);
        case 'municipal':
          return ['residential', 'commercial'].includes(buildingInfo.buildingType);
        default:
          return true;
      }
    });
  }

  private getTripType(buildingType?: string): TripType {
    switch (buildingType) {
      case 'residential':
        const rand = Math.random();
        if (rand < 0.6) return TripType.COMMUTE;
        if (rand < 0.8) return TripType.SHOPPING;
        return TripType.LEISURE;
      case 'commercial':
        return Math.random() < 0.7 ? TripType.SHOPPING : TripType.LEISURE;
      case 'industrial':
        return Math.random() < 0.8 ? TripType.FREIGHT : TripType.COMMUTE;
      case 'municipal':
        return TripType.LEISURE;
      default:
        return TripType.LEISURE;
    }
  }

  private createTrip(origin: Entity, destination: Entity, tripType: TripType): void {
    const originNode = this.findNearestRoadNode(origin.position);
    const destNode = this.findNearestRoadNode(destination.position);

    if (!originNode || !destNode) return;

    const route = this.roadNetwork.findPath(originNode, destNode);
    if (!route) return;

    const tripId = `trip_${this.tripIdCounter++}`;
    const trip: TrafficTrip = {
      id: tripId,
      originEntityId: origin.id,
      destinationEntityId: destination.id,
      route,
      tripType,
      startTime: Date.now(),
      duration: route.estimatedTime
    };

    this.activeTrips.set(tripId, trip);

    // Add traffic to route edges
    for (const edgeId of route.edges) {
      this.roadNetwork.updateTraffic(edgeId, this.getTripTrafficWeight(tripType));
    }
  }

  private getTripTrafficWeight(tripType: TripType): number {
    switch (tripType) {
      case TripType.FREIGHT: return 3; // Heavy vehicles
      case TripType.COMMUTE: return 1;
      case TripType.SHOPPING: return 1;
      case TripType.LEISURE: return 0.8;
      default: return 1;
    }
  }

  private findNearestRoadNode(position: GridPosition): string | null {
    const nodes = this.roadNetwork.getNodes();
    let nearestNode: string | null = null;
    let minDistance = Infinity;

    for (const [nodeId, node] of nodes) {
      const distance = this.calculateDistance(position, node.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = nodeId;
      }
    }

    return nearestNode;
  }

  private calculateDistance(pos1: GridPosition, pos2: GridPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateTrafficFlow(): void {
    // Remove completed trips
    const currentTime = Date.now();
    const completedTrips: string[] = [];

    for (const [tripId, trip] of this.activeTrips) {
      if (currentTime - trip.startTime > trip.duration * 60 * 1000) {
        completedTrips.push(tripId);
      }
    }

    completedTrips.forEach(tripId => this.activeTrips.delete(tripId));
  }

  getTrafficStatistics() {
    const networkStats = this.roadNetwork.getNetworkStatistics();
    const tripsByType = new Map<TripType, number>();
    
    for (const trip of this.activeTrips.values()) {
      tripsByType.set(trip.tripType, (tripsByType.get(trip.tripType) || 0) + 1);
    }

    return {
      ...networkStats,
      activeTrips: this.activeTrips.size,
      tripsByType: Object.fromEntries(tripsByType),
      congestionLevel: this.calculateCongestionLevel()
    };
  }

  private calculateCongestionLevel(): 'low' | 'medium' | 'high' {
    const avgDensity = this.roadNetwork.getNetworkStatistics().averageTrafficDensity;
    
    if (avgDensity < 0.3) return 'low';
    if (avgDensity < 0.7) return 'medium';
    return 'high';
  }

  getRoadNetwork(): RoadNetwork {
    return this.roadNetwork;
  }

  getActiveTrips(): Map<string, TrafficTrip> {
    return new Map(this.activeTrips);
  }

  // Method to manually add a road at a position
  addRoad(position: GridPosition): void {
    this.roadNetwork.addRoadNode(position);
  }

  // Get traffic density for visualization
  getTrafficDensityMap(): Map<string, number> {
    const densityMap = new Map<string, number>();
    
    for (const [edgeId, edge] of this.roadNetwork.getEdges()) {
      densityMap.set(edgeId, this.roadNetwork.getTrafficDensity(edgeId));
    }
    
    return densityMap;
  }
}