import { Component } from '../core/Component.js';

export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  MUNICIPAL = 'municipal'
}

export enum ZoneType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  MUNICIPAL = 'municipal',
  UNZONED = 'unzoned'
}

export interface BuildingInfo extends Component {
  buildingType: BuildingType;
  name: string;
  level: number;
  maxLevel: number;
  constructionCost: number;
  maintenanceCost: number;
  population?: number;
  jobs?: number;
}

export class BuildingInfoComponent extends Component implements BuildingInfo {
  public readonly type = 'BuildingInfo';
  
  constructor(
    public buildingType: BuildingType,
    public name: string,
    public level: number = 1,
    public maxLevel: number = 3,
    public constructionCost: number = 1000,
    public maintenanceCost: number = 100,
    public population?: number,
    public jobs?: number
  ) {
    super();
  }

  canUpgrade(): boolean {
    return this.level < this.maxLevel;
  }

  getUpgradeCost(): number {
    return this.constructionCost * this.level * 0.5;
  }

  upgrade(): boolean {
    if (this.canUpgrade()) {
      this.level++;
      this.constructionCost *= 1.5;
      this.maintenanceCost *= 1.3;
      if (this.population) this.population = Math.floor(this.population * 1.4);
      if (this.jobs) this.jobs = Math.floor(this.jobs * 1.4);
      return true;
    }
    return false;
  }
}

export interface BuildingTemplate {
  type: BuildingType;
  name: string;
  width: number;
  height: number;
  constructionCost: number;
  maintenanceCost: number;
  powerRequired: number;
  dailyTrips: number;
  taxRevenue: number;
  population?: number;
  jobs?: number;
  allowedZones: ZoneType[];
}

export const BUILDING_TEMPLATES: Record<string, BuildingTemplate> = {
  // Residential Buildings
  house: {
    type: BuildingType.RESIDENTIAL,
    name: 'House',
    width: 1,
    height: 1,
    constructionCost: 5000,
    maintenanceCost: 50,
    powerRequired: 20,
    dailyTrips: 8,
    taxRevenue: 1200,
    population: 4,
    allowedZones: [ZoneType.RESIDENTIAL]
  },
  
  apartment: {
    type: BuildingType.RESIDENTIAL,
    name: 'Apartment Building',
    width: 2,
    height: 2,
    constructionCost: 25000,
    maintenanceCost: 200,
    powerRequired: 80,
    dailyTrips: 40,
    taxRevenue: 6000,
    population: 20,
    allowedZones: [ZoneType.RESIDENTIAL]
  },

  // Commercial Buildings
  shop: {
    type: BuildingType.COMMERCIAL,
    name: 'Shop',
    width: 1,
    height: 1,
    constructionCost: 8000,
    maintenanceCost: 80,
    powerRequired: 30,
    dailyTrips: 25,
    taxRevenue: 2400,
    jobs: 3,
    allowedZones: [ZoneType.COMMERCIAL]
  },

  mall: {
    type: BuildingType.COMMERCIAL,
    name: 'Shopping Mall',
    width: 3,
    height: 3,
    constructionCost: 100000,
    maintenanceCost: 800,
    powerRequired: 300,
    dailyTrips: 200,
    taxRevenue: 15000,
    jobs: 50,
    allowedZones: [ZoneType.COMMERCIAL]
  },

  // Industrial Buildings
  factory: {
    type: BuildingType.INDUSTRIAL,
    name: 'Factory',
    width: 2,
    height: 2,
    constructionCost: 50000,
    maintenanceCost: 400,
    powerRequired: 150,
    dailyTrips: 60,
    taxRevenue: 8000,
    jobs: 25,
    allowedZones: [ZoneType.INDUSTRIAL]
  },

  warehouse: {
    type: BuildingType.INDUSTRIAL,
    name: 'Warehouse',
    width: 3,
    height: 2,
    constructionCost: 30000,
    maintenanceCost: 200,
    powerRequired: 50,
    dailyTrips: 30,
    taxRevenue: 4000,
    jobs: 10,
    allowedZones: [ZoneType.INDUSTRIAL]
  },

  // Municipal Buildings
  police: {
    type: BuildingType.MUNICIPAL,
    name: 'Police Station',
    width: 2,
    height: 2,
    constructionCost: 40000,
    maintenanceCost: 500,
    powerRequired: 100,
    dailyTrips: 20,
    taxRevenue: -2000, // Negative because it's an expense
    jobs: 15,
    allowedZones: [ZoneType.MUNICIPAL, ZoneType.RESIDENTIAL, ZoneType.COMMERCIAL]
  },

  powerPlant: {
    type: BuildingType.MUNICIPAL,
    name: 'Power Plant',
    width: 3,
    height: 3,
    constructionCost: 200000,
    maintenanceCost: 2000,
    powerRequired: -1000, // Negative because it generates power
    dailyTrips: 40,
    taxRevenue: -5000, // Operating expense
    jobs: 30,
    allowedZones: [ZoneType.INDUSTRIAL, ZoneType.MUNICIPAL]
  }
};