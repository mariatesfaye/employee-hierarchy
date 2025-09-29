import { State, Action, StateContext, Selector } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Position } from '../models/position.model';
import { PositionService } from '../services/position.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
  expanded?: boolean;
  isLeaf?: boolean;
  origin?: Position;
}

export class LoadPositions {
  static readonly type = '[Positions] Load';
}

export class CreatePosition {
  static readonly type = '[Positions] Create';
  constructor(public payload: Omit<Position, 'id'>) {}
}

export class UpdatePosition {
  static readonly type = '[Positions] Update';
  constructor(public payload: Position) {}
}

export class DeletePosition {
  static readonly type = '[Positions] Delete';
  constructor(public id: number) {}
}

export class DeletePositionWithChildren {
  static readonly type = '[Positions] Delete With Children';
  constructor(public id: number) {}
}

export interface PositionStateModel {
  positions: Position[];
  loading: boolean;
  error: string | null;
}

@State<PositionStateModel>({
  name: 'positions',
  defaults: {
    positions: [],
    loading: false,
    error: null
  }
})
@Injectable()
export class PositionState {
  constructor(private positionService: PositionService) {}

  @Selector()
  static positions(state: PositionStateModel): Position[] {
    return state.positions;
  }

  @Selector()
  static treeNodes(state: PositionStateModel): TreeNode[] {
    return PositionState.buildTree(state.positions);
  }

  @Selector()
  static loading(state: PositionStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: PositionStateModel): string | null {
    return state.error;
  }

  private static buildTree(positions: Position[]): TreeNode[] {
    const map = new Map<number | string, TreeNode>();

    positions.forEach(p => {
      map.set(p.id, { 
        title: p.name, 
        key: p.id.toString(),
        children: [], 
        origin: p,
        expanded: true,
        isLeaf: true
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
          parentNode.isLeaf = false;
        } else {
          roots.push(node);
        }
      }
    });

    roots.sort((a, b) => a.title.localeCompare(b.title));
    map.forEach(node => {
      if (node.children) {
        node.children.sort((a, b) => a.title.localeCompare(b.title));
      }
    });

    return roots;
  }

  @Action(LoadPositions)
  loadPositions(ctx: StateContext<PositionStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.positionService.getAll().pipe(
      tap(positions => {
        ctx.patchState({ 
          positions, 
          loading: false,
          error: null
        });
      }),
      catchError(error => {
        ctx.patchState({ 
          loading: false, 
          error: 'Failed to load positions' 
        });
        return of();
      })
    );
  }

  @Action(CreatePosition)
  createPosition(ctx: StateContext<PositionStateModel>, action: CreatePosition) {
    ctx.patchState({ loading: true });
    
    return this.positionService.create(action.payload).pipe(
      tap(newPosition => {
        const state = ctx.getState();
        ctx.patchState({
          positions: [...state.positions, newPosition],
          loading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: 'Failed to create position' });
        return of();
      })
    );
  }

  @Action(UpdatePosition)
  updatePosition(ctx: StateContext<PositionStateModel>, action: UpdatePosition) {
    ctx.patchState({ loading: true });
    
    return this.positionService.update(action.payload).pipe(
      tap(updatedPosition => {
        const state = ctx.getState();
        const positions = state.positions.map(p => 
          p.id === updatedPosition.id ? updatedPosition : p
        );
        ctx.patchState({ 
          positions,
          loading: false 
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: 'Failed to update position' });
        return of();
      })
    );
  }

@Action(DeletePositionWithChildren)
deletePositionWithChildren(ctx: StateContext<PositionStateModel>, action: DeletePositionWithChildren) {
    ctx.patchState({ loading: true });
    
    const state = ctx.getState();

    const positionsWithNumberIds = state.positions.map(p => ({
        ...p,
        id: typeof p.id === 'string' ? parseInt(p.id, 10) || 0 : p.id,
        parentId: typeof p.parentId === 'string' ? parseInt(p.parentId, 10) || null : p.parentId
    }));
    
    const idsToDelete = [action.id, ...this.positionService.getDescendantIds(positionsWithNumberIds, action.id as number)];
    
    return this.positionService.deleteWithChildren(positionsWithNumberIds, action.id as number).pipe(
        tap(() => {
        const positions = state.positions.filter(p => !idsToDelete.includes(p.id as number));
        ctx.patchState({ 
            positions,
            loading: false 
        });
        }),
        catchError(error => {
        ctx.patchState({ loading: false, error: 'Failed to delete position' });
        return of();
        })
    );
}
}