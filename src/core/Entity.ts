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

export class EntityImpl implements Entity {
  public readonly id: string;
  public position: GridPosition;
  public components: Map<string, Component>;

  constructor(id: string, position: GridPosition) {
    this.id = id;
    this.position = position;
    this.components = new Map();
  }

  addComponent<T extends Component>(component: T): void {
    this.components.set(component.type, component);
  }

  removeComponent(componentType: string): void {
    this.components.delete(componentType);
  }

  getComponent<T extends Component>(componentType: string): T | undefined {
    return this.components.get(componentType) as T;
  }

  hasComponent(componentType: string): boolean {
    return this.components.has(componentType);
  }
}