import { Entity } from './Entity.js';
export declare abstract class System {
    abstract readonly name: string;
    abstract update(deltaTime: number, entities: Entity[]): void;
    handleEntityAdded(entity: Entity): void;
    handleEntityRemoved(entity: Entity): void;
    protected getEntitiesWithComponent(entities: Entity[], componentType: string): Entity[];
}
//# sourceMappingURL=System.d.ts.map