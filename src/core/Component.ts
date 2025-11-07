export abstract class Component {
  public abstract readonly type: string;
}

export interface PowerConsumer extends Component {
  powerRequired: number;
  isPowered: boolean;
  priority: number;
}

export class PowerConsumerComponent extends Component implements PowerConsumer {
  public readonly type = 'PowerConsumer';
  
  constructor(
    public powerRequired: number,
    public isPowered: boolean = false,
    public priority: number = 1
  ) {
    super();
  }
}

export interface TrafficGenerator extends Component {
  dailyTrips: number;
  peakHourMultiplier: number;
  destinations: string[];
}

export class TrafficGeneratorComponent extends Component implements TrafficGenerator {
  public readonly type = 'TrafficGenerator';
  
  constructor(
    public dailyTrips: number,
    public peakHourMultiplier: number = 1.5,
    public destinations: string[] = []
  ) {
    super();
  }
}

export interface TaxGenerator extends Component {
  annualRevenue: number;
  taxRate: number;
  landValue: number;
}

export class TaxGeneratorComponent extends Component implements TaxGenerator {
  public readonly type = 'TaxGenerator';
  
  constructor(
    public annualRevenue: number,
    public taxRate: number,
    public landValue: number
  ) {
    super();
  }
}