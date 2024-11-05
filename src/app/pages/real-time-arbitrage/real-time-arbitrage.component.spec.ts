import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimeArbitrageComponent } from './real-time-arbitrage.component';

describe('RealTimeArbitrageComponent', () => {
  let component: RealTimeArbitrageComponent;
  let fixture: ComponentFixture<RealTimeArbitrageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RealTimeArbitrageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealTimeArbitrageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
