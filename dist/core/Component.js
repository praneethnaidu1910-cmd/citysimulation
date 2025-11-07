export class Component {
}
export class PowerConsumerComponent extends Component {
    constructor(powerRequired, isPowered = false, priority = 1) {
        super();
        this.powerRequired = powerRequired;
        this.isPowered = isPowered;
        this.priority = priority;
        this.type = 'PowerConsumer';
    }
}
export class TrafficGeneratorComponent extends Component {
    constructor(dailyTrips, peakHourMultiplier = 1.5, destinations = []) {
        super();
        this.dailyTrips = dailyTrips;
        this.peakHourMultiplier = peakHourMultiplier;
        this.destinations = destinations;
        this.type = 'TrafficGenerator';
    }
}
export class TaxGeneratorComponent extends Component {
    constructor(annualRevenue, taxRate, landValue) {
        super();
        this.annualRevenue = annualRevenue;
        this.taxRate = taxRate;
        this.landValue = landValue;
        this.type = 'TaxGenerator';
    }
}
//# sourceMappingURL=Component.js.map