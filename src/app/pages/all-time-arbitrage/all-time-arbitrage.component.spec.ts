import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTimeArbitrageComponent } from './all-time-arbitrage.component';

describe('AllTimeArbitrageComponent', () => {
  let component: AllTimeArbitrageComponent;
  let fixture: ComponentFixture<AllTimeArbitrageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllTimeArbitrageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllTimeArbitrageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
