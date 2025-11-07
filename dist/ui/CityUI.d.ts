import { RenderEngine } from '../rendering/RenderEngine.js';
export interface UITool {
    name: string;
    icon: string;
    description: string;
    isActive: boolean;
}
export declare class CityUI {
    private container;
    private toolbar;
    private infoPanel;
    private canvas;
    private renderEngine;
    private tools;
    private activeTool;
    private isDragging;
    private lastMousePos;
    constructor(containerId: string);
    private setupUI;
    private setupEventListeners;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onWheel;
    private handleLeftClick;
    addTool(id: string, name: string, icon: string, description: string): void;
    setActiveTool(toolId: string): void;
    getActiveTool(): string | null;
    updateCityStats(stats: {
        population: number;
        budget: number;
        entityCount: number;
        traffic?: number;
        congestion?: string;
        crime?: string;
        power?: number;
        unemployment?: number;
    }): void;
    getRenderEngine(): RenderEngine;
    getCanvas(): HTMLCanvasElement;
}
//# sourceMappingURL=CityUI.d.ts.map