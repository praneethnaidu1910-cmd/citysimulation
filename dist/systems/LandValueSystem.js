import { System } from '../core/System.js';
export class LandValueSystem extends System {
    constructor(zoneManager, spatialGrid) {
        super();
        this.zoneManager = zoneManager;
        this.spatialGrid = spatialGrid;
        this.name = 'LandValueSystem';
        this.lastUpdateTime = 0;
        this.updateInterval = 5000; // Update every 5 seconds (simulating annual updates)
    }
    update(deltaTime, entities) {
        this.lastUpdateTime += deltaTime * 1000; // Convert to milliseconds
        if (this.lastUpdateTime >= this.updateInterval) {
            this.updateLandValues(entities);
            this.updateBuildingValues(entities);
            this.lastUpdateTime = 0;
        }
    }
    updateLandValues(entities) {
        // Recalculate base land values considering proximity to buildings and infrastructure
        for (let x = 0; x < this.zoneManager.width; x++) {
            for (let y = 0; y < this.zoneManager.height; y++) {
                const newValue = this.calculateLandValue(x, y, entities);
                this.zoneManager.updateLandValue(x, y, newValue);
            }
        }
        console.log('Land values updated');
    }
    calculateLandValue(x, y, entities) {
        const baseValue = this.getBaseLandValue(x, y);
        const zoneMultiplier = this.getZoneMultiplier(x, y);
        const proximityBonus = this.calculateProximityBonus(x, y, entities);
        const infrastructureBonus = this.calculateInfrastructureBonus(x, y, entities);
        return Math.floor(baseValue * zoneMultiplier * proximityBonus * infrastructureBonus);
    }
    getBaseLandValue(x, y) {
        // Distance from city center increases land value
        const centerX = this.zoneManager.width / 2;
        const centerY = this.zoneManager.height / 2;
        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const proximityFactor = 1 - (distanceFromCenter / maxDistance);
        return Math.floor(15000 + (proximityFactor * 35000)); // $15k to $50k base
    }
    getZoneMultiplier(x, y) {
        const zone = this.zoneManager.getZone(x, y);
        switch (zone) {
            case 'commercial': return 1.8;
            case 'residential': return 1.2;
            case 'industrial': return 0.9;
            case 'municipal': return 0.7;
            default: return 1.0;
        }
    }
    calculateProximityBonus(x, y, entities) {
        let bonus = 1.0;
        const radius = 5;
        // Get nearby entities
        const nearbyEntities = this.spatialGrid.getEntitiesInRadius({ x, y, width: 1, height: 1 }, radius);
        nearbyEntities.forEach(entity => {
            const distance = Math.sqrt(Math.pow(entity.position.x - x, 2) + Math.pow(entity.position.y - y, 2));
            if (distance === 0)
                return; // Skip the same position
            const influence = Math.max(0, 1 - (distance / radius));
            const buildingInfo = entity.getComponent('BuildingInfo');
            if (buildingInfo) {
                switch (buildingInfo.buildingType) {
                    case 'commercial':
                        bonus += influence * 0.15; // Commercial buildings increase nearby land value
                        break;
                    case 'residential':
                        bonus += influence * 0.08; // Residential provides moderate increase
                        break;
                    case 'municipal':
                        bonus += influence * 0.12; // Municipal services increase value
                        break;
                    case 'industrial':
                        bonus -= influence * 0.05; // Industrial decreases nearby residential value
                        break;
                }
            }
        });
        return Math.max(0.3, Math.min(3.0, bonus)); // Clamp between 0.3x and 3.0x
    }
    calculateInfrastructureBonus(x, y, entities) {
        let bonus = 1.0;
        const radius = 3;
        // Check for roads and utilities nearby
        const nearbyEntities = this.spatialGrid.getEntitiesInRadius({ x, y, width: 1, height: 1 }, radius);
        let hasRoadAccess = false;
        let hasPowerAccess = false;
        nearbyEntities.forEach(entity => {
            const distance = Math.sqrt(Math.pow(entity.position.x - x, 2) + Math.pow(entity.position.y - y, 2));
            const influence = Math.max(0, 1 - (distance / radius));
            // Check for road access (simplified - any entity with traffic generation could be a road)
            const trafficGen = entity.getComponent('TrafficGenerator');
            if (trafficGen && distance <= 2) {
                hasRoadAccess = true;
            }
            // Check for power access
            const powerConsumer = entity.getComponent('PowerConsumer');
            if (powerConsumer?.isPowered && distance <= 3) {
                hasPowerAccess = true;
            }
        });
        if (hasRoadAccess)
            bonus += 0.2;
        if (hasPowerAccess)
            bonus += 0.15;
        return bonus;
    }
    updateBuildingValues(entities) {
        entities.forEach(entity => {
            const taxGenerator = entity.getComponent('TaxGenerator');
            const buildingInfo = entity.getComponent('BuildingInfo');
            if (taxGenerator && buildingInfo) {
                // Update building's land value based on current position
                const newLandValue = this.zoneManager.getLandValue(entity.position.x, entity.position.y);
                // Update tax revenue based on new land value
                const oldLandValue = taxGenerator.landValue;
                taxGenerator.landValue = newLandValue;
                // Adjust annual revenue proportionally
                if (oldLandValue > 0) {
                    const valueRatio = newLandValue / oldLandValue;
                    taxGenerator.annualRevenue = Math.floor(taxGenerator.annualRevenue * valueRatio);
                }
            }
        });
    }
    // Method to trigger building upgrades/downgrades based on land value changes
    checkBuildingDevelopment(entities) {
        entities.forEach(entity => {
            const buildingInfo = entity.getComponent('BuildingInfo');
            const taxGenerator = entity.getComponent('TaxGenerator');
            if (buildingInfo && taxGenerator) {
                const currentValue = taxGenerator.landValue;
                const upgradeThreshold = buildingInfo.constructionCost * buildingInfo.level * 2;
                const downgradeThreshold = buildingInfo.constructionCost * buildingInfo.level * 0.5;
                // Auto-upgrade if land value is high enough and building can be upgraded
                if (currentValue > upgradeThreshold && buildingInfo.canUpgrade()) {
                    console.log(`Auto-upgrading ${buildingInfo.name} due to high land value`);
                    // This would trigger the building factory's upgrade method
                }
                // Auto-downgrade if land value is too low (simplified - just reduce efficiency)
                if (currentValue < downgradeThreshold) {
                    taxGenerator.annualRevenue = Math.floor(taxGenerator.annualRevenue * 0.9);
                    console.log(`${buildingInfo.name} efficiency reduced due to low land value`);
                }
            }
        });
    }
    getLandValueStatistics() {
        let min = Infinity;
        let max = 0;
        let total = 0;
        let count = 0;
        for (let x = 0; x < this.zoneManager.width; x++) {
            for (let y = 0; y < this.zoneManager.height; y++) {
                const value = this.zoneManager.getLandValue(x, y);
                min = Math.min(min, value);
                max = Math.max(max, value);
                total += value;
                count++;
            }
        }
        return {
            min: min === Infinity ? 0 : min,
            max,
            average: count > 0 ? Math.floor(total / count) : 0,
            total
        };
    }
}
//# sourceMappingURL=LandValueSystem.js.map