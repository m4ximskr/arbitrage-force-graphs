import {Injectable} from '@angular/core';
import {
  ArbitrageGraphData,
  ArbitrageGraphLocationType,
  GraphLinkObject,
  GraphNodeObject,
  NodeGroup,
  ParentData
} from "./arbitrage-graph.model";

@Injectable({
  providedIn: 'root'
})
export class ArbitrageGraphService {
  private _nodesMap = new Map<(string | number), GraphNodeObject>()
  get nodesMap() {
    return this._nodesMap;
  }
  private _nodesConnectionsMap = new Map<(string | number), Set<(string | number)>>()
  get nodesConnectionsMap() {
    return this._nodesConnectionsMap;
  }
  private _linksMap = new Map<(string | number), GraphLinkObject[]>()
  get linksMap() {
    return this._linksMap;
  }
  private _symbolNodesSet = new Set<string | number>()
  get symbolNodesSet() {
    return this._symbolNodesSet;
  }

  private _arbNodesSet = new Set<string | number>()
  get arbNodesSet() {
    return this._arbNodesSet;
  }

  private _flickerInterval = 1000;
  get flickerInterval() {
    return this._flickerInterval;
  }
  private _nodesFlickerStartTimes = new Map<string | number, number>();
  get nodesFlickerStartTimes() {
    return this._nodesFlickerStartTimes;
  }

  private _nodeLifeTime: number;

  private _nodesLifetimeTimeouts = new Map<string | number, ReturnType<typeof setTimeout>>()
  private _nodesFlickerTimeouts = new Map<string | number, ReturnType<typeof setTimeout>>()
  
  private _newNodesAnimationStartTimes = new Map<string | number, number>();
  get newNodesAnimationStartTimes() {
    return this._newNodesAnimationStartTimes
  }

  constructor() { }

  getArbId(data: ArbitrageGraphData ): string {
    const {direction, from, to, symbol, amountIn} = data;
    return `arb-${direction}-${JSON.stringify(from)}-${JSON.stringify(to)}-${symbol}-${amountIn}`;
  }

  createArbNode(data: ArbitrageGraphData, nodes: GraphNodeObject[]): GraphNodeObject {
    const { direction, amountIn, profit, from, to, symbol, createdAt } = data;

    let maxAbsProfit = Math.abs(profit);

    nodes.forEach(node => {
      if (node.group === NodeGroup.ARBITRAGE) {
        const nodeProfit = Math.abs((node.data as ArbitrageGraphData).profit);
        maxAbsProfit = Math.max(maxAbsProfit, nodeProfit);
      }
    });

    const minNodeSize = 5;
    const maxNodeSize = 50;

    nodes.forEach(node => {
      if (node.group === NodeGroup.ARBITRAGE) {
        const nodeSize = (Math.abs((node.data as ArbitrageGraphData).profit) / maxAbsProfit) * maxNodeSize;
        node.size = Math.max(nodeSize, minNodeSize);

        node.fx = node.x;
        node.fy = node.y;
      }
    });

    let arbNodeSize = (Math.abs(profit) / maxAbsProfit) * maxNodeSize;
    arbNodeSize = Math.max(arbNodeSize, minNodeSize);

    const profitInPercent = (profit / amountIn * 100).toFixed(2)

    const arbNode: GraphNodeObject<ArbitrageGraphData> = {
      id: this.getArbId(data),
      label: `
        <div class="profit">$${profit} (${profitInPercent}%)</div>
        <div>
          <span class="title">${from.name.toUpperCase()}</span> ${from.type} ⮕ 
          <span class="title">${to.name.toUpperCase()}</span> ${to.type}
        </div>
        <div class="title">${amountIn} usd</div>
        ${direction}
      `,
      group: NodeGroup.ARBITRAGE,
      color: profit > 0 ? 'green' : 'red',
      size: arbNodeSize,
      data,
      createdAt: createdAt,
    };

    this._nodesMap.set(arbNode.id, arbNode)
    this._arbNodesSet.add(arbNode.id as string);

    return arbNode;
  }

