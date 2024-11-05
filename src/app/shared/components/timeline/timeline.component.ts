import {ChangeDetectionStrategy, Component, forwardRef, Input} from '@angular/core';
import { MatFormFieldModule} from "@angular/material/form-field";
import { MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {LabelType, NgxSliderModule, Options} from "@angular-slider/ngx-slider";
import {MatSelectModule} from "@angular/material/select";
import {debounceTime, startWith} from "rxjs";
import { TimeUnit, timeUnitMap } from './timeline';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxSliderModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimelineComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements ControlValueAccessor {
  @Input() maxTime = 24 * 3600;
  @Input() startTimestamp = Math.floor(Date.now() / 1000) - this.maxTime;

  isPlaying = false;

  timeUnitFormControl = new FormControl(TimeUnit.SECONDS_1)
  timelineFormControl = new FormControl(0);

  timeUnitOptions = Object.values(timeUnitMap)

  sliderOptions: Options = {
    floor: 0,
    ceil: this.maxTime,
    step: 1,
    showTicks: true,
    tickStep: 3600,
    showTicksValues: true,
    showSelectionBar: true,
    translate: (value, label) => {
      if (label === LabelType.TickValue) {
        return this.sliderTicksLabelMap.get(value);
      } else {
        const timestamp = this.startTimestamp + value;

        const date = new Date(timestamp * 1000);

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
      }
    },
    hideLimitLabels: true,
    animate: false,
    animateOnMove: false,
  }

  private timeStep: number;
  private intervalTime: number;
  private interval: ReturnType<typeof setTimeout>;

  private sliderTicksLabelMap = new Map<number, string>();

  private propagateChange: (_: any) => void;
  private propagateTouch: () => void;

  constructor() {
    this.calculateTimeMap();
    this.listenForTimeUnitFormControl();
    this.listenFormTimelineFormControl();
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn) {
    this.propagateTouch = fn;
  }

  writeValue(value: number) {
    this.timelineFormControl.setValue(value, {emitEvent: false});
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startTimeline();
    } else {
      this.stopTimeline();
    }
  }

  startTimeline() {
    this.interval = setInterval(() => {
      const nextCurrentTime = this.timelineFormControl.value + this.timeStep
      if (nextCurrentTime < this.maxTime) {
        this.timelineFormControl.setValue(nextCurrentTime)
      } else {
        this.timelineFormControl.setValue(0)
      }
    }, this.intervalTime);
  }

  stopTimeline() {
    this.isPlaying = false;
    clearInterval(this.interval);
  }

  private calculateTimeMap() {
    for (let i = 0; i <= this.maxTime; i += 3600) {
      const timestamp = this.startTimestamp + i;
      const date = new Date(timestamp * 1000);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const tickLabel = `${hours}:${minutes}`;

      this.sliderTicksLabelMap.set(i, tickLabel)
    }
  }

  private listenForTimeUnitFormControl() {
    this.timeUnitFormControl.valueChanges.pipe(startWith(TimeUnit.SECONDS_1)).subscribe((value) => {
      this.timeStep = timeUnitMap[value].timeStep;
      this.intervalTime = timeUnitMap[value].interval;
      this.sliderOptions.step = this.timeStep;

      if (this.isPlaying) {
        clearInterval(this.interval);
        this.startTimeline();
      }
    })
  }

  private listenFormTimelineFormControl() {
    this.timelineFormControl.valueChanges
      .pipe(startWith(0), debounceTime(0))
      .subscribe((seconds) => {
        const currentTimestamp = (this.startTimestamp + seconds) * 1000
        this.propagateTouch();
        this.propagateChange(currentTimestamp);
      })
  }
}
