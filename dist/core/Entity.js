export class EntityImpl {
    constructor(id, position) {
        this.id = id;
        this.position = position;
        this.components = new Map();
    }
    addComponent(component) {
        this.components.set(component.type, component);
    }
    removeComponent(componentType) {
        this.components.delete(componentType);
    }
    getComponent(componentType) {
        return this.components.get(componentType);
    }
    hasComponent(componentType) {
        return this.components.has(componentType);
    }
}
//# sourceMappingURL=Entity.js.map