export class System {
    handleEntityAdded(entity) {
        // Default implementation - override in subclasses if needed
    }
    handleEntityRemoved(entity) {
        // Default implementation - override in subclasses if needed
    }
    getEntitiesWithComponent(entities, componentType) {
        return entities.filter(entity => entity.hasComponent(componentType));
    }
}
//# sourceMappingURL=System.js.map