import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { Position } from '../../models/position.model';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CreatePosition, UpdatePosition, DeletePositionWithChildren } from '../../store/position.state';

@Component({
  selector: 'app-position-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzModalModule
  ],
  template: `<div class="p-2">
  <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">

    <div class="space-y-2">
      <label class="block text-sm font-semibold text-gray-700">
        Position Name <span class="text-red-500">*</span>
      </label>
      <input 
        nz-input 
        formControlName="name" 
        placeholder="e.g., Senior Developer"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" />
      <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-red-500 text-sm">
        <div *ngIf="form.get('name')?.errors?.['required']">Position name is required</div>
        <div *ngIf="form.get('name')?.errors?.['minlength']">Minimum 2 characters required</div>
      </div>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-semibold text-gray-700">Description</label>
      <textarea 
        nz-input 
        formControlName="description" 
        rows="3"
        placeholder="Optional position description..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"></textarea>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-semibold text-gray-700">Parent Position</label>
      <nz-select 
        formControlName="parentId" 
        nzAllowClear 
        nzShowSearch
        nzPlaceHolder="Select parent position"
        class="w-full">
        <nz-option 
          *ngFor="let option of getParentOptions()" 
          [nzValue]="option.id" 
          [nzLabel]="option.label">
        </nz-option>
      </nz-select>
      <p class="text-xs text-gray-500 italic">Select where this position fits in the organization hierarchy</p>
    </div>

    <div class="flex justify-between items-center pt-6 border-t border-gray-100">
      <div class="flex gap-3">
        <button 
          nz-button 
          nzType="primary" 
          [disabled]="loading || form.invalid"
          [nzLoading]="loading"
          type="submit"
          class="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none">
          {{ isNew ? 'Create Position' : 'Update Position' }}
        </button>
        <button 
          nz-button 
          type="button" 
          (click)="cancel()"
          [disabled]="loading"
          class="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200">
          Cancel
        </button>
      </div>

      <div *ngIf="showDeleteButton">
        <button 
          nz-button 
          nzType="default" 
          nzDanger
          (click)="confirmDelete()"
          [disabled]="loading"
          type="button"
          class="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
          Delete
        </button>
      </div>
    </div>

  </form>
</div>`,
})
export class PositionFormComponent implements OnChanges {
  @Input() position: Position | null = null;
  @Input() allPositions: Position[] = [];
  @Input() isNew: boolean = false;

  @Output() saved = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private modal: NzModalService
  ) {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 Form Input Changes:', {
      position: this.position,
      isNew: this.isNew,
      changes: changes
    });

    if (changes['position'] || changes['isNew']) {
      this.patchForm();
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150), Validators.minLength(2)]],
      description: [''],
      parentId: [null]
    });
    console.log('📝 Form built with initial values:', this.form.value);
  }

  private patchForm(): void {
    if (!this.form) {
      this.buildForm();
    }

    const formData = {
      name: this.position?.name || '',
      description: this.position?.description || '',
      parentId: this.position?.parentId ?? null
    };

    console.log('📝 Patching form with data:', formData);
    console.log('📝 Current position:', this.position);

    this.form.patchValue(formData, { emitEvent: false });

    setTimeout(() => {
      console.log('📝 Form values after patch:', this.form.value);
      console.log('📝 Form valid:', this.form.valid);
    }, 0);
  }

  save(): void {
    console.log('💾 Save button clicked');
    console.log('📝 Form values:', this.form.value);
    console.log('📝 Form valid:', this.form.valid);

    if (this.form.invalid) {
      console.log('❌ Form is invalid, marking fields as touched');
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.isNew) {
      console.log('🆕 Creating new position');
      this.createPosition(formValue);
    } else {
      console.log('🔄 Updating existing position');
      this.updatePosition(formValue);
    }
  }

  private createPosition(formValue: any): void {
    const payload: Omit<Position, 'id'> = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || '',
      parentId: formValue.parentId
    };

    console.log('📤 Create payload:', payload);

    this.store.dispatch(new CreatePosition(payload)).subscribe({
      next: () => {
        console.log('✅ Create successful');
        this.loading = false;
        this.saved.emit();
      },
      error: (error) => {
        console.error('❌ Create error:', error);
        this.loading = false;
      }
    });
  }

  private updatePosition(formValue: any): void {
    if (!this.position?.id) {
      console.error('❌ Cannot update: No position ID');
      this.loading = false;
      return;
    }

    const payload: Position = {
      id: this.position.id,
      name: formValue.name.trim(),
      description: formValue.description?.trim() || '',
      parentId: formValue.parentId
    };

    console.log('📤 Update payload:', payload);

    this.store.dispatch(new UpdatePosition(payload)).subscribe({
      next: () => {
        console.log('✅ Update successful');
        this.loading = false;
        this.saved.emit();
      },
      error: (error) => {
        console.error('❌ Update error:', error);
        this.loading = false;
      }
    });
  }

  confirmDelete(): void {
    if (!this.position?.id) {
      console.log('❌ Cannot delete: No position selected');
      return;
    }

    console.log('🗑️ Confirm delete for:', this.position);

    this.modal.confirm({
      nzTitle: 'Delete Position?',
      nzContent: `Are you sure you want to delete "${this.position.name}"? This will also delete all positions under it.`,
      nzOkText: 'Yes, Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => this.performDelete()
    });
  }

  private performDelete(): void {
    if (!this.position?.id) {
      console.log('❌ Cannot delete: No position ID');
      return;
    }

    console.log('🗑️ Performing delete for:', this.position.id);
    this.loading = true;

    this.store.dispatch(new DeletePositionWithChildren(this.position.id)).subscribe({
      next: () => {
        console.log('✅ Delete successful');
        this.loading = false;
        this.deleted.emit();
      },
      error: (error) => {
        console.error('❌ Delete error:', error);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    console.log('🚫 Cancel clicked');
    this.cancelled.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });
  }

  get showDeleteButton(): boolean {
    const shouldShow = !this.isNew && !!this.position?.id;
    console.log('🔍 Delete button should show:', shouldShow, {
      isNew: this.isNew,
      hasPosition: !!this.position,
      positionId: this.position?.id
    });
    return shouldShow;
  }

  getParentOptions(): { id: number | null; label: string }[] {
    const options: { id: number | null; label: string }[] = [
      { id: null, label: '🏢 No Parent (Root Level)' }
    ];

    this.allPositions
      .filter(p => p.id !== this.position?.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(position => {
        options.push({
          id: position.id,
          label: position.name
        });
      });

    console.log('📋 Parent options:', options);
    return options;
  }
}