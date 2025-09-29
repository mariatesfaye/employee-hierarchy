import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NzLayoutModule],
  template: `
    <nz-layout>
      <nz-header>
        <div class="logo" style="color: white; font-size: 18px; font-weight: bold;">
          Perago Information System - Employee Hierarchy
        </div>
      </nz-header>
      <nz-content style="padding: 24px; background: #f5f5f5; min-height: calc(100vh - 64px);">
        <router-outlet></router-outlet>
      </nz-content>
    </nz-layout>
  `,
  styles: [`
    nz-header {
      background: #001529;
      padding: 0 24px;
      display: flex;
      align-items: center;
    }
  `]
})
export class AppComponent {
  title = 'perago-employee';
}