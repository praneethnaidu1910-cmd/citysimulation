import { Entity } from '../core/Entity.js';
import { GridPosition } from '../core/GridPosition.js';
import { PowerConsumerComponent } from '../core/Component.js';
import { ZoneManagerImpl } from '../zoning/ZoneManager.js';
import { ZoneType } from '../buildings/BuildingTypes.js';
import { TrafficSystem } from '../systems/TrafficSystem.js';
import { RoadNetwork, RoadNode, RoadEdge } from '../transportation/RoadNetwork.js';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private gridSize: number;
  private zoneManager: ZoneManagerImpl | null = null;
  private trafficSystem: TrafficSystem | null = null;
  private showZones: boolean = false;
  private showLandValues: boolean = false;
  private showTraffic: boolean = false;

  constructor(canvas: HTMLCanvasElement, gridSize: number = 20) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gridSize = gridSize;
    this.camera = { x: 0, y: 0, zoom: 1 };
    
    this.setupCanvas();
  }

  private setupCanvas(): void {
    // Set canvas size to match display size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  setCamera(x: number, y: number, zoom: number): void {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = Math.max(0.1, Math.min(5, zoom));
  }

  panCamera(deltaX: number, deltaY: number): void {
    this.camera.x += deltaX / this.camera.zoom;
    this.camera.y += deltaY / this.camera.zoom;
  }

  zoomCamera(delta: number, centerX: number, centerY: number): void {
    const oldZoom = this.camera.zoom;
    const newZoom = Math.max(0.1, Math.min(5, oldZoom + delta));
    
    if (newZoom !== oldZoom) {
      // Zoom towards the mouse position
      const worldX = (centerX / oldZoom) + this.camera.x;
      const worldY = (centerY / oldZoom) + this.camera.y;
      
      this.camera.zoom = newZoom;
      this.camera.x = worldX - (centerX / newZoom);
      this.camera.y = worldY - (centerY / newZoom);
    }
  }

  setZoneManager(zoneManager: ZoneManagerImpl): void {
    this.zoneManager = zoneManager;
  }

  setTrafficSystem(trafficSystem: TrafficSystem): void {
    this.trafficSystem = trafficSystem;
  }

  toggleZoneDisplay(): void {
    this.showZones = !this.showZones;
  }

  toggleLandValueDisplay(): void {
    this.showLandValues = !this.showLandValues;
  }

  toggleTrafficDisplay(): void {
    this.showTraffic = !this.showTraffic;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(entities: Entity[]): void {
    this.clear();
    this.drawGrid();
    
    if (this.zoneManager) {
      if (this.showZones) {
        this.drawZones();
      }
      if (this.showLandValues) {
        this.drawLandValues();
      }
    }
    
    if (this.trafficSystem && this.showTraffic) {
      this.drawTrafficNetwork();
    }
    
    this.drawEntities(entities);
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;

    const startX = Math.floor(this.camera.x / this.gridSize) * this.gridSize;
    const startY = Math.floor(this.camera.y / this.gridSize) * this.gridSize;
    const endX = startX + (this.canvas.width / this.camera.zoom) + this.gridSize;
    const endY = startY + (this.canvas.height / this.camera.zoom) + this.gridSize;

    // Draw vertical lines
    for (let x = startX; x <= endX; x += this.gridSize) {
      const screenX = (x - this.camera.x) * this.camera.zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += this.gridSize) {
      const screenY = (y - this.camera.y) * this.camera.zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
      this.ctx.stroke();
    }
  }

  private drawZones(): void {
    if (!this.zoneManager) return;

    const startGridX = Math.floor(this.camera.x / this.gridSize);
    const startGridY = Math.floor(this.camera.y / this.gridSize);
    const endGridX = startGridX + Math.ceil(this.canvas.width / (this.gridSize * this.camera.zoom)) + 1;
    const endGridY = startGridY + Math.ceil(this.canvas.height / (this.gridSize * this.camera.zoom)) + 1;

    for (let gridX = startGridX; gridX <= endGridX; gridX++) {
      for (let gridY = startGridY; gridY <= endGridY; gridY++) {
        const zone = this.zoneManager.getZone(gridX, gridY);
        if (zone !== ZoneType.UNZONED) {
          const screenX = (gridX * this.gridSize - this.camera.x) * this.camera.zoom;
          const screenY = (gridY * this.gridSize - this.camera.y) * this.camera.zoom;
          const screenSize = this.gridSize * this.camera.zoom;

          this.ctx.fillStyle = this.getZoneColor(zone);
          this.ctx.globalAlpha = 0.3;
          this.ctx.fillRect(screenX, screenY, screenSize, screenSize);
          this.ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  private drawLandValues(): void {
    if (!this.zoneManager) return;

    const startGridX = Math.floor(this.camera.x / this.gridSize);
    const startGridY = Math.floor(this.camera.y / this.gridSize);
    const endGridX = startGridX + Math.ceil(this.canvas.width / (this.gridSize * this.camera.zoom)) + 1;
    const endGridY = startGridY + Math.ceil(this.canvas.height / (this.gridSize * this.camera.zoom)) + 1;

    // Get min/max land values for color scaling
    let minValue = Infinity;
    let maxValue = 0;
    for (let gridX = startGridX; gridX <= endGridX; gridX++) {
      for (let gridY = startGridY; gridY <= endGridY; gridY++) {
        const value = this.zoneManager.getLandValue(gridX, gridY);
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    }

    for (let gridX = startGridX; gridX <= endGridX; gridX++) {
      for (let gridY = startGridY; gridY <= endGridY; gridY++) {
        const value = this.zoneManager.getLandValue(gridX, gridY);
        const screenX = (gridX * this.gridSize - this.camera.x) * this.camera.zoom;
        const screenY = (gridY * this.gridSize - this.camera.y) * this.camera.zoom;
        const screenSize = this.gridSize * this.camera.zoom;

        // Color based on land value (green = high, red = low)
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const red = Math.floor(255 * (1 - normalizedValue));
        const green = Math.floor(255 * normalizedValue);
        
        this.ctx.fillStyle = `rgba(${red}, ${green}, 0, 0.4)`;
        this.ctx.fillRect(screenX, screenY, screenSize, screenSize);

        // Show value text if zoomed in enough
        if (this.camera.zoom > 1.0) {
          this.ctx.fillStyle = '#000';
          this.ctx.font = `${Math.max(8, 10 * this.camera.zoom)}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
            `$${Math.floor(value / 1000)}k`,
            screenX + screenSize / 2,
            screenY + screenSize / 2
          );
        }
      }
    }
  }

  private drawEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      this.drawEntity(entity);
    });
  }

  private drawEntity(entity: Entity): void {
    const pos = entity.position;
    const screenX = (pos.x * this.gridSize - this.camera.x) * this.camera.zoom;
    const screenY = (pos.y * this.gridSize - this.camera.y) * this.camera.zoom;
    const screenWidth = pos.width * this.gridSize * this.camera.zoom;
    const screenHeight = pos.height * this.gridSize * this.camera.zoom;

    // Skip rendering if entity is outside visible area
    if (screenX + screenWidth < 0 || screenX > this.canvas.width ||
        screenY + screenHeight < 0 || screenY > this.canvas.height) {
      return;
    }

    // Default entity rendering - can be overridden by specific entity types
    this.ctx.fillStyle = this.getEntityColor(entity);
    this.ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

    // Draw entity ID if zoomed in enough
    if (this.camera.zoom > 0.5) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = `${Math.max(10, 12 * this.camera.zoom)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        entity.id.substring(0, 8),
        screenX + screenWidth / 2,
        screenY + screenHeight / 2
      );
    }
  }

  private getEntityColor(entity: Entity): string {
    // Color entities based on their components
    if (entity.hasComponent('PowerConsumer')) {
      const powerConsumer = entity.getComponent<PowerConsumerComponent>('PowerConsumer');
      return powerConsumer?.isPowered ? '#4CAF50' : '#F44336';
    }
    if (entity.hasComponent('TrafficGenerator')) {
      return '#2196F3';
    }
    if (entity.hasComponent('TaxGenerator')) {
      return '#FF9800';
    }
    return '#9E9E9E'; // Default gray
  }

  private drawTrafficNetwork(): void {
    if (!this.trafficSystem) return;

    const roadNetwork = this.trafficSystem.getRoadNetwork();
    const nodes = roadNetwork.getNodes();
    const edges = roadNetwork.getEdges();

    // Draw road edges with traffic density
    for (const [edgeId, edge] of edges) {
      this.drawRoadEdge(edge, roadNetwork);
    }

    // Draw road nodes
    for (const [nodeId, node] of nodes) {
      this.drawRoadNode(node);
    }
  }

  private drawRoadEdge(edge: RoadEdge, roadNetwork: RoadNetwork): void {
    const startNode = roadNetwork.getNode(edge.startNodeId);
    const endNode = roadNetwork.getNode(edge.endNodeId);
    
    if (!startNode || !endNode) return;

    const startScreenPos = this.gridToScreen(startNode.position);
    const endScreenPos = this.gridToScreen(endNode.position);

    // Skip if edge is outside visible area
    if (!this.isLineVisible(startScreenPos, endScreenPos)) return;

    const trafficDensity = roadNetwork.getTrafficDensity(edge.id);
    const roadWidth = this.getRoadWidth(edge.roadType) * this.camera.zoom;

    // Draw road base
    this.ctx.strokeStyle = this.getRoadColor(edge.roadType);
    this.ctx.lineWidth = roadWidth;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(startScreenPos.x, startScreenPos.y);
    this.ctx.lineTo(endScreenPos.x, endScreenPos.y);
    this.ctx.stroke();

    // Draw traffic density overlay
    if (trafficDensity > 0.1) {
      this.ctx.strokeStyle = this.getTrafficDensityColor(trafficDensity);
      this.ctx.lineWidth = roadWidth * 0.6;
      this.ctx.globalAlpha = 0.7;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startScreenPos.x, startScreenPos.y);
      this.ctx.lineTo(endScreenPos.x, endScreenPos.y);
      this.ctx.stroke();
      
      this.ctx.globalAlpha = 1.0;
    }

    // Draw traffic flow animation (simplified)
    if (trafficDensity > 0.2 && this.camera.zoom > 0.8) {
      this.drawTrafficFlow(startScreenPos, endScreenPos, trafficDensity);
    }
  }

  private drawRoadNode(node: RoadNode): void {
    const screenPos = this.gridToScreen(node.position);
    
    // Skip if node is outside visible area
    if (!this.isPointVisible(screenPos)) return;

    const nodeSize = 4 * this.camera.zoom;
    
    this.ctx.fillStyle = '#666';
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, nodeSize, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  private drawTrafficFlow(start: {x: number, y: number}, end: {x: number, y: number}, density: number): void {
    const numVehicles = Math.floor(density * 5);
    const time = Date.now() / 1000;
    
    for (let i = 0; i < numVehicles; i++) {
      const progress = ((time * 0.5 + i * 0.2) % 1);
      const x = start.x + (end.x - start.x) * progress;
      const y = start.y + (end.y - start.y) * progress;
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2 * this.camera.zoom, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  private getRoadWidth(roadType: string): number {
    switch (roadType) {
      case 'highway': return 8;
      case 'avenue': return 6;
      case 'street': return 4;
      default: return 4;
    }
  }

  private getRoadColor(roadType: string): string {
    switch (roadType) {
      case 'highway': return '#2C3E50';
      case 'avenue': return '#34495E';
      case 'street': return '#7F8C8D';
      default: return '#7F8C8D';
    }
  }

  private getTrafficDensityColor(density: number): string {
    if (density < 0.3) return '#27AE60'; // Green - light traffic
    if (density < 0.6) return '#F39C12'; // Orange - moderate traffic
    if (density < 0.8) return '#E67E22'; // Dark orange - heavy traffic
    return '#E74C3C'; // Red - congested
  }

  private gridToScreen(gridPos: GridPosition): {x: number, y: number} {
    return {
      x: (gridPos.x * this.gridSize - this.camera.x) * this.camera.zoom,
      y: (gridPos.y * this.gridSize - this.camera.y) * this.camera.zoom
    };
  }

  private isPointVisible(point: {x: number, y: number}): boolean {
    return point.x >= -50 && point.x <= this.canvas.width + 50 &&
           point.y >= -50 && point.y <= this.canvas.height + 50;
  }

  private isLineVisible(start: {x: number, y: number}, end: {x: number, y: number}): boolean {
    return this.isPointVisible(start) || this.isPointVisible(end) ||
           (start.x < 0 && end.x > this.canvas.width) ||
           (start.y < 0 && end.y > this.canvas.height);
  }

  private getZoneColor(zone: ZoneType): string {
    switch (zone) {
      case ZoneType.RESIDENTIAL: return '#4CAF50'; // Green
      case ZoneType.COMMERCIAL: return '#2196F3'; // Blue
      case ZoneType.INDUSTRIAL: return '#FF9800'; // Orange
      case ZoneType.MUNICIPAL: return '#9C27B0'; // Purple
      default: return '#9E9E9E'; // Gray
    }
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom,
      y: (worldY - this.camera.y) * this.camera.zoom
    };
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX / this.camera.zoom) + this.camera.x,
      y: (screenY / this.camera.zoom) + this.camera.y
    };
  }

  screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const world = this.screenToWorld(screenX, screenY);
    return {
      x: Math.floor(world.x / this.gridSize),
      y: Math.floor(world.y / this.gridSize)
    };
  }

  getCamera(): Camera {
    return { ...this.camera };
  }

  resize(): void {
    this.setupCanvas();
  }
}