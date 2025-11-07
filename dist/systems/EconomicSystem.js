import { System } from '../core/System.js';
export class EconomicSystem extends System {
    constructor(initialBudget = 100000) {
        super();
        this.name = 'EconomicSystem';
        this.lastEconomicUpdate = 0;
        this.economicUpdateInterval = 6000; // Update every 6 seconds (1 year in sim time)
        this.economicState = {
            municipalBudget: initialBudget,
            annualRevenue: 0,
            annualExpenses: 0,
            taxRates: {
                residential: 0.015, // 1.5%
                commercial: 0.025, // 2.5%
                industrial: 0.020, // 2.0%
                property: 0.012 // 1.2%
            },
            economicGrowth: 0.02, // 2% growth
            unemployment: 0.05 // 5% unemployment
        };
    }
    update(deltaTime, entities) {
        this.lastEconomicUpdate += deltaTime * 1000;
        if (this.lastEconomicUpdate >= this.economicUpdateInterval) {
            this.processAnnualBudget(entities);
            this.lastEconomicUpdate = 0;
        }
    }
    processAnnualBudget(entities) {
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
    calculateAnnualBudget(entities) {
        const revenueBySource = new Map();
        const expensesByCategory = new Map();
        // Calculate tax revenue
        let totalRevenue = 0;
        const taxGenerators = entities.filter(entity => entity.hasComponent('TaxGenerator'));
        for (const entity of taxGenerators) {
            const taxGen = entity.getComponent('TaxGenerator');
            const buildingInfo = entity.getComponent('BuildingInfo');
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
    calculateBuildingTaxRevenue(taxGen, buildingInfo) {
        const baseRevenue = taxGen.annualRevenue;
        const taxRate = this.getTaxRateForBuilding(buildingInfo.buildingType);
        const propertyTax = taxGen.landValue * this.economicState.taxRates.property;
        // Apply economic growth factor
        const growthMultiplier = 1 + this.economicState.economicGrowth;
        return Math.floor((baseRevenue * taxRate + propertyTax) * growthMultiplier);
    }
    getTaxRateForBuilding(buildingType) {
        switch (buildingType) {
            case 'residential': return this.economicState.taxRates.residential;
            case 'commercial': return this.economicState.taxRates.commercial;
            case 'industrial': return this.economicState.taxRates.industrial;
            default: return 0;
        }
    }
    calculateInfrastructureCosts(entities) {
        let cost = 0;
        // Road maintenance (simplified - based on entity count)
        const roadMaintenanceCost = entities.length * 50; // $50 per entity for road maintenance
        cost += roadMaintenanceCost;
        // Power infrastructure maintenance
        const powerPlants = entities.filter(entity => {
            const buildingInfo = entity.getComponent('BuildingInfo');
            return buildingInfo?.name.toLowerCase().includes('power');
        });
        cost += powerPlants.length * 2000; // $2k per power plant
        // Transit maintenance
        cost += 1000; // Base transit maintenance
        return cost;
    }
    calculateServicesCosts(entities) {
        let cost = 0;
        // Police services
        const policeStations = entities.filter(entity => {
            const buildingInfo = entity.getComponent('BuildingInfo');
            return buildingInfo?.name.toLowerCase().includes('police');
        });
        cost += policeStations.length * 3000; // $3k per police station
        // Fire services (simplified)
        cost += Math.max(2000, entities.length * 20); // Base fire service cost
        // Utilities
        cost += entities.length * 30; // $30 per building for utilities
        return cost;
    }
    updateEconomicIndicators(entities, budgetReport) {
        // Update economic growth based on budget performance
        if (budgetReport.netIncome > 0) {
            this.economicState.economicGrowth = Math.min(0.05, this.economicState.economicGrowth + 0.002);
        }
        else {
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
    calculateTotalJobs(entities) {
        let totalJobs = 0;
        for (const entity of entities) {
            const buildingInfo = entity.getComponent('BuildingInfo');
            if (buildingInfo?.jobs) {
                totalJobs += buildingInfo.jobs;
            }
        }
        return totalJobs;
    }
    calculateTotalPopulation(entities) {
        let totalPopulation = 0;
        for (const entity of entities) {
            const buildingInfo = entity.getComponent('BuildingInfo');
            if (buildingInfo?.population) {
                totalPopulation += buildingInfo.population;
            }
        }
        return totalPopulation;
    }
    canAfford(cost) {
        return this.economicState.municipalBudget >= cost;
    }
    spendMoney(amount, category) {
        if (this.canAfford(amount)) {
            this.economicState.municipalBudget -= amount;
            console.log(`Spent $${amount.toLocaleString()} on ${category}`);
            return true;
        }
        return false;
    }
    addRevenue(amount, source) {
        this.economicState.municipalBudget += amount;
        console.log(`Added $${amount.toLocaleString()} revenue from ${source}`);
    }
    setTaxRate(buildingType, rate) {
        this.economicState.taxRates[buildingType] = Math.max(0, Math.min(0.1, rate)); // Cap between 0-10%
    }
    getEconomicState() {
        return { ...this.economicState };
    }
    getEconomicStatistics(entities) {
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
    getBudgetHealth() {
        const budget = this.economicState.municipalBudget;
        if (budget > 500000)
            return 'excellent';
        if (budget > 200000)
            return 'good';
        if (budget > 50000)
            return 'fair';
        if (budget > 0)
            return 'poor';
        return 'critical';
    }
}
//# sourceMappingURL=EconomicSystem.js.map