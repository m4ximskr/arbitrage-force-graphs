import {Component, DestroyRef, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatButtonModule} from "@angular/material/button";
import {ChipFilterComponent, ChipFilterValue} from "../filters/chip-filter/chip-filter.component";
import {RangeFilterComponent, RangeFilterValue} from "../filters/range-filter/range-filter.component";
import {ActivatedRoute, Router} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { defaultLifetimeSeconds } from '../../constants';

interface FiltersForm {
  exchanges: FormControl<ChipFilterValue[]>;
  chains: FormControl<ChipFilterValue[]>;
  symbols: FormControl<ChipFilterValue[]>;
  profit: FormControl<RangeFilterValue>;
  amount: FormControl<RangeFilterValue>;
  lifetime: FormControl<number>;
}

@Component({
  selector: 'app-arbitrage-graph-filters',
  templateUrl: './arbitrage-graph-filters.component.html',
  styleUrl: './arbitrage-graph-filters.component.scss',
  standalone: true,
  imports: [
    MatFormFieldModule, ReactiveFormsModule,
    MatInputModule, MatExpansionModule, MatButtonModule, RangeFilterComponent, ChipFilterComponent
  ]
})
export class ArbitrageGraphFiltersComponent implements OnInit {
  filtersForm: FormGroup<FiltersForm>;

  get lifetimeFormControl(): AbstractControl<number> {
    return this.filtersForm.get('lifetime');
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private destroyRef: DestroyRef,
  ) {
    this.filtersForm = this.fb.group({
      exchanges: [],
      chains: [],
      symbols: [],
      profit: [],
      amount: [],
      lifetime: [defaultLifetimeSeconds, {
        updateOn: 'blur'
      }]
    })
  }

  ngOnInit() {
    this.listenForFiltersFormChanges();
    this.listenForQueryParamsChanges();
  }

  clearFilters(event) {
    event.stopPropagation();
    this.router.navigate([], {
      queryParams: {},
    });
  }

  handleInputKeyupEnter(control: AbstractControl, value: string) {
    control.setValue(parseInt(value, 10) || defaultLifetimeSeconds)
  }

  private listenForFiltersFormChanges() {
    this.filtersForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef), 
    ).subscribe(value => {   
      const exchanges = value.exchanges?.map(({name}): string => name)
      const chains = value.chains?.map(({name}): string => name)
      const symbols = value.symbols?.map(({name}): string => name)

      const profitFrom = value.profit?.from?.length > 0 ? value.profit.from : null;
      const profitTo = value.profit?.to?.length > 0 ? value.profit.to : null;

      const amountFrom = value.amount?.from?.length > 0 ? value.amount.from : null;
      const amountTo = value.amount?.to?.length > 0 ? value.amount.to : null;

      let lifetime = value.lifetime
      
      if (value.lifetime < 5) {
        lifetime = defaultLifetimeSeconds;
        this.lifetimeFormControl.setValue(lifetime, {emitEvent: false})
      }

      this.router.navigate([], {
        queryParams: {
          exchanges,
          chains,
          symbols,
          profit_from: profitFrom,
          profit_to: profitTo,
          amount_from: amountFrom,
          amount_to: amountTo,
          lifetime,
        },
        queryParamsHandling: 'merge',
      });
    })
  }

  private listenForQueryParamsChanges() {
    const prepareArrayValues = (items) => {
      return items ? Array.isArray(items) ? items : [items] : []
    }

    this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.filtersForm.patchValue({
        exchanges: prepareArrayValues(params['exchanges']).map(exchange => ({name: exchange})),
        chains: prepareArrayValues(params['chains']).map(chain => ({name: chain})),
        symbols: prepareArrayValues(params['symbols']).map(symbol => ({name: symbol})),
        profit: {
          from: params['profit_from'],
          to: params['profit_to'],
        },
        amount: {
          from: params['amount_from'],
          to: params['amount_to'],
        },
        lifetime: params['lifetime'] || defaultLifetimeSeconds,
      }, {emitEvent: false})
    })
  }
}
