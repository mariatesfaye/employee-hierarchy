import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Position } from '../models/position.model';
import { forkJoin } from 'rxjs';

// Update TreeNode interface to match NG-ZORRO's NzTreeNodeOptions
export interface TreeNode {
  title: string;
  key: string; // Changed from number to string for NG-ZORRO compatibility
  children?: TreeNode[];
  expanded?: boolean;
  isLeaf?: boolean;
  origin?: Position;
  [key: string]: any; // Allow additional properties
}

@Injectable({ providedIn: 'root' })
export class PositionService {
  private base = 'http://localhost:3000/positions';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Position[]>(this.base);
  }

  getById(id: number) {
    return this.http.get<Position>(`${this.base}/${id}`);
  }

  create(position: Omit<Position, 'id'>) {
    return this.http.post<Position>(this.base, position);
  }

  update(position: Position) {
    return this.http.put<Position>(`${this.base}/${position.id}`, position);
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }

  buildTree(positions: Position[]): TreeNode[] {
    const map = new Map<number, TreeNode>();
    positions.forEach(p => {
      map.set(p.id, { 
        title: p.name, 
        key: p.id.toString(), // Convert number to string for NG-ZORRO
        children: [], 
        origin: p,
        expanded: true // Auto-expand nodes for better UX
      });
    });

    const roots: TreeNode[] = [];
    map.forEach(node => {
      const parentId = node.origin?.parentId ?? null;
      if (parentId == null) {
        roots.push(node);
      } else {
        const parentNode = map.get(parentId);
        if (parentNode) {
          parentNode.children!.push(node);
          // Mark parent as not leaf since it has children
          parentNode.isLeaf = false;
        } else {
          roots.push(node);
        }
      }
    });

    // Set isLeaf for nodes without children
    map.forEach(node => {
      if (!node.children || node.children.length === 0) {
        node.isLeaf = true;
        delete node.children; // Remove empty children array for cleaner tree
      }
    });

    return roots;
  }

  getDescendantIds(positions: Position[], id: number): number[] {
    const childrenMap = new Map<number, number[]>();
    positions.forEach(p => {
      if (p.parentId != null) {
        const arr = childrenMap.get(p.parentId) ?? [];
        arr.push(p.id);
        childrenMap.set(p.parentId, arr);
      }
    });

    const out: number[] = [];
    const visit = (cur: number) => {
      const children = childrenMap.get(cur) ?? [];
      children.forEach(c => {
        out.push(c);
        visit(c);
      });
    };
    visit(id);
    return out;
  }

  deleteWithChildren(positions: Position[], id: number) {
    const ids = [id, ...this.getDescendantIds(positions, id)];
    const calls = ids.map(i => this.delete(i));
    return forkJoin(calls);
  }
}