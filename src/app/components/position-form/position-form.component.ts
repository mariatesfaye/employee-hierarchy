// src/app/components/position-form/position-form.component.ts
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Position } from '../../models/position.model';
import { PositionService } from '../../services/position.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

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
  templateUrl: './position-form.component.html',
  styleUrls: ['./position-form.component.css']
})
export class PositionFormComponent implements OnInit, OnChanges {
  @Input() position?: Position | null;
  @Input() allPositions: Position[] = [];

  @Output() saved = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private svc: PositionService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['position'] && !changes['position'].firstChange) {
      this.patchForm();
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: [this.position?.name ?? '', [Validators.required, Validators.maxLength(150)]],
      description: [this.position?.description ?? ''],
      parentId: [this.position?.parentId ?? null]
    });
  }

  private patchForm(): void {
    if (!this.form) {
      this.buildForm();
      return;
    }
    this.form.patchValue({
      name: this.position?.name ?? '',
      description: this.position?.description ?? '',
      parentId: this.position?.parentId ?? null
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const value = this.form.value;

    if (this.position && this.position.id) {
      const payload: Position = { ...this.position, ...value };
      this.svc.update(payload).subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      const createPayload: Omit<Position, 'id'> = {
        name: value.name,
        description: value.description,
        parentId: value.parentId ?? null
      };
      this.svc.create(createPayload).subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  confirmDelete(): void {
    if (!this.position?.id) return;

    this.modal.confirm({
      nzTitle: 'Delete position?',
      nzContent: 'Deleting this position will also delete all of its sub-positions. Are you sure?',
      nzOnOk: () => this.performDelete()
    });
  }

  private performDelete(): void {
    if (!this.position?.id) return;

    this.svc.getAll().subscribe({
      next: (positions) => {
        this.svc.deleteWithChildren(positions, this.position!.id).subscribe({
          next: () => this.deleted.emit(),
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  get nameError(): string | null {
    const nameControl = this.form.get('name');
    if (nameControl?.errors?.['required'] && nameControl.touched) {
      return 'Name is required';
    }
    if (nameControl?.errors?.['maxlength'] && nameControl.touched) {
      return 'Name must be less than 150 characters';
    }
    return null;
  }

  getParentOptions(): { id: number | null; label: string }[] {
    const map = new Map<number | null, Position[]>();
    this.allPositions.forEach(p => {
      const pid = p.parentId ?? null;
      const arr = map.get(pid) ?? [];
      arr.push(p);
      map.set(pid, arr);
    });

    const out: { id: number | null; label: string }[] = [];
    out.push({ id: null, label: '(No parent / Root)' });

    const build = (parentId: number | null, depth = 0) => {
      const items = map.get(parentId) ?? [];
      items.sort((a, b) => a.name.localeCompare(b.name));
      for (const item of items) {
        const label = `${'—'.repeat(depth)} ${item.name}`;
        out.push({ id: item.id, label: label.trim() });
        build(item.id, depth + 1);
      }
    };

    build(null, 0);
    return out;
  }
}