import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, signal} from '@angular/core';
import {ArbitrageGraphService} from "../../shared/components/arbitrage-graph/arbitrage-graph.service";
import {ArbitrageGraphData, GraphLinkObject, GraphNodeObject} from "../../shared/components/arbitrage-graph/arbitrage-graph.model";
import { ArbitrageEventsService } from '../../shared/services/arbitrage-events/arbitrage-events.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArbitrageGraphFiltersService } from '../../shared/components/arbitrage-graph-filters/arbitrage-graph-filters.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArbitrageDataService } from '../../shared/data/arbitrage-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-real-time-arbitrage',
  templateUrl: './real-time-arbitrage.component.html',
  styleUrl: './real-time-arbitrage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ArbitrageGraphService],
})
export class RealTimeArbitrageComponent implements OnDestroy {
  areEventsFiring = false;

  graphNodes = signal<GraphNodeObject[]>([]);
  graphLinks = signal<GraphLinkObject[]>([]);

  private arbitrageMockDataSubscription = new Subscription();

  constructor(
    private arbitrageGraphService: ArbitrageGraphService,
    private arbitrageEventsService: ArbitrageEventsService,
    private destroyRef: DestroyRef,
    private arbitrageGraphFiltersService: ArbitrageGraphFiltersService,
    private arbitrageDataService: ArbitrageDataService,
    private matSnackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.arbitrageGraphFiltersService.listenForLifetimeFilterChanges().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((lifetime: number) => {
      this.arbitrageGraphService.updateLifetime(lifetime, this.updateGraph.bind(this))
    })
  }

  ngOnDestroy(): void {
    this.arbitrageEventsService.disconnectFromRealTimeEvents();
    this.arbitrageMockDataSubscription.unsubscribe();
  }

  toggleRealTimeEvents() {
    this.areEventsFiring = !this.areEventsFiring;

    if (this.areEventsFiring) {
      this.arbitrageEventsService.connectToRealTimeEvents().subscribe(data => {
        this.handleArbitrageData(data)
      }, (error: string) => {
        this.matSnackBar.open(error, 'Close', {panelClass: 'arb-snack-bar', duration: 3000})
        this.areEventsFiring = false;
        this.arbitrageEventsService.disconnectFromRealTimeEvents();
        this.cdr.markForCheck();
      });
    } else {
      this.arbitrageEventsService.disconnectFromRealTimeEvents();
    }

    // if (this.areEventsFiring) {
    //   this.arbitrageMockDataSubscription = this.arbitrageDataService.listenForArbitrageDataEventsFromAllTime(false).subscribe(res => {
    //     this.handleArbitrageData(res)
    //   })
    // } else {
    //   this.arbitrageMockDataSubscription.unsubscribe();
    // }
   
  }

  private handleArbitrageData(data: ArbitrageGraphData) {
    const newArbId = this.arbitrageGraphService.getArbId(data)
    const arbExists = this.arbitrageGraphService.arbNodesSet.has(newArbId)

    let newArbNode: GraphNodeObject;

    if (arbExists) {
      const currentNodes = this.graphNodes()
      
      newArbNode = this.arbitrageGraphService.createArbNode(data, currentNodes)

      const currentArbNode = currentNodes.find(node => node.id === newArbId)

      currentArbNode.data = newArbNode.data;
      currentArbNode.label = newArbNode.label;
      currentArbNode.size = newArbNode.size;
      currentArbNode.createdAt = newArbNode.createdAt;
      currentArbNode.color = newArbNode.color;

      this.graphNodes.set([...currentNodes])
    } else {
      const {nodes, links} = this.arbitrageGraphService.createNodesAndLinks(data, this.graphNodes())

      newArbNode = nodes[0]

      this.graphNodes.update((value) => [...value, ...nodes])
      this.graphLinks.update((value) => [...value, ...links])
    }

    this.arbitrageGraphService.setNewNodeAnimationStartTime(newArbNode.id, data.createdAt)

    this.arbitrageGraphService.handleNodeFlickering(newArbNode.id)
      
    this.arbitrageGraphService.handleNodeLifetime(
      newArbNode.id,
      newArbNode.createdAt,
      this.updateGraph.bind(this),
    )
  }

  private updateGraph(arbNodeId: string | number) {
    const [filteredNodes, filteredLinks] = this.arbitrageGraphService.getFilteredNodesAndLinksByArbs(new Set([arbNodeId]), this.graphNodes(), this.graphLinks())
    this.graphNodes.set(filteredNodes);
    this.graphLinks.set(filteredLinks);
  }
}