  createNodesAndLinks(data: ArbitrageGraphData, nodes: GraphNodeObject[]): {nodes: GraphNodeObject[], links: GraphLinkObject[]} { 
    const arbNode = this.createArbNode(data, nodes);

    const { from, to, symbol } = data;

    const fromNodeGroup = from.type === ArbitrageGraphLocationType.EXCHANGE ? NodeGroup.EXCHANGE : NodeGroup.CHAIN
    const toNodeGroup = to.type === ArbitrageGraphLocationType.EXCHANGE ? NodeGroup.EXCHANGE : NodeGroup.CHAIN

    const fromParent = this.getParentNodeOrCreate(from.name, fromNodeGroup, arbNode.id, nodes);
    const toParent = this.getParentNodeOrCreate(to.name, toNodeGroup, arbNode.id, nodes);
    const symbolParent = this.getParentNodeOrCreate(symbol, NodeGroup.SYMBOL, arbNode.id, nodes);

    const newNodes = [arbNode]

    if (fromParent.isNew) {
      newNodes.push(fromParent.node)
    }

    if (toParent.isNew) {
      newNodes.push(toParent.node)
    }

    if (symbolParent.isNew) {
      newNodes.push(symbolParent.node)
      this._symbolNodesSet.add(symbolParent.node.id);
    }

    const newLinks = this.createLinks(arbNode, fromParent.node, toParent.node, symbolParent.node)
    this._linksMap.set(arbNode.id, newLinks)

    return {
      links: newLinks,
      nodes: newNodes
    }
  }

  /**
   * Consider moving to the real time component
   */
  updateLifetime(newLifetime: number, callbackFn: (arbNodeId: string | number) => void) {
    this._nodeLifeTime = newLifetime;

    const currentTime = Date.now();
  
    this._arbNodesSet.forEach((arbNodeId) => {
      const { createdAt } = this._nodesMap.get(arbNodeId);

      if (currentTime > createdAt + newLifetime) {
        clearTimeout(this._nodesFlickerTimeouts.get(arbNodeId));
        this._nodesFlickerTimeouts.delete(arbNodeId);

        clearTimeout(this._nodesLifetimeTimeouts.get(arbNodeId));
        this._nodesLifetimeTimeouts.delete(arbNodeId);

        callbackFn(arbNodeId);
      } else {
        this.handleNodeFlickering(arbNodeId, currentTime, newLifetime);
        this.handleNodeLifetime(arbNodeId, currentTime, callbackFn, newLifetime);
      }
    });
  }

  handleNodeFlickering(arbNodeId: string | number, currentTime = Date.now(), lifetime = this._nodeLifeTime) {
    const arbNodeData = this._nodesMap.get(arbNodeId);

    if (this._nodesFlickerTimeouts.has(arbNodeId)) {
      clearTimeout(this._nodesFlickerTimeouts.get(arbNodeId));
      this._nodesFlickerStartTimes.delete(arbNodeId);
    }

    const flickerStartTime = lifetime - this._flickerInterval * 3;
    const timeRemainingForFlicker = arbNodeData.createdAt + flickerStartTime - currentTime;

    const timeoutId = setTimeout(() => {
      this._nodesFlickerStartTimes.set(arbNodeId, Date.now());
    }, timeRemainingForFlicker);

    this._nodesFlickerTimeouts.set(arbNodeId, timeoutId);
  }

  handleNodeLifetime(
    arbNodeId: string | number, 
    currentTime: number, 
    callbackFn: (arbNodeId: string | number) => void, 
    lifetime = this._nodeLifeTime
  ) {
    const arbNodeData = this._nodesMap.get(arbNodeId);

    if (this._nodesLifetimeTimeouts.has(arbNodeId)) {
      clearTimeout(this._nodesLifetimeTimeouts.get(arbNodeId));
    }

    const timeRemaining = arbNodeData.createdAt + lifetime - currentTime;

    const timeoutId = setTimeout(() => {
      callbackFn(arbNodeId);
    }, timeRemaining);

    this._nodesLifetimeTimeouts.set(arbNodeId, timeoutId);
  }

