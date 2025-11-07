import { System } from '../core/System.js';
export class PowerSystem extends System {
    constructor(spatialGrid) {
        super();
        this.name = 'PowerSystem';
        this.powerPlants = new Map();
        this.lastPowerUpdate = 0;
        this.powerUpdateInterval = 3000; // Update every 3 seconds
        this.spatialGrid = spatialGrid;
    }
    update(deltaTime, entities) {
        this.lastPowerUpdate += deltaTime * 1000;
        if (this.lastPowerUpdate >= this.powerUpdateInterval) {
            this.updatePowerGrid(entities);
            this.lastPowerUpdate = 0;
        }
    }
    handleEntityAdded(entity) {
        const buildingInfo = entity.getComponent('BuildingInfo');
        // Check if this is a power plant
        if (buildingInfo?.name.toLowerCase().includes('power')) {
            this.addPowerPlant(entity);
        }
    }
    handleEntityRemoved(entity) {
        this.powerPlants.delete(entity.id);
    }
    addPowerPlant(entity) {
        const buildingInfo = entity.getComponent('BuildingInfo');
        if (!buildingInfo)
            return;
        const powerPlant = {
            entityId: entity.id,
            capacity: this.calculatePlantCapacity(buildingInfo),
            currentOutput: 0,
            efficiency: 0.85,
            fuelType: this.determineFuelType(buildingInfo.name)
        };
        this.powerPlants.set(entity.id, powerPlant);
        console.log(`Added power plant: ${buildingInfo.name} with capacity ${powerPlant.capacity}MW`);
    }
    calculatePlantCapacity(buildingInfo) {
        // Base capacity on building level and type
        const baseCapacity = 500; // MW
        return Math.floor(baseCapacity * buildingInfo.level * 1.5);
    }
    determineFuelType(plantName) {
        const name = plantName.toLowerCase();
        if (name.includes('nuclear'))
            return 'nuclear';
        if (name.includes('solar'))
            return 'solar';
        if (name.includes('wind'))
            return 'wind';
        if (name.includes('gas'))
            return 'gas';
        return 'coal'; // Default
    }
    updatePowerGrid(entities) {
        // Calculate total power demand
        const consumers = entities.filter(entity => entity.hasComponent('PowerConsumer'));
        let totalDemand = 0;
        consumers.forEach(entity => {
            const powerConsumer = entity.getComponent('PowerConsumer');
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
    distributePower(consumers, totalSupply, totalDemand) {
        // Reset all consumers to unpowered
        consumers.forEach(entity => {
            const powerConsumer = entity.getComponent('PowerConsumer');
            if (powerConsumer) {
                powerConsumer.isPowered = false;
            }
        });
        // Sort consumers by priority (lower number = higher priority)
        consumers.sort((a, b) => {
            const priorityA = a.getComponent('PowerConsumer')?.priority || 5;
            const priorityB = b.getComponent('PowerConsumer')?.priority || 5;
            return priorityA - priorityB;
        });
        let remainingSupply = totalSupply;
        // Distribute power in priority order
        for (const entity of consumers) {
            const powerConsumer = entity.getComponent('PowerConsumer');
            if (!powerConsumer)
                continue;
            if (remainingSupply >= powerConsumer.powerRequired) {
                powerConsumer.isPowered = true;
                remainingSupply -= powerConsumer.powerRequired;
            }
            else {
                powerConsumer.isPowered = false;
            }
        }
        console.log(`Power Grid: ${totalSupply}MW supply, ${totalDemand}MW demand, ${remainingSupply}MW surplus`);
    }
    getPowerGridStatus() {
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
    getPowerPlants() {
        return new Map(this.powerPlants);
    }
    getUnpoweredBuildings(entities) {
        return entities.filter(entity => {
            const powerConsumer = entity.getComponent('PowerConsumer');
            return powerConsumer && !powerConsumer.isPowered;
        });
    }
    getPowerCoverage(entities) {
        const consumers = entities.filter(entity => entity.hasComponent('PowerConsumer'));
        if (consumers.length === 0)
            return 1.0;
        const poweredConsumers = consumers.filter(entity => {
            const powerConsumer = entity.getComponent('PowerConsumer');
            return powerConsumer?.isPowered;
        });
        return poweredConsumers.length / consumers.length;
    }
    // Method to check power coverage in a specific area
    getPowerCoverageInArea(area, entities) {
        const entitiesInArea = this.spatialGrid.getEntitiesInArea(area);
        const consumersInArea = entitiesInArea.filter(entity => entity.hasComponent('PowerConsumer'));
        if (consumersInArea.length === 0)
            return 1.0;
        const poweredInArea = consumersInArea.filter(entity => {
            const powerConsumer = entity.getComponent('PowerConsumer');
            return powerConsumer?.isPowered;
        });
        return poweredInArea.length / consumersInArea.length;
    }
    // Simulate power line connections (simplified)
    canReceivePower(entity, entities) {
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
            const powerConsumer = nearbyEntity.getComponent('PowerConsumer');
            if (powerConsumer?.isPowered) {
                return true;
            }
        }
        return false;
    }
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
//# sourceMappingURL=PowerSystem.js.map