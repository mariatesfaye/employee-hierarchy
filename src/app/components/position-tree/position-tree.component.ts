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
  templateUrl: './position-tree.component.html',
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
    private msg: NzMessageService
  ) {}

  ngOnInit() {
    this.store.select(PositionState.positions)
      .pipe(takeUntil(this.destroy$))
      .subscribe(positions => {
        this.positions = positions;
        console.log('📋 Positions loaded:', positions);
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
          this.msg.error(error);
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
    console.log('🖱️ Node clicked event:', event);
    
    if (!event?.node) {
      console.error('❌ No node in event');
      return;
    }

    const node = event.node;
    const key = node.key;
    console.log('🔑 Looking for position with key:', key);

    const foundPosition = this.positions.find(p => {
      const positionId = typeof p.id === 'string' ? p.id : p.id.toString();
      return positionId === key;
    });

    console.log('🔍 Found position:', foundPosition);

    if (foundPosition) {
      this.selectedPosition = { ...foundPosition };
      this.isNew = false;
      this.openDrawer();
    } else {
      console.error('❌ Position not found for key:', key);
      this.msg.error('Position not found');
    }
  }

  openCreate() {
    console.log('🆕 Opening create form');
    this.selectedPosition = null;
    this.isNew = true;
    this.openDrawer();
  }

  openDrawer() {
    console.log('🚪 Opening drawer with:', {
      selectedPosition: this.selectedPosition,
      isNew: this.isNew
    });
    this.drawerVisible = true;
  }

  closeDrawer() {
    console.log('🚪 Closing drawer');
    this.drawerVisible = false;
    this.selectedPosition = null;
  }

  onSaved() {
    console.log('✅ Position saved');
    this.msg.success('Position saved successfully');
    this.closeDrawer();
    this.load(); 
  }

  onDeleted() {
    console.log('🗑️ Position deleted');
    this.msg.success('Position deleted successfully');
    this.closeDrawer();
    this.load();
  }
}