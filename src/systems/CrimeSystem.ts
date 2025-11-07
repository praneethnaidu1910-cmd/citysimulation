import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { BuildingInfoComponent } from '../buildings/BuildingTypes.js';
import { SpatialGridImpl } from '../core/SpatialGrid.js';
import { GridPosition } from '../core/GridPosition.js';

export interface CrimeData {
  position: GridPosition;
  crimeScore: number;
  crimeTypes: CrimeType[];
  policePresence: number;
}

export enum CrimeType {
  PETTY_THEFT = 'petty_theft',
  BURGLARY = 'burglary',
  ASSAULT = 'assault',
  VANDALISM = 'vandalism',
  DRUG_RELATED = 'drug_related'
}

export class CrimeSystem extends System {
  public readonly name = 'CrimeSystem';
  private spatialGrid: SpatialGridImpl;
  private crimeMap: Map<string, CrimeData> = new Map();
  private policeStations: Entity[] = [];
  private lastCrimeUpdate: number = 0;
  private crimeUpdateInterval: number = 5000;

  constructor(spatialGrid: SpatialGridImpl) {
    super();
    this.spatialGrid = spatialGrid;
  }

  update(deltaTime: number, entities: Entity[]): void {
    this.lastCrimeUpdate += deltaTime * 1000;
    
    if (this.lastCrimeUpdate >= this.crimeUpdateInterval) {
      this.updateCrimeScores(entities);
      this.lastCrimeUpdate = 0;
    }
  }

  handleEntityAdded(entity: Entity): void {
    const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
    if (buildingInfo?.name.toLowerCase().includes('police')) {
      this.policeStations.push(entity);
    }
  }

  handleEntityRemoved(entity: Entity): void {
    this.policeStations = this.policeStations.filter(station => station.id !== entity.id);
  }

  private updateCrimeScores(entities: Entity[]): void {
    this.crimeMap.clear();

    const gridSize = 5;
    
    for (let x = 0; x < 100; x += gridSize) {
      for (let y = 0; y < 100; y += gridSize) {
        const position = { x, y, width: gridSize, height: gridSize };
        const crimeScore = this.calculateCrimeScore(position, entities);
        
        if (crimeScore > 0.1) {
          const key = `${x},${y}`;
          this.crimeMap.set(key, {
            position,
            crimeScore,
            crimeTypes: this.determineCrimeTypes(crimeScore, position, entities),
            policePresence: this.calculatePolicePresence(position)
          });
        }
      }
    }
  }

  private calculateCrimeScore(area: GridPosition, entities: Entity[]): number {
    const nearbyBuildings = this.spatialGrid.getEntitiesInArea(area);
    let baseCrimeScore = 0.1;
    
    for (const building of nearbyBuildings) {
      const buildingInfo = building.getComponent<BuildingInfoComponent>('BuildingInfo');
      if (buildingInfo) {
        baseCrimeScore += this.getBuildingCrimeFactor(buildingInfo);
      }
    }

    const policePresence = this.calculatePolicePresence(area);
    const crimeReduction = Math.min(0.8, policePresence * 0.6);
    
    const densityFactor = Math.min(2.0, 1.0 + (nearbyBuildings.length * 0.1));
    
    const finalScore = Math.max(0, baseCrimeScore * densityFactor * (1 - crimeReduction));
    return Math.min(1.0, finalScore);
  }

  private getBuildingCrimeFactor(buildingInfo: BuildingInfoComponent): number {
    switch (buildingInfo.buildingType) {
      case 'residential':
        return 0.05 + (buildingInfo.level * 0.02);
      case 'commercial':
        return 0.08 + (buildingInfo.level * 0.03);
      case 'industrial':
        return 0.06 + (buildingInfo.level * 0.02);
      case 'municipal':
        return buildingInfo.name.toLowerCase().includes('police') ? -0.15 : -0.05;
      default:
        return 0.02;
    }
  }

