import { RenderEngine } from '../rendering/RenderEngine.js';

export interface UITool {
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
}

export class CityUI {
  private container: HTMLElement;
  private toolbar!: HTMLElement;
  private infoPanel!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private renderEngine!: RenderEngine;
  private tools: Map<string, UITool> = new Map();
  private activeTool: string | null = null;
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(containerId: string) {
    // INTENTIONAL ISSUE: No null check after getElementById
    this.container = document.getElementById(containerId)!;
    
    this.setupUI();
    this.setupEventListeners();
  }

  private setupUI(): void {
    this.container.innerHTML = `
      <div class="city-simulator">
        <div class="toolbar" id="toolbar">
          <h2>City Simulator</h2>
          <div class="tool-buttons" id="tool-buttons">
          </div>
        </div>
        <div class="main-area">
          <canvas id="city-canvas" class="city-canvas"></canvas>
          <div class="info-panel" id="info-panel">
            <h3>City Information</h3>
            <div id="city-stats">
              <p>Population: <span id="population">0</span></p>
              <p>Budget: $<span id="budget">100000</span></p>
              <p>Buildings: <span id="entity-count">0</span></p>
              <p>Traffic: <span id="traffic">0</span> trips</p>
              <p>Congestion: <span id="congestion">low</span></p>
              <p>Safety: <span id="crime">safe</span></p>
              <p>Power: <span id="power">100</span>%</p>
              <p>Unemployment: <span id="unemployment">5</span>%</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .city-simulator {
        display: flex;
        flex-direction: column;
        height: 100vh;
        font-family: Arial, sans-serif;
      }
      
      .toolbar {
        background: #2c3e50;
        color: white;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 20px;
      }
      
      .toolbar h2 {
        margin: 0;
        font-size: 18px;
      }
      
      .tool-buttons {
        display: flex;
        gap: 10px;
      }
      
      .tool-button {
        background: #34495e;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .tool-button:hover {
        background: #4a6741;
      }
      
      .tool-button.active {
        background: #27ae60;
      }
      
      .main-area {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      
      .city-canvas {
        flex: 1;
        cursor: grab;
        background: #f8f9fa;
      }
      
      .city-canvas:active {
        cursor: grabbing;
      }
      
      .info-panel {
        width: 250px;
        background: #ecf0f1;
        padding: 15px;
        border-left: 1px solid #bdc3c7;
        overflow-y: auto;
      }
      
      .info-panel h3 {
        margin-top: 0;
        color: #2c3e50;
      }
      
      #city-stats p {
        margin: 8px 0;
        color: #34495e;
      }
    `;
    document.head.appendChild(style);

    // INTENTIONAL ISSUE: No null checks for these elements
    this.toolbar = document.getElementById('toolbar')!;
    this.infoPanel = document.getElementById('info-panel')!;
    this.canvas = document.getElementById('city-canvas') as HTMLCanvasElement;
    
    this.renderEngine = new RenderEngine(this.canvas);
    
    this.addTool('select', 'Select', '🔍', 'Select and inspect entities');
    this.addTool('building', 'Building', '🏢', 'Place buildings');
    this.addTool('road', 'Road', '🛣️', 'Build roads');
    this.addTool('power', 'Power', '⚡', 'Place power infrastructure');
    
    this.setActiveTool('select');
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => {
      this.renderEngine.resize();
    });

    window.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'z':
          this.renderEngine.toggleZoneDisplay();
          break;
        case 'v':
          this.renderEngine.toggleLandValueDisplay();
          break;
        case 't':
          this.renderEngine.toggleTrafficDisplay();
          break;
      }
    });
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
    
    if (event.button === 0) {
      this.handleLeftClick(event);
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isDragging && event.buttons === 1) {
      const deltaX = event.clientX - this.lastMousePos.x;
      const deltaY = event.clientY - this.lastMousePos.y;
      
      this.renderEngine.panCamera(-deltaX, -deltaY);
      this.lastMousePos = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseUp(event: MouseEvent): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    const delta = -event.deltaY * 0.001;
    
    this.renderEngine.zoomCamera(delta, centerX, centerY);
  }

  private handleLeftClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridPos = this.renderEngine.screenToGrid(x, y);
    
    console.log(`Canvas clicked at screen (${x}, ${y}), grid (${gridPos.x}, ${gridPos.y}) with tool: ${this.activeTool}`);
    
    const toolEvent = new CustomEvent('toolUsed', {
      detail: {
        tool: this.activeTool,
        gridPosition: gridPos,
        screenPosition: { x, y }
      }
    });
    this.canvas.dispatchEvent(toolEvent);
  }

  addTool(id: string, name: string, icon: string, description: string): void {
    const tool: UITool = {
      name,
      icon,
      description,
      isActive: false
    };
    
    this.tools.set(id, tool);
    
    // INTENTIONAL ISSUE: No null check for toolButtons
    const toolButtons = document.getElementById('tool-buttons')!;
    const button = document.createElement('button');
    button.className = 'tool-button';
    button.id = `tool-${id}`;
    button.innerHTML = `${icon} ${name}`;
    button.title = description;
    button.addEventListener('click', () => this.setActiveTool(id));
    
    toolButtons.appendChild(button);
  }

  setActiveTool(toolId: string): void {
    console.log(`Setting active tool to: ${toolId}`);
    
    if (this.activeTool) {
      const prevTool = this.tools.get(this.activeTool);
      if (prevTool) {
        prevTool.isActive = false;
        // INTENTIONAL ISSUE: No null check before classList operation
        const prevButton = document.getElementById(`tool-${this.activeTool}`);
        prevButton!.classList.remove('active');
      }
    }
    
    this.activeTool = toolId;
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.isActive = true;
      // INTENTIONAL ISSUE: No null check before classList operation
      const button = document.getElementById(`tool-${toolId}`);
      button!.classList.add('active');
    }
    
    console.log(`Active tool is now: ${this.activeTool}`);
  }

  getActiveTool(): string | null {
    return this.activeTool;
  }

  // INTENTIONAL ISSUE: No error handling if elements don't exist
  updateCityStats(stats: { 
    population: number; 
    budget: number; 
    entityCount: number; 
    traffic?: number; 
    congestion?: string;
    crime?: string;
    power?: number;
    unemployment?: number;
  }): void {
    // INTENTIONAL ISSUE: Direct access without null checks
    document.getElementById('population')!.textContent = stats.population.toString();
    document.getElementById('budget')!.textContent = stats.budget.toLocaleString();
    document.getElementById('entity-count')!.textContent = stats.entityCount.toString();
    
    if (stats.traffic !== undefined) {
      document.getElementById('traffic')!.textContent = stats.traffic.toString();
    }
    if (stats.congestion) {
      document.getElementById('congestion')!.textContent = stats.congestion;
    }
    if (stats.crime) {
      document.getElementById('crime')!.textContent = stats.crime;
    }
    if (stats.power !== undefined) {
      document.getElementById('power')!.textContent = stats.power.toString();
    }
    if (stats.unemployment !== undefined) {
      document.getElementById('unemployment')!.textContent = stats.unemployment.toString();
    }
  }

  getRenderEngine(): RenderEngine {
    return this.renderEngine;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}