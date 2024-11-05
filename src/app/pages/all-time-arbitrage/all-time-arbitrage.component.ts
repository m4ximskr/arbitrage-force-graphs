import { ChangeDetectionStrategy, Component, DestroyRef, signal} from '@angular/core';
import {FormControl} from "@angular/forms";
import { BehaviorSubject, combineLatest, skip, throttleTime} from "rxjs";
import {ArbitrageGraphData, GraphLinkObject, GraphNodeObject, NodeGroup} from "../../shared/components/arbitrage-graph/arbitrage-graph.model";
import {ArbitrageGraphService} from "../../shared/components/arbitrage-graph/arbitrage-graph.service";
import { ArbitrageGraphFiltersService } from '../../shared/components/arbitrage-graph-filters/arbitrage-graph-filters.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArbitrageEventsService } from '../../shared/services/arbitrage-events/arbitrage-events.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArbitrageDataService } from '../../shared/data/arbitrage-data.service';

@Component({
  selector: 'app-all-time-arbitrage',
  templateUrl: './all-time-arbitrage.component.html',
  styleUrl: './all-time-arbitrage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ArbitrageGraphService],
})
export class AllTimeArbitrageComponent {

  graphNodes = signal<GraphNodeObject[]>([]);
  graphLinks = signal<GraphLinkObject[]>([]);

  timelineTimestamp = signal(Date.now());
  maxTime = 24 * 3600;
  startTimestamp = Math.floor(Date.now() / 1000) - this.maxTime;

  timelineFormControl = new FormControl<number>(0);

  dataLoading = signal(false);

  dataLoaded = signal(false);

  constructor(
    private arbitrageGraphService: ArbitrageGraphService,
    private arbitrageGraphFiltersService: ArbitrageGraphFiltersService,
    private destroyRef: DestroyRef,
    private arbitrageEventsService: ArbitrageEventsService, 
    private matSnackBar: MatSnackBar,
    private arbitrageDataService: ArbitrageDataService,
  ) {
    combineLatest([
      this.arbitrageEventsService.allTimeData$,
      this.timelineFormControl.valueChanges.pipe(throttleTime(100)),
      this.arbitrageGraphFiltersService.listenForLifetimeFilterChanges()
    ])
    .pipe(
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe(([data, timestamp, lifetime]: [ArbitrageGraphData[], number, number]) => {
      this.dataLoaded.set(data.length > 0)
      this.timelineTimestamp.set(timestamp);
      this.updateArbitrageEvents(data, timestamp, lifetime);
    })
  }

  getAllTimeData() {
    if (this.dataLoading()) {
      return;
    }

    this.dataLoading.set(true);

    const source$ = this.arbitrageEventsService.getAllTimeData()
    // const source$ = this.arbitrageDataService.getArbitrageDataEventsFromAllTime(false)

    source$.subscribe(() => {
      this.dataLoading.set(false);
      this.matSnackBar.open('Arbitrage data succefully loaded', 'Close', {panelClass: 'arb-snack-bar', duration: 3000})
    }, (error) => {
      this.dataLoading.set(false);
      const errorMessage = error?.error?.error || 'Failed to get data'
      this.matSnackBar.open(errorMessage, 'Close', {panelClass: 'arb-snack-bar', duration: 3000})
    })
  }

  private async updateArbitrageEvents(data: ArbitrageGraphData[], timelineTimestamp: number, lifetime: number) {
    const newArbsMap = new Map<string | number, ArbitrageGraphData>();

    data.forEach(arbData => {
      const arbitrageEventEnd = arbData.createdAt + lifetime;

      if (timelineTimestamp < arbData.createdAt || timelineTimestamp > arbitrageEventEnd) {
        return; 
      }

      const arbId = this.arbitrageGraphService.getArbId(arbData)
      const existingArb = newArbsMap.get(arbId);

      /**
       * Only keep the latest event for the same id
       */
      if (!existingArb || existingArb.createdAt < arbData.createdAt) {
        newArbsMap.set(arbId, arbData)
      }
    })

    const newArbIds = new Set([...newArbsMap.keys()]);
    const arbIdsToDelete = new Set([...this.arbitrageGraphService.arbNodesSet].filter(arbNodeId => !newArbIds.has(arbNodeId)))

    let updatedNodes = this.graphNodes();
    let updatedLinks = this.graphLinks();

    /**
     * Get nodes and links filtered by arbs to delete
     */
    if (arbIdsToDelete.size > 0) {
      [updatedNodes, updatedLinks] = this.arbitrageGraphService.getFilteredNodesAndLinksByArbs(arbIdsToDelete, updatedNodes, updatedLinks)
    }

    /**
     * Update existing nodes with new ones if they exist
     */
    updatedNodes = updatedNodes.map((node) => {
      if (node.group === NodeGroup.ARBITRAGE) {
        const arbToUpdate = newArbsMap.get(node.id as string);
  
        if (arbToUpdate) {
          const newArbNode = this.arbitrageGraphService.createArbNode(arbToUpdate, updatedNodes);

          if (newArbNode.createdAt > node.createdAt) {
            this.arbitrageGraphService.setNewNodeAnimationStartTime(newArbNode.id, Date.now())
          }

          node.data = newArbNode.data;
          node.label = newArbNode.label;
          node.size = newArbNode.size;
          node.createdAt = newArbNode.createdAt;
          node.color = newArbNode.color;

          newArbsMap.delete(node.id as string);
        }
      }

      return node;
    });
    
    /**
     * If there are still new arbitrages, create new nodes/links
     */
    if (newArbsMap.size > 0) {
      const preparedArbitrageEvents = [...newArbsMap].reduce(
        ({nodes, links}, [arbId, arbData]) => {
          const { nodes: newNodes, links: newLinks } = this.arbitrageGraphService.createNodesAndLinks(arbData, nodes);

          this.arbitrageGraphService.setNewNodeAnimationStartTime(arbId, Date.now())

          return {
            nodes: [
              ...nodes,
              ...newNodes,
            ],
            links: [
              ...links,
              ...newLinks,
            ]
          };
        },
        {
          nodes: updatedNodes,
          links: updatedLinks,
        }
      );

      updatedNodes = preparedArbitrageEvents.nodes
      updatedLinks = preparedArbitrageEvents.links
    }

    this.graphNodes.set(updatedNodes)
    this.graphLinks.set(updatedLinks)
  }
}
