import { System } from '../core/System.js';
import { Entity } from '../core/Entity.js';
import { TaxGeneratorComponent } from '../core/Component.js';
import { BuildingInfoComponent } from '../buildings/BuildingTypes.js';

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

export class EconomicSystem extends System {
  public readonly name = 'EconomicSystem';
  private economicState: EconomicState;
  private lastEconomicUpdate: number = 0;
  private economicUpdateInterval: number = 6000; // Update every 6 seconds (1 year in sim time)

  constructor(initialBudget: number = 100000) {
    super();
    this.economicState = {
      municipalBudget: initialBudget,
      annualRevenue: 0,
      annualExpenses: 0,
      taxRates: {
        residential: 0.015, // 1.5%
        commercial: 0.025,  // 2.5%
        industrial: 0.020,  // 2.0%
        property: 0.012     // 1.2%
      },
      economicGrowth: 0.02, // 2% growth
      unemployment: 0.05    // 5% unemployment
    };
  }

  update(deltaTime: number, entities: Entity[]): void {
    this.lastEconomicUpdate += deltaTime * 1000;
    
    if (this.lastEconomicUpdate >= this.economicUpdateInterval) {
      this.processAnnualBudget(entities);
      this.lastEconomicUpdate = 0;
    }
  }

  private processAnnualBudget(entities: Entity[]): void {
    const budgetReport = this.calculateAnnualBudget(entities);
    
    // Update municipal budget
    this.economicState.municipalBudget += budgetReport.netIncome;
    this.economicState.annualRevenue = budgetReport.totalRevenue;
    this.economicState.annualExpenses = budgetReport.totalExpenses;
    
    // Update economic indicators
    this.updateEconomicIndicators(entities, budgetReport);
    
    console.log(`Annual Budget: Revenue $${budgetReport.totalRevenue.toLocaleString()}, ` +
                `Expenses $${budgetReport.totalExpenses.toLocaleString()}, ` +
                `Net: $${budgetReport.netIncome.toLocaleString()}, ` +
                `Budget: $${this.economicState.municipalBudget.toLocaleString()}`);
  }

