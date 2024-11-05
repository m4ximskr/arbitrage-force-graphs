import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageGraphFiltersComponent } from './arbitrage-graph-filters.component';

describe('ArbitrageGraphFiltersComponent', () => {
  let component: ArbitrageGraphFiltersComponent;
  let fixture: ComponentFixture<ArbitrageGraphFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArbitrageGraphFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrageGraphFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
