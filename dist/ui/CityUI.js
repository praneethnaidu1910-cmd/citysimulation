import { RenderEngine } from '../rendering/RenderEngine.js';
export class CityUI {
    constructor(containerId) {
        this.tools = new Map();
        this.activeTool = null;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        this.setupUI();
        this.setupEventListeners();
    }
    setupUI() {
        this.container.innerHTML = `
      <div class="city-simulator">
        <div class="toolbar" id="toolbar">
          <h2>City Simulator</h2>
          <div class="tool-buttons" id="tool-buttons">
            <!-- Tools will be added dynamically -->
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
        // Add CSS styles
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
        // Get references to UI elements
        this.toolbar = document.getElementById('toolbar');
        this.infoPanel = document.getElementById('info-panel');
        this.canvas = document.getElementById('city-canvas');
        // Initialize render engine
        this.renderEngine = new RenderEngine(this.canvas);
        // Setup default tools
        this.addTool('select', 'Select', '🔍', 'Select and inspect entities');
        this.addTool('building', 'Building', '🏢', 'Place buildings');
        this.addTool('road', 'Road', '🛣️', 'Build roads');
        this.addTool('power', 'Power', '⚡', 'Place power infrastructure');
        this.setActiveTool('select');
    }
    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        // Window resize
        window.addEventListener('resize', () => {
            this.renderEngine.resize();
        });
        // Keyboard shortcuts
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
    onMouseDown(event) {
        this.isDragging = true;
        this.lastMousePos = { x: event.clientX, y: event.clientY };
        if (event.button === 0) { // Left click
            this.handleLeftClick(event);
        }
    }
    onMouseMove(event) {
        if (this.isDragging && event.buttons === 1) {
            const deltaX = event.clientX - this.lastMousePos.x;
            const deltaY = event.clientY - this.lastMousePos.y;
            this.renderEngine.panCamera(-deltaX, -deltaY);
            this.lastMousePos = { x: event.clientX, y: event.clientY };
        }
    }
    onMouseUp(event) {
        this.isDragging = false;
    }
    onWheel(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const centerX = event.clientX - rect.left;
        const centerY = event.clientY - rect.top;
        const delta = -event.deltaY * 0.001;
        this.renderEngine.zoomCamera(delta, centerX, centerY);
    }
    handleLeftClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const gridPos = this.renderEngine.screenToGrid(x, y);
        console.log(`Canvas clicked at screen (${x}, ${y}), grid (${gridPos.x}, ${gridPos.y}) with tool: ${this.activeTool}`);
        // Emit custom event for tool usage
        const toolEvent = new CustomEvent('toolUsed', {
            detail: {
                tool: this.activeTool,
                gridPosition: gridPos,
                screenPosition: { x, y }
            }
        });
        this.canvas.dispatchEvent(toolEvent);
    }
    addTool(id, name, icon, description) {
        const tool = {
            name,
            icon,
            description,
            isActive: false
        };
        this.tools.set(id, tool);
        // Add button to toolbar
        const toolButtons = document.getElementById('tool-buttons');
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.id = `tool-${id}`;
        button.innerHTML = `${icon} ${name}`;
        button.title = description;
        button.addEventListener('click', () => this.setActiveTool(id));
        toolButtons.appendChild(button);
    }
    setActiveTool(toolId) {
        console.log(`Setting active tool to: ${toolId}`);
        // Deactivate previous tool
        if (this.activeTool) {
            const prevTool = this.tools.get(this.activeTool);
            if (prevTool) {
                prevTool.isActive = false;
                const prevButton = document.getElementById(`tool-${this.activeTool}`);
                if (prevButton) {
                    prevButton.classList.remove('active');
                }
            }
        }
        // Activate new tool
        this.activeTool = toolId;
        const tool = this.tools.get(toolId);
        if (tool) {
            tool.isActive = true;
            const button = document.getElementById(`tool-${toolId}`);
            if (button) {
                button.classList.add('active');
            }
        }
        console.log(`Active tool is now: ${this.activeTool}`);
    }
    getActiveTool() {
        return this.activeTool;
    }
    updateCityStats(stats) {
        const populationEl = document.getElementById('population');
        const budgetEl = document.getElementById('budget');
        const entityCountEl = document.getElementById('entity-count');
        const trafficEl = document.getElementById('traffic');
        const congestionEl = document.getElementById('congestion');
        const crimeEl = document.getElementById('crime');
        const powerEl = document.getElementById('power');
        const unemploymentEl = document.getElementById('unemployment');
        if (populationEl)
            populationEl.textContent = stats.population.toString();
        if (budgetEl)
            budgetEl.textContent = stats.budget.toLocaleString();
        if (entityCountEl)
            entityCountEl.textContent = stats.entityCount.toString();
        if (trafficEl && stats.traffic !== undefined)
            trafficEl.textContent = stats.traffic.toString();
        if (congestionEl && stats.congestion)
            congestionEl.textContent = stats.congestion;
        if (crimeEl && stats.crime)
            crimeEl.textContent = stats.crime;
        if (powerEl && stats.power !== undefined)
            powerEl.textContent = stats.power.toString();
        if (unemploymentEl && stats.unemployment !== undefined)
            unemploymentEl.textContent = stats.unemployment.toString();
    }
    getRenderEngine() {
        return this.renderEngine;
    }
    getCanvas() {
        return this.canvas;
    }
}
//# sourceMappingURL=CityUI.js.map