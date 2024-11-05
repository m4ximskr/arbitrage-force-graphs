import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, signal} from '@angular/core';
import {MatChipEditedEvent, MatChipInputEvent, MatChipsModule} from "@angular/material/chips";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";

export interface ChipFilterValue {
  name: string;
}
@Component({
  selector: 'app-chip-filter',
  templateUrl: './chip-filter.component.html',
  styleUrl: './chip-filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipFilterComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatFormFieldModule, MatChipsModule, MatIconModule]
})
export class ChipFilterComponent implements ControlValueAccessor {
  @Input() label = 'Options'
  readonly options = signal<ChipFilterValue[]>([]);

  private propagateChange: (_: any) => void;
  private propagateTouch: () => void;

  constructor(private cdr: ChangeDetectorRef) {}
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.options.update(options => [...options, {name: value}]);
    }
    event.chipInput.clear();
    this.propagateChange(this.options())
  }

  remove(option: ChipFilterValue): void {
    this.options.update(options => {
      const index = options.indexOf(option);
      if (index < 0) {
        return options;
      }

      options.splice(index, 1);
      return [...options];
    });

    this.propagateChange(this.options())
  }

  edit(option: ChipFilterValue, event: MatChipEditedEvent) {
    const value = event.value.trim();

    if (!value) {
      this.remove(option);
      return;
    }

    this.options.update(options => {
      const index = options.indexOf(option);
      if (index >= 0) {
        options[index].name = value;
        return [...options];
      }
      return options;
    });

    this.propagateChange(this.options())
  }

  writeValue(options: ChipFilterValue[]) {
    this.options.update(() => options || []);
    this.cdr.markForCheck();
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn) {
    this.propagateTouch = fn;
  }
}