  calculateAnnualBudget(entities: Entity[]): BudgetReport {
    const revenueBySource = new Map<string, number>();
    const expensesByCategory = new Map<string, number>();
    
    // Calculate tax revenue
    let totalRevenue = 0;
    
    const taxGenerators = entities.filter(entity => entity.hasComponent('TaxGenerator'));
    for (const entity of taxGenerators) {
      const taxGen = entity.getComponent<TaxGeneratorComponent>('TaxGenerator');
      const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
      
      if (taxGen && buildingInfo) {
        const revenue = this.calculateBuildingTaxRevenue(taxGen, buildingInfo);
        totalRevenue += revenue;
        
        const sourceKey = `${buildingInfo.buildingType}_tax`;
        revenueBySource.set(sourceKey, (revenueBySource.get(sourceKey) || 0) + revenue);
      }
    }
    
    // Calculate expenses
    let totalExpenses = 0;
    
    // Infrastructure maintenance
    const infrastructureCost = this.calculateInfrastructureCosts(entities);
    totalExpenses += infrastructureCost;
    expensesByCategory.set('infrastructure', infrastructureCost);
    
    // Municipal services
    const servicesCost = this.calculateServicesCosts(entities);
    totalExpenses += servicesCost;
    expensesByCategory.set('services', servicesCost);
    
    // Administrative costs
    const adminCost = Math.max(5000, totalRevenue * 0.1); // 10% of revenue or minimum $5k
    totalExpenses += adminCost;
    expensesByCategory.set('administration', adminCost);
    
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      revenueBySource,
      totalExpenses,
      expensesByCategory,
      netIncome,
      municipalBudget: this.economicState.municipalBudget + netIncome
    };
  }

  private calculateBuildingTaxRevenue(taxGen: TaxGeneratorComponent, buildingInfo: BuildingInfoComponent): number {
    const baseRevenue = taxGen.annualRevenue;
    const taxRate = this.getTaxRateForBuilding(buildingInfo.buildingType);
    const propertyTax = taxGen.landValue * this.economicState.taxRates.property;
    
    // Apply economic growth factor
    const growthMultiplier = 1 + this.economicState.economicGrowth;
    
    return Math.floor((baseRevenue * taxRate + propertyTax) * growthMultiplier);
  }

  private getTaxRateForBuilding(buildingType: string): number {
    switch (buildingType) {
      case 'residential': return this.economicState.taxRates.residential;
      case 'commercial': return this.economicState.taxRates.commercial;
      case 'industrial': return this.economicState.taxRates.industrial;
      default: return 0;
    }
  }

  private calculateInfrastructureCosts(entities: Entity[]): number {
    let cost = 0;
    
    // Road maintenance (simplified - based on entity count)
    const roadMaintenanceCost = entities.length * 50; // $50 per entity for road maintenance
    cost += roadMaintenanceCost;
    
    // Power infrastructure maintenance
    const powerPlants = entities.filter(entity => {
      const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
      return buildingInfo?.name.toLowerCase().includes('power');
    });
    cost += powerPlants.length * 2000; // $2k per power plant
    
    // Transit maintenance
    cost += 1000; // Base transit maintenance
    
    return cost;
  }

  private calculateServicesCosts(entities: Entity[]): number {
    let cost = 0;
    
    // Police services
    const policeStations = entities.filter(entity => {
      const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
      return buildingInfo?.name.toLowerCase().includes('police');
    });
    cost += policeStations.length * 3000; // $3k per police station
    
    // Fire services (simplified)
    cost += Math.max(2000, entities.length * 20); // Base fire service cost
    
    // Utilities
    cost += entities.length * 30; // $30 per building for utilities
    
    return cost;
  }

  private updateEconomicIndicators(entities: Entity[], budgetReport: BudgetReport): void {
    // Update economic growth based on budget performance
    if (budgetReport.netIncome > 0) {
      this.economicState.economicGrowth = Math.min(0.05, this.economicState.economicGrowth + 0.002);
    } else {
      this.economicState.economicGrowth = Math.max(-0.02, this.economicState.economicGrowth - 0.005);
    }
    
    // Update unemployment based on job availability
    const totalJobs = this.calculateTotalJobs(entities);
    const totalPopulation = this.calculateTotalPopulation(entities);
    const laborForce = totalPopulation * 0.6; // 60% of population in labor force
    
    if (laborForce > 0) {
      this.economicState.unemployment = Math.max(0.02, Math.min(0.15, 1 - (totalJobs / laborForce)));
    }
  }

  private calculateTotalJobs(entities: Entity[]): number {
    let totalJobs = 0;
    
    for (const entity of entities) {
      const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
      if (buildingInfo?.jobs) {
        totalJobs += buildingInfo.jobs;
      }
    }
    
    return totalJobs;
  }

  private calculateTotalPopulation(entities: Entity[]): number {
    let totalPopulation = 0;
    
    for (const entity of entities) {
      const buildingInfo = entity.getComponent<BuildingInfoComponent>('BuildingInfo');
      if (buildingInfo?.population) {
        totalPopulation += buildingInfo.population;
      }
    }
    
    return totalPopulation;
  }

  canAfford(cost: number): boolean {
    return this.economicState.municipalBudget >= cost;
  }

  spendMoney(amount: number, category: string): boolean {
    if (this.canAfford(amount)) {
      this.economicState.municipalBudget -= amount;
      console.log(`Spent $${amount.toLocaleString()} on ${category}`);
      return true;
    }
    return false;
  }

  addRevenue(amount: number, source: string): void {
    this.economicState.municipalBudget += amount;
    console.log(`Added $${amount.toLocaleString()} revenue from ${source}`);
  }

  setTaxRate(buildingType: keyof TaxRates, rate: number): void {
    this.economicState.taxRates[buildingType] = Math.max(0, Math.min(0.1, rate)); // Cap between 0-10%
  }

  getEconomicState(): EconomicState {
    return { ...this.economicState };
  }

  getEconomicStatistics(entities: Entity[]) {
    const totalPopulation = this.calculateTotalPopulation(entities);
    const totalJobs = this.calculateTotalJobs(entities);
    const budgetReport = this.calculateAnnualBudget(entities);
    
    return {
      municipalBudget: this.economicState.municipalBudget,
      annualRevenue: budgetReport.totalRevenue,
      annualExpenses: budgetReport.totalExpenses,
      netIncome: budgetReport.netIncome,
      economicGrowth: this.economicState.economicGrowth,
      unemployment: this.economicState.unemployment,
      totalPopulation,
      totalJobs,
      budgetHealth: this.getBudgetHealth(),
      taxRates: { ...this.economicState.taxRates }
    };
  }

  private getBudgetHealth(): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const budget = this.economicState.municipalBudget;
    
    if (budget > 500000) return 'excellent';
    if (budget > 200000) return 'good';
    if (budget > 50000) return 'fair';
    if (budget > 0) return 'poor';
    return 'critical';
  }
}