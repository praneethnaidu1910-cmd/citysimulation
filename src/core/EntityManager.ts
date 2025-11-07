import { Entity, EntityImpl } from './Entity.js';
import { Component } from './Component.js';
import { GridPosition, GridPositionImpl } from './GridPosition.js';
import { System } from './System.js';

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private systems: System[] = [];
  private nextEntityId: number = 1;

  addSystem(system: System): void {
    this.systems.push(system);
  }

  removeSystem(systemName: string): void {
    this.systems = this.systems.filter(system => system.name !== systemName);
  }

  createEntity(position: GridPosition): Entity {
    const id = `entity_${this.nextEntityId++}`;
    const entity = new EntityImpl(id, position);
    this.entities.set(id, entity);
    
    // Notify all systems about the new entity
    this.systems.forEach(system => system.handleEntityAdded(entity));
    
    return entity;
  }

  removeEntity(entityId: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return false;
    }

    // Notify all systems about entity removal
    this.systems.forEach(system => system.handleEntityRemoved(entity));
    
    return this.entities.delete(entityId);
  }

  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getEntitiesWithComponent(componentType: string): Entity[] {
    return Array.from(this.entities.values()).filter(entity => 
      entity.hasComponent(componentType)
    );
  }

  getEntitiesInArea(area: GridPosition): Entity[] {
    return Array.from(this.entities.values()).filter(entity => 
      area.overlaps ? area.overlaps(entity.position) : this.positionsOverlap(area, entity.position)
    );
  }

  private positionsOverlap(pos1: GridPosition, pos2: GridPosition): boolean {
    return !(
      pos2.x >= pos1.x + pos1.width ||
      pos2.x + pos2.width <= pos1.x ||
      pos2.y >= pos1.y + pos1.height ||
      pos2.y + pos2.height <= pos1.y
    );
  }

  update(deltaTime: number): void {
    const entities = this.getAllEntities();
    this.systems.forEach(system => system.update(deltaTime, entities));
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  clear(): void {
    // Notify systems about all entity removals
    this.entities.forEach(entity => {
      this.systems.forEach(system => system.handleEntityRemoved(entity));
    });
    
    this.entities.clear();
    this.nextEntityId = 1;
  }
}