  getFilteredNodesAndLinksByArbs(
    arbIdsToDelete: Set<string | number>,
    nodes: GraphNodeObject[], 
    links: GraphLinkObject[]
  ): [GraphNodeObject[], GraphLinkObject[]] {
    const filteredNodes = [];
    const filteredLinks = [];

    nodes.forEach((node) => {
      if (node.group === NodeGroup.ARBITRAGE) {
        if (!arbIdsToDelete.has(node.id)) {
          filteredNodes.push(node);
        } else {
          this._nodesMap.delete(node.id)
          this._nodesConnectionsMap.delete(node.id)
          this._arbNodesSet.delete(node.id);
          this._linksMap.delete(node.id);

          this._newNodesAnimationStartTimes.delete(node.id);
          this._nodesFlickerStartTimes.delete(node.id);

          clearTimeout(this._nodesFlickerTimeouts.get(node.id));
          clearTimeout(this._nodesLifetimeTimeouts.get(node.id));
        }
      } else {
        const connections = this._nodesConnectionsMap.get(node.id);

        if (connections) {
          const filteredConnections = new Set([...connections].filter(connectedArbId => !arbIdsToDelete.has(connectedArbId)));
  
          if (filteredConnections.size > 0) {
            filteredNodes.push(node);
            this._nodesConnectionsMap.set(node.id, filteredConnections);
  
            const updatedNode = {
              ...this._nodesMap.get(node.id),
              data: { arbIds: filteredConnections }
            };
            this._nodesMap.set(node.id, updatedNode);
          } else {
            this._nodesMap.delete(node.id);
            this._nodesConnectionsMap.delete(node.id);
  
            if (node.group === NodeGroup.SYMBOL) {
              this._symbolNodesSet.delete(node.id);
            }
          }
        }
      }
    })

    links.forEach(link => {
      const includeLink = link.source.group === NodeGroup.ARBITRAGE ? !arbIdsToDelete.has(link.source.id) : !arbIdsToDelete.has(link.target.id)

      if (includeLink) {
        filteredLinks.push(link);
      }
    });

    return [filteredNodes, filteredLinks];
  }

  setNewNodeAnimationStartTime(arbId: string | number, createdAt: number) {
    const animationStartTime = this._newNodesAnimationStartTimes.get(arbId)

    if (!animationStartTime || createdAt - animationStartTime > 500) {
      this._newNodesAnimationStartTimes.set(arbId, createdAt);
    }
  }

  private getParentNodeOrCreate(label: string, group: NodeGroup, arbNodeId: string | number, nodes: GraphNodeObject[]): {node: GraphNodeObject, isNew: boolean} {
    const id = `${label}-${group}`;

    let color: string;

    switch (group) {
      case NodeGroup.EXCHANGE:
        color = 'gold';
        break;
      case NodeGroup.CHAIN:
        color = 'pink';
        break;
      case NodeGroup.SYMBOL:
        color = 'lightblue';
        break;
    }

    let node = nodes.find(n => n.id === id);
    let isNew = false;

    if (!node) {
      node = {
        id,
        label,
        group,
        color,
        size: 50,
      };
      isNew = true;
    }

    node.data = {
      arbIds: new Set([...node.data?.arbIds || [], arbNodeId])
    }

    if (isNew) {
      this._nodesMap.set(node.id, node)
    }

    const nodeConnections = this._nodesConnectionsMap.get(node.id) || new Set([]);
    this._nodesConnectionsMap.set(node.id, new Set([...nodeConnections, arbNodeId]))

    const arbNodeConnections = this._nodesConnectionsMap.get(arbNodeId) || new Set([]);
    this._nodesConnectionsMap.set(arbNodeId, new Set([...arbNodeConnections, node.id]))

    return {node, isNew};
  }

  private createLinks(arbNode: GraphNodeObject, fromNode: GraphNodeObject, toNode: GraphNodeObject, symbolNode: GraphNodeObject): GraphLinkObject[] {
    let linksColor = 'lightgrey';
    if (fromNode.group === NodeGroup.EXCHANGE && toNode.group === NodeGroup.CHAIN) {
      linksColor = 'blue';
    }

    if (fromNode.group === NodeGroup.CHAIN && toNode.group === NodeGroup.EXCHANGE) {
      linksColor = 'red';
    }

    if (fromNode.group === NodeGroup.EXCHANGE && toNode.group === NodeGroup.EXCHANGE) {
      linksColor = 'gold';
    }

    if (fromNode.group === NodeGroup.CHAIN && toNode.group === NodeGroup.CHAIN) {
      linksColor = 'green';
    }

    const linkFrom: GraphLinkObject = { id: `link-from-${arbNode.id}`, source: fromNode, target: arbNode, color: linksColor}
    const linkTo: GraphLinkObject = { id: `link-to-${arbNode.id}`, source: arbNode, target: toNode, color: linksColor}
    const linkSymbol: GraphLinkObject = { id: `link-symbol-${arbNode.id}`, source: arbNode, target: symbolNode, color: 'lightgrey'}

    return [linkFrom, linkTo, linkSymbol]
  }
}
