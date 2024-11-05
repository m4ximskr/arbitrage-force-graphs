import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageGraphComponent } from './arbitrage-graph.component';

describe('ArbitrageGraphComponent', () => {
  let component: ArbitrageGraphComponent;
  let fixture: ComponentFixture<ArbitrageGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArbitrageGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrageGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
