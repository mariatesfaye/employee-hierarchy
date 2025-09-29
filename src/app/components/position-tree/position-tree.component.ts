import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionService, TreeNode } from '../../services/position.service';
import { Position } from '../../models/position.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { PositionFormComponent } from '../position-form/position-form.component';

@Component({
  selector: 'app-position-tree',
  standalone: true,
  imports: [
    CommonModule,
    NzTreeModule,
    NzDrawerModule,
    NzButtonModule,
    PositionFormComponent
  ],
  template: `
    <div class="page">
      <div class="header">
        <h2>Perago — Employee Positions</h2>
        <button nz-button nzType="primary" (click)="openCreate()">Create Position</button>
      </div>

      <div *ngIf="loading">Loading positions...</div>
      <div *ngIf="error" style="color: red;">Error loading positions</div>

      <nz-tree
        *ngIf="nodes.length > 0"
        [nzData]="nodes"
        nzBlockNode
        (nzClick)="onNodeClick($event)">
      </nz-tree>

      <div *ngIf="nodes.length === 0 && !loading" style="text-align: center; padding: 20px;">
        No positions found. <button nz-button nzType="link" (click)="openCreate()">Create the first position</button>
      </div>

      <nz-drawer
        [nzVisible]="drawerVisible"
        nzPlacement="right"
        [nzTitle]="isNew ? 'Create Position' : (selectedPosition?.name || 'Position')"
        (nzOnClose)="closeDrawer()"
        [nzWidth]="420">
        <div *nzDrawerContent>
          <app-position-form
            [position]="selectedPosition"
            [allPositions]="positions"
            (saved)="onSaved()"
            (deleted)="onDeleted()">
          </app-position-form>
        </div>
      </nz-drawer>
    </div>
  `,
  styleUrls: ['./position-tree.component.css']
})
export class PositionTreeComponent implements OnInit {
  nodes: TreeNode[] = [];
  positions: Position[] = [];
  drawerVisible = false;
  selectedPosition?: Position | null = null;
  isNew = false;
  loading = true;
  error = false;

  constructor(private svc: PositionService, private msg: NzMessageService) {
    console.log('PositionTreeComponent initialized');
  }

  ngOnInit() {
    console.log('Loading positions...');
    this.load();
  }

  load() {
    this.loading = true;
    this.error = false;
    
    this.svc.getAll().subscribe({
      next: (data) => {
        console.log('Positions loaded:', data);
        this.positions = data;
        this.nodes = this.svc.buildTree(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading positions:', error);
        this.msg.error('Failed to load positions');
        this.loading = false;
        this.error = true;
      }
    });
  }

  onNodeClick(event: any) {
    console.log('Node clicked:', event);
    const node = event.node;
    const key = parseInt(node.key, 10);
    this.selectedPosition = this.positions.find(p => p.id === key) ?? null;
    this.isNew = false;
    this.openDrawer();
  }

  openCreate() {
    this.selectedPosition = undefined;
    this.isNew = true;
    this.openDrawer();
  }

  openDrawer() {
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
  }

  onSaved() {
    this.msg.success('Position saved successfully');
    this.closeDrawer();
    this.load();
  }

  onDeleted() {
    this.msg.success('Position deleted successfully');
    this.closeDrawer();
    this.load();
  }
}