export interface IProvider {
  load(params: {
    ticker: string;
    tf: string;
    limit: number;
    sDate: number;
    eDate: number;
  }): Promise<any[]>;

  getMarketData(
    tickerId: string,
    timeframe: string,
    limit?: number,
    sDate?: number,
    eDate?: number
  ): Promise<any>;
}