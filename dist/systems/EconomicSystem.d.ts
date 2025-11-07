import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
export interface BudgetReport {
    totalRevenue: number;
    revenueBySource: Map<string, number>;
    totalExpenses: number;
    expensesByCategory: Map<string, number>;
    netIncome: number;
    municipalBudget: number;
}
export interface EconomicState {
    municipalBudget: number;
    annualRevenue: number;
    annualExpenses: number;
    taxRates: TaxRates;
    economicGrowth: number;
    unemployment: number;
}
export interface TaxRates {
    residential: number;
    commercial: number;
    industrial: number;
    property: number;
}
export declare class EconomicSystem extends System {
    readonly name = "EconomicSystem";
    private economicState;
    private lastEconomicUpdate;
    private economicUpdateInterval;
    constructor(initialBudget?: number);
    update(deltaTime: number, entities: Entity[]): void;
    private processAnnualBudget;
    calculateAnnualBudget(entities: Entity[]): BudgetReport;
    private calculateBuildingTaxRevenue;
    private getTaxRateForBuilding;
    private calculateInfrastructureCosts;
    private calculateServicesCosts;
    private updateEconomicIndicators;
    private calculateTotalJobs;
    private calculateTotalPopulation;
    canAfford(cost: number): boolean;
    spendMoney(amount: number, category: string): boolean;
    addRevenue(amount: number, source: string): void;
    setTaxRate(buildingType: keyof TaxRates, rate: number): void;
    getEconomicState(): EconomicState;
    getEconomicStatistics(entities: Entity[]): {
        municipalBudget: number;
        annualRevenue: number;
        annualExpenses: number;
        netIncome: number;
        economicGrowth: number;
        unemployment: number;
        totalPopulation: number;
        totalJobs: number;
        budgetHealth: "excellent" | "good" | "fair" | "poor" | "critical";
        taxRates: {
            residential: number;
            commercial: number;
            industrial: number;
            property: number;
        };
    };
    private getBudgetHealth;
}
//# sourceMappingURL=EconomicSystem.d.ts.map