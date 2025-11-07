import { Component } from './Component.js';
import { GridPosition } from './GridPosition.js';
export interface Entity {
    readonly id: string;
    position: GridPosition;
    components: Map<string, Component>;
    addComponent<T extends Component>(component: T): void;
    removeComponent(componentType: string): void;
    getComponent<T extends Component>(componentType: string): T | undefined;
    hasComponent(componentType: string): boolean;
}
export declare class EntityImpl implements Entity {
    readonly id: string;
    position: GridPosition;
    components: Map<string, Component>;
    constructor(id: string, position: GridPosition);
    addComponent<T extends Component>(component: T): void;
    removeComponent(componentType: string): void;
    getComponent<T extends Component>(componentType: string): T | undefined;
    hasComponent(componentType: string): boolean;
}
//# sourceMappingURL=Entity.d.ts.map