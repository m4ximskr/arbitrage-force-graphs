import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RealTimeArbitrageComponent} from "./real-time-arbitrage.component";
import {ArbitrageGraphComponent} from "../../shared/components/arbitrage-graph/arbitrage-graph.component";
import {RouterModule, Routes} from "@angular/router";
import {
  ArbitrageGraphFiltersComponent
} from "../../shared/components/arbitrage-graph-filters/arbitrage-graph-filters.component";
import { MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {ArbitrageGraphService} from "../../shared/components/arbitrage-graph/arbitrage-graph.service";

const routes: Routes = [
  {
    path: '',
    component: RealTimeArbitrageComponent
  }
]

@NgModule({
  declarations: [RealTimeArbitrageComponent],
  imports: [
    CommonModule,
    ArbitrageGraphComponent,
    RouterModule.forChild(routes),
    ArbitrageGraphFiltersComponent,
    MatButtonModule,
    MatIconModule,
  ],
  exports: [RealTimeArbitrageComponent],
  providers: [ArbitrageGraphService],
})
export class RealTimeArbitrageModule { }
