import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`
    <h1>Welcome to Angular</h1>
    <p>Edit src/app/app.component.ts to see changes instantly</p>
  \`
})
export class AppComponent {
  title = 'angular-starter';
}