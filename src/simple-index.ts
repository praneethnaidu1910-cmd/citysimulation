// Simplified City Simulator - Step by step loading
console.log('Starting simplified city simulator...');

// Simple UI class without complex dependencies
class SimpleCityUI {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private activeTool: string = 'select';

  constructor(containerId: string) {
    console.log('Initializing SimpleCityUI...');
    this.container = document.getElementById(containerId)!;
    this.setupUI();
    this.setupEventListeners();
    console.log('SimpleCityUI initialized successfully');
  }

  private setupUI(): void {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; font-family: Arial, sans-serif;">
        <div style="background: #2c3e50; color: white; padding: 10px; display: flex; align-items: center; gap: 20px;">
          <h2 style="margin: 0; font-size: 18px;">City Simulator</h2>
          <div id="tool-buttons" style="display: flex; gap: 10px;">
            <!-- Tools will be added here -->
          </div>
        </div>
        <div style="display: flex; flex: 1;">
          <canvas id="city-canvas" style="flex: 1; background: #f8f9fa; cursor: grab;"></canvas>
          <div style="width: 250px; background: #ecf0f1; padding: 15px; border-left: 1px solid #bdc3c7;">
            <h3 style="margin-top: 0; color: #2c3e50;">City Information</h3>
            <div id="city-stats">
              <p>Population: <span id="population">0</span></p>
              <p>Budget: $<span id="budget">100000</span></p>
              <p>Buildings: <span id="entity-count">0</span></p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('city-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Set canvas size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Add tools
    this.addTool('select', 'Select', '🔍');
    this.addTool('house', 'House', '🏠');
    this.addTool('road', 'Road', '🛣️');
    this.addTool('zone-r', 'Zone R', '🏘️');
    
    this.setActiveTool('select');
    this.drawGrid();
  }

  private addTool(id: string, name: string, icon: string): void {
    const toolButtons = document.getElementById('tool-buttons')!;
    const button = document.createElement('button');
    button.id = `tool-${id}`;
    button.innerHTML = `${icon} ${name}`;
    button.style.cssText = `
      background: #34495e; color: white; border: none; padding: 8px 12px; 
      border-radius: 4px; cursor: pointer; font-size: 12px;
    `;
    
    button.addEventListener('click', () => {
      console.log(`Tool clicked: ${id}`);
      this.setActiveTool(id);
    });
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#4a6741';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = button.classList.contains('active') ? '#27ae60' : '#34495e';
    });
    
    toolButtons.appendChild(button);
  }

  private setActiveTool(toolId: string): void {
    console.log(`Setting active tool: ${toolId}`);
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tool-button, [id^="tool-"]');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.background = '#34495e';
      btn.classList.remove('active');
    });
    
    // Set active tool
    this.activeTool = toolId;
    const activeButton = document.getElementById(`tool-${toolId}`);
    if (activeButton) {
      activeButton.style.background = '#27ae60';
      activeButton.classList.add('active');
    }
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const gridX = Math.floor(x / 20);
      const gridY = Math.floor(y / 20);
      
      console.log(`Canvas clicked at (${gridX}, ${gridY}) with tool: ${this.activeTool}`);
      this.handleCanvasClick(gridX, gridY);
    });

    window.addEventListener('resize', () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.drawGrid();
    });
  }

  private handleCanvasClick(gridX: number, gridY: number): void {
    switch (this.activeTool) {
      case 'house':
        this.drawBuilding(gridX, gridY, '#4CAF50');
        console.log(`Placed house at (${gridX}, ${gridY})`);
        break;
      case 'road':
        this.drawRoad(gridX, gridY);
        console.log(`Placed road at (${gridX}, ${gridY})`);
        break;
      case 'zone-r':
        this.drawZone(gridX, gridY, '#90EE90');
        console.log(`Zoned residential at (${gridX}, ${gridY})`);
        break;
      case 'select':
        console.log(`Selected position (${gridX}, ${gridY})`);
        break;
    }
  }

  private drawGrid(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x < this.canvas.width; x += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < this.canvas.height; y += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawBuilding(gridX: number, gridY: number, color: string): void {
    const x = gridX * 20;
    const y = gridY * 20;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 1, y + 1, 38, 38); // 2x2 building
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 1, y + 1, 38, 38);
  }

  private drawRoad(gridX: number, gridY: number): void {
    const x = gridX * 20;
    const y = gridY * 20;
    
    this.ctx.fillStyle = '#666';
    this.ctx.fillRect(x + 1, y + 1, 18, 18);
  }

  private drawZone(gridX: number, gridY: number, color: string): void {
    const x = gridX * 20;
    const y = gridY * 20;
    
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillRect(x + 1, y + 1, 18, 18);
    this.ctx.globalAlpha = 1.0;
  }
}

// Simple initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting simple city simulator...');
  
  try {
    const ui = new SimpleCityUI('app');
    console.log('Simple city simulator loaded successfully!');
    
    // Add to window for debugging
    (window as any).cityUI = ui;
  } catch (error) {
    console.error('Failed to initialize simple city simulator:', error);
    document.getElementById('app')!.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h2>Error Loading City Simulator</h2>
        <p>Error: ${error}</p>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
});