import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Position } from '../../models/position.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { PositionFormComponent } from '../position-form/position-form.component';
import { 
  LoadPositions, 
  PositionState, 
  TreeNode 
} from '../../store/position.state';

@Component({
  selector: 'app-position-tree',
  standalone: true,
  imports: [
    CommonModule,
    NzTreeModule,
    NzDrawerModule,
    NzButtonModule,
    NzSpinModule,
    NzEmptyModule,
    PositionFormComponent
  ],
  template: `<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto">

    <div class="bg-white rounded-lg p-6 mb-6 border border-gray-200">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            🏢 Employee Hierarchy
          </h1>
          <p class="text-gray-600 mt-1">Manage your organization's position structure</p>
        </div>
        <button 
          nz-button 
          nzType="primary" 
          (click)="openCreate()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded">
          ➕ Create Position
        </button>
      </div>
    </div>

    <nz-spin [nzSpinning]="loading">
      <div class="bg-white rounded-lg p-6 border border-gray-200">
        <nz-tree
          *ngIf="nodes.length > 0"
          [nzData]="nodes"
          nzBlockNode
          [nzExpandAll]="true"
          (nzClick)="onNodeClick($event)"
          class="org-tree">
        </nz-tree>

        <div *ngIf="nodes.length === 0 && !loading" class="text-center py-12">
          <div class="text-6xl mb-4">🏢</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No positions yet</h3>
          <p class="text-gray-500 mb-6">Start building your organization's hierarchy</p>
          <button 
            nz-button 
            nzType="primary" 
            (click)="openCreate()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded">
            Create First Position
          </button>
        </div>
      </div>
    </nz-spin>

  </div>

  <nz-drawer
    [nzVisible]="drawerVisible"
    nzPlacement="right"
    [nzTitle]="isNew ? 'Create Position' : ('Edit: ' + (selectedPosition?.name || 'Position'))"
    (nzOnClose)="closeDrawer()"
    [nzWidth]="500"
    nzClosable>
    
    <div *nzDrawerContent class="h-full">
      <app-position-form
        [position]="selectedPosition"
        [allPositions]="positions"
        [isNew]="isNew"
        (saved)="onSaved()"
        (deleted)="onDeleted()"
        (cancelled)="closeDrawer()">
      </app-position-form>
    </div>
  </nz-drawer>
</div>`
})
export class PositionTreeComponent implements OnInit, OnDestroy {
  nodes: TreeNode[] = [];
  positions: Position[] = [];
  loading = false;
  error: string | null = null;
  
  drawerVisible = false;
  selectedPosition: Position | null = null;
  isNew = false;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.store.select(PositionState.positions)
      .pipe(takeUntil(this.destroy$))
      .subscribe(positions => {
        this.positions = positions;
      });

    this.store.select(PositionState.treeNodes)
      .pipe(takeUntil(this.destroy$))
      .subscribe(nodes => {
        this.nodes = nodes;
      });

    this.store.select(PositionState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    this.store.select(PositionState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        if (error) {
          this.message.error(error); // Remove the options object
        }
      });

    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load() {
    this.store.dispatch(new LoadPositions());
  }

  onNodeClick(event: any) {
    if (!event?.node) {
      return;
    }

    const node = event.node;
    const key = node.key;

    const foundPosition = this.positions.find(p => {
      const positionId = typeof p.id === 'string' ? p.id : p.id.toString();
      return positionId === key;
    });

    if (foundPosition) {
      this.selectedPosition = { ...foundPosition };
      this.isNew = false;
      this.openDrawer();
    }
  }

  openCreate() {
    this.selectedPosition = null;
    this.isNew = true;
    this.openDrawer();
  }

  openDrawer() {
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.selectedPosition = null;
  }

  onSaved() {
    this.closeDrawer();
    this.load(); 
  }

  onDeleted() {
    this.closeDrawer();
    this.load();
  }
}