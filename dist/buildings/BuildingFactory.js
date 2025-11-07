import { GridPositionImpl } from '../core/GridPosition.js';
import { PowerConsumerComponent, TrafficGeneratorComponent, TaxGeneratorComponent } from '../core/Component.js';
import { BuildingInfoComponent, BUILDING_TEMPLATES } from './BuildingTypes.js';
export class BuildingFactory {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }
    createBuilding(templateKey, position, zoneType) {
        const template = BUILDING_TEMPLATES[templateKey];
        if (!template) {
            console.error(`Building template '${templateKey}' not found`);
            return null;
        }
        // Check if building can be placed in the specified zone
        if (zoneType && !template.allowedZones.includes(zoneType)) {
            console.error(`Building '${template.name}' cannot be placed in ${zoneType} zone`);
            return null;
        }
        // Create the entity with the template's dimensions
        const buildingPosition = new GridPositionImpl(position.x, position.y, template.width, template.height);
        const entity = this.entityManager.createEntity(buildingPosition);
        // Add building info component
        const buildingInfo = new BuildingInfoComponent(template.type, template.name, 1, // Starting level
        3, // Max level
        template.constructionCost, template.maintenanceCost, template.population, template.jobs);
        entity.addComponent(buildingInfo);
        // Add power consumer component
        const powerConsumer = new PowerConsumerComponent(Math.abs(template.powerRequired), // Use absolute value for consumption
        false, // Initially not powered
        this.getPowerPriority(template.type));
        entity.addComponent(powerConsumer);
        // Add traffic generator component
        const trafficGenerator = new TrafficGeneratorComponent(template.dailyTrips, this.getTrafficMultiplier(template.type), [] // Destinations will be calculated by traffic system
        );
        entity.addComponent(trafficGenerator);
        // Add tax generator component
        const taxGenerator = new TaxGeneratorComponent(template.taxRevenue, this.getTaxRate(template.type), this.calculateLandValue(position, template));
        entity.addComponent(taxGenerator);
        console.log(`Created ${template.name} at (${position.x}, ${position.y})`);
        return entity;
    }
    getPowerPriority(buildingType) {
        switch (buildingType) {
            case 'municipal': return 1; // Highest priority
            case 'residential': return 2;
            case 'commercial': return 3;
            case 'industrial': return 4; // Lowest priority
            default: return 3;
        }
    }
    getTrafficMultiplier(buildingType) {
        switch (buildingType) {
            case 'residential': return 1.8; // High peak hour traffic
            case 'commercial': return 1.4; // Moderate peak traffic
            case 'industrial': return 1.2; // Lower peak variation
            case 'municipal': return 1.1; // Steady traffic
            default: return 1.5;
        }
    }
    getTaxRate(buildingType) {
        switch (buildingType) {
            case 'residential': return 0.015; // 1.5% property tax
            case 'commercial': return 0.025; // 2.5% business tax
            case 'industrial': return 0.020; // 2.0% industrial tax
            case 'municipal': return 0.000; // No tax on municipal buildings
            default: return 0.020;
        }
    }
    calculateLandValue(position, template) {
        // Base land value calculation - can be enhanced later with proximity factors
        const baseValue = 50000;
        const typeMultiplier = this.getLandValueMultiplier(template.type);
        const sizeMultiplier = template.width * template.height;
        return baseValue * typeMultiplier * sizeMultiplier;
    }
    getLandValueMultiplier(buildingType) {
        switch (buildingType) {
            case 'commercial': return 1.5;
            case 'residential': return 1.0;
            case 'industrial': return 0.8;
            case 'municipal': return 0.6;
            default: return 1.0;
        }
    }
    getAvailableBuildings() {
        return BUILDING_TEMPLATES;
    }
    getBuildingTemplate(templateKey) {
        return BUILDING_TEMPLATES[templateKey];
    }
    canPlaceBuilding(templateKey, position, zoneType) {
        const template = BUILDING_TEMPLATES[templateKey];
        if (!template)
            return false;
        // Check zone compatibility
        if (zoneType && !template.allowedZones.includes(zoneType)) {
            return false;
        }
        // Check if area is clear (this would need to be implemented with collision detection)
        // For now, we'll assume it's always possible to place
        return true;
    }
    upgradeBuilding(entity) {
        const buildingInfo = entity.getComponent('BuildingInfo');
        if (!buildingInfo || !buildingInfo.canUpgrade()) {
            return false;
        }
        const upgradeCost = buildingInfo.getUpgradeCost();
        // TODO: Check if player has enough money
        // For now, assume upgrade is always possible
        const oldLevel = buildingInfo.level;
        if (buildingInfo.upgrade()) {
            // Update other components based on the upgrade
            this.updateComponentsAfterUpgrade(entity, oldLevel, buildingInfo.level);
            console.log(`Upgraded ${buildingInfo.name} to level ${buildingInfo.level}`);
            return true;
        }
        return false;
    }
    updateComponentsAfterUpgrade(entity, oldLevel, newLevel) {
        const multiplier = newLevel / oldLevel;
        // Update power consumption
        const powerConsumer = entity.getComponent('PowerConsumer');
        if (powerConsumer) {
            powerConsumer.powerRequired = Math.floor(powerConsumer.powerRequired * multiplier);
        }
        // Update traffic generation
        const trafficGenerator = entity.getComponent('TrafficGenerator');
        if (trafficGenerator) {
            trafficGenerator.dailyTrips = Math.floor(trafficGenerator.dailyTrips * multiplier);
        }
        // Update tax generation
        const taxGenerator = entity.getComponent('TaxGenerator');
        if (taxGenerator) {
            taxGenerator.annualRevenue = Math.floor(taxGenerator.annualRevenue * multiplier);
            taxGenerator.landValue = Math.floor(taxGenerator.landValue * multiplier);
        }
    }
}
//# sourceMappingURL=BuildingFactory.js.map