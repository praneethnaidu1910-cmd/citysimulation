import { Entity } from './Entity.js';

export abstract class System {
  public abstract readonly name: string;
  
  abstract update(deltaTime: number, entities: Entity[]): void;
  
  handleEntityAdded(entity: Entity): void {
    // Default implementation - override in subclasses if needed
  }
  
  handleEntityRemoved(entity: Entity): void {
    // Default implementation - override in subclasses if needed
  }

  protected getEntitiesWithComponent(entities: Entity[], componentType: string): Entity[] {
    return entities.filter(entity => entity.hasComponent(componentType));
  }
}