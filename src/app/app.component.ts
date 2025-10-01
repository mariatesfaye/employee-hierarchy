import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NzLayoutModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = signal('Perago Employee Hierarchy');
}