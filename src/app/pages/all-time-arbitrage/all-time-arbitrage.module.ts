import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AllTimeArbitrageComponent} from "./all-time-arbitrage.component";
import {RouterModule, Routes} from "@angular/router";
import {MatButtonModule} from "@angular/material/button";
import {MatSliderModule} from "@angular/material/slider";
import { MatIconModule} from "@angular/material/icon";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {NgxSliderModule} from "@angular-slider/ngx-slider";
import {
  ArbitrageGraphFiltersComponent
} from "../../shared/components/arbitrage-graph-filters/arbitrage-graph-filters.component";
import {ArbitrageGraphComponent} from "../../shared/components/arbitrage-graph/arbitrage-graph.component";
import {TimelineComponent} from "../../shared/components/timeline/timeline.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    component: AllTimeArbitrageComponent
  }
]

@NgModule({
  declarations: [AllTimeArbitrageComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatSliderModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxSliderModule,
    ArbitrageGraphFiltersComponent,
    ArbitrageGraphComponent,
    TimelineComponent,
    MatProgressSpinnerModule
  ],
  exports: [AllTimeArbitrageComponent],
})
export class AllTimeArbitrageModule { }
