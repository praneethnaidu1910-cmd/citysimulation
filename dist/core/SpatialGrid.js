export class SpatialGridImpl {
    constructor(cellSize = 10) {
        this.grid = new Map();
        this.entityToCells = new Map();
        this.cellSize = cellSize;
    }
    addEntity(entity) {
        const cells = this.getEntityCells(entity.position);
        this.entityToCells.set(entity.id, cells);
        cells.forEach(cellKey => {
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, new Set());
            }
            this.grid.get(cellKey).add(entity);
        });
    }
    removeEntity(entity) {
        const cells = this.entityToCells.get(entity.id);
        if (!cells)
            return;
        cells.forEach(cellKey => {
            const cellEntities = this.grid.get(cellKey);
            if (cellEntities) {
                cellEntities.delete(entity);
                if (cellEntities.size === 0) {
                    this.grid.delete(cellKey);
                }
            }
        });
        this.entityToCells.delete(entity.id);
    }
    getEntitiesInRadius(center, radius) {
        const centerX = center.x + center.width / 2;
        const centerY = center.y + center.height / 2;
        const minCellX = Math.floor((centerX - radius) / this.cellSize);
        const maxCellX = Math.floor((centerX + radius) / this.cellSize);
        const minCellY = Math.floor((centerY - radius) / this.cellSize);
        const maxCellY = Math.floor((centerY + radius) / this.cellSize);
        const entitiesInRadius = new Set();
        const radiusSquared = radius * radius;
        for (let x = minCellX; x <= maxCellX; x++) {
            for (let y = minCellY; y <= maxCellY; y++) {
                const cellEntities = this.getEntitiesInCell(x, y);
                cellEntities.forEach(entity => {
                    const entityCenter = entity.position;
                    const entityCenterX = entityCenter.x + entityCenter.width / 2;
                    const entityCenterY = entityCenter.y + entityCenter.height / 2;
                    const dx = entityCenterX - centerX;
                    const dy = entityCenterY - centerY;
                    const distanceSquared = dx * dx + dy * dy;
                    if (distanceSquared <= radiusSquared) {
                        entitiesInRadius.add(entity);
                    }
                });
            }
        }
        return Array.from(entitiesInRadius);
    }
    getEntitiesInCell(x, y) {
        const cellKey = this.getCellKey(x, y);
        const cellEntities = this.grid.get(cellKey);
        return cellEntities ? Array.from(cellEntities) : [];
    }
    getEntitiesInArea(area) {
        const minCellX = Math.floor(area.x / this.cellSize);
        const maxCellX = Math.floor((area.x + area.width - 1) / this.cellSize);
        const minCellY = Math.floor(area.y / this.cellSize);
        const maxCellY = Math.floor((area.y + area.height - 1) / this.cellSize);
        const entitiesInArea = new Set();
        for (let x = minCellX; x <= maxCellX; x++) {
            for (let y = minCellY; y <= maxCellY; y++) {
                const cellEntities = this.getEntitiesInCell(x, y);
                cellEntities.forEach(entity => {
                    if (this.positionsOverlap(area, entity.position)) {
                        entitiesInArea.add(entity);
                    }
                });
            }
        }
        return Array.from(entitiesInArea);
    }
    getEntityCells(position) {
        const minCellX = Math.floor(position.x / this.cellSize);
        const maxCellX = Math.floor((position.x + position.width - 1) / this.cellSize);
        const minCellY = Math.floor(position.y / this.cellSize);
        const maxCellY = Math.floor((position.y + position.height - 1) / this.cellSize);
        const cells = [];
        for (let x = minCellX; x <= maxCellX; x++) {
            for (let y = minCellY; y <= maxCellY; y++) {
                cells.push(this.getCellKey(x, y));
            }
        }
        return cells;
    }
    getCellKey(x, y) {
        return `${x},${y}`;
    }
    positionsOverlap(pos1, pos2) {
        return !(pos2.x >= pos1.x + pos1.width ||
            pos2.x + pos2.width <= pos1.x ||
            pos2.y >= pos1.y + pos1.height ||
            pos2.y + pos2.height <= pos1.y);
    }
    clear() {
        this.grid.clear();
        this.entityToCells.clear();
    }
    getCellCount() {
        return this.grid.size;
    }
    getEntityCount() {
        return this.entityToCells.size;
    }
}
//# sourceMappingURL=SpatialGrid.js.map