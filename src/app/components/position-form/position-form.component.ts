import { Component, input, output, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { Position } from '../../models/position.model';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
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
  template: `<div class="p-4">
  <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Position Name <span class="text-red-500">*</span>
      </label>
      <input 
        nz-input 
        formControlName="name" 
        placeholder="e.g., Senior Developer"
        class="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500" />
      <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-red-500 text-sm">
        <div *ngIf="form.get('name')?.errors?.['required']">Position name is required</div>
        <div *ngIf="form.get('name')?.errors?.['minlength']">Minimum 2 characters required</div>
      </div>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Description</label>
      <textarea 
        nz-input 
        formControlName="description" 
        rows="3"
        placeholder="Optional position description..."
        class="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 resize-none"></textarea>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Parent Position</label>
      <nz-select 
        formControlName="parentId" 
        nzAllowClear 
        nzShowSearch
        nzPlaceHolder="Select parent position"
        class="w-full">
        <nz-option 
          *ngFor="let option of parentOptions()" 
          [nzValue]="option.id" 
          [nzLabel]="option.label">
        </nz-option>
      </nz-select>
      <p class="text-xs text-gray-500">Select where this position fits in the organization hierarchy</p>
    </div>

    <div class="flex justify-between items-center pt-4 border-t border-gray-200">
      <div class="flex gap-2">
        <button 
          nz-button 
          nzType="primary" 
          [disabled]="loading || form.invalid"
          [nzLoading]="loading"
          type="submit"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded">
          {{ isNew() ? 'Create Position' : 'Update Position' }}
        </button>
        <button 
          nz-button 
          type="button" 
          (click)="cancel()"
          [disabled]="loading"
          class="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50">
          Cancel
        </button>
      </div>

      <div *ngIf="showDeleteButton()">
        <button 
          nz-button 
          nzType="default" 
          nzDanger
          (click)="confirmDelete()"
          [disabled]="loading"
          type="button"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded">
          Delete
        </button>
      </div>
    </div>

  </form>
</div>`
})
export class PositionFormComponent {
  position = input<Position | null>(null);
  allPositions = input<Position[]>([]);
  isNew = input<boolean>(false);

  saved = output<void>();
  deleted = output<void>();
  cancelled = output<void>();

  form!: FormGroup;
  loading = false;

  showDeleteButton = computed(() => !this.isNew() && !!this.position()?.id);
  
  parentOptions = computed(() => {
    const options: { id: number | null; label: string }[] = [
      { id: null, label: '🏢 No Parent (Root Level)' }
    ];

    this.allPositions()
      .filter(p => p.id !== this.position()?.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(position => {
        options.push({
          id: position.id,
          label: position.name
        });
      });

    return options;
  });

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.buildForm();
    
    effect(() => {
      this.patchForm();
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150), Validators.minLength(2)]],
      description: [''],
      parentId: [null]
    });
  }

  private patchForm(): void {
    if (!this.form) {
      this.buildForm();
    }

    const currentPosition = this.position();
    const formData = {
      name: currentPosition?.name || '',
      description: currentPosition?.description || '',
      parentId: currentPosition?.parentId ?? null
    };

    this.form.patchValue(formData, { emitEvent: false });
  }

  save(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.isNew()) {
      this.createPosition(formValue);
    } else {
      this.updatePosition(formValue);
    }
  }

  private createPosition(formValue: any): void {
    const payload: Omit<Position, 'id'> = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || '',
      parentId: formValue.parentId
    };

    this.store.dispatch(new CreatePosition(payload)).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('Position created successfully!');
        this.saved.emit();
      },
      error: (error) => {
        console.error('Create error:', error);
        this.loading = false;
        this.message.error('Failed to create position');
      }
    });
  }

  private updatePosition(formValue: any): void {
    const currentPosition = this.position();
    if (!currentPosition?.id) {
      console.error('Cannot update: No position ID');
      this.loading = false;
      return;
    }

    const payload: Position = {
      id: currentPosition.id,
      name: formValue.name.trim(),
      description: formValue.description?.trim() || '',
      parentId: formValue.parentId
    };

    this.store.dispatch(new UpdatePosition(payload)).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('Position updated successfully!');
        this.saved.emit();
      },
      error: (error) => {
        console.error('Update error:', error);
        this.loading = false;
        this.message.error('Failed to update position');
      }
    });
  }

  confirmDelete(): void {
    const currentPosition = this.position();
    if (!currentPosition?.id) {
      return;
    }

    this.modal.confirm({
      nzTitle: 'Delete Position?',
      nzContent: `Are you sure you want to delete "${currentPosition.name}"? This will also delete all positions under it.`,
      nzOkText: 'Yes, Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => this.performDelete()
    });
  }

  private performDelete(): void {
    const currentPosition = this.position();
    if (!currentPosition?.id) {
      return;
    }

    this.loading = true;
    this.store.dispatch(new DeletePositionWithChildren(currentPosition.id)).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('Position deleted successfully!');
        this.deleted.emit();
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.loading = false;
        this.message.error('Failed to delete position');
      }
    });
  }

  cancel(): void {
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
}