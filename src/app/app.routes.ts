import { Routes } from '@angular/router';
import { PositionTreeComponent } from './components/position-tree/position-tree.component';
import { patch } from '@ngxs/store/operators';

export const routes: Routes = [
  { path: '', component: PositionTreeComponent, pathMatch: 'full',children:[
    {
      path:"",
      component:PositionTreeComponent
    }
  ] },
  { path: '**', redirectTo: '' }
];