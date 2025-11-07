import { EntityManager } from './core/EntityManager.js';
import { SpatialGridImpl } from './core/SpatialGrid.js';
import { CityUI } from './ui/CityUI.js';
import { GridPositionImpl } from './core/GridPosition.js';
import { BuildingFactory } from './buildings/BuildingFactory.js';
import { ZoneManagerImpl } from './zoning/ZoneManager.js';
import { LandValueSystem } from './systems/LandValueSystem.js';
import { TrafficSystem } from './systems/TrafficSystem.js';
import { PowerSystem } from './systems/PowerSystem.js';
import { PublicTransitSystem } from './systems/PublicTransitSystem.js';
import { CrimeSystem } from './systems/CrimeSystem.js';
import { EconomicSystem } from './systems/EconomicSystem.js';
import { RoadNetwork } from './transportation/RoadNetwork.js';
class CitySimulator {
    constructor() {
        this.isRunning = false;
        this.lastUpdateTime = 0;
        this.selectedBuildingType = 'house';
        this.currentTool = 'select';
        this.entityManager = new EntityManager();
        this.spatialGrid = new SpatialGridImpl(10);
        this.zoneManager = new ZoneManagerImpl(100, 100);
        this.buildingFactory = new BuildingFactory(this.entityManager);
        this.roadNetwork = new RoadNetwork();
        this.landValueSystem = new LandValueSystem(this.zoneManager, this.spatialGrid);
        this.trafficSystem = new TrafficSystem(this.roadNetwork, this.spatialGrid);
        this.powerSystem = new PowerSystem(this.spatialGrid);
        this.transitSystem = new PublicTransitSystem(this.spatialGrid);
        this.crimeSystem = new CrimeSystem(this.spatialGrid);
        this.economicSystem = new EconomicSystem(100000);
        this.ui = new CityUI('app');
        // Add systems to entity manager
        this.entityManager.addSystem(this.landValueSystem);
        this.entityManager.addSystem(this.trafficSystem);
        this.entityManager.addSystem(this.powerSystem);
        this.entityManager.addSystem(this.transitSystem);
        this.entityManager.addSystem(this.crimeSystem);
        this.entityManager.addSystem(this.economicSystem);
        // Connect managers to render engine
        this.ui.getRenderEngine().setZoneManager(this.zoneManager);
        this.ui.getRenderEngine().setTrafficSystem(this.trafficSystem);
        this.setupEventListeners();
        this.setupBuildingTools();
        this.start();
    }
    setupEventListeners() {
        // Listen for tool usage events from the UI
        this.ui.getCanvas().addEventListener('toolUsed', (event) => {
            const customEvent = event;
            this.handleToolUsage(customEvent.detail);
        });
    }
    setupBuildingTools() {
        // Add building type selection tools
        this.ui.addTool('zone-residential', 'Zone R', '🏠', 'Zone area for residential buildings');
        this.ui.addTool('zone-commercial', 'Zone C', '🏢', 'Zone area for commercial buildings');
        this.ui.addTool('zone-industrial', 'Zone I', '🏭', 'Zone area for industrial buildings');
        this.ui.addTool('zone-municipal', 'Zone M', '🏛️', 'Zone area for municipal buildings');
        this.ui.addTool('build-house', 'House', '🏠', 'Build residential house');
        this.ui.addTool('build-apartment', 'Apartment', '🏢', 'Build apartment building');
        this.ui.addTool('build-shop', 'Shop', '🏪', 'Build commercial shop');
        this.ui.addTool('build-factory', 'Factory', '🏭', 'Build industrial factory');
        this.ui.addTool('build-police', 'Police', '👮', 'Build police station');
        this.ui.addTool('road', 'Road', '🛣️', 'Build roads for traffic');
    }
    handleToolUsage(detail) {
        const { tool, gridPosition } = detail;
        this.currentTool = tool;
        console.log(`Handling tool usage: ${tool} at (${gridPosition.x}, ${gridPosition.y})`);
        // Handle zoning tools
        if (tool.startsWith('zone-')) {
            const zoneType = tool.replace('zone-', '');
            this.setZoneAt(gridPosition.x, gridPosition.y, zoneType);
            return;
        }
        // Handle building tools
        if (tool.startsWith('build-')) {
            const buildingType = tool.replace('build-', '');
            this.placeBuildingAt(gridPosition.x, gridPosition.y, buildingType);
            return;
        }
        // Handle legacy tools
        switch (tool) {
            case 'building':
                this.placeBuildingAt(gridPosition.x, gridPosition.y, 'house');
                break;
            case 'road':
                this.placeRoadAt(gridPosition.x, gridPosition.y);
                break;
            case 'power':
                this.placeBuildingAt(gridPosition.x, gridPosition.y, 'powerPlant');
                break;
            case 'select':
                this.selectEntityAt(gridPosition.x, gridPosition.y);
                break;
            default:
                console.log(`Unknown tool: ${tool}`);
        }
    }
    setZoneAt(x, y, zoneType) {
        this.zoneManager.setZone(x, y, zoneType);
        console.log(`Zoned (${x}, ${y}) as ${zoneType}`);
    }
    placeBuildingAt(x, y, buildingType) {
        const currentZone = this.zoneManager.getZone(x, y);
        const entity = this.buildingFactory.createBuilding(buildingType, new GridPositionImpl(x, y), currentZone);
        if (entity) {
            this.spatialGrid.addEntity(entity);
            console.log(`Placed ${buildingType} at (${x}, ${y})`);
        }
        else {
            console.log(`Cannot place ${buildingType} at (${x}, ${y}) - incompatible zone or invalid building type`);
        }
    }
    placeRoadAt(x, y) {
        const position = new GridPositionImpl(x, y, 1, 1);
        // Add road node to the traffic network
        this.trafficSystem.addRoad(position);
        console.log(`Placed road at (${x}, ${y})`);
    }
    selectEntityAt(x, y) {
        const position = new GridPositionImpl(x, y, 1, 1);
        const entities = this.spatialGrid.getEntitiesInArea(position);
        const zone = this.zoneManager.getZone(x, y);
        const landValue = this.zoneManager.getLandValue(x, y);
        console.log(`Position (${x}, ${y}): Zone=${zone}, Land Value=$${landValue.toLocaleString()}`);
        if (entities.length > 0) {
            const entity = entities[0];
            const buildingInfo = entity.getComponent('BuildingInfo');
            console.log(`Selected entity: ${entity.id}`, {
                building: buildingInfo?.name || 'Unknown',
                type: buildingInfo?.buildingType || 'Unknown',
                level: buildingInfo?.level || 'N/A',
                components: Array.from(entity.components.keys())
            });
        }
        else {
            console.log(`No entity found at (${x}, ${y})`);
        }
    }
    start() {
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }
    gameLoop() {
        if (!this.isRunning)
            return;
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    update(deltaTime) {
        // Update all systems
        this.entityManager.update(deltaTime);
        // Update UI stats
        const entities = this.entityManager.getAllEntities();
        const powerConsumers = entities.filter(e => e.hasComponent('PowerConsumer'));
        const taxGenerators = entities.filter(e => e.hasComponent('TaxGenerator'));
        const totalTaxRevenue = taxGenerators.reduce((sum, entity) => {
            const taxGen = entity.getComponent('TaxGenerator');
            return sum + (taxGen?.annualRevenue || 0);
        }, 0);
        const trafficStats = this.trafficSystem.getTrafficStatistics();
        const economicStats = this.economicSystem.getEconomicStatistics(entities);
        const crimeStats = this.crimeSystem.getCrimeStatistics();
        const powerStats = this.powerSystem.getPowerGridStatus();
        this.ui.updateCityStats({
            population: economicStats.totalPopulation,
            budget: economicStats.municipalBudget,
            entityCount: entities.length,
            traffic: trafficStats.activeTrips,
            congestion: trafficStats.congestionLevel,
            crime: crimeStats.safetyLevel,
            power: Math.round(this.powerSystem.getPowerCoverage(entities) * 100),
            unemployment: Math.round(economicStats.unemployment * 100)
        });
    }
    render() {
        const entities = this.entityManager.getAllEntities();
        this.ui.getRenderEngine().render(entities);
    }
    stop() {
        this.isRunning = false;
    }
    // Debug methods
    getActiveTool() {
        return this.ui.getActiveTool();
    }
    getEntityCount() {
        return this.entityManager.getEntityCount();
    }
}
// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing City Simulator...');
    try {
        const simulator = new CitySimulator();
        console.log('City Simulator initialized successfully!');
        // Add debug info to window for browser console access
        window.citySimulator = simulator;
        window.debugInfo = () => {
            console.log('Active tool:', simulator.getActiveTool());
            console.log('Entity count:', simulator.getEntityCount());
            console.log('City simulator loaded successfully');
        };
        console.log('Debug: Type debugInfo() in browser console for more info');
    }
    catch (error) {
        console.error('Failed to initialize City Simulator:', error);
    }
});
//# sourceMappingURL=index.js.map