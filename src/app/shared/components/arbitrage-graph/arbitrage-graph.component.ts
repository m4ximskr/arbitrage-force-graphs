import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef, Input, OnChanges, SimpleChanges,
  ViewChild,
} from '@angular/core';

import ForceGraph, {ForceGraphInstance} from 'force-graph';
import {forceCollide, forceLink, forceX, forceY} from 'd3-force';
import {ActivatedRoute, Params} from "@angular/router";
import {
  ArbitrageGraphData, ArbitrageGraphFilters,
  GraphLinkObject,
  GraphNodeObject,
  NodeGroup,
  NodePositionsByGroup, ParentData,
} from "./arbitrage-graph.model";
import {ArbitrageGraphService} from "./arbitrage-graph.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatIconModule} from "@angular/material/icon";
import { MatButtonModule} from "@angular/material/button";
import {intersection, isEqual} from "lodash";
import { distinctUntilChanged, startWith } from 'rxjs';

@Component({
  selector: 'app-arbitrage-graph',
  templateUrl: './arbitrage-graph.component.html',
  styleUrl: './arbitrage-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIconModule, MatButtonModule]
})
export class ArbitrageGraphComponent implements AfterViewInit, OnChanges {
  @Input() nodes: GraphNodeObject[] = [];
  @Input() links: GraphLinkObject[] = [];

  @Input() showElapsedSeconds = false;
  @Input() currentTimestamp: number;

  @ViewChild('graph', {static: true}) graphRef;

  private graph: ForceGraphInstance;

  private highlightNodeIds = new Set<string | number>();
  private highlightLinkIds = new Set<string | number>();

  private activeNode: GraphNodeObject = null;

  private nodePositionsByGroup: NodePositionsByGroup;

  private preparedCanvasWidth: number;
  private preparedCanvasHeight: number;

  private NODE_R = 4;

  private graphFilters: ArbitrageGraphFilters = {
    exchanges: [],
    chains: [],
    symbols: [],
    profitFrom: undefined,
    profitTo: undefined,
    amountFrom: undefined,
    amountTo: undefined,
  };

  private newArbAnimationTime = 1000;

  constructor(
    private elementRef: ElementRef,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private arbitrageGraphService: ArbitrageGraphService,
    private destroyRef: DestroyRef,
) {}

