import { Entity } from '../core/Entity.js';
import { ZoneManagerImpl } from '../zoning/ZoneManager.js';
import { TrafficSystem } from '../systems/TrafficSystem.js';
export interface Camera {
    x: number;
    y: number;
    zoom: number;
}
export declare class RenderEngine {
    private canvas;
    private ctx;
    private camera;
    private gridSize;
    private zoneManager;
    private trafficSystem;
    private showZones;
    private showLandValues;
    private showTraffic;
    constructor(canvas: HTMLCanvasElement, gridSize?: number);
    private setupCanvas;
    setCamera(x: number, y: number, zoom: number): void;
    panCamera(deltaX: number, deltaY: number): void;
    zoomCamera(delta: number, centerX: number, centerY: number): void;
    setZoneManager(zoneManager: ZoneManagerImpl): void;
    setTrafficSystem(trafficSystem: TrafficSystem): void;
    toggleZoneDisplay(): void;
    toggleLandValueDisplay(): void;
    toggleTrafficDisplay(): void;
    clear(): void;
    render(entities: Entity[]): void;
    private drawGrid;
    private drawZones;
    private drawLandValues;
    private drawEntities;
    private drawEntity;
    private getEntityColor;
    private drawTrafficNetwork;
    private drawRoadEdge;
    private drawRoadNode;
    private drawTrafficFlow;
    private getRoadWidth;
    private getRoadColor;
    private getTrafficDensityColor;
    private gridToScreen;
    private isPointVisible;
    private isLineVisible;
    private getZoneColor;
    worldToScreen(worldX: number, worldY: number): {
        x: number;
        y: number;
    };
    screenToWorld(screenX: number, screenY: number): {
        x: number;
        y: number;
    };
    screenToGrid(screenX: number, screenY: number): {
        x: number;
        y: number;
    };
    getCamera(): Camera;
    resize(): void;
}
//# sourceMappingURL=RenderEngine.d.ts.map