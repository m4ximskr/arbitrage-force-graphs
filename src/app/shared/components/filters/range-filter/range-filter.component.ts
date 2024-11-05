import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, ElementRef,
  forwardRef,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR, ReactiveFormsModule
} from "@angular/forms";
import {MatInput, MatInputModule} from "@angular/material/input";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatFormFieldModule} from "@angular/material/form-field";

interface RangeFilterForm {
  from: FormControl<string>;
  to: FormControl<string>;
}

export interface RangeFilterValue {
  from: string;
  to: string;
}

@Component({
  selector: 'app-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrl: './range-filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RangeFilterComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule]
})
export class RangeFilterComponent implements ControlValueAccessor {
  @Input() label = 'Range'

  @ViewChildren(MatInput, {read: ElementRef}) inputs: QueryList<ElementRef<HTMLInputElement>>;

  rangeFilterForm: FormGroup<RangeFilterForm>

  private propagateChange: (_: any) => void;
  private propagateTouch: () => void;

  constructor(private cdr: ChangeDetectorRef, private fb: FormBuilder) {
    this.rangeFilterForm = this.fb.group({
      from: [],
      to: [],
    }, {updateOn: 'blur'})

    this.rangeFilterForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.propagateChange(value)
    })
  }

  submitForm() {
    this.inputs.forEach(input => {
      input.nativeElement.blur();
    })
  }

  writeValue(value: RangeFilterValue) {
    const {from, to} = value || {}
    this.rangeFilterForm.patchValue({from, to}, {emitEvent: false})
    this.cdr.markForCheck();
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn) {
    this.propagateTouch = fn;
  }

}
