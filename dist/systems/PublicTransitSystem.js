import { System } from '../core/System.js';
export class PublicTransitSystem extends System {
    constructor(spatialGrid) {
        super();
        this.name = 'PublicTransitSystem';
        this.transitLines = new Map();
        this.transitStations = new Map();
        this.lastTransitUpdate = 0;
        this.transitUpdateInterval = 4000; // Update every 4 seconds
        this.spatialGrid = spatialGrid;
    }
    update(deltaTime, entities) {
        this.lastTransitUpdate += deltaTime * 1000;
        if (this.lastTransitUpdate >= this.transitUpdateInterval) {
            this.updateTransitUsage(entities);
            this.lastTransitUpdate = 0;
        }
    }
    updateTransitUsage(entities) {
        // Calculate ridership based on nearby buildings
        for (const [stationId, station] of this.transitStations) {
            const nearbyBuildings = this.spatialGrid.getEntitiesInRadius(station.position, station.accessibilityRadius);
            let potentialRiders = 0;
            for (const building of nearbyBuildings) {
                const buildingInfo = building.getComponent('BuildingInfo');
                if (buildingInfo) {
                    potentialRiders += this.calculateBuildingRiders(buildingInfo);
                }
            }
            station.dailyRiders = Math.floor(potentialRiders * 0.3); // 30% use transit
        }
        // Update line ridership
        for (const [lineId, line] of this.transitLines) {
            let totalRidership = 0;
            for (const stationId of line.stations) {
                const station = this.transitStations.get(stationId);
                if (station) {
                    totalRidership += station.dailyRiders;
                }
            }
            line.ridership = totalRidership;
        }
    }
    calculateBuildingRiders(buildingInfo) {
        switch (buildingInfo.buildingType) {
            case 'residential':
                return (buildingInfo.population || 0) * 0.6; // 60% of residents might use transit
            case 'commercial':
                return (buildingInfo.jobs || 0) * 0.4; // 40% of workers use transit
            case 'industrial':
                return (buildingInfo.jobs || 0) * 0.2; // 20% of industrial workers use transit
            default:
                return 0;
        }
    }
    addTransitStation(position, type = 'bus') {
        const stationId = `station_${this.transitStations.size + 1}`;
        const station = {
            id: stationId,
            position: { ...position },
            lines: [],
            dailyRiders: 0,
            accessibilityRadius: type === 'subway' ? 8 : type === 'train' ? 12 : 5
        };
        this.transitStations.set(stationId, station);
        return station;
    }
    addTransitLine(name, stationIds, type) {
        const lineId = `line_${this.transitLines.size + 1}`;
        const line = {
            id: lineId,
            name,
            stations: [...stationIds],
            ridership: 0,
            capacity: this.getLineCapacity(type),
            type
        };
        this.transitLines.set(lineId, line);
        // Update stations to reference this line
        for (const stationId of stationIds) {
            const station = this.transitStations.get(stationId);
            if (station) {
                station.lines.push(lineId);
            }
        }
        return line;
    }
    getLineCapacity(type) {
        switch (type) {
            case 'bus': return 2000; // Daily capacity
            case 'subway': return 15000;
            case 'train': return 8000;
            default: return 2000;
        }
    }
    getTransitAccessibility(position) {
        let accessibility = 0;
        for (const station of this.transitStations.values()) {
            const distance = this.calculateDistance(position, station.position);
            if (distance <= station.accessibilityRadius) {
                // Closer stations provide better accessibility
                const accessibilityBonus = 1 - (distance / station.accessibilityRadius);
                accessibility += accessibilityBonus * station.lines.length;
            }
        }
        return Math.min(1.0, accessibility); // Cap at 100%
    }
    getTrafficReduction(entities) {
        let totalReduction = 0;
        for (const station of this.transitStations.values()) {
            const nearbyBuildings = this.spatialGrid.getEntitiesInRadius(station.position, station.accessibilityRadius);
            for (const building of nearbyBuildings) {
                const trafficGen = building.getComponent('TrafficGenerator');
                if (trafficGen) {
                    // Transit reduces traffic by percentage based on accessibility
                    const accessibility = this.getTransitAccessibility(building.position);
                    totalReduction += trafficGen.dailyTrips * accessibility * 0.4; // 40% reduction max
                }
            }
        }
        return totalReduction;
    }
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    getTransitStatistics() {
        let totalRidership = 0;
        let totalCapacity = 0;
        for (const line of this.transitLines.values()) {
            totalRidership += line.ridership;
            totalCapacity += line.capacity;
        }
        return {
            totalLines: this.transitLines.size,
            totalStations: this.transitStations.size,
            totalRidership,
            totalCapacity,
            utilizationRate: totalCapacity > 0 ? totalRidership / totalCapacity : 0
        };
    }
    getTransitLines() {
        return new Map(this.transitLines);
    }
    getTransitStations() {
        return new Map(this.transitStations);
    }
}
//# sourceMappingURL=PublicTransitSystem.js.map