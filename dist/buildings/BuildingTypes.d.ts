import { Component } from '../core/Component.js';
export declare enum BuildingType {
    RESIDENTIAL = "residential",
    COMMERCIAL = "commercial",
    INDUSTRIAL = "industrial",
    MUNICIPAL = "municipal"
}
export declare enum ZoneType {
    RESIDENTIAL = "residential",
    COMMERCIAL = "commercial",
    INDUSTRIAL = "industrial",
    MUNICIPAL = "municipal",
    UNZONED = "unzoned"
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
export declare class BuildingInfoComponent extends Component implements BuildingInfo {
    buildingType: BuildingType;
    name: string;
    level: number;
    maxLevel: number;
    constructionCost: number;
    maintenanceCost: number;
    population?: number | undefined;
    jobs?: number | undefined;
    readonly type = "BuildingInfo";
    constructor(buildingType: BuildingType, name: string, level?: number, maxLevel?: number, constructionCost?: number, maintenanceCost?: number, population?: number | undefined, jobs?: number | undefined);
    canUpgrade(): boolean;
    getUpgradeCost(): number;
    upgrade(): boolean;
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
export declare const BUILDING_TEMPLATES: Record<string, BuildingTemplate>;
//# sourceMappingURL=BuildingTypes.d.ts.map