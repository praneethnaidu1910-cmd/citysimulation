export declare abstract class Component {
    abstract readonly type: string;
}
export interface PowerConsumer extends Component {
    powerRequired: number;
    isPowered: boolean;
    priority: number;
}
export declare class PowerConsumerComponent extends Component implements PowerConsumer {
    powerRequired: number;
    isPowered: boolean;
    priority: number;
    readonly type = "PowerConsumer";
    constructor(powerRequired: number, isPowered?: boolean, priority?: number);
}
export interface TrafficGenerator extends Component {
    dailyTrips: number;
    peakHourMultiplier: number;
    destinations: string[];
}
export declare class TrafficGeneratorComponent extends Component implements TrafficGenerator {
    dailyTrips: number;
    peakHourMultiplier: number;
    destinations: string[];
    readonly type = "TrafficGenerator";
    constructor(dailyTrips: number, peakHourMultiplier?: number, destinations?: string[]);
}
export interface TaxGenerator extends Component {
    annualRevenue: number;
    taxRate: number;
    landValue: number;
}
export declare class TaxGeneratorComponent extends Component implements TaxGenerator {
    annualRevenue: number;
    taxRate: number;
    landValue: number;
    readonly type = "TaxGenerator";
    constructor(annualRevenue: number, taxRate: number, landValue: number);
}
//# sourceMappingURL=Component.d.ts.map