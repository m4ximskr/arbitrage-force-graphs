import {Component, DestroyRef, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {ChipFilterValue} from "./shared/components/filters/chip-filter/chip-filter.component";
import {RangeFilterValue} from "./shared/components/filters/range-filter/range-filter.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { ArbitrageEventsService } from './shared/services/arbitrage-events/arbitrage-events.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  credentialsForm: FormGroup

  apiKeyFormControl = new FormControl('')

  isEntered = false;

  constructor(
    private arbitrageEventsService: ArbitrageEventsService,
    private fb: FormBuilder,
  ) {
    this.credentialsForm = this.fb.group({
      apiKey: [],
    })
  }

  onSubmit() {
    this.arbitrageEventsService.apiKey = this.credentialsForm.value.apiKey;
    this.credentialsForm.reset();
    this.isEntered = true;
  }
}
