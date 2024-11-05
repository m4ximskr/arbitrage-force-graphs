export interface ArbitrageEvent {
  direction: string;
  from: string;
  to: string;
  symbol: string;
  amountIn: number;
  profit: number;
  ts: number;
}

export enum ArbitrageEventSource {
  DEX = 'DEX',
  CEX = 'CEX',
}