  private calculatePolicePresence(area: GridPosition): number {
    let totalPresence = 0;
    const maxEffectiveDistance = 15;

    for (const policeStation of this.policeStations) {
      const distance = this.calculateDistance(area, policeStation.position);
      if (distance <= maxEffectiveDistance) {
        const buildingInfo = policeStation.getComponent<BuildingInfoComponent>('BuildingInfo');
        const stationEffectiveness = buildingInfo ? buildingInfo.level * 0.3 : 0.3;
        const distanceEffect = 1 - (distance / maxEffectiveDistance);
        totalPresence += stationEffectiveness * distanceEffect;
      }
    }

    return Math.min(1.0, totalPresence);
  }

  private determineCrimeTypes(crimeScore: number, area: GridPosition, entities: Entity[]): CrimeType[] {
    const types: CrimeType[] = [];
    const nearbyBuildings = this.spatialGrid.getEntitiesInArea(area);
    
    const hasCommercial = nearbyBuildings.some(b => {
      const info = b.getComponent<BuildingInfoComponent>('BuildingInfo');
      return info?.buildingType === 'commercial';
    });
    
    const hasResidential = nearbyBuildings.some(b => {
      const info = b.getComponent<BuildingInfoComponent>('BuildingInfo');
      return info?.buildingType === 'residential';
    });
    
    const hasIndustrial = nearbyBuildings.some(b => {
      const info = b.getComponent<BuildingInfoComponent>('BuildingInfo');
      return info?.buildingType === 'industrial';
    });

    if (crimeScore > 0.2) {
      if (hasCommercial) types.push(CrimeType.PETTY_THEFT);
      if (hasResidential) types.push(CrimeType.BURGLARY);
      if (crimeScore > 0.5) types.push(CrimeType.VANDALISM);
      if (crimeScore > 0.7) types.push(CrimeType.ASSAULT);
      if (hasIndustrial && crimeScore > 0.4) types.push(CrimeType.DRUG_RELATED);
    }

    return types;
  }

  private calculateDistance(pos1: GridPosition, pos2: GridPosition): number {
    const dx = (pos1.x + pos1.width/2) - (pos2.x + pos2.width/2);
    const dy = (pos1.y + pos1.height/2) - (pos2.y + pos2.height/2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  getCrimeScore(position: GridPosition): number {
    const gridSize = 5;
    const gridX = Math.floor(position.x / gridSize) * gridSize;
    const gridY = Math.floor(position.y / gridSize) * gridSize;
    const key = `${gridX},${gridY}`;
    
    return this.crimeMap.get(key)?.crimeScore || 0.1;
  }

  getCrimeMap(): Map<string, CrimeData> {
    return new Map(this.crimeMap);
  }

  getCrimeStatistics() {
    let totalCrime = 0;
    let highCrimeAreas = 0;
    const crimeTypeCount = new Map<CrimeType, number>();

    for (const crimeData of this.crimeMap.values()) {
      totalCrime += crimeData.crimeScore;
      if (crimeData.crimeScore > 0.6) highCrimeAreas++;
      
      for (const crimeType of crimeData.crimeTypes) {
        crimeTypeCount.set(crimeType, (crimeTypeCount.get(crimeType) || 0) + 1);
      }
    }

    const averageCrime = this.crimeMap.size > 0 ? totalCrime / this.crimeMap.size : 0;
    
    return {
      averageCrimeScore: averageCrime,
      highCrimeAreas,
      totalPoliceStations: this.policeStations.length,
      crimeTypeDistribution: Object.fromEntries(crimeTypeCount),
      safetyLevel: averageCrime < 0.3 ? 'safe' : averageCrime < 0.6 ? 'moderate' : 'dangerous'
    };
  }

  getPoliceStations(): Entity[] {
    return [...this.policeStations];
  }

  // INTENTIONAL ISSUE: Poor function name, magic numbers, and no documentation
  chkPS(a: GridPosition): boolean {
    const cs = this.getCrimeScore(a);
    const pp = this.calculatePolicePresence(a);
    
    return cs > 0.5 && pp < 0.3;
  }
  
  // INTENTIONAL ISSUE: Single letter variables, unclear logic
  public x(e: Entity[]): number {
    let t = 0;
    for(let i=0;i<e.length;i++){
      const b=e[i].getComponent<BuildingInfoComponent>('BuildingInfo');
      if(b&&b.name.toLowerCase().includes('police')){t++;}
    }
    return t;
  }
}