  ngAfterViewInit() {
    this.listenToFilterChanges();
    this.prepareNodePositionsMap();
    this.initializeGraph();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['nodes']?.currentValue || changes['links']?.currentValue) {
      if (this.activeNode) {
        this.updateActiveNodesAndLinks(this.activeNode);    
      }

      this.updateGraph();
    }
  }

  private listenToFilterChanges() {
    this.activatedRoute.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef), 
      distinctUntilChanged((prev: Params, curr: Params) => {
        const {lifetime: prevLifetime, ...actualPrev} = prev
        const {lifetime: currLifetime, ...actualCurr} = curr

        return isEqual(actualPrev, actualCurr)
      }),
    ).subscribe((params) => {
      const prepareArrayValues = (items) => {
        return Array.isArray(items) ? items : [items]
      }

      const prepareFloatValue = (value: string): number => {
        const parsedValue = parseFloat(value)
        return isNaN(parsedValue) ? undefined : parsedValue
      }

      this.graphFilters.exchanges = prepareArrayValues(params['exchanges'] || [])
      this.graphFilters.chains = prepareArrayValues(params['chains'] || [])
      this.graphFilters.symbols = prepareArrayValues(params['symbols'] || [])
      this.graphFilters.profitFrom = prepareFloatValue(params['profit_from'])
      this.graphFilters.profitTo = prepareFloatValue(params['profit_to'])
      this.graphFilters.amountFrom = prepareFloatValue(params['amount_from'])
      this.graphFilters.amountTo = prepareFloatValue(params['amount_to'])

      this.updateGraph();
    })
  }

  private updateGraph() {
    if (this.graph) {
      this.graph.graphData({ nodes: this.nodes, links: this.links });
    }
  }

  private prepareNodePositionsMap() {
    setTimeout(() => {
      const canvas = this.graphRef.nativeElement.querySelector('canvas');

      const {width, height} = canvas

      this.preparedCanvasWidth = width / window.devicePixelRatio
      this.preparedCanvasHeight = height / window.devicePixelRatio

      this.nodePositionsByGroup = {
        [NodeGroup.EXCHANGE]: {x: -(this.preparedCanvasWidth / 2 - 100), y: -(this.preparedCanvasHeight / 2 - 100)},  // Top-left
        [NodeGroup.CHAIN]: {x: this.preparedCanvasWidth / 2 - 100, y: -(this.preparedCanvasHeight / 2 - 100)},   // Top-right
        [NodeGroup.SYMBOL]: {x: 0, y: this.preparedCanvasHeight / 2 - 50},    // Bottom
        [NodeGroup.ARBITRAGE]: {x: 0, y: -100}    // Center
      };
    })
  }

  private initializeGraph() {
    this.graph = ForceGraph()(this.graphRef.nativeElement)

    this.graph
      .graphData({ nodes: this.nodes, links: this.links })
      .nodeLabel('label')
      .nodeColor((node: GraphNodeObject) => node.color || 'blue')
      .nodeRelSize(this.NODE_R)
      .nodeVal((node: GraphNodeObject) => node.size)
      .nodeCanvasObjectMode(() => 'after')
      .nodeCanvasObject((node: GraphNodeObject, ctx: CanvasRenderingContext2D) => this.createNodeCanvasObject(node, ctx))
      .linkCanvasObjectMode(() => 'replace')
      .linkCanvasObject((link: GraphLinkObject, ctx: CanvasRenderingContext2D) => this.createLinkCanvasObject(link, ctx))
      .nodeVisibility((node: GraphNodeObject) => this.checkVisibility(node))
      .linkVisibility((link: GraphLinkObject) => this.checkVisibility(link.source.group === NodeGroup.ARBITRAGE ? link.source : link.target))
      .d3Force('collide', forceCollide()
        .radius((node: GraphNodeObject) => Math.sqrt(node.size) * this.NODE_R + (node.group === NodeGroup.ARBITRAGE ? 30 : 10))
        .strength(1)
        .iterations(100)
      )
      .d3Force('link', forceLink().strength(0).distance(1000))
      .linkWidth((link: GraphLinkObject) => this.highlightLinkIds.has(link.id) ? 5 : 1)
      .linkDirectionalArrowLength((link: GraphLinkObject) => link.target.group !== NodeGroup.SYMBOL ? 15 : 0)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles(5)
      .linkDirectionalParticleWidth((link: GraphLinkObject) => link.target.group !== NodeGroup.SYMBOL && this.highlightLinkIds.has(link.id) ? 10 : 0)
      .onNodeHover((node: GraphNodeObject) => this.handleNodeHover(node))
      .onNodeClick((node: GraphNodeObject) => this.handleNodeClick(node))
      .onBackgroundClick(() => {
        this.activeNode = null;
        this.highlightNodeIds.clear();
        this.highlightLinkIds.clear();
      })
      .d3Force('x', forceX(node => {
        /**
         * Spreading SYMBOL nodes by x-axis
         */
          if (node.group === NodeGroup.SYMBOL) {
            if (this.arbitrageGraphService.symbolNodesSet.size === 1) {
              return 0;
            }
            const index = [...this.arbitrageGraphService.symbolNodesSet].indexOf(node.id)

            const margin = this.preparedCanvasWidth / 10;
            const availableWidth = this.preparedCanvasWidth - margin * 2;
            const spreadRange = Math.min(availableWidth, this.arbitrageGraphService.symbolNodesSet.size * 70);
            return ((index / (this.arbitrageGraphService.symbolNodesSet.size - 1)) * 2 - 1) * (spreadRange / 2);
          } else {
            return this.nodePositionsByGroup[node.group].x;
          }
        })
        .strength(0.1)
      )
      .d3Force('y', forceY(node => this.nodePositionsByGroup[node.group].y).strength(0.1))
      .d3Force('center', null)
      .zoom(0.9)
      .autoPauseRedraw(false)
  }

  private createNodeCanvasObject(node: GraphNodeObject, ctx: CanvasRenderingContext2D) {
    const radius = Math.sqrt(node.size) * this.NODE_R;

    /**
     * Adding outline animation for new arb nodes
     */
    const startTime = this.arbitrageGraphService.newNodesAnimationStartTimes.get(node.id);

    if (startTime) {
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime < this.newArbAnimationTime) {
        const phase = elapsedTime / this.newArbAnimationTime;
        const opacity = 1 - phase;
        const radiusIncrease = phase * 20;

        ctx.strokeStyle = `rgba(0, 128, 0, ${opacity})`;
        ctx.lineWidth = Math.max(5, 10 * node.size / 50);
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + radiusIncrease, 0, 2 * Math.PI, false);
        ctx.stroke();
      } else {
        this.arbitrageGraphService.newNodesAnimationStartTimes.delete(node.id);
      }
    }

    const currentTimestamp = this.currentTimestamp || Date.now();

    /**
     * Adding flickering effect for arb nodes that will expire soon
     */
    const flickerStartTime = this.arbitrageGraphService.nodesFlickerStartTimes.get(node.id);

    if (flickerStartTime) {
      const elapsedTime =  currentTimestamp - flickerStartTime;
      const phase = (elapsedTime % this.arbitrageGraphService.flickerInterval) / this.arbitrageGraphService.flickerInterval;
      const opacity = 0.8 * (0.5 + 0.5 * Math.sin(2 * Math.PI * phase));

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    ctx.font = '8px Sans-Serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';

    /**
     * Adding appropriate label text for each node
     */
    if (node.group === NodeGroup.ARBITRAGE) {
      const profit = node.data.profit;
      if (profit > 0) {
        ctx.fillText(`$${profit}`, node.x, node.y);
      }
    } else {
      ctx.fillText(`${node.label}`, node.x, node.y);
    }

    if (this.highlightNodeIds.has(node.id)) {
      /**
       * Adding stroke effect for nodes that are highlighted
       */

      const lineWidth = 5
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + lineWidth / 2, 0, 2 * Math.PI, false);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = 'black'
      ctx.stroke();

      if (node.group === NodeGroup.ARBITRAGE) {
        /**
         * Adding elapsed seconds counter for arb node that is highlighted
         */

        const elapsedTime = currentTimestamp - node.createdAt;
        const elapsedSeconds = Math.floor(elapsedTime / 1000);

        const seconds = elapsedSeconds % 60;
        const minutes = Math.floor(elapsedSeconds / 60) % 60;
        const hours = Math.floor(elapsedSeconds / 3600);

        const timeParts = [];

        if (hours > 0) {
          timeParts.push(`${hours}h`);
        }
        if (minutes > 0) {
          timeParts.push(`${minutes}m`);
        }

        timeParts.push(`${seconds}s`);

        const time = timeParts.join(' ');

        ctx.font = 'bold 20px Sans-Serif';
        ctx.fillText(`${time}`, node.x, node.y - radius - 20);
      }
    } else if (this.highlightNodeIds.size > 0) {
      /**
       * Adding overlay effect for nodes that are not highlighted
       */

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fill();
    }
  }

  private createLinkCanvasObject(link: GraphLinkObject, ctx: CanvasRenderingContext2D) {
    if (this.highlightLinkIds.has(link.id)) {
      ctx.lineWidth = 5;
      ctx.globalAlpha = 1;
    } else if (this.highlightLinkIds.size > 0) {
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
    } else {
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = link.color;

    const {x: sourceX, y: sourceY} = link.source
    const {x: targetX, y: targetY} = link.target

    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
  }

  private handleNodeHover(node: GraphNodeObject) {
    if (this.activeNode) {
      return;
    }

    this.highlightNodeIds.clear();
    this.highlightLinkIds.clear();

    if (node?.group === NodeGroup.ARBITRAGE) {
      const connectedNodesIds = this.arbitrageGraphService.nodesConnectionsMap.get(node.id)
      const links = this.arbitrageGraphService.linksMap.get(node.id)

      if (connectedNodesIds && links) {
        [...connectedNodesIds, node.id].forEach(nodeId => this.highlightNodeIds.add(nodeId))
        links.forEach(link => this.highlightLinkIds.add(link.id));
      }     
    }
  }

  private handleNodeClick(node: GraphNodeObject) {
    if (node.group !== NodeGroup.ARBITRAGE) {
      if (node.id === this.activeNode?.id) {
        this.activeNode = null;
        this.highlightNodeIds.clear();
        this.highlightLinkIds.clear();
      } else {
        this.activeNode = node;
        this.updateActiveNodesAndLinks(this.activeNode);    
      }
    }
  }

  private updateActiveNodesAndLinks(node: GraphNodeObject) {
    this.highlightNodeIds.clear();
    this.highlightLinkIds.clear();

    const arbNodeIds = this.arbitrageGraphService.nodesConnectionsMap.get(node.id);

    [...arbNodeIds].forEach(arbNodeId => {
      this.highlightNodeIds.add(arbNodeId)

      const connectedNodeIds = this.arbitrageGraphService.nodesConnectionsMap.get(arbNodeId);

      if (connectedNodeIds) {
        [...connectedNodeIds].forEach(nodeId => this.highlightNodeIds.add(nodeId))
      }

      const links = this.arbitrageGraphService.linksMap.get(arbNodeId)

      if (links) {
        links.forEach(link => this.highlightLinkIds.add(link.id));
      }
    })
  }

  private checkVisibility(node: GraphNodeObject): boolean {
    if (!this.arbitrageGraphService.nodesMap.get(node.id)) {
      return false
    }

    let connectedArbNodes: GraphNodeObject[];
    let connectedParentNodes: GraphNodeObject[];

    if (node.group !== NodeGroup.ARBITRAGE) {
      const connectedArbIds = this.arbitrageGraphService.nodesConnectionsMap.get(node.id)
      connectedArbNodes = [...connectedArbIds].map(connectedArbId => this.arbitrageGraphService.nodesMap.get(connectedArbId))

      const connectedParentNodeIds = new Set([...connectedArbIds].flatMap(connectedArbId => [...this.arbitrageGraphService.nodesConnectionsMap.get(connectedArbId)]))
      connectedParentNodes = [...connectedParentNodeIds].map(connectedParentNodeId => this.arbitrageGraphService.nodesMap.get(connectedParentNodeId))
    } else {
      connectedArbNodes = [node]
      const connectedParentNodeIds = this.arbitrageGraphService.nodesConnectionsMap.get(node.id)
      connectedParentNodes = [...connectedParentNodeIds].map(connectedParentNodeId => this.arbitrageGraphService.nodesMap.get(connectedParentNodeId))
    }
    return this.filterArbitrageNodeData(connectedArbNodes, connectedParentNodes, node)
  }

  private filterArbitrageNodeData(connectedArbNodes: GraphNodeObject<ArbitrageGraphData>[], connectedParentNodes: GraphNodeObject<ParentData>[], node: GraphNodeObject): boolean {
    const {exchanges, chains, symbols, profitFrom, profitTo, amountFrom, amountTo} = this.graphFilters;
    const includesByName = (label: string, filterValues: string[]) =>
      filterValues.some(filter => label.toLowerCase().includes(filter.toLowerCase()))

    const includesByRange = (value: number, min: number, max: number) =>
      (isNaN(min) || value >= min) && (isNaN(max) || value <= max);

    let includedExchangesArbIdsToCheck = new Set([]);
    let includedChainsArbIdsToCheck = new Set([]);
    let includedSymbolsArbIdsToCheck = new Set([]);

    connectedParentNodes.forEach(connectedParentNode => {
      if (connectedParentNode.group === NodeGroup.EXCHANGE) {
        if (exchanges.length > 0) {
          if (includesByName(connectedParentNode.label, exchanges)) {
            includedExchangesArbIdsToCheck = new Set([...includedExchangesArbIdsToCheck, ...connectedParentNode.data.arbIds])
          }
        }
      }

      if (connectedParentNode.group === NodeGroup.CHAIN) {
        if (chains.length > 0) {
          if (includesByName(connectedParentNode.label, chains)) {
            includedChainsArbIdsToCheck = new Set([...includedChainsArbIdsToCheck, ...connectedParentNode.data.arbIds])
          }
        }
      }

      if (connectedParentNode.group === NodeGroup.SYMBOL) {
        if (symbols.length > 0) {
          if (includesByName(connectedParentNode.label, symbols)) {
            includedSymbolsArbIdsToCheck = new Set([...includedSymbolsArbIdsToCheck, ...connectedParentNode.data.arbIds])
          }
        }
      }
    })

    const includesExchanges = exchanges.length === 0 || includedExchangesArbIdsToCheck.size > 0;
    const includesChains = chains.length === 0 || includedChainsArbIdsToCheck.size > 0;
    const includesSymbols = symbols.length === 0 || includedSymbolsArbIdsToCheck.size > 0;

    const includedByProfitAndAmountArbIdsToCheck = connectedArbNodes.reduce((arbIds, connectedArbNode) => {
      const {profit, amountIn} = connectedArbNode.data;

      if (includesByRange(profit, profitFrom, profitTo) && includesByRange(amountIn, amountFrom, amountTo)) {
        arbIds.add(connectedArbNode.id);
      }

      return arbIds;
    }, new Set([]));

    const includesArbNodeByProfitAndAmount = includedByProfitAndAmountArbIdsToCheck.size > 0;

    const currentNodeArbIds = node.group === NodeGroup.ARBITRAGE ? [node.id] : [...node.data.arbIds]

    const arbIdsIntersectionToCheck = [
      [...includedExchangesArbIdsToCheck],
      [...includedChainsArbIdsToCheck],
      [...includedSymbolsArbIdsToCheck],
      [...includedByProfitAndAmountArbIdsToCheck],
      currentNodeArbIds
    ].filter(arbIds => arbIds?.length > 0)

    if (arbIdsIntersectionToCheck.length > 1) {
      const arbIdsIntersections = intersection(...arbIdsIntersectionToCheck);
      return arbIdsIntersections.length > 0 && includesExchanges && includesChains && includesSymbols && includesArbNodeByProfitAndAmount;
    } else {
      return includesExchanges && includesChains && includesSymbols && includesArbNodeByProfitAndAmount
    }
  }
}
