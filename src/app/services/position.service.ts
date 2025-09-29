import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Position } from '../models/position.model';
import { forkJoin } from 'rxjs';

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
  console.log('Creating new position:', position); 
  return this.http.post<Position>(this.base, position);
}


  update(position: Position) {
  const url = `${this.base}/${position.id}`;
  console.log('Updating position at URL:', url, 'with data:', position); 
  return this.http.put<Position>(url, position);
}

  delete(id: number | string) {
  const url = `${this.base}/${id}`;
  console.log('Deleting position at URL:', url); 
  return this.http.delete(url);
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