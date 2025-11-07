import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { PowerConsumerComponent } from '../core/Component.js';
import { BuildingInfoComponent } from '../buildings/BuildingTypes.js';
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

export class PowerSystem extends System {
  public readonly name = 'PowerSystem';
  private spatialGrid: SpatialGridImpl;
  private powerPlants: Map<string, PowerPlant> = new Map();
  private lastPowerUpdate: number = 0;
  private powerUpdateInterval: number = 3000; // Update every 3 seconds

  constructor(spatialGrid: SpatialGridImpl) {
    super();
    this.spatialGrid = spatialGrid;
  }

  update(deltaTime: number, entities: Entity[]): void {
    this.lastPowerUpdate += deltaTime * 1000;
    
    if (this.lastPowerUpdate >= this.powerUpdateInterval) {
      this.updatePowerGrid(entities);
      this.lastPowerUpdate = 0;
    }
  }

  handleEntityAdded(entity: Entity): void {
    const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
    
    // Check if this is a power plant
    if (buildingInfo?.name.toLowerCase().includes('power')) {
      this.addPowerPlant(entity);
    }
  }

  handleEntityRemoved(entity: Entity): void {
    this.powerPlants.delete(entity.id);
  }

  private addPowerPlant(entity: Entity): void {
    const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
    if (!buildingInfo) return;

    const powerPlant: PowerPlant = {
      entityId: entity.id,
      capacity: this.calculatePlantCapacity(buildingInfo),
      currentOutput: 0,
      efficiency: 0.85,
      fuelType: this.determineFuelType(buildingInfo.name)
    };

    this.powerPlants.set(entity.id, powerPlant);
    console.log(`Added power plant: ${buildingInfo.name} with capacity ${powerPlant.capacity}MW`);
  }

  private calculatePlantCapacity(buildingInfo: BuildingInfoComponent): number {
    // Base capacity on building level and type
    const baseCapacity = 500; // MW
    return Math.floor(baseCapacity * buildingInfo.level * 1.5);
  }

  private determineFuelType(plantName: string): 'coal' | 'gas' | 'nuclear' | 'solar' | 'wind' {
    const name = plantName.toLowerCase();
    if (name.includes('nuclear')) return 'nuclear';
    if (name.includes('solar')) return 'solar';
    if (name.includes('wind')) return 'wind';
    if (name.includes('gas')) return 'gas';
    return 'coal'; // Default
  }

  private updatePowerGrid(entities: Entity[]): void {
    // Calculate total power demand
    const consumers = entities.filter(entity => entity.hasComponent('PowerConsumer'));
    let totalDemand = 0;
    
    consumers.forEach(entity => {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      if (powerConsumer) {
        totalDemand += powerConsumer.powerRequired;
      }
    });

    // Calculate total power supply
    let totalSupply = 0;
    for (const plant of this.powerPlants.values()) {
      plant.currentOutput = plant.capacity * plant.efficiency;
      totalSupply += plant.currentOutput;
    }

    // Distribute power based on priority
    this.distributePower(consumers, totalSupply, totalDemand);
  }

  private distributePower(consumers: Entity[], totalSupply: number, totalDemand: number): void {
    // Reset all consumers to unpowered
    consumers.forEach(entity => {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      if (powerConsumer) {
        powerConsumer.isPowered = false;
      }
    });

    // Sort consumers by priority (lower number = higher priority)
    consumers.sort((a, b) => {
      const priorityA = a.getComponent<PowerConsumerComponent>('PowerConsumer')?.priority || 5;
      const priorityB = b.getComponent<PowerConsumerComponent>('PowerConsumer')?.priority || 5;
      return priorityA - priorityB;
    });

    let remainingSupply = totalSupply;

    // Distribute power in priority order
    for (const entity of consumers) {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      if (!powerConsumer) continue;

      if (remainingSupply >= powerConsumer.powerRequired) {
        powerConsumer.isPowered = true;
        remainingSupply -= powerConsumer.powerRequired;
      } else {
        powerConsumer.isPowered = false;
      }
    }

    console.log(`Power Grid: ${totalSupply}MW supply, ${totalDemand}MW demand, ${remainingSupply}MW surplus`);
  }

  getPowerGridStatus(): PowerGrid {
    let totalCapacity = 0;
    let totalOutput = 0;
    
    for (const plant of this.powerPlants.values()) {
      totalCapacity += plant.capacity;
      totalOutput += plant.currentOutput;
    }

    // Calculate total demand from all consumers
    let totalDemand = 0;
    // This would need access to all entities, simplified for now
    
    return {
      totalCapacity,
      totalDemand,
      totalOutput,
      efficiency: totalCapacity > 0 ? totalOutput / totalCapacity : 0,
      blackoutZones: [] // Simplified - would calculate actual blackout areas
    };
  }

  getPowerPlants(): Map<string, PowerPlant> {
    return new Map(this.powerPlants);
  }

  getUnpoweredBuildings(entities: Entity[]): Entity[] {
    return entities.filter(entity => {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      return powerConsumer && !powerConsumer.isPowered;
    });
  }

  getPowerCoverage(entities: Entity[]): number {
    const consumers = entities.filter(entity => entity.hasComponent('PowerConsumer'));
    if (consumers.length === 0) return 1.0;

    const poweredConsumers = consumers.filter(entity => {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      return powerConsumer?.isPowered;
    });

    return poweredConsumers.length / consumers.length;
  }

  // Method to check power coverage in a specific area
  getPowerCoverageInArea(area: GridPosition, entities: Entity[]): number {
    const entitiesInArea = this.spatialGrid.getEntitiesInArea(area);
    const consumersInArea = entitiesInArea.filter(entity => entity.hasComponent('PowerConsumer'));
    
    if (consumersInArea.length === 0) return 1.0;

    const poweredInArea = consumersInArea.filter(entity => {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      return powerConsumer?.isPowered;
    });

    return poweredInArea.length / consumersInArea.length;
  }

  // Simulate power line connections (simplified)
  canReceivePower(entity: Entity, entities: Entity[]): boolean {
    const maxDistance = 10; // Grid units for power transmission
    
    // Check if there's a power plant within range
    for (const plant of this.powerPlants.values()) {
      const plantEntity = entities.find(e => e.id === plant.entityId);
      if (plantEntity) {
        const distance = this.calculateDistance(entity.position, plantEntity.position);
        if (distance <= maxDistance) {
          return true;
        }
      }
    }

    // Check if there's a powered building within range (power transmission)
    const nearbyEntities = this.spatialGrid.getEntitiesInRadius(entity.position, maxDistance);
    for (const nearbyEntity of nearbyEntities) {
      const powerConsumer = nearbyEntity.getComponent<PowerConsumerComponent>('PowerConsumer');
      if (powerConsumer?.isPowered) {
        return true;
      }
    }

    return false;
  }

  private calculateDistance(pos1: GridPosition, pos2: GridPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}