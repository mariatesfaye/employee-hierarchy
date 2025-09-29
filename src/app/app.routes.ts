import { Routes } from '@angular/router';
import { PositionTreeComponent } from './components/position-tree/position-tree.component';

export const routes: Routes = [
  { path: '', component: PositionTreeComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];