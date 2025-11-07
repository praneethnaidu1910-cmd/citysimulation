import { EntityImpl } from './Entity.js';
export class EntityManager {
    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.nextEntityId = 1;
    }
    addSystem(system) {
        this.systems.push(system);
    }
    removeSystem(systemName) {
        this.systems = this.systems.filter(system => system.name !== systemName);
    }
    createEntity(position) {
        const id = `entity_${this.nextEntityId++}`;
        const entity = new EntityImpl(id, position);
        this.entities.set(id, entity);
        // Notify all systems about the new entity
        this.systems.forEach(system => system.handleEntityAdded(entity));
        return entity;
    }
    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            return false;
        }
        // Notify all systems about entity removal
        this.systems.forEach(system => system.handleEntityRemoved(entity));
        return this.entities.delete(entityId);
    }
    getEntity(entityId) {
        return this.entities.get(entityId);
    }
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    getEntitiesWithComponent(componentType) {
        return Array.from(this.entities.values()).filter(entity => entity.hasComponent(componentType));
    }
    getEntitiesInArea(area) {
        return Array.from(this.entities.values()).filter(entity => area.overlaps ? area.overlaps(entity.position) : this.positionsOverlap(area, entity.position));
    }
    positionsOverlap(pos1, pos2) {
        return !(pos2.x >= pos1.x + pos1.width ||
            pos2.x + pos2.width <= pos1.x ||
            pos2.y >= pos1.y + pos1.height ||
            pos2.y + pos2.height <= pos1.y);
    }
    update(deltaTime) {
        const entities = this.getAllEntities();
        this.systems.forEach(system => system.update(deltaTime, entities));
    }
    getEntityCount() {
        return this.entities.size;
    }
    clear() {
        // Notify systems about all entity removals
        this.entities.forEach(entity => {
            this.systems.forEach(system => system.handleEntityRemoved(entity));
        });
        this.entities.clear();
        this.nextEntityId = 1;
    }
}
//# sourceMappingURL=EntityManager.js.map