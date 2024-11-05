import {LinkObject, NodeObject} from "force-graph";

export enum NodeGroup {
  ARBITRAGE = 'arbitrage',
  EXCHANGE = 'exchange',
  CHAIN = 'chain',
  SYMBOL = 'symbol',
}

export interface GraphNodeObject<D = any> extends NodeObject {
  group: NodeGroup;
  color: string;
  label: string;
  size: number;
  data?: D;
  createdAt?: number;
}

export interface GraphLinkObject<D = any> extends LinkObject {
  id: string;
  source: GraphNodeObject<D>;
  target: GraphNodeObject<D>;
  color: string;
}

export enum ArbitrageGraphLocationType {
  EXCHANGE = 'exchange',
  CHAIN = 'chain',
}

export interface ArbitrageGraphLocation {
  name: string;
  type: ArbitrageGraphLocationType
}

export interface ArbitrageGraphData {
  direction: string;
  from: ArbitrageGraphLocation
  to: ArbitrageGraphLocation
  symbol: string,
  amountIn: number;
  profit: number;
  createdAt?: number;
  lifetime?: number;
}

export interface ParentData {
  arbIds: Set<string | number>;
}

export interface ArbitrageGraphFilters {
  exchanges: string[];
  chains: string[];
  symbols: string[];
  profitFrom: number;
  profitTo: number;
  amountFrom: number;
  amountTo: number;
}

export type NodePositionsByGroup = {
  [key in NodeGroup]: {x: number, y: number};
}
