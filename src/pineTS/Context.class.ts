// src/pineTS/Context.ts

import { Core } from './namespaces/Core.ts';
import { Input } from './namespaces/Input.ts';
import PineMath from './namespaces/PineMath.ts';
import { PineRequest } from './namespaces/PineRequest.ts';
import TechnicalAnalysis from './namespaces/TechnicalAnalysis.ts';
import { PineArray } from './namespaces/PineArray.ts';
import { IProvider } from './marketdata/IProvider.ts';

export class Context {
  public data: any = {
    open: [],
    high: [],
    low: [],
    close: [],
    volume: [],
    hl2: [],
    hlc3: [],
    ohlc4: [],
  };

  public cache: any = {};
  public useTACache = false;
  public NA: any = NaN;

  public math: PineMath;
  public ta: TechnicalAnalysis;
  public input: Input;
  public request: PineRequest;
  public array: PineArray;
  public core: any;
  public lang: any;

  public idx = 0;
  public params: any = {};
  public const: any = {};
  public var: any = {};
  public let: any = {};
  public result: any = undefined;
  public plots: any = {};

  public marketData: any;
  public source: IProvider | any[];
  public tickerId = '';
  public timeframe = '';
  public limit = 0;
  public sDate = 0;
  public eDate = 0;

  public pineTSCode: Function | string = '';

  constructor({
    marketData,
    source,
    tickerId = '',
    timeframe = '',
    limit = 0,
    sDate = 0,
    eDate = 0,
  }: {
    marketData: any;
    source: IProvider | any[];
    tickerId?: string;
    timeframe?: string;
    limit?: number;
    sDate?: number;
    eDate?: number;
  }) {
    this.marketData = marketData;
    this.source = source;
    this.tickerId = tickerId;
    this.timeframe = timeframe;
    this.limit = limit;
    this.sDate = sDate;
    this.eDate = eDate;

    this.math = new PineMath(this);
    this.ta = new TechnicalAnalysis(this);
    this.input = new Input(this);
    this.request = new PineRequest(this);
    this.array = new PineArray(this);

    const core = new Core(this);
    this.core = {
      plotchar: core.plotchar.bind(core),
      na: core.na.bind(core),
      color: core.color,
      plot: core.plot.bind(core),
      nz: core.nz.bind(core),
    };
  }

  init(trg: any, src: any, idx: number = 0) {
    if (!trg) {
      if (Array.isArray(src)) {
        trg = [this.precision(src[src.length - this.idx - 1 + idx])];
      } else {
        trg = [this.precision(src)];
      }
    } else {
      if (!Array.isArray(src) || Array.isArray(src[0])) {
        trg[0] = Array.isArray(src?.[0]) ? src[0] : this.precision(src);
      } else {
        trg[0] = this.precision(src[src.length - this.idx - 1 + idx]);
      }
    }

    return trg;
  }

  precision(n: number, decimals: number = 10) {
    if (typeof n !== 'number' || isNaN(n)) return n;
    return Number(n.toFixed(decimals));
  }

  param(source: any, index: number, name?: string) {
    if (typeof source === 'string') return source;
    if (!Array.isArray(source) && typeof source === 'object') return source;
    if (!name) throw new Error("Parameter 'name' is required in Context.param()");

    if (!this.params[name]) this.params[name] = [];

    if (Array.isArray(source)) {
      if (index) {
        this.params[name] = source.slice(index);
        this.params[name].length = source.length;
        return this.params[name];
      }
      this.params[name] = source.slice(0);
      return this.params[name];
    } else {
      this.params[name][0] = source;
      return this.params[name];
    }
  }
}
