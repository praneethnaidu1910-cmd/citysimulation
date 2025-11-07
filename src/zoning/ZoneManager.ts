import { GridPosition } from '../core/GridPosition.js';
import { ZoneType } from '../buildings/BuildingTypes.js';

export interface ZoneMap {
  width: number;
  height: number;
  grid: ZoneType[][];
  landValues: number[][];
  updateLandValue(x: number, y: number, value: number): void;
  getZone(x: number, y: number): ZoneType;
  setZone(x: number, y: number, zoneType: ZoneType): void;
  getZoneArea(area: GridPosition): ZoneType[];
  getLandValue(x: number, y: number): number;
}

export class ZoneManagerImpl implements ZoneMap {
  public readonly width: number;
  public readonly height: number;
  public grid: ZoneType[][];
  public landValues: number[][];

  constructor(width: number = 100, height: number = 100) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.landValues = [];
    
    this.initializeGrids();
  }

  private initializeGrids(): void {
    // Initialize zone grid with unzoned areas
    for (let x = 0; x < this.width; x++) {
      this.grid[x] = [];
      this.landValues[x] = [];
      for (let y = 0; y < this.height; y++) {
        this.grid[x][y] = ZoneType.UNZONED;
        this.landValues[x][y] = this.calculateBaseLandValue(x, y);
      }
    }
  }

  private calculateBaseLandValue(x: number, y: number): number {
    // Base land value calculation - higher near center, lower at edges
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const proximityFactor = 1 - (distanceFromCenter / maxDistance);
    
    return Math.floor(10000 + (proximityFactor * 40000)); // $10k to $50k base value
  }

  getZone(x: number, y: number): ZoneType {
    if (this.isValidCoordinate(x, y)) {
      return this.grid[x][y];
    }
    return ZoneType.UNZONED;
  }

  setZone(x: number, y: number, zoneType: ZoneType): void {
    if (this.isValidCoordinate(x, y)) {
      const oldZone = this.grid[x][y];
      this.grid[x][y] = zoneType;
      
      // Update land value based on new zone type
      this.updateLandValueForZoneChange(x, y, oldZone, zoneType);
      
      console.log(`Zoned (${x}, ${y}) as ${zoneType}`);
    }
  }

  setZoneArea(area: GridPosition, zoneType: ZoneType): void {
    for (let x = area.x; x < area.x + area.width; x++) {
      for (let y = area.y; y < area.y + area.height; y++) {
        this.setZone(x, y, zoneType);
      }
    }
  }

  getZoneArea(area: GridPosition): ZoneType[] {
    const zones: ZoneType[] = [];
    for (let x = area.x; x < area.x + area.width; x++) {
      for (let y = area.y; y < area.y + area.height; y++) {
        zones.push(this.getZone(x, y));
      }
    }
    return zones;
  }

  getLandValue(x: number, y: number): number {
    if (this.isValidCoordinate(x, y)) {
      return this.landValues[x][y];
    }
    return 0;
  }

  updateLandValue(x: number, y: number, value: number): void {
    if (this.isValidCoordinate(x, y)) {
      this.landValues[x][y] = Math.max(0, value);
    }
  }

  private updateLandValueForZoneChange(x: number, y: number, oldZone: ZoneType, newZone: ZoneType): void {
    const baseValue = this.calculateBaseLandValue(x, y);
    const zoneMultiplier = this.getZoneValueMultiplier(newZone);
    const newValue = Math.floor(baseValue * zoneMultiplier);
    
    this.updateLandValue(x, y, newValue);
  }

  private getZoneValueMultiplier(zoneType: ZoneType): number {
    switch (zoneType) {
      case ZoneType.COMMERCIAL: return 1.8;
      case ZoneType.RESIDENTIAL: return 1.2;
      case ZoneType.INDUSTRIAL: return 0.9;
      case ZoneType.MUNICIPAL: return 0.7;
      case ZoneType.UNZONED: return 1.0;
      default: return 1.0;
    }
  }

  private isValidCoordinate(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // Annual land value recalculation based on surrounding development
  recalculateLandValues(): void {
    const newLandValues: number[][] = [];
    
    for (let x = 0; x < this.width; x++) {
      newLandValues[x] = [];
      for (let y = 0; y < this.height; y++) {
        newLandValues[x][y] = this.calculateUpdatedLandValue(x, y);
      }
    }
    
    this.landValues = newLandValues;
    console.log('Land values recalculated');
  }

  private calculateUpdatedLandValue(x: number, y: number): number {
    const baseValue = this.calculateBaseLandValue(x, y);
    const zoneMultiplier = this.getZoneValueMultiplier(this.getZone(x, y));
    const proximityBonus = this.calculateProximityBonus(x, y);
    
    return Math.floor(baseValue * zoneMultiplier * proximityBonus);
  }

  private calculateProximityBonus(x: number, y: number): number {
    let bonus = 1.0;
    const radius = 3;
    
    // Check surrounding area for valuable zones
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (this.isValidCoordinate(checkX, checkY)) {
          const nearbyZone = this.getZone(checkX, checkY);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - (distance / radius));
          
          switch (nearbyZone) {
            case ZoneType.COMMERCIAL:
              bonus += influence * 0.1;
              break;
            case ZoneType.RESIDENTIAL:
              bonus += influence * 0.05;
              break;
            case ZoneType.MUNICIPAL:
              bonus += influence * 0.03;
              break;
            case ZoneType.INDUSTRIAL:
              bonus -= influence * 0.02; // Industrial slightly decreases nearby values
              break;
          }
        }
      }
    }
    
    return Math.max(0.5, Math.min(2.0, bonus)); // Clamp between 0.5x and 2.0x
  }

  getZoneStatistics(): Record<ZoneType, number> {
    const stats: Record<ZoneType, number> = {
      [ZoneType.RESIDENTIAL]: 0,
      [ZoneType.COMMERCIAL]: 0,
      [ZoneType.INDUSTRIAL]: 0,
      [ZoneType.MUNICIPAL]: 0,
      [ZoneType.UNZONED]: 0
    };

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const zone = this.getZone(x, y);
        stats[zone]++;
      }
    }

    return stats;
  }

  getTotalLandValue(): number {
    let total = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        total += this.getLandValue(x, y);
      }
    }
    return total;
  }

  clear(): void {
    this.initializeGrids();
  }
}